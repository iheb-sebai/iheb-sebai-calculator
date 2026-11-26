import type { IsoDate } from './lib/dates';

/**
 * The only place the app reads the clock (D-4): the device's local calendar date.
 * Built from local parts, never toISOString(), which gives the UTC date and is a
 * day off for part of every day in most time zones.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` as IsoDate;
}
