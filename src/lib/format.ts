/**
 * Numbers and dates turned into the result sentences (S-1 AC-5, S-2 AC-6, S-3 AC-5, S-4).
 */
import type { DueDateOption } from './admin';
import { formatDisplayDate, type IsoDate } from './dates';
import { describeWorkingDays, type WorkingDays } from './workingDays';

/** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 AC-5). */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${minutes} min (${hours} h${rest === 0 ? '' : ` ${rest} min`})`;
}

const workingDayCount = (count: number) => `${count} working day${count === 1 ? '' : 's'}`;

/** '15 min a day over 26 working days (Mon–Fri)' (S-2 AC-6). */
export function learnerPlanSentence(neededPerDay: number, workingDaysLeft: number, workingDays: WorkingDays): string {
  return `${formatMinutes(neededPerDay)} a day over ${workingDayCount(workingDaysLeft)} (${describeWorkingDays(workingDays)})`;
}

/** "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working days late." (S-3 AC-5). */
export function lateSentence(spareMinutesPerDay: number, finishDate: IsoDate, workingDaysLate: number): string {
  return `At ${formatMinutes(spareMinutesPerDay)} a day you'll finish on ${formatDisplayDate(finishDate)}, ${workingDayCount(workingDaysLate)} late.`;
}

/** '5 working days (Mon–Fri) at 60 min a day' (S-4, S-2 AC-6). */
export function adminOptionSentence(option: DueDateOption, workingDays: WorkingDays): string {
  return `${workingDayCount(option.workingDayCount)} (${describeWorkingDays(workingDays)}) at ${formatMinutes(option.minutesPerDay)} a day`;
}
