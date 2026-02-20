import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DateISO } from "../domain/types/ids";
import { STORAGE_KEYS } from "./persistence";

type CalendarState = {
  schemaVersion: number;
  holidaySet: Record<DateISO, true>;

  actions: {
    toggleHoliday: (dateISO: DateISO) => void;
    clearHolidays: () => void;
    pruneToMonth: (year: number, month: number) => void;
    resetCalendar: () => void;
  };
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${pad2(month)}-`;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      schemaVersion: 1,
      holidaySet: {},

      actions: {
        toggleHoliday: (dateISO) => {
          const current = get().holidaySet;
          const next = { ...current };
          if (next[dateISO]) delete next[dateISO];
          else next[dateISO] = true;
          set({ holidaySet: next });
        },

        clearHolidays: () => set({ holidaySet: {} }),

        pruneToMonth: (year, month) => {
          const prefix = monthPrefix(year, month);
          const current = get().holidaySet;

          const pruned = Object.fromEntries(
            Object.entries(current).filter(([k]) => k.startsWith(prefix)),
          ) as Record<DateISO, true>;

          set({ holidaySet: pruned });
        },

        resetCalendar: () => set({ holidaySet: {} }),
      },
    }),
    {
      name: STORAGE_KEYS.calendar,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        holidaySet: state.holidaySet,
      }),
      // Keep actions safe even if older persisted shape exists
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<CalendarState>),
        actions: current.actions,
      }),
    },
  ),
);
