import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ScheduleAssignments,
  AssignmentStatus,
  ScheduleChangeLogEntry,
} from "../domain/types/schedule";
import type { HistoryState } from "./history";
import type { DateISO, EmployeeId } from "../domain/types/ids";

import { STORAGE_KEYS } from "./persistence";
import { initHistory, pushHistory, undoHistory, redoHistory } from "./history";

type SchedulePresent = {
  assignments: ScheduleAssignments;
};

type ScheduleState = {
  history: HistoryState<SchedulePresent>;
  changeLog: ScheduleChangeLogEntry[];
  schemaVersion: number;
  actions: {
    setStatus: (
      employeeId: EmployeeId,
      dateISO: DateISO,
      status: AssignmentStatus,
    ) => void;
    toggleOff: (employeeId: EmployeeId, dateISO: DateISO) => void;
    bulkSet: (
      employeeIds: EmployeeId[],
      dateISOs: DateISO[],
      status: AssignmentStatus,
    ) => void;

    undo: () => void;
    redo: () => void;

    resetSchedule: () => void;
    setAssignments: (assignments: ScheduleAssignments) => void;
  };
};

const emptyPresent: SchedulePresent = { assignments: {} };
const MAX_CHANGE_LOG = 300;

function createLogId(): string {
  return `sched_log_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function withLog(
  current: ScheduleChangeLogEntry[],
  next: ScheduleChangeLogEntry,
): ScheduleChangeLogEntry[] {
  return [...current, next].slice(-MAX_CHANGE_LOG);
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      history: initHistory(emptyPresent),
      changeLog: [],
      schemaVersion: 2,
      actions: {
        setAssignments: (assignments) => {
          const currentAssignments = get().history.present.assignments;
          let changedCells = 0;

          const allEmployeeIds = new Set([
            ...Object.keys(currentAssignments),
            ...Object.keys(assignments),
          ]);

          for (const employeeId of allEmployeeIds) {
            const currentByDate = currentAssignments[employeeId as EmployeeId] ?? {};
            const nextByDate = assignments[employeeId as EmployeeId] ?? {};
            const allDates = new Set([
              ...Object.keys(currentByDate),
              ...Object.keys(nextByDate),
            ]);

            for (const dateISO of allDates) {
              const prevStatus = currentByDate[dateISO as DateISO] ?? "WORK";
              const nextStatus = nextByDate[dateISO as DateISO] ?? "WORK";
              if (prevStatus !== nextStatus) changedCells += 1;
            }
          }

          if (changedCells === 0) return;

          const next = { assignments };
          const logEntry: ScheduleChangeLogEntry = {
            id: createLogId(),
            at: Date.now(),
            type: "SET_ASSIGNMENTS",
            changedCells,
            message: `Sugestão aplicada em ${changedCells} célula(s).`,
          };

          set({
            history: pushHistory(get().history, next),
            changeLog: withLog(get().changeLog, logEntry),
          });
        },

        setStatus: (employeeId, dateISO, status) => {
          const current = get().history.present.assignments;
          const prevStatus = current[employeeId]?.[dateISO] ?? "WORK";
          if (prevStatus === status) return;

          const nextEmp = { ...(current[employeeId] ?? {}) };
          nextEmp[dateISO] = status;

          const nextAssignments = { ...current, [employeeId]: nextEmp };
          const logEntry: ScheduleChangeLogEntry = {
            id: createLogId(),
            at: Date.now(),
            type: "SET_STATUS",
            employeeId,
            dateISO,
            prevStatus,
            nextStatus: status,
            changedCells: 1,
            message: `${dateISO}: ${prevStatus} -> ${status}`,
          };

          set({
            history: pushHistory(get().history, {
              assignments: nextAssignments,
            }),
            changeLog: withLog(get().changeLog, logEntry),
          });
        },

        toggleOff: (employeeId, dateISO) => {
          const current = get().history.present.assignments;
          const currentStatus = current[employeeId]?.[dateISO] ?? "WORK";
          const nextStatus: AssignmentStatus =
            currentStatus === "OFF" ? "WORK" : "OFF";
          get().actions.setStatus(employeeId, dateISO, nextStatus);
        },

        bulkSet: (employeeIds, dateISOs, status) => {
          const current = get().history.present.assignments;
          const nextAssignments: ScheduleAssignments = { ...current };
          let changedCells = 0;

          for (const empId of employeeIds) {
            const nextEmp = { ...(nextAssignments[empId] ?? {}) };
            for (const d of dateISOs) {
              const prevStatus = nextEmp[d] ?? "WORK";
              if (prevStatus !== status) {
                nextEmp[d] = status;
                changedCells += 1;
              }
            }
            nextAssignments[empId] = nextEmp;
          }

          if (changedCells === 0) return;

          const logEntry: ScheduleChangeLogEntry = {
            id: createLogId(),
            at: Date.now(),
            type: "BULK_SET",
            changedCells,
            nextStatus: status,
            message: `Alteração em lote: ${changedCells} célula(s) para ${status}.`,
          };

          set({
            history: pushHistory(get().history, {
              assignments: nextAssignments,
            }),
            changeLog: withLog(get().changeLog, logEntry),
          });
        },

        undo: () => set({ history: undoHistory(get().history) }),
        redo: () => set({ history: redoHistory(get().history) }),

        resetSchedule: () =>
          set({ history: initHistory(emptyPresent), changeLog: [] }),
      },
    }),
    {
      name: STORAGE_KEYS.schedule,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        history: state.history,
        changeLog: state.changeLog,
      }),
    },
  ),
);
