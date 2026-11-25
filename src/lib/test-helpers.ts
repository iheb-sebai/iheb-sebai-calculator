/**
 * Shared test data and checks. Used by the *.test.ts files only, never by app code.
 */
import type { IsoDate, Weekday } from './dates';
import type { WorkingDays } from './workingDays';

/** A date literal the test knows is valid, so tests don't depend on parseIsoDate. */
export const iso = (text: string) => text as IsoDate;

export const days = (...weekdays: Weekday[]): WorkingDays => new Set(weekdays);

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Every non-empty choice of working days: 2^7 - 1 = 127 sets. */
export const ALL_CHOICES: readonly WorkingDays[] = Array.from({ length: 127 }, (_, i) =>
  days(...WEEKDAYS.filter((d) => ((i + 1) >> d) & 1)),
);

/** One date on each weekday, Mon 23 to Sun 29 Nov 2026. Literals, so loading a test file runs no engine code. */
export const START_DATES: readonly IsoDate[] = ['23', '24', '25', '26', '27', '28', '29'].map((d) =>
  iso(`2026-11-${d}`),
);

/** Paths of every number in `value` that is NaN or ±Infinity (S-5 AC-1). Empty when all are finite. */
export function nonFiniteNumbers(value: unknown, path = 'result'): string[] {
  if (typeof value === 'number') return Number.isFinite(value) ? [] : [`${path} = ${value}`];
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => nonFiniteNumbers(child, `${path}.${key}`));
  }
  return [];
}
