import type { Employee } from "../../../domain/types/employees";
import type { DateISO, EmployeeId, RuleId } from "../../../domain/types/ids";
import type { RuleConfig } from "../../../domain/types/rules";
import type {
  Conflict,
  ValidationResult,
  ValidationStatsPerEmployee,
} from "../../../domain/types/validation";
import type { ScheduleAssignments } from "../../../domain/types/schedule";
import { getWeekday, parseDateISO, toDateISO } from "../../../shared/utils/dates";
import { isOff } from "./validateDay";

type Input = {
  employees: Employee[];
  rules: RuleConfig[];
  assignments: ScheduleAssignments;
  daysOfMonth: DateISO[];
  holidays: Record<DateISO, true>;
};

function enabledRule(rules: RuleConfig[], key: RuleConfig["key"]): RuleConfig | undefined {
  return rules.find((r) => r.key === key && r.enabled);
}

function stringParam(params: Record<string, unknown>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function numberParam(params: Record<string, unknown>, key: string): number | undefined {
  const value = params[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayParam(params: Record<string, unknown>, key: string): string[] {
  const value = params[key];
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function customTemplateParam(
  params: Record<string, unknown>,
): string | undefined {
  const value = params.customTemplate;
  return typeof value === "string" ? value : undefined;
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

function weekdaysAfterSunday(dateISO: DateISO, daysSet: Set<DateISO>): DateISO[] {
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

const WEEKDAY_LABELS_SHORT_PT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

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
    const employeeId = stringParam(fixedSunday.params, "employeeId") as EmployeeId | undefined;
    if (employeeId) {
      input.daysOfMonth.forEach((dateISO) => {
        if (getWeekday(dateISO) !== 0) return;
        if (!isOff(input.assignments, employeeId, dateISO)) {
          addConflict(conflicts, {
            ruleId: fixedSunday.id,
            dateISO,
            employeeIds: [employeeId],
            severity: fixedSunday.severity,
            message: "Funcionário com folga fixa de domingo está marcado como WORK.",
          });
        }
      });
    }
  }

  // one Sunday OFF per month rules
  const monthlySundayRuleKeys: RuleConfig["key"][] = [
    "laundry_one_sunday_off_per_month",
    "pot_washer_one_sunday_off_per_month",
  ];

  monthlySundayRuleKeys.forEach((key) => {
    const rule = enabledRule(input.rules, key);
    if (!rule) return;

    const employeeId = stringParam(rule.params, "employeeId") as EmployeeId | undefined;
    const exactlyOffCount = numberParam(rule.params, "exactlyOffCount") ?? 1;
    if (!employeeId) return;

    const sundayOffCount = input.daysOfMonth.reduce((acc, dateISO) => {
      if (getWeekday(dateISO) !== 0) return acc;
      return acc + (isOff(input.assignments, employeeId, dateISO) ? 1 : 0);
    }, 0);

    if (sundayOffCount !== exactlyOffCount) {
      const firstSunday = input.daysOfMonth.find((dateISO) => getWeekday(dateISO) === 0);
      addConflict(conflicts, {
        ruleId: rule.id,
        dateISO: firstSunday ?? input.daysOfMonth[0],
        employeeIds: [employeeId],
        severity: rule.severity,
        message: `Colaborador deve ter exatamente ${exactlyOffCount} folga(s) no domingo no mês.`,
      });
    }
  });

  // Pair constraints and substitutions (daily checks)
  input.daysOfMonth.forEach((dateISO) => {
    const coincidenceGroup = enabledRule(input.rules, "no_coincidence_clarice_ingrid_elaine");
    if (coincidenceGroup) {
      const ids = arrayParam(coincidenceGroup.params, "employeeIds") as EmployeeId[];
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
      if (isOff(input.assignments, a, dateISO) && isOff(input.assignments, b, dateISO)) {
        addConflict(conflicts, {
          ruleId: rule.id,
          dateISO,
          employeeIds: [a, b],
          severity: rule.severity,
          message: "Folga coincidente proibida para o par da regra.",
        });
      }
    });

    input.rules.forEach((rule) => {
      if (!rule.enabled) return;
      if (customTemplateParam(rule.params) !== "pair_cannot_both_off") return;

      const a = stringParam(rule.params, "a") as EmployeeId | undefined;
      const b = stringParam(rule.params, "b") as EmployeeId | undefined;
      if (!a || !b) return;

      if (isOff(input.assignments, a, dateISO) && isOff(input.assignments, b, dateISO)) {
        addConflict(conflicts, {
          ruleId: rule.id,
          dateISO,
          employeeIds: [a, b],
          severity: rule.severity,
          message: rule.title || "Folga coincidente proibida para o par da regra personalizada.",
        });
      }
    });

    const mariaLidriel = enabledRule(input.rules, "if_maria_off_then_lidriel_must_work");
    if (mariaLidriel) {
      const ifOffId = stringParam(mariaLidriel.params, "ifOffEmployeeId") as EmployeeId | undefined;
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

    const subRule = enabledRule(input.rules, "if_josana_or_luis_off_then_elaine_must_work");
    if (subRule) {
      const substituteId = stringParam(subRule.params, "substituteId") as EmployeeId | undefined;
      const substitutedIds = arrayParam(subRule.params, "substitutedIds") as EmployeeId[];

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

    input.rules.forEach((rule) => {
      if (!rule.enabled) return;
      if (customTemplateParam(rule.params) !== "substitution_required") return;

      const substituteId = stringParam(rule.params, "substituteId") as EmployeeId | undefined;
      const substitutedIds = arrayParam(rule.params, "substitutedIds") as EmployeeId[];
      if (!substituteId || substitutedIds.length === 0) return;

      if (isOff(input.assignments, substituteId, dateISO)) {
        const anySubstitutedOff = substitutedIds.some((id) =>
          isOff(input.assignments, id, dateISO),
        );
        if (anySubstitutedOff) {
          addConflict(conflicts, {
            ruleId: rule.id,
            dateISO,
            employeeIds: [substituteId, ...substitutedIds],
            severity: rule.severity,
            message: rule.title || "Substituição obrigatória não atendida.",
          });
        }
      }
    });
  });

  // Cooks Sunday/week constraints
  const sundayRule = enabledRule(input.rules, "cook_rotation_one_off_each_sunday");
  const weekOffRule = enabledRule(input.rules, "cook_if_sunday_work_requires_week_off");
  const noWeekOffRule = enabledRule(input.rules, "cook_if_sunday_off_no_week_off");
  const noMondayAfterSundayOffRule = enabledRule(
    input.rules,
    "cook_no_monday_off_after_sunday_off",
  );

  const cookRoleId = stringParam(sundayRule?.params ?? {}, "cookRoleId");
  const requiredSundayOff = numberParam(sundayRule?.params ?? {}, "exactlyOffCount") ?? 1;
  const requiredWeekdayOff =
    numberParam(weekOffRule?.params ?? {}, "requiredWeekdayOffCount") ?? 1;

  const cooks = cookRoleId
    ? input.employees.filter((e) => e.roleId === cookRoleId)
    : [];

  const sundays = input.daysOfMonth.filter((dateISO) => getWeekday(dateISO) === 0);

  if (sundayRule && cooks.length > 0) {
    sundays.forEach((sunday) => {
      const offCooks = cooks.filter((c) => isOff(input.assignments, c.id, sunday));
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

  input.rules.forEach((rule) => {
    if (!rule.enabled) return;
    if (customTemplateParam(rule.params) !== "role_one_off_each_sunday") return;

    const roleId = stringParam(rule.params, "roleId");
    const exactlyOffCount = numberParam(rule.params, "exactlyOffCount") ?? 1;
    if (!roleId) return;

    const roleEmployees = input.employees.filter((e) => e.roleId === roleId);
    if (roleEmployees.length === 0) return;

    sundays.forEach((sunday) => {
      const offByRole = roleEmployees.filter((employee) =>
        isOff(input.assignments, employee.id, sunday),
      );

      if (offByRole.length !== exactlyOffCount) {
        addConflict(conflicts, {
          ruleId: rule.id,
          dateISO: sunday,
          employeeIds: offByRole.map((e) => e.id),
          severity: rule.severity,
          message: `${rule.title}: domingo deve ter exatamente ${exactlyOffCount} folga(s).`,
        });
      }
    });
  });

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
          message: "Cozinheiro que trabalhou no domingo precisa folga na semana.",
        });
      }

      if (noWeekOffRule && isSundayOff && weekdayOffCount > 0) {
        addConflict(conflicts, {
          ruleId: noWeekOffRule.id,
          dateISO: sunday,
          employeeIds: [cook.id],
          severity: noWeekOffRule.severity,
          message: "Cozinheiro que folgou no domingo não pode folgar na semana.",
        });
      }

      if (noMondayAfterSundayOffRule && isSundayOff) {
        const mondayAfterSunday = weekdays.find((d) => getWeekday(d) === 1);
        if (mondayAfterSunday && isOff(input.assignments, cook.id, mondayAfterSunday)) {
          addConflict(conflicts, {
            ruleId: noMondayAfterSundayOffRule.id,
            dateISO: mondayAfterSunday,
            employeeIds: [cook.id],
            severity: noMondayAfterSundayOffRule.severity,
            message: "Se folgou domingo, não pode folgar na segunda seguinte.",
          });
        }
      }
    });
  });

  // Assistants Sunday/week constraints
  const assistantWeekOffRule = enabledRule(
    input.rules,
    "assistant_if_sunday_work_requires_week_off",
  );
  const assistantNoWeekOffRule = enabledRule(
    input.rules,
    "assistant_if_sunday_off_no_week_off",
  );
  const assistantNoMondayAfterSundayOffRule = enabledRule(
    input.rules,
    "assistant_no_monday_off_after_sunday_off",
  );
  const assistantFixedWeekdayRule = enabledRule(
    input.rules,
    "assistant_weekday_off_must_be_fixed",
  );

  const assistantRoleId = stringParam(
    assistantWeekOffRule?.params ??
      assistantNoWeekOffRule?.params ??
      assistantNoMondayAfterSundayOffRule?.params ??
      assistantFixedWeekdayRule?.params ??
      {},
    "assistantRoleId",
  );
  const assistantRequiredWeekdayOff =
    numberParam(assistantWeekOffRule?.params ?? {}, "requiredWeekdayOffCount") ?? 1;

  const assistants = assistantRoleId
    ? input.employees.filter((e) => e.roleId === assistantRoleId)
    : [];

  sundays.forEach((sunday) => {
    const weekdays = weekdaysAfterSunday(sunday, daysSet);

    assistants.forEach((assistant) => {
      const weekdayOffCount = weekdays.reduce((acc, day) => {
        return acc + (isOff(input.assignments, assistant.id, day) ? 1 : 0);
      }, 0);

      const isSundayOff = isOff(input.assignments, assistant.id, sunday);

      if (
        assistantWeekOffRule &&
        !isSundayOff &&
        weekdayOffCount < assistantRequiredWeekdayOff
      ) {
        addConflict(conflicts, {
          ruleId: assistantWeekOffRule.id,
          dateISO: sunday,
          employeeIds: [assistant.id],
          severity: assistantWeekOffRule.severity,
          message: "Auxiliar que trabalhou no domingo precisa folga na semana.",
        });
      }

      if (assistantNoWeekOffRule && isSundayOff && weekdayOffCount > 0) {
        addConflict(conflicts, {
          ruleId: assistantNoWeekOffRule.id,
          dateISO: sunday,
          employeeIds: [assistant.id],
          severity: assistantNoWeekOffRule.severity,
          message: "Auxiliar que folgou no domingo não pode folgar na semana.",
        });
      }

      if (assistantNoMondayAfterSundayOffRule && isSundayOff) {
        const mondayAfterSunday = weekdays.find((d) => getWeekday(d) === 1);
        if (
          mondayAfterSunday &&
          isOff(input.assignments, assistant.id, mondayAfterSunday)
        ) {
          addConflict(conflicts, {
            ruleId: assistantNoMondayAfterSundayOffRule.id,
            dateISO: mondayAfterSunday,
            employeeIds: [assistant.id],
            severity: assistantNoMondayAfterSundayOffRule.severity,
            message:
              "Auxiliar que folgou no domingo não pode folgar na segunda seguinte.",
          });
        }
      }
    });
  });

  if (assistantFixedWeekdayRule) {
    assistants.forEach((assistant) => {
      const weekdayOffDates = input.daysOfMonth.filter((dateISO) => {
        const weekday = getWeekday(dateISO);
        return weekday !== 0 && isOff(input.assignments, assistant.id, dateISO);
      });

      const uniqueWeekdays = [...new Set(weekdayOffDates.map((dateISO) => getWeekday(dateISO)))];
      if (uniqueWeekdays.length <= 1) return;

      const weekdayLabels = uniqueWeekdays
        .map((weekday) => WEEKDAY_LABELS_SHORT_PT[weekday])
        .join(", ");

      addConflict(conflicts, {
        ruleId: assistantFixedWeekdayRule.id,
        dateISO: weekdayOffDates[0] ?? input.daysOfMonth[0],
        employeeIds: [assistant.id],
        severity: assistantFixedWeekdayRule.severity,
        message: `Auxiliar deve manter folga fixa na semana (encontrado: ${weekdayLabels}).`,
      });
    });
  }

  return {
    conflicts,
    isValid: conflicts.every((c) => c.severity !== "HARD"),
    statsPerEmployee,
  };
}
