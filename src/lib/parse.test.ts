import { describe, expect, it } from 'vitest';
import {
  parseAdminForm,
  parseLearnerForm,
  parseWholeNumber,
  type AdminFormText,
  type FieldError,
  type LearnerFormText,
} from './parse';
import type { Result } from './result';
import { days, iso } from './test-helpers';
import { PRESETS } from './workingDays';

const { monFri } = PRESETS;
const THU = iso('2026-11-26');
const duration = (hours: string, minutes: string) => ({ hours, minutes });

/** The S-1 AC-6 example as typed into the form. */
function learnerForm(overrides: Partial<LearnerFormText> = {}): LearnerFormText {
  return { total: duration('7', '40'), done: duration('1', '10'), dueDate: '2026-12-31', spare: '', workingDays: monFri, ...overrides };
}

/** The S-4 AC-2 example as typed into the form. */
function adminForm(overrides: Partial<AdminFormText> = {}): AdminFormText {
  return { course: duration('5', '0'), startDate: '2026-11-26', daily: '60', workingDays: monFri, ...overrides };
}

function errorsOf<T>(result: Result<T, FieldError[]>): FieldError[] {
  if (result.ok) throw new Error(`expected field errors, got ${JSON.stringify(result)}`);
  return result.error;
}

describe('parseWholeNumber', () => {
  it.each([
    ['7', 7],
    [' 7 ', 7],
    ['007', 7],
    ['0', 0],
    ['59', 59],
  ])('S-5 input rules: %j is %i', (text, value) => {
    expect(parseWholeNumber(text, 59, 'minutes-over-59')).toEqual({ ok: true, value });
  });

  it.each([
    ['١٥', 15],
    ['۱۵', 15],
    [' ٠ ', 0],
  ])('D-13: Arabic-Indic digits %j are %i', (text, value) => {
    expect(parseWholeNumber(text, 480, 'per-day-over-max')).toEqual({ ok: true, value });
  });

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['-5', 'negative'],
    ['-0.5', 'negative'],
    ['1.5', 'not-whole'],
    ['1,5', 'not-whole'],
    ['abc', 'not-whole'],
    ['1e3', 'not-whole'],
    ['+5', 'not-whole'],
    ['5 min', 'not-whole'],
    ['0x10', 'not-whole'],
    ['Infinity', 'not-whole'],
    ['NaN', 'not-whole'],
    ['60', 'minutes-over-59'],
    ['99999999999999999999', 'minutes-over-59'],
  ])('S-5 input rules: %j gives %s', (text, code) => {
    expect(parseWholeNumber(text, 59, 'minutes-over-59')).toEqual({ ok: false, error: code });
  });
});

