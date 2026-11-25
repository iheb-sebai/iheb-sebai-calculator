import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { calculateLearner, paceStatus, type LearnerInput, type LearnerResult } from './learner';
import { days, iso, nonFiniteNumbers, WEEKDAYS } from './test-helpers';
import { PRESETS, countWorkingDays } from './workingDays';

const { monFri, sunThu } = PRESETS;
const THU = iso('2026-11-26');
const FRI = iso('2026-11-27');
const SAT = iso('2026-11-28');
const MON_30 = iso('2026-11-30'); // 3 working days from THU on Mon–Fri: Thu, Fri, Mon
const PAST = iso('2026-11-25');

/** The S-1 AC-6 example; each test overrides only what it is about. */
function input(overrides: Partial<LearnerInput> = {}): LearnerInput {
  return {
    today: THU,
    dueDate: iso('2026-12-31'),
    workingDays: monFri,
    totalMinutes: 460,
    doneMinutes: 70,
    spareMinutesPerDay: null,
    ...overrides,
  };
}

type Plan = Extract<LearnerResult, { kind: 'plan' }>;

function planFor(overrides: Partial<LearnerInput>): Plan {
  const result = calculateLearner(input(overrides));
  if (!result.ok || result.value.kind !== 'plan') {
    throw new Error(`expected a plan, got ${JSON.stringify(result)}`);
  }
  return result.value;
}

function errorFor(overrides: Partial<LearnerInput>) {
  const result = calculateLearner(input(overrides));
  if (result.ok) throw new Error(`expected an error, got ${JSON.stringify(result)}`);
  return result.error;
}

describe('S-1: minutes per working day', () => {
  it('S-1 AC-6: 7 h 40 min total, 1 h 10 min done, due Thu 31 Dec, Mon–Fri: 15 min a day over 26 working days', () => {
    const plan = planFor({});
    expect(plan.remainingMinutes).toBe(390);
    expect(plan.workingDaysLeft).toBe(26);
    expect(plan.neededPerDay).toBe(15);
  });

  it('S-1 AC-1: remaining time is total minus done', () => {
    expect(planFor({ totalMinutes: 100, doneMinutes: 40 }).remainingMinutes).toBe(60);
  });

  it('S-1 AC-2: 100 min over 3 working days is 34, never 33', () => {
    const plan = planFor({ totalMinutes: 100, doneMinutes: 0, dueDate: MON_30 });
    expect(plan.workingDaysLeft).toBe(3);
    expect(plan.neededPerDay).toBe(34);
  });

  it('S-1 AC-3: 90 min over 3 working days is exactly 30', () => {
    expect(planFor({ totalMinutes: 90, doneMinutes: 0, dueDate: MON_30 }).neededPerDay).toBe(30);
  });

  it('D-1: one minute more than an even split rounds up (391 min over 26 days is 16)', () => {
    expect(planFor({ totalMinutes: 461 }).neededPerDay).toBe(16);
  });

  it('S-1 AC-4: 481 min a day is flagged as more than a working day, and still shown', () => {
    const plan = planFor({ totalMinutes: 1443, doneMinutes: 0, dueDate: MON_30 });
    expect(plan.neededPerDay).toBe(481);
    expect(plan.moreThanAWorkingDay).toBe(true);
  });

  it('S-1 AC-4: exactly 480 min a day is not flagged', () => {
    const plan = planFor({ totalMinutes: 1440, doneMinutes: 0, dueDate: MON_30 });
    expect(plan.neededPerDay).toBe(480);
    expect(plan.moreThanAWorkingDay).toBe(false);
  });

  it('S-2 AC-4: a Saturday today is not counted', () => {
    expect(planFor({ today: SAT, dueDate: iso('2026-12-04') }).workingDaysLeft).toBe(5);
  });

  it('D-5: a due date of today is allowed, and today counts', () => {
    const plan = planFor({ dueDate: THU, totalMinutes: 30, doneMinutes: 0 });
    expect(plan.workingDaysLeft).toBe(1);
    expect(plan.neededPerDay).toBe(30);
  });
});

