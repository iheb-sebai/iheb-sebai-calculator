import { describe, expect, it } from 'vitest';
import { calculateAdmin, type AdminInput, type AdminResult } from './admin';
import { calculateLearner } from './learner';
import { ALL_CHOICES, START_DATES, days, iso, nonFiniteNumbers } from './test-helpers';
import { PRESETS, nthWorkingDay } from './workingDays';

const { monFri, sunThu } = PRESETS;
const THU = iso('2026-11-26');
const SAT = iso('2026-11-28');

/** The S-4 AC-2 example; each test overrides only what it is about. */
function input(overrides: Partial<AdminInput> = {}): AdminInput {
  return { today: THU, startDate: THU, workingDays: monFri, courseMinutes: 300, dailyMinutes: 60, ...overrides };
}

type Dates = Extract<AdminResult, { kind: 'dates' }>;

function datesFor(overrides: Partial<AdminInput>): Dates {
  const result = calculateAdmin(input(overrides));
  if (!result.ok || result.value.kind !== 'dates') {
    throw new Error(`expected dates, got ${JSON.stringify(result)}`);
  }
  return result.value;
}

function errorFor(overrides: Partial<AdminInput>) {
  const result = calculateAdmin(input(overrides));
  if (result.ok) throw new Error(`expected an error, got ${JSON.stringify(result)}`);
  return result.error;
}

