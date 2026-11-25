/**
 * The L&D admin calculation (S-4, S-5).
 *
 * Pure: `today` is passed in, nothing reads the clock (D-4), and nothing
 * throws. Every outcome is a Result.
 */
import { toDayNumber, type IsoDate } from './dates';
import { divideRoundingUp, isWholeNumber } from './numbers';
import { err, ok, type Result } from './result';
import { TIGHT_PERCENT } from './rules';
import { nthWorkingDay, type WorkingDays } from './workingDays';

export interface AdminInput {
  today: IsoDate;
  startDate: IsoDate;
  workingDays: WorkingDays;
  courseMinutes: number;
  /** Learning time employees are given per working day. */
  dailyMinutes: number;
}

export interface DueDateOption {
  date: IsoDate;
  /** Working days from the start date to `date`, both included. */
  workingDayCount: number;
  /** What a learner then needs per working day, rounded up (D-1). */
  minutesPerDay: number;
}

export type AdminResult =
  /** Daily time is 0: no due date is achievable (S-4 AC-5). */
  | { kind: 'no-time' }
  | {
      kind: 'dates';
      earliest: DueDateOption;
      /** null at 1 minute a day, where 80% rounds down to 0 (S-4 AC-4). */
      recommended: DueDateOption | null;
    };

export type AdminError = 'invalid-input' | 'no-working-days-selected' | 'start-date-in-past';

export function calculateAdmin(input: AdminInput): Result<AdminResult, AdminError> {
  const { today, startDate, workingDays, courseMinutes, dailyMinutes } = input;

  // The form parser rejects these first; the engine still refuses them (S-5 AC-1).
  if (!isWholeNumber(courseMinutes) || courseMinutes === 0 || !isWholeNumber(dailyMinutes)) {
    return err('invalid-input');
  }

  // S-5 AC-3: the first matching check wins, in this order.
  if (workingDays.size === 0) return err('no-working-days-selected');
  if (toDayNumber(startDate) < toDayNumber(today)) return err('start-date-in-past');
  if (dailyMinutes === 0) return ok({ kind: 'no-time' });

  // S-4 AC-2: as fast as the daily time allows.
  const earliest = dueDateAtPace(startDate, workingDays, courseMinutes, dailyMinutes);
  // Unreachable: the checks above guarantee a date. Kept so the function is total.
  if (earliest === null) return err('invalid-input');

  // S-4 AC-3: the learner's On track rule, so at most 80% of the daily time.
  const recommendedPace = Math.floor((dailyMinutes * TIGHT_PERCENT) / 100);
  const recommended =
    recommendedPace === 0 ? null : dueDateAtPace(startDate, workingDays, courseMinutes, recommendedPace);

  return ok({ kind: 'dates', earliest, recommended });
}

/** The first date by which `courseMinutes` fit at no more than `pace` minutes per working day. */
function dueDateAtPace(
  startDate: IsoDate,
  workingDays: WorkingDays,
  courseMinutes: number,
  pace: number,
): DueDateOption | null {
  const workingDayCount = divideRoundingUp(courseMinutes, pace);
  const date = nthWorkingDay(startDate, workingDayCount, workingDays);
  if (date === null) return null;
  return { date, workingDayCount, minutesPerDay: divideRoundingUp(courseMinutes, workingDayCount) };
}
