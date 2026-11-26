/**
 * Form text → checked engine input, or every field error at once (S-5).
 *
 * Only checks one field at a time (format and limits). Checks that compare
 * fields, or compare with today, belong to the engine, in the S-5 AC-3 order.
 */
import type { AdminInput } from './admin';
import { parseIsoDate, toDayNumber, type IsoDate } from './dates';
import type { LearnerInput } from './learner';
import { err, ok, type Result } from './result';
import { MAX_DAYS_AHEAD, MAX_HOURS, WORKING_DAY_MINUTES } from './rules';
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

/** Arabic-Indic (٠–٩) and Extended Arabic-Indic (۰–۹) digits become 0–9 (D-13). */
function westernDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** A whole number from 0 to `max`, with spaces ignored and Arabic-Indic digits accepted (D-13). */
export function parseWholeNumber(
  text: string,
  max: number,
  tooLarge: FieldErrorCode,
): Result<number, FieldErrorCode> {
  const clean = westernDigits(text).trim();
  if (clean === '') return err('required');
  if (/^-\s*\d/.test(clean)) return err('negative');
  // Digits only: rejects '1.5', '1e3', '+5', '0x10', 'Infinity', which Number() would accept.
  if (!/^\d+$/.test(clean)) return err('not-whole');
  const value = Number(clean);
  return value > max ? err(tooLarge) : ok(value);
}

/** Hours + minutes in minutes, or null after recording each field's error. */
function parseDuration(
  text: DurationText,
  fields: { hours: FieldId; minutes: FieldId },
  errors: FieldError[],
): number | null {
  const hours = parseWholeNumber(text.hours, MAX_HOURS, 'hours-over-max');
  const minutes = parseWholeNumber(text.minutes, 59, 'minutes-over-59');
  if (!hours.ok) errors.push({ field: fields.hours, code: hours.error });
  if (!minutes.ok) errors.push({ field: fields.minutes, code: minutes.error });
  return hours.ok && minutes.ok ? hours.value * 60 + minutes.value : null;
}

/** A real date no more than 5 years after today (D-9). Past dates pass: the engine reports them in order. */
function parseDate(text: string, today: IsoDate, field: FieldId, errors: FieldError[]): IsoDate | null {
  const date = parseIsoDate(text);
  if (date === null) {
    errors.push({ field, code: 'date-invalid' });
    return null;
  }
  if (toDayNumber(date) - toDayNumber(today) > MAX_DAYS_AHEAD) {
    errors.push({ field, code: 'date-too-far' });
    return null;
  }
  return date;
}

export function parseLearnerForm(form: LearnerFormText, today: IsoDate): Result<LearnerInput, FieldError[]> {
  const errors: FieldError[] = [];

  const totalMinutes = parseDuration(form.total, { hours: 'totalHours', minutes: 'totalMinutes' }, errors);
  if (totalMinutes === 0) errors.push({ field: 'total', code: 'total-zero' });
  const doneMinutes = parseDuration(form.done, { hours: 'doneHours', minutes: 'doneMinutes' }, errors);
  const dueDate = parseDate(form.dueDate, today, 'dueDate', errors);

  let spareMinutesPerDay: number | null = null;
  if (form.spare.trim() !== '') {
    const spare = parseWholeNumber(form.spare, WORKING_DAY_MINUTES, 'per-day-over-max');
    if (spare.ok) spareMinutesPerDay = spare.value;
    else errors.push({ field: 'spare', code: spare.error });
  }

  if (errors.length > 0 || totalMinutes === null || doneMinutes === null || dueDate === null) return err(errors);
  return ok({ today, dueDate, workingDays: form.workingDays, totalMinutes, doneMinutes, spareMinutesPerDay });
}

export function parseAdminForm(form: AdminFormText, today: IsoDate): Result<AdminInput, FieldError[]> {
  const errors: FieldError[] = [];

  const courseMinutes = parseDuration(form.course, { hours: 'courseHours', minutes: 'courseMinutes' }, errors);
  if (courseMinutes === 0) errors.push({ field: 'course', code: 'total-zero' });
  const startDate = parseDate(form.startDate, today, 'startDate', errors);
  const daily = parseWholeNumber(form.daily, WORKING_DAY_MINUTES, 'per-day-over-max');
  if (!daily.ok) errors.push({ field: 'daily', code: daily.error });

  if (errors.length > 0 || courseMinutes === null || startDate === null || !daily.ok) return err(errors);
  return ok({ today, startDate, workingDays: form.workingDays, courseMinutes, dailyMinutes: daily.value });
}
