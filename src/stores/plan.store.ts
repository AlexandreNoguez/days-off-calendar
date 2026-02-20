import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "./persistence";

type PlanState = {
  schemaVersion: number;
  year: number;
  month: number; // 1..12

  actions: {
    setYearMonth: (year: number, month: number) => void;
    resetPlan: () => void;
  };
};

const now = new Date();
const initialYear = now.getFullYear();
const initialMonth = now.getMonth() + 1;

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      schemaVersion: 1,
      year: initialYear,
      month: initialMonth,

      actions: {
        setYearMonth: (year, month) => set({ year, month }),
        resetPlan: () => set({ year: initialYear, month: initialMonth }),
      },
    }),
    {
      name: STORAGE_KEYS.plan,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        year: state.year,
        month: state.month,
      }),
      // Keep actions safe even if older persisted shape exists
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PlanState>),
        actions: current.actions,
      }),
    },
  ),
);
