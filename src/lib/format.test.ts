import { describe, expect, it } from 'vitest';
import { adminOptionSentence, formatMinutes, lateSentence, learnerPlanSentence } from './format';
import { days, iso } from './test-helpers';
import { PRESETS } from './workingDays';

const { monFri, sunThu } = PRESETS;

describe('formatMinutes', () => {
  it.each([
    [1, '1 min'],
    [34, '34 min'],
    [59, '59 min'],
    [60, '60 min (1 h)'],
    [85, '85 min (1 h 25 min)'],
    [120, '120 min (2 h)'],
    [481, '481 min (8 h 1 min)'],
  ])('S-1 AC-5: %i is shown as %j', (minutes, shown) => {
    expect(formatMinutes(minutes)).toBe(shown);
  });
});

describe('learnerPlanSentence', () => {
  it('S-2 AC-6: names the working days: 15 min a day over 26 working days (Mon–Fri)', () => {
    expect(learnerPlanSentence(15, 26, monFri)).toBe('15 min a day over 26 working days (Mon–Fri)');
  });

  it('S-2 AC-6: one working day is singular', () => {
    expect(learnerPlanSentence(30, 1, sunThu)).toBe('30 min a day over 1 working day (Sun–Thu)');
  });

  it('S-1 AC-5: an hour or more is also shown in hours and minutes', () => {
    expect(learnerPlanSentence(85, 3, days(1, 3, 5))).toBe('85 min (1 h 25 min) a day over 3 working days (Mon, Wed, Fri)');
  });
});

describe('lateSentence', () => {
  it('S-3 AC-5: gives the finish date and the working days late', () => {
    expect(lateSentence(14, iso('2027-01-04'), 2)).toBe(
      "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working days late.",
    );
  });

  it('S-3 AC-5: one working day late is singular', () => {
    expect(lateSentence(50, iso('2026-12-03'), 1)).toBe(
      "At 50 min a day you'll finish on Thu 3 Dec 2026, 1 working day late.",
    );
  });
});

describe('adminOptionSentence', () => {
  it('S-4 AC-2, S-2 AC-6, S-1 AC-5: working days, which days, and the daily minutes', () => {
    const option = { date: iso('2026-12-02'), workingDayCount: 5, minutesPerDay: 60 };
    expect(adminOptionSentence(option, monFri)).toBe('5 working days (Mon–Fri) at 60 min (1 h) a day');
  });

  it('S-4 AC-3: the recommended option shows the lower daily minutes', () => {
    const option = { date: iso('2026-12-04'), workingDayCount: 7, minutesPerDay: 43 };
    expect(adminOptionSentence(option, sunThu)).toBe('7 working days (Sun–Thu) at 43 min a day');
  });

  it('S-4: one working day is singular', () => {
    const option = { date: iso('2026-11-26'), workingDayCount: 1, minutesPerDay: 30 };
    expect(adminOptionSentence(option, monFri)).toBe('1 working day (Mon–Fri) at 30 min a day');
  });
});
