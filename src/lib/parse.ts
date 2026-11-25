/**
 * Form text → checked engine input, or every field error at once (S-5).
 *
 * Only checks one field at a time (format and limits). Checks that compare
 * fields, or compare with today, belong to the engine, in the S-5 AC-3 order.
 *
 * RED PHASE: types and signatures only.
 */
import type { AdminInput } from './admin';
import type { IsoDate } from './dates';
import type { LearnerInput } from './learner';
import type { Result } from './result';
import type { WorkingDays } from './workingDays';

export type FieldErrorCode =
  | 'required'
  | 'negative'
  | 'not-whole'
  | 'hours-over-max'
  | 'minutes-over-59'
  | 'per-day-over-max'
  | 'total-zero'
  | 'date-invalid'
  | 'date-too-far';

/** Where a message is shown. 'total', 'done' and 'course' are the hours + minutes groups. */
export type FieldId =
  | 'totalHours'
  | 'totalMinutes'
  | 'total'
  | 'doneHours'
  | 'doneMinutes'
  | 'done'
  | 'dueDate'
  | 'spare'
  | 'courseHours'
  | 'courseMinutes'
  | 'course'
  | 'startDate'
  | 'daily'
  | 'workingDays';

export interface FieldError {
  field: FieldId;
  code: FieldErrorCode;
}

export interface DurationText {
  hours: string;
  minutes: string;
}

export interface LearnerFormText {
  total: DurationText;
  done: DurationText;
  dueDate: string;
  /** Blank is allowed: no status is shown (S-3 AC-7). */
  spare: string;
  workingDays: WorkingDays;
}

export interface AdminFormText {
  course: DurationText;
  startDate: string;
  daily: string;
  workingDays: WorkingDays;
}

/** A whole number from 0 to `max`, with spaces ignored and Arabic-Indic digits accepted (D-13). */
export function parseWholeNumber(
  text: string,
  max: number,
  tooLarge: FieldErrorCode,
): Result<number, FieldErrorCode> {
  throw new Error(`parseWholeNumber not implemented (${text}, ${max}, ${tooLarge})`);
}

export function parseLearnerForm(form: LearnerFormText, today: IsoDate): Result<LearnerInput, FieldError[]> {
  throw new Error(`parseLearnerForm not implemented (${form.dueDate}, ${today})`);
}

export function parseAdminForm(form: AdminFormText, today: IsoDate): Result<AdminInput, FieldError[]> {
  throw new Error(`parseAdminForm not implemented (${form.startDate}, ${today})`);
}
