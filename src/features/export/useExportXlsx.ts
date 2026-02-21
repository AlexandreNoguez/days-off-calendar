import { useMemo } from "react";
import { getDaysOfMonth } from "../../shared/utils/dates";
import { useEmployeesStore } from "../../stores/employees.store";
import { usePlanStore } from "../../stores/plan.store";
import { useScheduleStore } from "../../stores/schedule.store";
import { useRulesStore } from "../../stores/rules.store";
import { useCalendarStore } from "../../stores/calendar.store";
import { validateSchedule } from "../../application/usecases/rules/validateSchedule";
import { buildWorkbook } from "../../application/usecases/export/buildWorkbook";
import { downloadBytes } from "../../shared/utils/download";

export function useExportXlsx() {
  const year = usePlanStore((s) => s.year);
  const month = usePlanStore((s) => s.month);
  const roles = useEmployeesStore((s) => s.roles);
  const employees = useEmployeesStore((s) => s.employees);
  const rules = useRulesStore((s) => s.rules);
  const holidays = useCalendarStore((s) => s.holidaySet);
  const assignments = useScheduleStore((s) => s.history.present.assignments);

  const daysOfMonth = useMemo(
    () => getDaysOfMonth(year, month).map((d) => d.dateISO),
    [year, month],
  );

  const exportEmployees = useMemo(
    () =>
      employees.map((e) => ({
        ...e,
        roleId: roles.find((r) => r.id === e.roleId)?.name ?? e.roleId,
      })),
    [employees, roles],
  );

  const validation = useMemo(
    () =>
      validateSchedule({
        employees,
        rules,
        assignments,
        daysOfMonth,
        holidays,
      }),
    [employees, rules, assignments, daysOfMonth, holidays],
  );

  function exportXlsx() {
    const bytes = buildWorkbook({
      year,
      month,
      employees: exportEmployees,
      daysOfMonth,
      assignments,
      validation,
    });

    const filename = `escala-folgas-${year}-${String(month).padStart(2, "0")}.xlsx`;

    downloadBytes({
      filename,
      bytes,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  return {
    state: {
      year,
      month,
      employeesCount: employees.length,
      hardConflictsCount: validation.conflicts.filter((c) => c.severity === "HARD")
        .length,
      softConflictsCount: validation.conflicts.filter((c) => c.severity === "SOFT")
        .length,
      canExport: employees.length > 0,
    },
    actions: {
      exportXlsx,
    },
  };
}
