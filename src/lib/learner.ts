/**
 * The learner calculation (S-1, S-2, S-3, S-5).
 *
 * Pure: `today` is passed in, nothing reads the clock (D-4), and nothing
 * throws. Every outcome is a Result.
 */
import { toDayNumber, type IsoDate } from './dates';
import { divideRoundingUp, isWholeNumber } from './numbers';
import { err, ok, type Result } from './result';
import { TIGHT_PERCENT, WORKING_DAY_MINUTES } from './rules';
import { countWorkingDays, nthWorkingDay, type WorkingDays } from './workingDays';

export interface LearnerInput {
  today: IsoDate;
  dueDate: IsoDate;
  workingDays: WorkingDays;
  totalMinutes: number;
  doneMinutes: number;
  /** null when the field is left blank: no status is shown (S-3 AC-7). */
  spareMinutesPerDay: number | null;
}

export type PaceStatus = 'on-track' | 'tight' | 'late';

export type Pace =
  | { status: 'on-track' | 'tight' }
  /** `finish` is null when spare time is 0: they won't finish at all (S-3 AC-6). */
  | { status: 'late'; finish: { date: IsoDate; workingDaysLate: number } | null };

export type LearnerResult =
  | { kind: 'complete' }
  | {
      kind: 'plan';
      remainingMinutes: number;
      workingDaysLeft: number;
      /** Rounded up (D-1). */
      neededPerDay: number;
      /** More than a full working day (S-1 AC-4). */
      moreThanAWorkingDay: boolean;
      /** null when spare time was left blank. */
      pace: Pace | null;
    };

export type LearnerError =
  | 'invalid-input'
  | 'done-over-total'
  | 'no-working-days-selected'
  | 'due-date-in-past'
  | 'no-working-days-left';

/** S-3 AC-1 to AC-4, compared in whole numbers: needed ≤ 80% of spare is On track. */
export function paceStatus(neededPerDay: number, spareMinutesPerDay: number): PaceStatus {
  if (neededPerDay * 100 <= spareMinutesPerDay * TIGHT_PERCENT) return 'on-track';
  if (neededPerDay <= spareMinutesPerDay) return 'tight';
  return 'late';
}

export function calculateLearner(input: LearnerInput): Result<LearnerResult, LearnerError> {
  const { today, dueDate, workingDays, totalMinutes, doneMinutes, spareMinutesPerDay } = input;

  // The form parser rejects these first; the engine still refuses them (S-5 AC-1).
  if (
    !isWholeNumber(totalMinutes) ||
    totalMinutes === 0 ||
    !isWholeNumber(doneMinutes) ||
    (spareMinutesPerDay !== null && !isWholeNumber(spareMinutesPerDay))
  ) {
    return err('invalid-input');
  }

  // S-5 AC-3: the first matching check wins, in this order.
  if (doneMinutes > totalMinutes) return err('done-over-total');
  if (doneMinutes === totalMinutes) return ok({ kind: 'complete' });
  if (workingDays.size === 0) return err('no-working-days-selected');
  if (toDayNumber(dueDate) < toDayNumber(today)) return err('due-date-in-past');
  const workingDaysLeft = countWorkingDays(today, dueDate, workingDays);
  if (workingDaysLeft === 0) return err('no-working-days-left');

  const remainingMinutes = totalMinutes - doneMinutes;
  const neededPerDay = divideRoundingUp(remainingMinutes, workingDaysLeft);

  return ok({
    kind: 'plan',
    remainingMinutes,
    workingDaysLeft,
    neededPerDay,
    moreThanAWorkingDay: neededPerDay > WORKING_DAY_MINUTES,
    pace:
      spareMinutesPerDay === null
        ? null
        : paceFor({ today, workingDays, remainingMinutes, workingDaysLeft, neededPerDay, spareMinutesPerDay }),
  });
}

function paceFor(p: {
  today: IsoDate;
  workingDays: WorkingDays;
  remainingMinutes: number;
  workingDaysLeft: number;
  neededPerDay: number;
  spareMinutesPerDay: number;
}): Pace {
  const status = paceStatus(p.neededPerDay, p.spareMinutesPerDay);
  if (status !== 'late') return { status };

  // S-3 AC-6: with no time at all there is no finish date to show.
  if (p.spareMinutesPerDay === 0) return { status: 'late', finish: null };

  // S-3 AC-5: at the spare pace, the work ends on this working day, counting from today.
  const workingDaysToFinish = divideRoundingUp(p.remainingMinutes, p.spareMinutesPerDay);
  const date = nthWorkingDay(p.today, workingDaysToFinish, p.workingDays);
  return {
    status: 'late',
    // nthWorkingDay can't return null here (n ≥ 1 and days are selected); null keeps it total.
    finish: date === null ? null : { date, workingDaysLate: workingDaysToFinish - p.workingDaysLeft },
  };
}
