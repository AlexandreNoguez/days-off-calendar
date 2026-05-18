import { describe, expect, it } from "vitest";

import { generateSuggestedSchedule } from "../schedule/generateSuggestedSchedule";
import { createDefaultSeed } from "../../../domain/defaults/defaultSeed";
import { DEFAULT_EMPLOYEE_IDS } from "../../../domain/defaults/defaultEmployees";
import type { DateISO } from "../../../domain/types/ids";
import type { RuleConfig, RuleKey } from "../../../domain/types/rules";
import type { ScheduleAssignments } from "../../../domain/types/schedule";
import { getDaysOfMonth, getWeekday } from "../../../shared/utils/dates";
import { validateSchedule } from "./validateSchedule";

function findRule(rules: RuleConfig[], key: RuleKey): RuleConfig {
  const rule = rules.find((item) => item.key === key);
  if (!rule) throw new Error(`Missing rule fixture: ${key}`);
  return rule;
}

function monthDays(year: number, month: number): DateISO[] {
  return getDaysOfMonth(year, month).map((day) => day.dateISO);
}

describe("validateSchedule", () => {
  it("reports when Tales is not off on Sunday", () => {
    const seed = createDefaultSeed(2026);
    const tales = seed.employees.find(
      (employee) => employee.id === DEFAULT_EMPLOYEE_IDS.tales,
    );

    expect(tales).toBeDefined();

    const result = validateSchedule({
      employees: [tales!],
      rules: [findRule(seed.rules, "fixed_off_sunday_tales")],
      assignments: {},
      daysOfMonth: ["2026-05-03" as DateISO],
      holidays: {},
    });

    expect(result.isValid).toBe(false);
    expect(result.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "rule_fixed_off_sunday_tales",
          dateISO: "2026-05-03",
          employeeIds: [DEFAULT_EMPLOYEE_IDS.tales],
          severity: "HARD",
        }),
      ]),
    );
  });

  it("reports consecutive days off and keeps employee stats", () => {
    const seed = createDefaultSeed(2026);
    const gustavo = seed.employees.find(
      (employee) => employee.id === DEFAULT_EMPLOYEE_IDS.gustavo,
    );
    const assignments: ScheduleAssignments = {
      [DEFAULT_EMPLOYEE_IDS.gustavo]: {
        "2026-05-01": "OFF",
        "2026-05-02": "OFF",
      },
    };

    expect(gustavo).toBeDefined();

    const result = validateSchedule({
      employees: [gustavo!],
      rules: [findRule(seed.rules, "no_two_consecutive_off_days")],
      assignments,
      daysOfMonth: [
        "2026-05-01",
        "2026-05-02",
        "2026-05-03",
      ] as DateISO[],
      holidays: {
        "2026-05-01": true,
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        ruleId: "rule_no_two_consecutive_off_days",
        dateISO: "2026-05-02",
        employeeIds: [DEFAULT_EMPLOYEE_IDS.gustavo],
        severity: "HARD",
      }),
    ]);
    expect(result.statsPerEmployee[DEFAULT_EMPLOYEE_IDS.gustavo]).toEqual({
      totalOff: 2,
      sundayOff: 0,
      holidayOff: 1,
    });
  });

  it("reports holiday credit usage when the yearly credit is already consumed", () => {
    const seed = createDefaultSeed(2026);
    const gustavo = seed.employees.find(
      (employee) => employee.id === DEFAULT_EMPLOYEE_IDS.gustavo,
    );

    expect(gustavo).toBeDefined();

    const result = validateSchedule({
      employees: [
        {
          ...gustavo!,
          holidayCreditYear: 2026,
          holidayOffUsed: true,
        },
      ],
      rules: [findRule(seed.rules, "annual_holiday_credit_one_per_person")],
      assignments: {
        [DEFAULT_EMPLOYEE_IDS.gustavo]: {
          "2026-05-01": "OFF",
        },
      },
      daysOfMonth: ["2026-05-01" as DateISO],
      holidays: {
        "2026-05-01": true,
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        ruleId: "rule_annual_holiday_credit_one_per_person",
        dateISO: "2026-05-01",
        employeeIds: [DEFAULT_EMPLOYEE_IDS.gustavo],
        severity: "HARD",
      }),
    ]);
  });
});

describe("generateSuggestedSchedule", () => {
  it("satisfies fixed Sunday off and cook Sunday rotation rules", () => {
    const seed = createDefaultSeed(2026);
    const daysOfMonth = monthDays(2026, 5);
    const rules = [
      findRule(seed.rules, "fixed_off_sunday_tales"),
      findRule(seed.rules, "cook_rotation_one_off_each_sunday"),
    ];
    const assignments = generateSuggestedSchedule({
      employees: seed.employees,
      rules,
      daysOfMonth,
    });

    const result = validateSchedule({
      employees: seed.employees,
      rules,
      assignments,
      daysOfMonth,
      holidays: {},
    });
    const hardConflicts = result.conflicts.filter(
      (conflict) => conflict.severity === "HARD",
    );

    expect(hardConflicts).toEqual([]);
    expect(assignments[DEFAULT_EMPLOYEE_IDS.tales]).toEqual(
      expect.objectContaining({
        "2026-05-03": "OFF",
        "2026-05-10": "OFF",
        "2026-05-17": "OFF",
        "2026-05-24": "OFF",
        "2026-05-31": "OFF",
      }),
    );

    const cookIds = new Set<string>([
      DEFAULT_EMPLOYEE_IDS.gustavo,
      DEFAULT_EMPLOYEE_IDS.milena,
      DEFAULT_EMPLOYEE_IDS.dyson,
      DEFAULT_EMPLOYEE_IDS.alex,
    ]);
    const cooks = seed.employees.filter((employee) => cookIds.has(employee.id));
    const sundayOffCounts = daysOfMonth
      .filter((dateISO) => getWeekday(dateISO) === 0)
      .map((dateISO) => {
        return cooks.filter(
          (cook) => assignments[cook.id]?.[dateISO] === "OFF",
        ).length;
      });

    expect(sundayOffCounts).toEqual([1, 1, 1, 1, 1]);
  });
});
