import { useEffect, useMemo } from "react";
import type { DateISO, EmployeeId } from "../../domain/types/ids";
import { getDaysOfMonth, WEEKDAY_LABELS_PT } from "../../shared/utils/dates";
import { useEmployeesStore } from "../../stores/employees.store";
import { usePlanStore } from "../../stores/plan.store";
import { useRulesStore } from "../../stores/rules.store";
import { useScheduleStore } from "../../stores/schedule.store";
import { useValidationStore } from "../../stores/validation.store";
import { useCalendarStore } from "../../stores/calendar.store";
import { generateSuggestedSchedule } from "../../application/usecases/schedule/generateSuggestedSchedule";
import { validateSchedule } from "../../application/usecases/rules/validateSchedule";

type DayColumn = {
  dateISO: DateISO;
  day: number;
  weekday: number;
  weekdayLabel: string;
};

type EmployeeRow = {
  id: EmployeeId;
  name: string;
  roleName: string;
  offCount: number;
};

export function useScheduleEditor() {
  const year = usePlanStore((s) => s.year);
  const month = usePlanStore((s) => s.month);

  const roles = useEmployeesStore((s) => s.roles);
  const employees = useEmployeesStore((s) => s.employees);
  const rules = useRulesStore((s) => s.rules);
  const holidays = useCalendarStore((s) => s.holidaySet);

  const history = useScheduleStore((s) => s.history);
  const setAssignments = useScheduleStore((s) => s.actions.setAssignments);
  const setStatus = useScheduleStore((s) => s.actions.setStatus);
  const toggleOff = useScheduleStore((s) => s.actions.toggleOff);
  const bulkSet = useScheduleStore((s) => s.actions.bulkSet);
  const undo = useScheduleStore((s) => s.actions.undo);
  const redo = useScheduleStore((s) => s.actions.redo);
  const resetSchedule = useScheduleStore((s) => s.actions.resetSchedule);

  const validationResult = useValidationStore((s) => s.result);
  const setValidationResult = useValidationStore((s) => s.actions.setResult);

  const dayColumns = useMemo<DayColumn[]>(() => {
    return getDaysOfMonth(year, month).map((d) => ({
      dateISO: d.dateISO,
      day: d.day,
      weekday: d.weekday,
      weekdayLabel: WEEKDAY_LABELS_PT[d.weekday],
    }));
  }, [year, month]);

  const assignments = history.present.assignments;

  const employeeRows = useMemo<EmployeeRow[]>(() => {
    return employees.map((e) => {
      const offCount = dayColumns.reduce((acc, day) => {
        const status = assignments[e.id]?.[day.dateISO] ?? "WORK";
        return acc + (status === "OFF" ? 1 : 0);
      }, 0);

      return {
        id: e.id,
        name: e.name,
        roleName: roles.find((r) => r.id === e.roleId)?.name ?? "—",
        offCount,
      };
    });
  }, [employees, roles, dayColumns, assignments]);

  const computedValidation = useMemo(
    () =>
      validateSchedule({
        employees,
        rules,
        assignments,
        daysOfMonth: dayColumns.map((d) => d.dateISO),
        holidays,
      }),
    [employees, rules, assignments, dayColumns, holidays],
  );

  useEffect(() => {
    setValidationResult(computedValidation);
  }, [computedValidation, setValidationResult]);

  function getCellStatus(employeeId: EmployeeId, dateISO: DateISO): "WORK" | "OFF" {
    return assignments[employeeId]?.[dateISO] ?? "WORK";
  }

  function markAllAsWork() {
    const employeeIds = employees.map((e) => e.id);
    const dates = dayColumns.map((d) => d.dateISO);
    if (employeeIds.length === 0 || dates.length === 0) return;
    bulkSet(employeeIds, dates, "WORK");
  }

  function generateSuggestion() {
    const nextAssignments = generateSuggestedSchedule({
      employees,
      rules,
      daysOfMonth: dayColumns.map((d) => d.dateISO),
    });
    setAssignments(nextAssignments);
  }

  return {
    state: {
      year,
      month,
      hasEmployees: employees.length > 0,
      hasRules: rules.length > 0,
      dayColumns,
      employeeRows,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      validation: validationResult,
    },
    actions: {
      getCellStatus,
      setStatus,
      toggleOff,
      markAllAsWork,
      generateSuggestion,
      undo,
      redo,
      resetSchedule,
    },
  };
}
