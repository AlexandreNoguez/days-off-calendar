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
  const fixedSundayTalesRule = isEnabledRule(input.rules, "fixed_off_sunday_tales");

  const cookRoleId = asString(cookRotationRule?.params.cookRoleId);
  const exactlyOffCount = asNumber(cookRotationRule?.params.exactlyOffCount) ?? 1;
  const cooks = cookRoleId
    ? input.employees.filter((e) => e.roleId === cookRoleId)
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

  return assignments;
}