describe('S-3: paceStatus', () => {
  it.each([
    ['S-3 AC-1', 80, 100, 'on-track'],
    ['S-3 AC-2', 81, 100, 'tight'],
    ['S-3 AC-2', 100, 100, 'tight'],
    ['S-3 AC-3', 101, 100, 'late'],
    ['S-3 AC-4', 4, 5, 'on-track'], // exactly 80% on small numbers
    ['S-3 AC-4', 384, 480, 'on-track'], // exactly 80% of the largest spare
    ['S-3 AC-4', 385, 480, 'tight'],
    ['S-3 AC-6', 1, 0, 'late'],
  ])('%s: needed %i with spare %i is %s', (_id, needed, spare, status) => {
    expect(paceStatus(needed, spare)).toBe(status);
  });
});

describe('S-3: pace in the result', () => {
  it('S-3 AC-1: 15 min needed with 30 spare is On track', () => {
    expect(planFor({ spareMinutesPerDay: 30 }).pace).toEqual({ status: 'on-track' });
  });

  it('S-3 AC-2: 15 min needed with 18 spare is Tight (83%)', () => {
    expect(planFor({ spareMinutesPerDay: 18 }).pace).toEqual({ status: 'tight' });
  });

  it('S-3 AC-2: 15 min needed with exactly 15 spare is Tight, not Late', () => {
    expect(planFor({ spareMinutesPerDay: 15 }).pace).toEqual({ status: 'tight' });
  });

  it('S-3 AC-5: the docs example: 300 min, 50 spare, due Mon 30 Nov finishes Thu 3 Dec, 3 working days late', () => {
    const plan = planFor({ totalMinutes: 300, doneMinutes: 0, dueDate: MON_30, spareMinutesPerDay: 50 });
    expect(plan.neededPerDay).toBe(100);
    expect(plan.pace).toEqual({ status: 'late', finish: { date: '2026-12-03', workingDaysLate: 3 } });
  });

  it('S-3 AC-5: 15 min needed with 14 spare finishes Mon 4 Jan 2027, 2 working days late', () => {
    expect(planFor({ spareMinutesPerDay: 14 }).pace).toEqual({
      status: 'late',
      finish: { date: '2027-01-04', workingDaysLate: 2 },
    });
  });

  it('S-3 AC-6: 0 spare minutes is Late with no finish date, not an error', () => {
    expect(planFor({ spareMinutesPerDay: 0 }).pace).toEqual({ status: 'late', finish: null });
  });

  it('S-3 AC-7: blank spare time gives no status, and minutes per day are still shown', () => {
    const plan = planFor({ spareMinutesPerDay: null });
    expect(plan.pace).toBeNull();
    expect(plan.neededPerDay).toBe(15);
  });

  it('S-3 AC-3: Late exactly when spare × working days left is less than the time remaining', () => {
    // The learner's promise in docs/app-roles.md: never "On track" or "Tight" when they'll be late.
    const problems: string[] = [];
    for (const workingDays of [monFri, sunThu, days(6), days(...WEEKDAYS)]) {
      for (let offset = 0; offset <= 40; offset++) {
        const dueDate = addDays(THU, offset);
        for (const remaining of [1, 7, 59, 60, 390, 1000, 5999]) {
          for (const spare of [0, 1, 2, 7, 14, 15, 16, 29, 30, 60, 480]) {
            const result = calculateLearner(
              input({ dueDate, workingDays, totalMinutes: remaining, doneMinutes: 0, spareMinutesPerDay: spare }),
            );
            if (!result.ok || result.value.kind !== 'plan') continue; // e.g. no working days left
            const plan = result.value;
            const where = `due ${dueDate}, ${remaining} min, spare ${spare}`;
            const willBeLate = spare * plan.workingDaysLeft < remaining;

            if ((plan.pace?.status === 'late') !== willBeLate) {
              problems.push(`${where}: status ${plan.pace?.status}, but late = ${willBeLate}`);
            }
            if (plan.pace?.status === 'late' && plan.pace.finish) {
              const { date, workingDaysLate } = plan.pace.finish;
              const daysToFinish = countWorkingDays(THU, date, workingDays);
              if (date <= dueDate) problems.push(`${where}: finish ${date} is not after the due date`);
              if (daysToFinish !== Math.ceil(remaining / spare)) {
                problems.push(`${where}: finish ${date} is not the day the work is done`);
              }
              if (daysToFinish - workingDaysLate !== plan.workingDaysLeft) {
                problems.push(`${where}: ${workingDaysLate} working days late does not add up`);
              }
            }
          }
        }
      }
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });
});

describe('S-5: errors and the order they are checked in', () => {
  it('S-5: time done more than the total is an error', () => {
    expect(errorFor({ doneMinutes: 461 })).toBe('done-over-total');
  });

  it('S-5: time done equal to the total is Already complete, not an error', () => {
    expect(calculateLearner(input({ doneMinutes: 460 }))).toEqual({ ok: true, value: { kind: 'complete' } });
  });

  it('S-5: no working day selected is an error', () => {
    expect(errorFor({ workingDays: days() })).toBe('no-working-days-selected');
  });

  it('S-5: a due date before today is an error', () => {
    expect(errorFor({ dueDate: PAST })).toBe('due-date-in-past');
  });

  it('S-5 AC-5: no working days left (today Fri, Sun–Thu, due Sat) has its own error', () => {
    expect(errorFor({ today: FRI, dueDate: SAT, workingDays: sunThu })).toBe('no-working-days-left');
  });

  it('S-5 AC-3: time done over the total is reported first', () => {
    expect(errorFor({ doneMinutes: 999, workingDays: days(), dueDate: PAST })).toBe('done-over-total');
  });

  it('S-5 AC-3: Already complete comes before working-day and date errors', () => {
    const result = calculateLearner(input({ doneMinutes: 460, workingDays: days(), dueDate: PAST }));
    expect(result).toEqual({ ok: true, value: { kind: 'complete' } });
  });

  it('S-5 AC-3: no working day selected comes before a past due date', () => {
    expect(errorFor({ workingDays: days(), dueDate: PAST })).toBe('no-working-days-selected');
  });

  it('S-5 AC-3: a past due date comes before no working days left', () => {
    expect(errorFor({ today: FRI, workingDays: sunThu, dueDate: THU })).toBe('due-date-in-past');
  });

  it.each([
    ['totalMinutes', Number.NaN],
    ['totalMinutes', -1],
    ['totalMinutes', 1.5],
    ['totalMinutes', Number.POSITIVE_INFINITY],
    ['totalMinutes', 0],
    ['doneMinutes', Number.NaN],
    ['doneMinutes', -1],
    ['doneMinutes', 0.5],
    ['spareMinutesPerDay', Number.NaN],
    ['spareMinutesPerDay', -1],
    ['spareMinutesPerDay', 1.5],
    ['spareMinutesPerDay', Number.POSITIVE_INFINITY],
  ])('S-5 AC-1: %s = %s gives an error, not NaN or an exception', (field, value) => {
    expect(errorFor({ [field]: value })).toBe('invalid-input');
  });

  it('S-5 AC-1: no result ever contains NaN or Infinity, and nothing throws', () => {
    const problems: string[] = [];
    for (const workingDays of [monFri, days(), days(0)]) {
      for (const dueDate of [PAST, THU, SAT, iso('2031-11-26')]) {
        for (const [totalMinutes, doneMinutes] of [[460, 70], [460, 460], [1, 0], [59_999, 0], [10, 11]]) {
          for (const spareMinutesPerDay of [null, 0, 1, 480]) {
            const value = { dueDate, workingDays, totalMinutes, doneMinutes, spareMinutesPerDay };
            try {
              problems.push(...nonFiniteNumbers(calculateLearner(input(value))));
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
