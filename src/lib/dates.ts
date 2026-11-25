/**
 * Calendar dates with no time of day and no time zone.
 *
 * A date is a 'YYYY-MM-DD' string. All arithmetic is done on whole day numbers
 * (days since 1970-01-01) using plain integer maths, never the Date object, so
 * no result can depend on the machine's time zone or clock (D-4).
 */

/** A validated 'YYYY-MM-DD' calendar date. Create one with parseIsoDate. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

/** Day of the week, numbered as in JavaScript: 0 = Sunday ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Year, month (1–12) and day of a date that is already known to be valid. */
function parts(date: IsoDate): [year: number, month: number, day: number] {
  return [Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10))];
}

function format(year: number, month: number, day: number): IsoDate {
  const pad = (value: number, width: number) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as IsoDate;
}

/** Returns the date if `text` is a real calendar date in 'YYYY-MM-DD' form, otherwise null. */
export function parseIsoDate(text: string): IsoDate | null {
  const match = ISO_DATE.exec(text.trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return format(year, month, day);
}

// toDayNumber and fromDayNumber use Howard Hinnant's civil-date algorithms
// (https://howardhinnant.github.io/date_algorithms.html). They count years from
// March, so the leap day falls at the end of the year and needs no special case.

/** Days since 1970-01-01 (negative before it). */
export function toDayNumber(date: IsoDate): number {
  const [year, month, day] = parts(date);
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const monthFromMarch = (month + 9) % 12;
  const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** The date for a day number. Inverse of toDayNumber. */
export function fromDayNumber(dayNumber: number): IsoDate {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthFromMarch + 2) / 5) + 1;
  const month = monthFromMarch < 10 ? monthFromMarch + 3 : monthFromMarch - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return format(year, month, day);
}

/** The date `days` days later (or earlier, if negative). */
export function addDays(date: IsoDate, days: number): IsoDate {
  return fromDayNumber(toDayNumber(date) + days);
}

export function weekdayOf(date: IsoDate): Weekday {
  // Day 0 (1970-01-01) was a Thursday. The double modulo keeps dates before 1970 positive.
  return (((toDayNumber(date) + 4) % 7) + 7) % 7 as Weekday;
}

/** 'Thu 3 Dec 2026', the same on every machine and locale (D-11). */
export function formatDisplayDate(date: IsoDate): string {
  const [year, month, day] = parts(date);
  return `${WEEKDAY_SHORT_NAMES[weekdayOf(date)]} ${day} ${MONTH_SHORT_NAMES[month - 1]} ${year}`;
}
