import type { Employee } from "../../../domain/types/employees";
import type { RuleConfig } from "../../../domain/types/rules";
import type { DateISO } from "../../../domain/types/ids";
import type { ScheduleAssignments } from "../../../domain/types/schedule";
import { getWeekday, parseDateISO, toDateISO } from "../../../shared/utils/dates";

type Input = {
  employees: Employee[];
  rules: RuleConfig[];
  daysOfMonth: DateISO[];
};

function isEnabledRule(rules: RuleConfig[], key: RuleConfig["key"]): RuleConfig | undefined {
  return rules.find((r) => r.key === key && r.enabled);
}

function ensureOff(assignments: ScheduleAssignments, employeeId: string, dateISO: DateISO) {
  const current = assignments[employeeId] ?? {};
  assignments[employeeId] = { ...current, [dateISO]: "OFF" };
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function listWeekdaysAfterSunday(dateISO: DateISO, daysSet: Set<DateISO>): DateISO[] {
  const { year, month, day } = parseDateISO(dateISO as string);
  const out: DateISO[] = [];
  for (let i = 1; i <= 6; i += 1) {
    const next = new Date(year, month - 1, day + i);
    const nextISO = toDateISO(
      next.getFullYear(),
      next.getMonth() + 1,
      next.getDate(),
    );
    if (daysSet.has(nextISO)) out.push(nextISO);
  }
  return out;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function buildAssistantForbiddenPairs(rules: RuleConfig[]): Set<string> {
  const out = new Set<string>();

  const noCoincidence = isEnabledRule(rules, "no_coincidence_clarice_ingrid_elaine");
  const noCoincidenceIds = Array.isArray(noCoincidence?.params.employeeIds)
    ? noCoincidence?.params.employeeIds.filter(
        (id): id is string => typeof id === "string",
      ) ?? []
    : [];
  for (let i = 0; i < noCoincidenceIds.length; i += 1) {
    for (let j = i + 1; j < noCoincidenceIds.length; j += 1) {
      out.add(pairKey(noCoincidenceIds[i], noCoincidenceIds[j]));
    }
  }

  const directPairKeys: RuleConfig["key"][] = [
    "elaine_not_same_day_josana",
    "elaine_not_same_day_luis",
    "if_maria_off_then_lidriel_must_work",
  ];

  directPairKeys.forEach((key) => {
    const rule = isEnabledRule(rules, key);
    if (!rule) return;

    const a = asString(
      rule.params.a ?? rule.params.ifOffEmployeeId ?? rule.params.substituteId,
    );
    const b = asString(
      rule.params.b ??
        rule.params.mustWorkEmployeeId ??
        (Array.isArray(rule.params.substitutedIds)
          ? rule.params.substitutedIds[0]
          : undefined),
    );

    if (a && b) out.add(pairKey(a, b));
  });

  const substitution = isEnabledRule(
    rules,
    "if_josana_or_luis_off_then_elaine_must_work",
  );
  const substituteId = asString(substitution?.params.substituteId);
  const substitutedIds = Array.isArray(substitution?.params.substitutedIds)
    ? substitution?.params.substitutedIds.filter(
        (id): id is string => typeof id === "string",
      )
    : [];

  if (substituteId) {
    substitutedIds.forEach((id) => out.add(pairKey(substituteId, id)));
  }

  return out;
}

export function generateSuggestedSchedule(input: Input): ScheduleAssignments {
  const assignments: ScheduleAssignments = {};

  const daysSet = new Set(input.daysOfMonth);
  const sundays = input.daysOfMonth.filter((d) => getWeekday(d) === 0);

  const cookRotationRule = isEnabledRule(
    input.rules,
    "cook_rotation_one_off_each_sunday",
  );
  const cookWeekOffRule = isEnabledRule(
    input.rules,
    "cook_if_sunday_work_requires_week_off",
  );
  const assistantWeekOffRule = isEnabledRule(
    input.rules,
    "assistant_if_sunday_work_requires_week_off",
  );
  const assistantFixedWeekdayRule = isEnabledRule(
    input.rules,
    "assistant_weekday_off_must_be_fixed",
  );
  const fixedSundayTalesRule = isEnabledRule(input.rules, "fixed_off_sunday_tales");

  const cookRoleId = asString(cookRotationRule?.params.cookRoleId);
  const exactlyOffCount = asNumber(cookRotationRule?.params.exactlyOffCount) ?? 1;
  const cooks = cookRoleId
    ? input.employees.filter((e) => e.roleId === cookRoleId)
    : [];
  const assistantRoleId = asString(
    assistantWeekOffRule?.params.assistantRoleId ??
      assistantFixedWeekdayRule?.params.assistantRoleId,
  );
  const assistants = assistantRoleId
    ? input.employees.filter((e) => e.roleId === assistantRoleId)
    : [];

  // Rule: always-off-sunday flags + fixed Tales Sunday off.
  const fixedSundayIds = new Set<string>(
    input.employees.filter((e) => e.alwaysOffSunday).map((e) => e.id),
  );

  const fixedByRuleId = asString(fixedSundayTalesRule?.params.employeeId);
  if (fixedByRuleId) fixedSundayIds.add(fixedByRuleId);

  for (const sunday of sundays) {
    for (const employeeId of fixedSundayIds) {
      ensureOff(assignments, employeeId, sunday);
    }
  }

  // Rule: cook rotation (exactly N off each Sunday).
  const sundayOffCookIds = new Map<DateISO, Set<string>>();

  if (cooks.length > 0 && exactlyOffCount > 0) {
    sundays.forEach((sunday, sundayIndex) => {
      const selected = new Set<string>();
      for (let i = 0; i < exactlyOffCount; i += 1) {
        const cook = cooks[(sundayIndex + i) % cooks.length];
        if (!cook) continue;
        selected.add(cook.id);
        ensureOff(assignments, cook.id, sunday);
      }
      sundayOffCookIds.set(sunday, selected);
    });
  }

  // Rule: if cook worked on Sunday, they need 1 weekday off in that week.
  const requiredWeekdayOffCount =
    asNumber(cookWeekOffRule?.params.requiredWeekdayOffCount) ?? 1;

  if (cooks.length > 0 && requiredWeekdayOffCount > 0 && cookWeekOffRule) {
    sundays.forEach((sunday, sundayIndex) => {
      const offOnSunday = sundayOffCookIds.get(sunday) ?? new Set<string>();
      const weekdayCandidates = listWeekdaysAfterSunday(sunday, daysSet);

      cooks.forEach((cook, cookIndex) => {
        if (offOnSunday.has(cook.id)) return;

        for (let n = 0; n < requiredWeekdayOffCount; n += 1) {
          if (weekdayCandidates.length === 0) return;
          const idx = (cookIndex + sundayIndex + n) % weekdayCandidates.length;
          ensureOff(assignments, cook.id, weekdayCandidates[idx]);
        }
      });
    });
  }

  // Assistant rules:
  // - if Sunday WORK => need weekday OFF
  // - weekly OFF should stay fixed (prefer Tue-Sat to avoid Monday-after-Sunday issues)
  const assistantRequiredWeekdayOffCount =
    asNumber(assistantWeekOffRule?.params.requiredWeekdayOffCount) ?? 1;

  if (
    assistants.length > 0 &&
    assistantRequiredWeekdayOffCount > 0 &&
    assistantWeekOffRule
  ) {
    const forbiddenPairs = buildAssistantForbiddenPairs(input.rules);
    const assignedWeekdayByAssistant = new Map<string, number>();
    const loadByWeekday = new Map<number, number>();

    assistants.forEach((assistant) => {
      const workedSundays = fixedSundayIds.has(assistant.id) ? [] : sundays;
      const weekDaysBySunday = workedSundays.map((sunday) =>
        listWeekdaysAfterSunday(sunday, daysSet),
      );
      if (weekDaysBySunday.length === 0) return;

      const perWeekdaySets = weekDaysBySunday.map(
        (weekDays) => new Set(weekDays.map((d) => getWeekday(d))),
      );

      const commonWeekdays = [1, 2, 3, 4, 5, 6].filter((weekday) =>
        perWeekdaySets.every((set) => set.has(weekday)),
      );

      const candidateWeekdays = (
        commonWeekdays.length > 0
          ? commonWeekdays
          : [1, 2, 3, 4, 5, 6].filter((weekday) =>
              perWeekdaySets.some((set) => set.has(weekday)),
            )
      ).sort((a, b) => {
        const order = [2, 3, 4, 5, 6, 1];
        return order.indexOf(a) - order.indexOf(b);
      });

      let chosen = candidateWeekdays[0];
      let bestScore = Number.POSITIVE_INFINITY;

      candidateWeekdays.forEach((weekday) => {
        let conflictPenalty = 0;
        assignedWeekdayByAssistant.forEach((otherWeekday, otherAssistantId) => {
          if (otherWeekday !== weekday) return;
          if (forbiddenPairs.has(pairKey(assistant.id, otherAssistantId))) {
            conflictPenalty += 100;
          }
        });

        const loadPenalty = loadByWeekday.get(weekday) ?? 0;
        const mondayPenalty = weekday === 1 ? 2 : 0;
        const score = conflictPenalty + loadPenalty + mondayPenalty;

        if (score < bestScore) {
          bestScore = score;
          chosen = weekday;
        }
      });

      if (chosen !== undefined) {
        assignedWeekdayByAssistant.set(assistant.id, chosen);
        loadByWeekday.set(chosen, (loadByWeekday.get(chosen) ?? 0) + 1);
      }
    });

    assistants.forEach((assistant) => {
      const workedSundays = fixedSundayIds.has(assistant.id) ? [] : sundays;
      const fixedWeekday = assignedWeekdayByAssistant.get(assistant.id);
      if (!fixedWeekday) return;

      workedSundays.forEach((sunday) => {
        const weekDays = listWeekdaysAfterSunday(sunday, daysSet);
        if (weekDays.length === 0) return;

        const preferredDate = weekDays.find((d) => getWeekday(d) === fixedWeekday);
        if (preferredDate) {
          ensureOff(assignments, assistant.id, preferredDate);
          return;
        }

        // End-of-month fallback keeps same-week requirement when preferred day is missing.
        const fallbackDate = weekDays.find((d) => getWeekday(d) !== 1);
        if (fallbackDate) ensureOff(assignments, assistant.id, fallbackDate);
      });
    });
  }

  return assignments;
}
