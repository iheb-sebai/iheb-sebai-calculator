/**
 * Numbers and dates turned into the result sentences (S-1 AC-5, S-2 AC-6, S-3 AC-5, S-4).
 *
 * RED PHASE: signatures only.
 */
import type { DueDateOption } from './admin';
import type { IsoDate } from './dates';
import type { WorkingDays } from './workingDays';

/** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 AC-5). */
export function formatMinutes(minutes: number): string {
  throw new Error(`formatMinutes not implemented (${minutes})`);
}

/** '15 min a day over 26 working days (Mon–Fri)' (S-2 AC-6). */
export function learnerPlanSentence(neededPerDay: number, workingDaysLeft: number, workingDays: WorkingDays): string {
  throw new Error(`learnerPlanSentence not implemented (${neededPerDay}, ${workingDaysLeft}, ${workingDays.size})`);
}

/** "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working days late." (S-3 AC-5). */
export function lateSentence(spareMinutesPerDay: number, finishDate: IsoDate, workingDaysLate: number): string {
  throw new Error(`lateSentence not implemented (${spareMinutesPerDay}, ${finishDate}, ${workingDaysLate})`);
}

/** '5 working days (Mon–Fri) at 60 min a day' (S-4, S-2 AC-6). */
export function adminOptionSentence(option: DueDateOption, workingDays: WorkingDays): string {
  throw new Error(`adminOptionSentence not implemented (${option.date}, ${workingDays.size})`);
}
