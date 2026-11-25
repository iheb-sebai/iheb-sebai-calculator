/**
 * The learner calculation (S-1, S-2, S-3, S-5).
 *
 * Pure: `today` is passed in, nothing reads the clock (D-4), and nothing
 * throws. Every outcome is a Result.
 *
 * RED PHASE: types and signatures only.
 */
import type { IsoDate } from './dates';
import type { Result } from './result';
import type { WorkingDays } from './workingDays';

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

/** S-3 AC-1 to AC-4, compared in whole numbers. */
export function paceStatus(neededPerDay: number, spareMinutesPerDay: number): PaceStatus {
  throw new Error(`paceStatus not implemented (${neededPerDay}, ${spareMinutesPerDay})`);
}

export function calculateLearner(input: LearnerInput): Result<LearnerResult, LearnerError> {
  throw new Error(`calculateLearner not implemented (${input.today})`);
}
