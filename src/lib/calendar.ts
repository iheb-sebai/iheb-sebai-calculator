/**
 * Month grids for the date picker (S-6 AC-8). Built on dates.ts, so like the engine
 * it uses whole day numbers and never reads the clock. Weeks start on Monday, as the
 * working-day toggles do.
 */
import { addDays, fromDayNumber, toDayNumber, weekdayOf, type IsoDate, type Weekday } from './dates';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const WEEKDAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Monday first. */
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const pad = (value: number) => String(value).padStart(2, '0');
const yearOf = (date: IsoDate) => Number(date.slice(0, 4));
const monthOf = (date: IsoDate) => Number(date.slice(5, 7));
const firstOfMonth = (year: number, month: number) => `${String(year).padStart(4, '0')}-${pad(month)}-01` as IsoDate;

function nextMonth(year: number, month: number): [number, number] {
  return month === 12 ? [year + 1, 1] : [year, month + 1];
}

function daysInMonth(year: number, month: number): number {
  return toDayNumber(firstOfMonth(...nextMonth(year, month))) - toDayNumber(firstOfMonth(year, month));
}

/** Position in a Monday-first week: Monday 0 … Sunday 6. */
const weekPosition = (date: IsoDate) => (weekdayOf(date) + 6) % 7;

/** 'December 2026'. */
export function monthTitle(date: IsoDate): string {
  return `${MONTH_NAMES[monthOf(date) - 1]} ${yearOf(date)}`;
}

/** The weeks of the month that `date` is in, Monday first; days outside the month are null. */
export function monthGrid(date: IsoDate): (IsoDate | null)[][] {
  const first = firstOfMonth(yearOf(date), monthOf(date));
  const cells: (IsoDate | null)[] = Array.from({ length: weekPosition(first) }, () => null);
  const count = daysInMonth(yearOf(date), monthOf(date));
  for (let day = 0; day < count; day++) cells.push(addDays(first, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** The same day `months` months later, or the month's last day if it is shorter (31 Jan + 1 → 28 Feb). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const index = yearOf(date) * 12 + (monthOf(date) - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const day = Math.min(Number(date.slice(8, 10)), daysInMonth(year, month));
  return fromDayNumber(toDayNumber(firstOfMonth(year, month)) + day - 1);
}

/** Monday of the week `date` is in. */
export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, -weekPosition(date));
}

/** Sunday of the week `date` is in. */
export function endOfWeek(date: IsoDate): IsoDate {
  return addDays(date, 6 - weekPosition(date));
}
