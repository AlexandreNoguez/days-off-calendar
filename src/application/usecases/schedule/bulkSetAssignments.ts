import type { DateISO, EmployeeId } from "../../../domain/types/ids";
import type {
  AssignmentStatus,
  ScheduleAssignments,
} from "../../../domain/types/schedule";

export type BulkSetAssignmentsInput = {
  assignments: ScheduleAssignments;
  employeeIds: EmployeeId[];
  dateISOs: DateISO[];
  status: AssignmentStatus;
};

export type BulkSetAssignmentsResult = {
  assignments: ScheduleAssignments;
  changedCells: number;
};

export function bulkSetAssignments(
  input: BulkSetAssignmentsInput,
): BulkSetAssignmentsResult {
  const nextAssignments: ScheduleAssignments = { ...input.assignments };
  let changedCells = 0;

  input.employeeIds.forEach((employeeId) => {
    const nextByDate = { ...(nextAssignments[employeeId] ?? {}) };

    input.dateISOs.forEach((dateISO) => {
      const previousStatus = nextByDate[dateISO] ?? "WORK";
      if (previousStatus === input.status) return;

      nextByDate[dateISO] = input.status;
      changedCells += 1;
    });

    nextAssignments[employeeId] = nextByDate;
  });

  return { assignments: nextAssignments, changedCells };
}
