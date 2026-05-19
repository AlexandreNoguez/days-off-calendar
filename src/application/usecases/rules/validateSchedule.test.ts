import { describe, expect, it } from "vitest";

import {
  generateSuggestedSchedule,
  generateSuggestedScheduleWithReport,
} from "../schedule/generateSuggestedSchedule";
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

  it("reports monthly off counts outside the configured range", () => {
    const seed = createDefaultSeed(2026);
    const gustavo = seed.employees.find(
      (employee) => employee.id === DEFAULT_EMPLOYEE_IDS.gustavo,
    );

    expect(gustavo).toBeDefined();

    const result = validateSchedule({
      employees: [gustavo!],
      rules: [findRule(seed.rules, "monthly_off_count_between_4_and_5")],
      assignments: {
        [DEFAULT_EMPLOYEE_IDS.gustavo]: {
          "2026-05-01": "OFF",
          "2026-05-03": "OFF",
          "2026-05-05": "OFF",
          "2026-05-07": "OFF",
          "2026-05-09": "OFF",
          "2026-05-11": "OFF",
        },
      },
      daysOfMonth: monthDays(2026, 5),
      holidays: {},
    });

    expect(result.isValid).toBe(false);
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        ruleId: "rule_monthly_off_count_between_4_and_5",
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

  it("repairs generated hard conflicts by retrying candidates from the conflict list", () => {
    const employees = [
      {
        id: "emp_a",
        name: "Pessoa A",
        roleId: "role_any",
        alwaysOffSunday: true,
        holidayCreditYear: 2026,
        holidayOffUsed: false,
      },
      {
        id: "emp_b",
        name: "Pessoa B",
        roleId: "role_any",
        alwaysOffSunday: true,
        holidayCreditYear: 2026,
        holidayOffUsed: false,
      },
    ];
    const rules: RuleConfig[] = [
      {
        id: "rule_pair",
        key: "custom_pair",
        title: "A e B não podem folgar juntas",
        enabled: true,
        severity: "HARD",
        params: {
          customTemplate: "pair_cannot_both_off",
          a: "emp_a",
          b: "emp_b",
        },
      },
    ];

    const report = generateSuggestedScheduleWithReport({
      employees,
      rules,
      daysOfMonth: ["2026-05-03" as DateISO],
    });

    expect(report.initialHardConflicts).toBe(1);
    expect(report.finalHardConflicts).toBe(0);
    expect(report.repairPasses).toBeGreaterThan(0);

    const result = validateSchedule({
      employees,
      rules,
      assignments: report.assignments,
      daysOfMonth: ["2026-05-03" as DateISO],
      holidays: {},
    });

    expect(result.isValid).toBe(true);
  });

  it("generates every 2026 default month without hard conflicts", () => {
    const seed = createDefaultSeed(2026);

    for (let month = 1; month <= 12; month += 1) {
      const daysOfMonth = monthDays(2026, month);
      const report = generateSuggestedScheduleWithReport({
        employees: seed.employees,
        rules: seed.rules,
        daysOfMonth,
        holidays: {},
      });

      const result = validateSchedule({
        employees: seed.employees,
        rules: seed.rules,
        assignments: report.assignments,
        daysOfMonth,
        holidays: {},
      });

      expect(
        result.conflicts.filter((conflict) => conflict.severity === "HARD"),
      ).toEqual([]);
    }
  });
});
