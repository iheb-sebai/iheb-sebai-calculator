/**
 * Counting and stepping over working days.
 *
 * Both functions work in whole weeks plus a remainder, so they take the same
 * time for 3 days or 300 years (a slow pace can project a finish date far away).
 *
 * RED PHASE: the presets are real data, the functions are not built yet.
 */
import type { IsoDate, Weekday } from './dates';

/** The weekdays someone works on. */
export type WorkingDays = ReadonlySet<Weekday>;

export type PresetId = 'monFri' | 'sunThu';

/** S-2 AC-1. Mon–Fri is the default (D-12). */
export const PRESETS: Readonly<Record<PresetId, WorkingDays>> = {
  monFri: new Set<Weekday>([1, 2, 3, 4, 5]),
  sunThu: new Set<Weekday>([0, 1, 2, 3, 4]),
};

/**
 * Working days from `from` to `to`, both included (S-2 AC-3, D-3, D-5).
 * Returns 0 when `to` is before `from` or no day is selected.
 */
export function countWorkingDays(from: IsoDate, to: IsoDate, days: WorkingDays): number {
  throw new Error(`countWorkingDays not implemented (${from}, ${to}, ${days.size})`);
}

/**
 * The nth working day counting from `from`, which counts itself if it is a working day.
 * Returns null when n is not a whole number ≥ 1 or no day is selected.
 */
export function nthWorkingDay(from: IsoDate, n: number, days: WorkingDays): IsoDate | null {
  throw new Error(`nthWorkingDay not implemented (${from}, ${n}, ${days.size})`);
}

/** Which preset the selection matches, or 'custom' (S-2 AC-2). */
export function presetFor(days: WorkingDays): PresetId | 'custom' {
  throw new Error(`presetFor not implemented (${days.size})`);
}

/** Short label repeated in every result sentence: 'Mon–Fri', 'Mon, Wed, Fri', 'every day' (S-2 AC-6). */
export function describeWorkingDays(days: WorkingDays): string {
  throw new Error(`describeWorkingDays not implemented (${days.size})`);
}
