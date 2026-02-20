import type { Employee } from "../../../domain/types/employees";
import type { DateISO, EmployeeId, RuleId } from "../../../domain/types/ids";
import type { RuleConfig } from "../../../domain/types/rules";
import type {
  Conflict,
  ValidationResult,
  ValidationStatsPerEmployee,
} from "../../../domain/types/validation";
import type { ScheduleAssignments } from "../../../domain/types/schedule";
import {
  getWeekday,
  parseDateISO,
  toDateISO,
} from "../../../shared/utils/dates";
import { isOff } from "./validateDay";

type Input = {
  employees: Employee[];
  rules: RuleConfig[];
  assignments: ScheduleAssignments;
  daysOfMonth: DateISO[];
  holidays: Record<DateISO, true>;
};

function enabledRule(
  rules: RuleConfig[],
  key: RuleConfig["key"],
): RuleConfig | undefined {
  return rules.find((r) => r.key === key && r.enabled);
}

function stringParam(
  params: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function numberParam(
  params: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = params[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function arrayParam(params: Record<string, unknown>, key: string): string[] {
  const value = params[key];
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function addConflict(
  conflicts: Conflict[],
  input: {
    ruleId: RuleId;
    dateISO: DateISO;
    employeeIds: EmployeeId[];
    severity: "HARD" | "SOFT";
    message: string;
  },
) {
  conflicts.push({
    id: `${input.ruleId}_${input.dateISO}_${input.employeeIds.join("_")}`,
    ...input,
  });
}

function weekdaysAfterSunday(
  dateISO: DateISO,
  daysSet: Set<DateISO>,
): DateISO[] {
  const { year, month, day } = parseDateISO(dateISO);
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

export function validateSchedule(input: Input): ValidationResult {
  const conflicts: Conflict[] = [];
  const daysSet = new Set(input.daysOfMonth);

  const statsPerEmployee: Record<EmployeeId, ValidationStatsPerEmployee> =
    Object.fromEntries(
      input.employees.map((employee) => {
        const stats: ValidationStatsPerEmployee = {
          totalOff: 0,
          sundayOff: 0,
          holidayOff: 0,
        };

        input.daysOfMonth.forEach((dateISO) => {
          if (!isOff(input.assignments, employee.id, dateISO)) return;
          stats.totalOff += 1;
          if (getWeekday(dateISO) === 0) stats.sundayOff += 1;
          if (input.holidays[dateISO]) stats.holidayOff += 1;
        });

        return [employee.id, stats];
      }),
    );

  // fixed_off_sunday_tales
  const fixedSunday = enabledRule(input.rules, "fixed_off_sunday_tales");
  if (fixedSunday) {
    const employeeId = stringParam(fixedSunday.params, "employeeId") as
      | EmployeeId
      | undefined;
    if (employeeId) {
      input.daysOfMonth.forEach((dateISO) => {
        if (getWeekday(dateISO) !== 0) return;
        if (!isOff(input.assignments, employeeId, dateISO)) {
          addConflict(conflicts, {
            ruleId: fixedSunday.id,
            dateISO,
            employeeIds: [employeeId],
            severity: fixedSunday.severity,
            message:
              "Funcionário com folga fixa de domingo está marcado como WORK.",
          });
        }
      });
    }
  }

  // Pair constraints and substitutions (daily checks)
  input.daysOfMonth.forEach((dateISO) => {
    const coincidenceGroup = enabledRule(
      input.rules,
      "no_coincidence_clarice_ingrid_elaine",
    );
    if (coincidenceGroup) {
      const ids = arrayParam(
        coincidenceGroup.params,
        "employeeIds",
      ) as EmployeeId[];
      const offIds = ids.filter((id) => isOff(input.assignments, id, dateISO));
      if (offIds.length > 1) {
        addConflict(conflicts, {
          ruleId: coincidenceGroup.id,
          dateISO,
          employeeIds: offIds,
          severity: coincidenceGroup.severity,
          message: "Folgas proibidas coincidindo no mesmo dia.",
        });
      }
    }

    const pairRuleKeys: RuleConfig["key"][] = [
      "elaine_not_same_day_josana",
      "elaine_not_same_day_luis",
      "ingrid_and_fernando_cannot_both_off",
    ];

    pairRuleKeys.forEach((key) => {
      const rule = enabledRule(input.rules, key);
      if (!rule) return;
      const a = stringParam(rule.params, "a") as EmployeeId | undefined;
      const b = stringParam(rule.params, "b") as EmployeeId | undefined;
      if (!a || !b) return;
      if (
        isOff(input.assignments, a, dateISO) &&
        isOff(input.assignments, b, dateISO)
      ) {
        addConflict(conflicts, {
          ruleId: rule.id,
          dateISO,
          employeeIds: [a, b],
          severity: rule.severity,
          message: "Folga coincidente proibida para o par da regra.",
        });
      }
    });

    const mariaLidriel = enabledRule(
      input.rules,
      "if_maria_off_then_lidriel_must_work",
    );
    if (mariaLidriel) {
      const ifOffId = stringParam(mariaLidriel.params, "ifOffEmployeeId") as
        | EmployeeId
        | undefined;
      const mustWorkId = stringParam(
        mariaLidriel.params,
        "mustWorkEmployeeId",
      ) as EmployeeId | undefined;

      if (
        ifOffId &&
        mustWorkId &&
        isOff(input.assignments, ifOffId, dateISO) &&
        isOff(input.assignments, mustWorkId, dateISO)
      ) {
        addConflict(conflicts, {
          ruleId: mariaLidriel.id,
          dateISO,
          employeeIds: [ifOffId, mustWorkId],
          severity: mariaLidriel.severity,
          message: "Se Maria folgar, Lidriel deve estar em WORK.",
        });
      }
    }

    const subRule = enabledRule(
      input.rules,
      "if_josana_or_luis_off_then_elaine_must_work",
    );
    if (subRule) {
      const substituteId = stringParam(subRule.params, "substituteId") as
        | EmployeeId
        | undefined;
      const substitutedIds = arrayParam(
        subRule.params,
        "substitutedIds",
      ) as EmployeeId[];

      if (substituteId && isOff(input.assignments, substituteId, dateISO)) {
        const anySubstitutedOff = substitutedIds.some((id) =>
          isOff(input.assignments, id, dateISO),
        );
        if (anySubstitutedOff) {
          addConflict(conflicts, {
            ruleId: subRule.id,
            dateISO,
            employeeIds: [substituteId, ...substitutedIds],
            severity: subRule.severity,
            message: "Quando Josana/Luís folgam, Elaine deve estar em WORK.",
          });
        }
      }
    }
  });

  // Cooks Sunday/week constraints
  const sundayRule = enabledRule(
    input.rules,
    "cook_rotation_one_off_each_sunday",
  );
  const weekOffRule = enabledRule(
    input.rules,
    "cook_if_sunday_work_requires_week_off",
  );
  const noWeekOffRule = enabledRule(
    input.rules,
    "cook_if_sunday_off_no_week_off",
  );

  const cookRoleId = stringParam(sundayRule?.params ?? {}, "cookRoleId");
  const requiredSundayOff =
    numberParam(sundayRule?.params ?? {}, "exactlyOffCount") ?? 1;
  const requiredWeekdayOff =
    numberParam(weekOffRule?.params ?? {}, "requiredWeekdayOffCount") ?? 1;

  const cooks = cookRoleId
    ? input.employees.filter((e) => e.roleId === cookRoleId)
    : [];

  const sundays = input.daysOfMonth.filter(
    (dateISO) => getWeekday(dateISO) === 0,
  );

  if (sundayRule && cooks.length > 0) {
    sundays.forEach((sunday) => {
      const offCooks = cooks.filter((c) =>
        isOff(input.assignments, c.id, sunday),
      );
      if (offCooks.length !== requiredSundayOff) {
        addConflict(conflicts, {
          ruleId: sundayRule.id,
          dateISO: sunday,
          employeeIds: offCooks.map((c) => c.id),
          severity: sundayRule.severity,
          message: `Domingo deve ter exatamente ${requiredSundayOff} cozinheiro(s) OFF.`,
        });
      }
    });
  }

  sundays.forEach((sunday) => {
    const weekdays = weekdaysAfterSunday(sunday, daysSet);

    cooks.forEach((cook) => {
      const weekdayOffCount = weekdays.reduce((acc, day) => {
        return acc + (isOff(input.assignments, cook.id, day) ? 1 : 0);
      }, 0);

      const isSundayOff = isOff(input.assignments, cook.id, sunday);

      if (weekOffRule && !isSundayOff && weekdayOffCount < requiredWeekdayOff) {
        addConflict(conflicts, {
          ruleId: weekOffRule.id,
          dateISO: sunday,
          employeeIds: [cook.id],
          severity: weekOffRule.severity,
          message:
            "Cozinheiro que trabalhou no domingo precisa folga na semana.",
        });
      }

      if (noWeekOffRule && isSundayOff && weekdayOffCount > 0) {
        addConflict(conflicts, {
          ruleId: noWeekOffRule.id,
          dateISO: sunday,
          employeeIds: [cook.id],
          severity: noWeekOffRule.severity,
          message:
            "Cozinheiro que folgou no domingo não pode folgar na semana.",
        });
      }
    });
  });

  return {
    conflicts,
    isValid: conflicts.every((c) => c.severity !== "HARD"),
    statsPerEmployee,
  };
}
