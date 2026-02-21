import type { EmployeeId, DateISO } from "../../../domain/types/ids";
import type { ScheduleAssignments } from "../../../domain/types/schedule";

export function isOff(
  assignments: ScheduleAssignments,
  employeeId: EmployeeId,
  dateISO: DateISO,
): boolean {
  return (assignments[employeeId]?.[dateISO] ?? "WORK") === "OFF";
}
