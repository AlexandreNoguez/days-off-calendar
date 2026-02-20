import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ScheduleAssignments,
  AssignmentStatus,
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

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      history: initHistory(emptyPresent),
      schemaVersion: 1,
      actions: {
        setAssignments: (assignments) => {
          const next = { assignments };
          set({ history: pushHistory(get().history, next) });
        },

        setStatus: (employeeId, dateISO, status) => {
          const current = get().history.present.assignments;
          const nextEmp = { ...(current[employeeId] ?? {}) };
          nextEmp[dateISO] = status;

          const nextAssignments = { ...current, [employeeId]: nextEmp };
          set({
            history: pushHistory(get().history, {
              assignments: nextAssignments,
            }),
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

          for (const empId of employeeIds) {
            const nextEmp = { ...(nextAssignments[empId] ?? {}) };
            for (const d of dateISOs) nextEmp[d] = status;
            nextAssignments[empId] = nextEmp;
          }

          set({
            history: pushHistory(get().history, {
              assignments: nextAssignments,
            }),
          });
        },

        undo: () => set({ history: undoHistory(get().history) }),
        redo: () => set({ history: redoHistory(get().history) }),

        resetSchedule: () => set({ history: initHistory(emptyPresent) }),
      },
    }),
    {
      name: STORAGE_KEYS.schedule,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        history: state.history,
      }),
    },
  ),
);
