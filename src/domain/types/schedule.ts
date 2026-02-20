import type { DateISO, EmployeeId } from "./ids";

export type AssignmentStatus = "WORK" | "OFF";

export type ScheduleAssignments = Record<
  EmployeeId,
  Record<DateISO, AssignmentStatus>
>;

export type ScheduleSummaryByDay = {
  dateISO: DateISO;
  offEmployeeIds: EmployeeId[];
  workEmployeeIds: EmployeeId[];
};
