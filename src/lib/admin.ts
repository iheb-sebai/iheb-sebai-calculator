/**
 * The L&D admin calculation (S-4, S-5).
 *
 * Pure: `today` is passed in, nothing reads the clock (D-4), and nothing
 * throws. Every outcome is a Result.
 *
 * RED PHASE: types and signatures only.
 */
import type { IsoDate } from './dates';
import type { Result } from './result';
import type { WorkingDays } from './workingDays';

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
  throw new Error(`calculateAdmin not implemented (${input.today})`);
}
