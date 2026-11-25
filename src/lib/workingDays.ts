/**
 * Counting and stepping over working days.
 *
 * Both functions work in whole weeks plus a remainder of under 7 days, so they
 * take the same time for 3 days or 300 years (a slow pace can project a finish
 * date far away). workingDays.test.ts checks them against a day-by-day walk.
 */
import { WEEKDAY_SHORT_NAMES, fromDayNumber, toDayNumber, weekdayOf } from './dates';
import type { IsoDate, Weekday } from './dates';

/** The weekdays someone works on. */
export type WorkingDays = ReadonlySet<Weekday>;

export type PresetId = 'monFri' | 'sunThu';

/** S-2 AC-1. Mon–Fri is the default (D-12). */
export const PRESETS: Readonly<Record<PresetId, WorkingDays>> = {
  monFri: new Set<Weekday>([1, 2, 3, 4, 5]),
  sunThu: new Set<Weekday>([0, 1, 2, 3, 4]),
};

const PRESET_LABELS: Readonly<Record<PresetId, string>> = { monFri: 'Mon–Fri', sunThu: 'Sun–Thu' };

/** Week order used in labels and the day checkboxes (S-2 AC-6). */
const MONDAY_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const nextWeekday = (day: Weekday) => ((day + 1) % 7) as Weekday;

/**
 * Working days from `from` to `to`, both included (S-2 AC-3, D-3, D-5).
 * Returns 0 when `to` is before `from` or no day is selected.
 */
export function countWorkingDays(from: IsoDate, to: IsoDate, days: WorkingDays): number {
  const totalDays = toDayNumber(to) - toDayNumber(from) + 1;
  if (totalDays <= 0 || days.size === 0) return 0;

  // Every run of 7 days contains each weekday once.
  let count = Math.floor(totalDays / 7) * days.size;

  // The leftover days start on the same weekday as `from`.
  let day = weekdayOf(from);
  for (let i = 0; i < totalDays % 7; i++) {
    if (days.has(day)) count++;
    day = nextWeekday(day);
  }
  return count;
}

/**
 * The nth working day counting from `from`, which counts itself if it is a working day.
 * Returns null when n is not a whole number ≥ 1 or no day is selected.
 */
export function nthWorkingDay(from: IsoDate, n: number, days: WorkingDays): IsoDate | null {
  if (!Number.isSafeInteger(n) || n < 1 || days.size === 0) return null;

  // Skip whole weeks that each hold `days.size` working days, leaving 1..days.size to find.
  const wholeWeeks = Math.floor((n - 1) / days.size);
  let left = n - wholeWeeks * days.size;
  let dayNumber = toDayNumber(from) + wholeWeeks * 7;

  // The rest lies within the next 7 days, starting on the same weekday as `from`.
  let day = weekdayOf(from);
  for (let i = 0; i < 7; i++) {
    if (days.has(day) && --left === 0) return fromDayNumber(dayNumber);
    dayNumber++;
    day = nextWeekday(day);
  }
  // Unreachable while the week maths above is right. Capping the loop means a
  // mistake there shows up as a failed test, not a frozen page.
  return null;
}

function sameDays(a: WorkingDays, b: WorkingDays): boolean {
  return a.size === b.size && [...a].every((day) => b.has(day));
}

/** Which preset the selection matches, or 'custom' (S-2 AC-2). */
export function presetFor(days: WorkingDays): PresetId | 'custom' {
  if (sameDays(days, PRESETS.monFri)) return 'monFri';
  if (sameDays(days, PRESETS.sunThu)) return 'sunThu';
  return 'custom';
}

/** Short label repeated in every result sentence: 'Mon–Fri', 'Mon, Wed, Fri', 'every day' (S-2 AC-6). */
export function describeWorkingDays(days: WorkingDays): string {
  const preset = presetFor(days);
  if (preset !== 'custom') return PRESET_LABELS[preset];
  if (days.size === 0) return 'no working days';
  if (days.size === 7) return 'every day';
  return MONDAY_FIRST.filter((day) => days.has(day))
    .map((day) => WEEKDAY_SHORT_NAMES[day])
    .join(', ');
}