describe('S-4: earliest and recommended due date', () => {
  it('S-4 AC-2: 300 min at 60 a day from Thu 26 Nov, Mon–Fri: earliest is Wed 2 Dec (5 working days)', () => {
    expect(datesFor({}).earliest).toEqual({ date: '2026-12-02', workingDayCount: 5, minutesPerDay: 60 });
  });

  it('S-4 AC-3: recommended is Fri 4 Dec: 7 working days at 43 min a day, within the 48-minute pace', () => {
    expect(datesFor({}).recommended).toEqual({ date: '2026-12-04', workingDayCount: 7, minutesPerDay: 43 });
  });

  it('D-1: 61 min at 60 a day needs 2 working days, never 1', () => {
    expect(datesFor({ courseMinutes: 61 }).earliest).toEqual({
      date: '2026-11-27',
      workingDayCount: 2,
      minutesPerDay: 31,
    });
  });

  it('S-4 AC-1: a start date of today is allowed', () => {
    expect(datesFor({ startDate: THU }).earliest.date).toBe('2026-12-02');
  });

  it('S-4 AC-2: a start date on a Saturday counts from Monday', () => {
    expect(datesFor({ startDate: SAT, courseMinutes: 60 }).earliest.date).toBe('2026-11-30');
  });

  it('S-2 AC-1: the working days change the date (2 days: Fri 27 on Mon–Fri, Sun 29 on Sun–Thu)', () => {
    expect(datesFor({ courseMinutes: 120, workingDays: monFri }).earliest.date).toBe('2026-11-27');
    expect(datesFor({ courseMinutes: 120, workingDays: sunThu }).earliest.date).toBe('2026-11-29');
  });

  it('S-4 AC-4: at 1 minute a day there is no recommended date, but the earliest is still shown', () => {
    const dates = datesFor({ courseMinutes: 3, dailyMinutes: 1 });
    expect(dates.earliest.date).toBe('2026-11-30');
    expect(dates.recommended).toBeNull();
  });

  it('S-4 AC-4: at 2 minutes a day the recommended date exists (a pace of 1)', () => {
    const dates = datesFor({ courseMinutes: 3, dailyMinutes: 2 });
    expect(dates.earliest.date).toBe('2026-11-27');
    expect(dates.recommended?.date).toBe('2026-11-30');
  });

  it('S-4 AC-5: 0 minutes a day gives no date, and is not an error', () => {
    expect(calculateAdmin(input({ dailyMinutes: 0 }))).toEqual({ ok: true, value: { kind: 'no-time' } });
  });

  it('S-4 AC-6: the dates keep the learner promise for every working-day choice, start weekday, course and daily time', () => {
    // Earliest: not Late. One working day earlier: Late. Recommended: On track.
    const problems: string[] = [];
    for (const workingDays of ALL_CHOICES) {
      for (const startDate of START_DATES) {
        for (const courseMinutes of [1, 59, 60, 61, 300, 460, 1000, 5999]) {
          for (const dailyMinutes of [1, 2, 5, 37, 60, 61, 480]) {
            const where = `${[...workingDays].sort().join('')} from ${startDate}, ${courseMinutes} min at ${dailyMinutes}`;
            const admin = calculateAdmin({ today: startDate, startDate, workingDays, courseMinutes, dailyMinutes });
            if (!admin.ok || admin.value.kind !== 'dates') {
              problems.push(`${where}: no dates (${JSON.stringify(admin)})`);
              continue;
            }
            const { earliest, recommended } = admin.value;
            const statusIfDue = (dueDate: string) => {
              const learner = calculateLearner({
                today: startDate,
                dueDate: iso(dueDate),
                workingDays,
                totalMinutes: courseMinutes,
                doneMinutes: 0,
                spareMinutesPerDay: dailyMinutes,
              });
              return learner.ok && learner.value.kind === 'plan' ? learner.value.pace?.status : 'no plan';
            };

            if (statusIfDue(earliest.date) === 'late') problems.push(`${where}: earliest ${earliest.date} is Late`);
            if (earliest.workingDayCount >= 2) {
              const dayBefore = nthWorkingDay(startDate, earliest.workingDayCount - 1, workingDays)!;
              if (statusIfDue(dayBefore) !== 'late') {
                problems.push(`${where}: ${dayBefore} is also achievable, so ${earliest.date} is not the earliest`);
              }
            }
            if (recommended && statusIfDue(recommended.date) !== 'on-track') {
              problems.push(`${where}: recommended ${recommended.date} is not On track`);
            }
          }
        }
      }
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });
});

describe('S-12: errors and the order they are checked in', () => {
  it('S-12: no working day selected is an error', () => {
    expect(errorFor({ workingDays: days() })).toBe('no-working-days-selected');
  });

  it('S-12: a start date before today is an error', () => {
    expect(errorFor({ startDate: iso('2026-11-25') })).toBe('start-date-in-past');
  });

  it('S-12 AC-3: no working day selected comes before a past start date', () => {
    expect(errorFor({ workingDays: days(), startDate: iso('2026-11-25') })).toBe('no-working-days-selected');
  });

  it.each([
    ['courseMinutes', 0],
    ['courseMinutes', -1],
    ['courseMinutes', Number.NaN],
    ['courseMinutes', 1.5],
    ['courseMinutes', Number.POSITIVE_INFINITY],
    ['dailyMinutes', -1],
    ['dailyMinutes', Number.NaN],
    ['dailyMinutes', 1.5],
    ['dailyMinutes', Number.POSITIVE_INFINITY],
  ])('S-12 AC-1: %s = %s gives an error, not NaN or an exception', (field, value) => {
    expect(errorFor({ [field]: value })).toBe('invalid-input');
  });

  it('S-12 AC-1: no result ever contains NaN or Infinity, and nothing throws', () => {
    const problems: string[] = [];
    for (const workingDays of [monFri, days(), days(0)]) {
      for (const startDate of [iso('2026-11-25'), THU, SAT, iso('2031-11-26')]) {
        for (const courseMinutes of [1, 300, 59_999]) {
          for (const dailyMinutes of [0, 1, 2, 480]) {
            const value = { startDate, workingDays, courseMinutes, dailyMinutes };
            try {
              problems.push(...nonFiniteNumbers(calculateAdmin(input(value))));
            } catch (error) {
              problems.push(`${JSON.stringify(value)} threw ${String(error)}`);
            }
          }
        }
      }
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });
});
