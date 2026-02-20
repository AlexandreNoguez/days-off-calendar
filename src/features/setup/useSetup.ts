import { useCallback, useMemo } from "react";
import type { DateISO } from "../../domain/types/ids";
import { usePlanStore } from "../../stores/plan.store";
import { useCalendarStore } from "../../stores/calendar.store";
import { getDaysOfMonth, WEEKDAY_LABELS_PT } from "../../shared/utils/dates";

export type SetupCalendarCell =
  | { kind: "blank"; key: string }
  | {
      kind: "day";
      key: string;
      dateISO: DateISO;
      day: number;
      weekday: number;
      weekdayLabel: string;
      isHoliday: boolean;
      isSunday: boolean;
    };

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function buildCells(
  days: ReturnType<typeof getDaysOfMonth>,
  holidays: Record<DateISO, true>,
): SetupCalendarCell[] {
  if (days.length === 0) return [];

  const firstWeekday = days[0].weekday; // 0..6
  const blanks: SetupCalendarCell[] = Array.from({ length: firstWeekday }).map(
    (_, i) => ({
      kind: "blank",
      key: `blank_${i}`,
    }),
  );

  const dayCells: SetupCalendarCell[] = days.map((d) => ({
    kind: "day",
    key: d.dateISO,
    dateISO: d.dateISO,
    day: d.day,
    weekday: d.weekday,
    weekdayLabel: WEEKDAY_LABELS_PT[d.weekday],
    isHoliday: Boolean(holidays[d.dateISO]),
    isSunday: d.weekday === 0,
  }));

  return [...blanks, ...dayCells];
}

export function useSetup() {
  // Source of truth: year/month in plan.store
  const year = usePlanStore((s) => s.year);
  const month = usePlanStore((s) => s.month);
  const setYearMonth = usePlanStore((s) => s.actions.setYearMonth);

  // Source of truth: holidays in calendar.store
  const holidays = useCalendarStore((s) => s.holidaySet);
  const toggleHoliday = useCalendarStore((s) => s.actions.toggleHoliday);
  const clearHolidays = useCalendarStore((s) => s.actions.clearHolidays);
  const pruneToMonth = useCalendarStore((s) => s.actions.pruneToMonth);

  const monthOptions = useMemo(
    () => MONTHS_PT.map((label, idx) => ({ value: idx + 1, label })),
    [],
  );

  const yearOptions = useMemo(() => {
    const start = Math.max(2020, year - 2);
    const end = year + 3;
    const out: number[] = [];
    for (let y = start; y <= end; y += 1) out.push(y);
    return out;
  }, [year]);

  // derived
  const days = useMemo(() => getDaysOfMonth(year, month), [year, month]);

  const calendarCells = useMemo(
    () => buildCells(days, holidays),
    [days, holidays],
  );

  const onChangeYear = useCallback(
    (nextYear: number) => {
      // change plan period
      setYearMonth(nextYear, month);

      // MVP rule: keep holidays only within the selected month
      pruneToMonth(nextYear, month);
    },
    [setYearMonth, pruneToMonth, month],
  );

  const onChangeMonth = useCallback(
    (nextMonth: number) => {
      setYearMonth(year, nextMonth);
      pruneToMonth(year, nextMonth);
    },
    [setYearMonth, pruneToMonth, year],
  );

  const onToggleHoliday = useCallback(
    (dateISO: DateISO) => toggleHoliday(dateISO),
    [toggleHoliday],
  );

  return {
    state: {
      year,
      month,
      monthOptions,
      yearOptions,
      weekdayLabels: WEEKDAY_LABELS_PT,
      calendarCells,
      holidaysCount: Object.keys(holidays).length,
    },
    actions: {
      onChangeYear,
      onChangeMonth,
      onToggleHoliday,
      clearHolidays,
    },
  };
}