describe('parseLearnerForm', () => {
  it('S-1 AC-6: the realistic example becomes 460 min total and 70 min done', () => {
    expect(parseLearnerForm(learnerForm(), THU)).toEqual({
      ok: true,
      value: {
        today: THU,
        dueDate: '2026-12-31',
        workingDays: monFri,
        totalMinutes: 460,
        doneMinutes: 70,
        spareMinutesPerDay: null,
      },
    });
  });

  it('S-3 AC-7: blank spare time is null, not an error', () => {
    const result = parseLearnerForm(learnerForm({ spare: '  ' }), THU);
    expect(result.ok && result.value.spareMinutesPerDay).toBeNull();
  });

  it('S-3 AC-6: 0 spare minutes is accepted', () => {
    const result = parseLearnerForm(learnerForm({ spare: '0' }), THU);
    expect(result.ok && result.value.spareMinutesPerDay).toBe(0);
  });

  it('D-8: 480 spare minutes is accepted, 481 is not', () => {
    expect(parseLearnerForm(learnerForm({ spare: '480' }), THU).ok).toBe(true);
    expect(errorsOf(parseLearnerForm(learnerForm({ spare: '481' }), THU))).toEqual([
      { field: 'spare', code: 'per-day-over-max' },
    ]);
  });

  it('S-5 input rules: 999 h 59 min is accepted, 1000 hours is not', () => {
    expect(parseLearnerForm(learnerForm({ total: duration('999', '59') }), THU).ok).toBe(true);
    expect(errorsOf(parseLearnerForm(learnerForm({ total: duration('1000', '0') }), THU))).toEqual([
      { field: 'totalHours', code: 'hours-over-max' },
    ]);
  });

  it('S-5 input rules: a total of 0 is an error on the total group', () => {
    expect(errorsOf(parseLearnerForm(learnerForm({ total: duration('0', '0'), done: duration('0', '0') }), THU))).toEqual([
      { field: 'total', code: 'total-zero' },
    ]);
  });

  it('S-5 input rules: a total of 0 is not reported while the total fields themselves are wrong', () => {
    expect(errorsOf(parseLearnerForm(learnerForm({ total: duration('x', '0') }), THU))).toEqual([
      { field: 'totalHours', code: 'not-whole' },
    ]);
  });

  it('S-5 input rules: 0 time done is fine', () => {
    expect(parseLearnerForm(learnerForm({ done: duration('0', '0') }), THU).ok).toBe(true);
  });

  it.each([
    ['', 'date-invalid'],
    ['2026-02-30', 'date-invalid'],
    ['31/12/2026', 'date-invalid'],
    ['2031-11-27', 'date-too-far'],
  ])('S-5 input rules: due date %j gives %s', (dueDate, code) => {
    expect(errorsOf(parseLearnerForm(learnerForm({ dueDate }), THU))).toEqual([{ field: 'dueDate', code }]);
  });

  it('D-9: a due date exactly 1,826 days ahead is accepted', () => {
    expect(parseLearnerForm(learnerForm({ dueDate: '2031-11-26' }), THU).ok).toBe(true);
  });

  it('S-5 AC-3: a past due date is left to the engine, so the checks keep their order', () => {
    expect(parseLearnerForm(learnerForm({ dueDate: '2026-11-25' }), THU).ok).toBe(true);
  });

  it('S-5 AC-3: no working day selected is left to the engine', () => {
    expect(parseLearnerForm(learnerForm({ workingDays: days() }), THU).ok).toBe(true);
  });

  it('S-5 AC-2: every field error is reported at once', () => {
    const form = learnerForm({ total: duration('x', '0'), done: duration('1', '75'), dueDate: '', spare: '-3' });
    expect(errorsOf(parseLearnerForm(form, THU))).toEqual([
      { field: 'totalHours', code: 'not-whole' },
      { field: 'doneMinutes', code: 'minutes-over-59' },
      { field: 'dueDate', code: 'date-invalid' },
      { field: 'spare', code: 'negative' },
    ]);
  });

  it('S-5 AC-2: empty hours and minutes are each required', () => {
    expect(errorsOf(parseLearnerForm(learnerForm({ done: duration('', '') }), THU))).toEqual([
      { field: 'doneHours', code: 'required' },
      { field: 'doneMinutes', code: 'required' },
    ]);
  });
});

describe('parseAdminForm', () => {
  it('S-4 AC-2: the docs example becomes 300 course minutes at 60 a day', () => {
    expect(parseAdminForm(adminForm(), THU)).toEqual({
      ok: true,
      value: { today: THU, startDate: THU, workingDays: monFri, courseMinutes: 300, dailyMinutes: 60 },
    });
  });

  it('S-4 AC-5: 0 daily minutes is accepted', () => {
    const result = parseAdminForm(adminForm({ daily: '0' }), THU);
    expect(result.ok && result.value.dailyMinutes).toBe(0);
  });

  it.each([
    ['', 'required'],
    ['481', 'per-day-over-max'],
    ['1.5', 'not-whole'],
  ])('S-12 input rules: daily time %j gives %s', (daily, code) => {
    expect(errorsOf(parseAdminForm(adminForm({ daily }), THU))).toEqual([{ field: 'daily', code }]);
  });

  it('S-12 input rules: a course time of 0 is an error on the course group', () => {
    expect(errorsOf(parseAdminForm(adminForm({ course: duration('0', '0') }), THU))).toEqual([
      { field: 'course', code: 'total-zero' },
    ]);
  });

  it.each([
    ['', 'date-invalid'],
    ['2031-11-27', 'date-too-far'],
  ])('S-12 input rules: start date %j gives %s', (startDate, code) => {
    expect(errorsOf(parseAdminForm(adminForm({ startDate }), THU))).toEqual([{ field: 'startDate', code }]);
  });

  it('S-12 AC-2: every field error is reported at once', () => {
    const form = adminForm({ course: duration('1', '60'), startDate: 'soon', daily: '' });
    expect(errorsOf(parseAdminForm(form, THU))).toEqual([
      { field: 'courseMinutes', code: 'minutes-over-59' },
      { field: 'startDate', code: 'date-invalid' },
      { field: 'daily', code: 'required' },
    ]);
  });
});
