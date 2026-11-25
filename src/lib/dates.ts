/**
 * Calendar dates with no time of day and no time zone.
 *
 * A date is a 'YYYY-MM-DD' string. All arithmetic is done on whole day numbers
 * (days since 1970-01-01), so no result can depend on the machine's time zone
 * or clock (D-4).
 *
 * RED PHASE: signatures only. The tests in dates.test.ts describe the behaviour.
 */

/** A validated 'YYYY-MM-DD' calendar date. Create one with parseIsoDate. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

/** Day of the week, numbered as in JavaScript: 0 = Sunday ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Returns the date if `text` is a real calendar date in 'YYYY-MM-DD' form, otherwise null. */
export function parseIsoDate(text: string): IsoDate | null {
  throw new Error(`parseIsoDate not implemented (${text})`);
}

/** Days since 1970-01-01 (negative before it). */
export function toDayNumber(date: IsoDate): number {
  throw new Error(`toDayNumber not implemented (${date})`);
}

/** The date for a day number. Inverse of toDayNumber. */
export function fromDayNumber(dayNumber: number): IsoDate {
  throw new Error(`fromDayNumber not implemented (${dayNumber})`);
}

/** The date `days` days later (or earlier, if negative). */
export function addDays(date: IsoDate, days: number): IsoDate {
  throw new Error(`addDays not implemented (${date}, ${days})`);
}

export function weekdayOf(date: IsoDate): Weekday {
  throw new Error(`weekdayOf not implemented (${date})`);
}

/** 'Thu 3 Dec 2026', the same on every machine and locale (D-11). */
export function formatDisplayDate(date: IsoDate): string {
  throw new Error(`formatDisplayDate not implemented (${date})`);
}
