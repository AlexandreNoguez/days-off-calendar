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

export type ScheduleChangeType =
  | "SET_STATUS"
  | "BULK_SET"
  | "SET_ASSIGNMENTS";

export type ScheduleChangeLogEntry = {
  id: string;
  at: number;
  type: ScheduleChangeType;
  employeeId?: EmployeeId;
  dateISO?: DateISO;
  prevStatus?: AssignmentStatus;
  nextStatus?: AssignmentStatus;
  changedCells: number;
  message: string;
};
