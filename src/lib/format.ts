/**
 * Numbers and dates turned into the result text (S-1 AC-5, S-2 AC-6, S-3 AC-5, S-4).
 * Presentation only: nothing here calculates.
 */
import type { DueDateOption } from './admin';
import { formatDisplayDate, type IsoDate } from './dates';
import { TIGHT_PERCENT, WORKING_DAY_MINUTES } from './rules';
import { describeWorkingDays, type WorkingDays } from './workingDays';

/** What follows the number: 'min', or 'min (1 h 25 min)' from 60 minutes up (S-1 AC-5). */
export function formatMinutesUnit(minutes: number): string {
  if (minutes < 60) return 'min';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `min (${hours} h${rest === 0 ? '' : ` ${rest} min`})`;
}

/** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 AC-5). */
export function formatMinutes(minutes: number): string {
  return `${minutes} ${formatMinutesUnit(minutes)}`;
}

const workingDayCount = (count: number) => `${count} working day${count === 1 ? '' : 's'}`;

/** '26 working days (Mon–Fri)' (S-2 AC-6). */
export function workingDaysPhrase(count: number, workingDays: WorkingDays): string {
  return `${workingDayCount(count)} (${describeWorkingDays(workingDays)})`;
}

/** '15 min a day over 26 working days (Mon–Fri)' (S-2 AC-6). */
export function learnerPlanSentence(neededPerDay: number, workingDaysLeft: number, workingDays: WorkingDays): string {
  return `${formatMinutes(neededPerDay)} a day over ${workingDaysPhrase(workingDaysLeft, workingDays)}`;
}

/** The Late sentence in three parts, so the finish date can be shown large (S-3 AC-5). */
export function lateParts(spareMinutesPerDay: number, finishDate: IsoDate, workingDaysLate: number) {
  return {
    lead: `At ${formatMinutes(spareMinutesPerDay)} a day you'll finish on`,
    date: formatDisplayDate(finishDate),
    lateBy: `${workingDayCount(workingDaysLate)} late`,
  };
}

/** "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working days late." (S-3 AC-5). */
export function lateSentence(spareMinutesPerDay: number, finishDate: IsoDate, workingDaysLate: number): string {
  const { lead, date, lateBy } = lateParts(spareMinutesPerDay, finishDate, workingDaysLate);
  return `${lead} ${date}, ${lateBy}.`;
}

/** '5 working days (Mon–Fri) at 60 min (1 h) a day' (S-4, S-2 AC-6). */
export function adminOptionSentence(option: DueDateOption, workingDays: WorkingDays): string {
  return `${workingDaysPhrase(option.workingDayCount, workingDays)} at ${formatMinutes(option.minutesPerDay)} a day`;
}

/**
 * S-3 AC-10, D-16: minutes needed as a share of spare minutes, rounded to the nearest whole
 * percent (15 of 18 is 83%). It describes a share, not an amount to plan with, so D-1's
 * rounding up does not apply. The status itself always comes from the exact numbers.
 */
export function pacePercent(neededPerDay: number, spareMinutesPerDay: number): number {
  return Math.round((neededPerDay * 100) / spareMinutesPerDay);
}

/** Where the meter's marker sits: the exact share, so it is always in its status's zone. */
export function markerPosition(neededPerDay: number, spareMinutesPerDay: number): number {
  return meterPosition((neededPerDay * 100) / spareMinutesPerDay);
}

/** S-3 AC-10: more than a full working day a day is off any useful scale: "way over", no bar. */
export function meterIsOffScale(neededPerDay: number): boolean {
  return neededPerDay > WORKING_DAY_MINUTES;
}

/** S-3 AC-9: the On track message talks to the person. */
export function onTrackSentence(percent: number): string {
  return `Comfortable: you're using ${percent}% of your spare time.`;
}

/** The pace meter's scale runs from 0% to 125% of spare time; beyond that the marker stays at the end. */
export const METER_MAX_PERCENT = 125;

/** Where a percentage sits along the meter, from 0 to 100 (% of its width). */
export function meterPosition(percent: number): number {
  return (Math.min(percent, METER_MAX_PERCENT) / METER_MAX_PERCENT) * 100;
}

/** The meter's zones: On track up to 80%, Tight up to 100%, Late beyond (D-2). */
export const METER_ZONES = {
  onTrack: meterPosition(TIGHT_PERCENT),
  tight: meterPosition(100) - meterPosition(TIGHT_PERCENT),
  late: 100 - meterPosition(100),
};

/** '15 min of your 30 min spare · 50%', with hours from 60 minutes up (S-3 AC-10, S-1 AC-5). */
export function paceMeterText(neededPerDay: number, spareMinutesPerDay: number): string {
  return `${formatMinutes(neededPerDay)} of your ${formatMinutes(spareMinutesPerDay)} spare · ${pacePercent(neededPerDay, spareMinutesPerDay)}%`;
}
