import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALC_ERROR_PLACE,
  CALC_ERROR_TEXT,
  FIELD_ERROR_TEXT,
  LABELS,
  STATUS_DETAIL,
  STATUS_LABEL,
  TEXT,
  type CalcError,
} from './messages';
import type { FieldErrorCode } from './parse';

// Line breaks and indentation in the Markdown are collapsed, so a message wrapped across lines still matches.
const userStories = readFileSync(new URL('../../docs/user-stories.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');

const FIELD_CODES: FieldErrorCode[] = [
  'required',
  'negative',
  'not-whole',
  'hours-over-max',
  'minutes-over-59',
  'per-day-over-max',
  'total-zero',
  'date-invalid',
  'date-too-far',
];

const CALC_CODES: CalcError[] = [
  'invalid-input',
  'done-over-total',
  'no-working-days-selected',
  'due-date-in-past',
  'no-working-days-left',
  'start-date-in-past',
];

describe('messages match docs/user-stories.md word for word', () => {
  it.each(FIELD_CODES)('S-5 AC-1: field error %s has its message from the docs', (code) => {
    const text = FIELD_ERROR_TEXT[code];
    expect(text).toBeTruthy();
    expect(userStories).toContain(text);
  });

  it.each(CALC_CODES)('S-5 AC-1: error %s has its message from the docs', (code) => {
    const text = CALC_ERROR_TEXT[code];
    expect(text).toBeTruthy();
    expect(userStories).toContain(text);
  });

  it.each(Object.keys(TEXT) as (keyof typeof TEXT)[])('result text %s is the wording in the docs', (key) => {
    expect(TEXT[key]).toBeTruthy();
    expect(userStories).toContain(TEXT[key]);
  });

  it.each(Object.entries(LABELS))('screen text: label %s (%j) is listed in the docs', (_key, text) => {
    expect(userStories).toContain(text);
  });

  it.each(Object.entries(STATUS_DETAIL))('S-3 AC-9: the %s explanation is the wording in the docs', (_status, text) => {
    expect(userStories).toContain(text);
  });

  it('S-3 AC-8: each status is a word', () => {
    expect(STATUS_LABEL).toEqual({ 'on-track': 'On track', tight: 'Tight', late: 'Late' });
  });
});

describe('where each engine error is shown (S-5 messages table)', () => {
  it.each([
    ['done-over-total', 'done'],
    ['no-working-days-selected', 'workingDays'],
    ['due-date-in-past', 'dueDate'],
    ['no-working-days-left', 'result'],
    ['start-date-in-past', 'startDate'],
    ['invalid-input', 'result'],
  ] as const)('S-5: %s is shown at %s', (code, place) => {
    expect(CALC_ERROR_PLACE[code]).toBe(place);
  });
});

describe('what the docs say is not built', () => {
  it('S-11: the timeline from the design is listed as not implemented', () => {
    const notImplemented = userStories.slice(userStories.indexOf('## Not implemented (next)'));
    expect(notImplemented).toMatch(/S-11\W+Timeline/);
  });
});
