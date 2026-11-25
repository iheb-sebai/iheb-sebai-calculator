import { describe, expect, it } from 'vitest';
import { addDays, weekdayOf, type IsoDate } from './dates';
import { ALL_CHOICES, START_DATES, WEEKDAYS, days, iso } from './test-helpers';
import {
  PRESETS,
  countWorkingDays,
  describeWorkingDays,
  nthWorkingDay,
  presetFor,
  type WorkingDays,
} from './workingDays';

const { monFri, sunThu } = PRESETS;

const THU = iso('2026-11-26');
const FRI = iso('2026-11-27');
const SAT = iso('2026-11-28');

const label = (choice: WorkingDays) => [...choice].sort().join('');

// The oracles: walk one day at a time. Slow, but obviously right.
function slowCount(from: IsoDate, to: IsoDate, choice: WorkingDays): number {
  let count = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (choice.has(weekdayOf(d))) count++;
  return count;
}

function slowNth(from: IsoDate, n: number, choice: WorkingDays): IsoDate {
  let seen = 0;
  for (let d = from; ; d = addDays(d, 1)) {
    if (choice.has(weekdayOf(d)) && ++seen === n) return d;
  }
}

describe('presets', () => {
  it('S-2 AC-1: Mon–Fri is Monday to Friday', () => {
    expect([...monFri].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('S-2 AC-1: Sun–Thu is Sunday to Thursday', () => {
    expect([...sunThu].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('presetFor', () => {
  it('S-2 AC-2: recognises Mon–Fri whatever order the days were ticked in', () => {
    expect(presetFor(days(5, 4, 3, 2, 1))).toBe('monFri');
  });

  it('S-2 AC-2: recognises Sun–Thu', () => {
    expect(presetFor(days(0, 1, 2, 3, 4))).toBe('sunThu');
  });

  it.each([
    ['Mon–Thu', days(1, 2, 3, 4)],
    ['Sun–Fri', days(0, 1, 2, 3, 4, 5)],
    ['every day', days(...WEEKDAYS)],
    ['no days', days()],
  ])('S-2 AC-2: %s is Custom', (_name, choice) => {
    expect(presetFor(choice)).toBe('custom');
  });

  it('S-2 AC-2: exactly one of the 127 choices matches each preset', () => {
    expect(ALL_CHOICES.filter((c) => presetFor(c) === 'monFri')).toHaveLength(1);
    expect(ALL_CHOICES.filter((c) => presetFor(c) === 'sunThu')).toHaveLength(1);
  });
});

describe('countWorkingDays', () => {
  it('S-2 AC-4: today Thu, Mon–Fri, due today gives 1', () => {
    expect(countWorkingDays(THU, THU, monFri)).toBe(1);
  });

  it('S-2 AC-4: today Sat does not count; Mon–Fri, due Fri 4 Dec gives 5', () => {
    expect(countWorkingDays(SAT, iso('2026-12-04'), monFri)).toBe(5);
  });

  it('S-2 AC-4: today Thu, Sun–Thu, due Sun 29 Nov gives 2 (Thu and Sun)', () => {
    expect(countWorkingDays(THU, iso('2026-11-29'), sunThu)).toBe(2);
  });

  it('S-1 AC-6: Thu 26 Nov to Thu 31 Dec 2026, Mon–Fri, is 26 working days', () => {
    expect(countWorkingDays(THU, iso('2026-12-31'), monFri)).toBe(26);
  });

  it('S-2 AC-3: both ends are included (Mon 30 Nov to Fri 4 Dec is 5)', () => {
    expect(countWorkingDays(iso('2026-11-30'), iso('2026-12-04'), monFri)).toBe(5);
  });

  it('S-2 AC-5: a due date on a weekend counts only the working days before it', () => {
    expect(countWorkingDays(THU, iso('2026-11-29'), monFri)).toBe(2);
  });

  it('S-2 AC-3: a due date before today gives 0', () => {
    expect(countWorkingDays(THU, iso('2026-11-25'), monFri)).toBe(0);
  });

  it('S-5 AC-5: today Fri, Sun–Thu, due Sat gives 0 working days left', () => {
    expect(countWorkingDays(FRI, SAT, sunThu)).toBe(0);
  });

  it('S-5 AC-1: no working day selected gives 0, not NaN or an exception', () => {
    expect(countWorkingDays(THU, iso('2026-12-31'), days())).toBe(0);
  });

  it('D-9: five years of Mon–Fri (26 Nov 2026 to 26 Nov 2031) gives 1305', () => {
    expect(countWorkingDays(THU, iso('2031-11-26'), monFri)).toBe(1305);
  });

  it('S-2 AC-3: matches a day-by-day count for all 127 choices, every start weekday and 0–60 days', () => {
    const mismatches: string[] = [];
    for (const choice of ALL_CHOICES) {
      for (const from of START_DATES) {
        for (let length = -1; length <= 60; length++) {
          const to = addDays(from, length);
          const expected = slowCount(from, to, choice);
          const actual = countWorkingDays(from, to, choice);
          if (actual !== expected) {
            mismatches.push(`${label(choice)} ${from}..${to}: got ${actual}, expected ${expected}`);
          }
        }
      }
    }
    expect(mismatches, mismatches.slice(0, 5).join('\n')).toEqual([]);
  });
});

describe('nthWorkingDay', () => {
  it('S-4 AC-2: 5th working day from Thu 26 Nov, Mon–Fri, is Wed 2 Dec', () => {
    expect(nthWorkingDay(THU, 5, monFri)).toBe('2026-12-02');
  });

  it('S-4 AC-3: 7th working day from Thu 26 Nov, Mon–Fri, is Fri 4 Dec', () => {
    expect(nthWorkingDay(THU, 7, monFri)).toBe('2026-12-04');
  });

  it('S-3 AC-5: 6th working day from Thu 26 Nov, Mon–Fri, is Thu 3 Dec', () => {
    expect(nthWorkingDay(THU, 6, monFri)).toBe('2026-12-03');
  });

  it('D-3: the 1st working day is the start date itself when it is a working day', () => {
    expect(nthWorkingDay(THU, 1, monFri)).toBe(THU);
  });

  it('S-4 AC-2: a start date on a weekend begins counting at the next working day', () => {
    expect(nthWorkingDay(SAT, 1, monFri)).toBe('2026-11-30');
    expect(nthWorkingDay(FRI, 1, sunThu)).toBe('2026-11-29');
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'S-5 AC-1: n = %s gives null, not an exception or an endless loop',
    (n) => {
      expect(nthWorkingDay(THU, n, monFri)).toBeNull();
    },
  );

  it('S-5 AC-1: no working day selected gives null', () => {
    expect(nthWorkingDay(THU, 3, days())).toBeNull();
  });

  it('S-3 AC-5: matches a day-by-day walk for all 127 choices, every start weekday and n = 1–30', () => {
    const mismatches: string[] = [];
    for (const choice of ALL_CHOICES) {
      for (const from of START_DATES) {
        for (let n = 1; n <= 30; n++) {
          const expected = slowNth(from, n, choice);
          const actual = nthWorkingDay(from, n, choice);
          if (actual !== expected) {
            mismatches.push(`${label(choice)} from ${from}, n=${n}: got ${actual}, expected ${expected}`);
          }
        }
      }
    }
    expect(mismatches, mismatches.slice(0, 5).join('\n')).toEqual([]);
  });

  it('S-3 AC-5: a very slow pace (59,999 Sundays) still gives the right date, at once', () => {
    const finish = nthWorkingDay(THU, 59_999, days(0));
    expect(finish).not.toBeNull();
    expect(weekdayOf(finish!)).toBe(0);
    expect(countWorkingDays(THU, finish!, days(0))).toBe(59_999);
  });
});

describe('describeWorkingDays', () => {
  it.each([
    ['the Mon–Fri preset', monFri, 'Mon–Fri'],
    ['the Sun–Thu preset', sunThu, 'Sun–Thu'],
    ['Mon, Wed, Fri ticked in any order', days(5, 1, 3), 'Mon, Wed, Fri'],
    ['a weekend-only choice (week starts Monday)', days(0, 6), 'Sat, Sun'],
    ['Mon to Thu', days(1, 2, 3, 4), 'Mon, Tue, Wed, Thu'],
    ['all seven days', days(...WEEKDAYS), 'every day'],
  ])('S-2 AC-6: %s is shown as %j', (_name, choice, shown) => {
    expect(describeWorkingDays(choice)).toBe(shown);
  });

  it('S-5 AC-1: no days selected still gives text, not an exception', () => {
    expect(describeWorkingDays(days())).toBe('no working days');
  });
});
