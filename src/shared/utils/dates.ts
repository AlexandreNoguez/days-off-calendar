import type { DateISO } from "../../domain/types/ids";

export const WEEKDAY_LABELS_PT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateISO(year: number, month: number, day: number): DateISO {
  // month: 1..12
  return `${year}-${pad2(month)}-${pad2(day)}` as DateISO;
}

export function parseDateISO(dateISO: DateISO): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  return { year: y, month: m, day: d };
}

export function getDaysInMonth(year: number, month: number): number {
  // month: 1..12
  return new Date(year, month, 0).getDate();
}

export function getWeekday(dateISO: DateISO): number {
  // 0..6 (0 Sunday)
  const { year, month, day } = parseDateISO(dateISO);
  return new Date(year, month - 1, day).getDay();
}

export type DayMeta = {
  dateISO: DateISO;
  day: number;
  weekday: number; // 0..6
};

export function getDaysOfMonth(year: number, month: number): DayMeta[] {
  const total = getDaysInMonth(year, month);
  const out: DayMeta[] = [];
  for (let d = 1; d <= total; d += 1) {
    const dateISO = toDateISO(year, month, d);
    out.push({ dateISO, day: d, weekday: getWeekday(dateISO) });
  }
  return out;
}
