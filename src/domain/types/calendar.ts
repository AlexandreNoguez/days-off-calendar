import type { DateISO } from "./ids";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday

export type CalendarDay = {
  dateISO: DateISO;
  dayOfWeek: DayOfWeek;
  isSunday: boolean;
  isHoliday: boolean;
};
