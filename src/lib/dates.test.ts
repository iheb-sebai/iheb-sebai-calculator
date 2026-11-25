import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatDisplayDate,
  fromDayNumber,
  parseIsoDate,
  toDayNumber,
  weekdayOf,
  type IsoDate,
} from './dates';

/** A date literal the test knows is valid, so these tests don't depend on parseIsoDate. */
const iso = (text: string) => text as IsoDate;

describe('parseIsoDate', () => {
  it('S-5 input rules: accepts a real calendar date', () => {
    expect(parseIsoDate('2026-11-26')).toBe('2026-11-26');
  });

  it('S-5 input rules: ignores spaces around the date', () => {
    expect(parseIsoDate('  2026-11-26 ')).toBe('2026-11-26');
  });

  it.each(['2028-02-29', '2000-02-29', '2026-01-01', '2026-12-31', '2026-04-30'])(
    'S-5 input rules: accepts the real date %s',
    (text) => {
      expect(parseIsoDate(text)).toBe(text);
    },
  );

  it.each([
    ['2026-02-29', '2026 is not a leap year'],
    ['2100-02-29', '2100 is a century but not a leap year'],
    ['2026-02-30', 'February has no 30th'],
    ['2026-04-31', 'April has 30 days'],
    ['2026-13-01', 'there is no month 13'],
    ['2026-00-10', 'there is no month 0'],
    ['2026-01-00', 'there is no day 0'],
    ['2026-01-32', 'there is no day 32'],
  ])('S-5 input rules: rejects %s because %s', (text) => {
    expect(parseIsoDate(text)).toBeNull();
  });

  it.each([
    '',
    '   ',
    'abc',
    '2026-1-5',
    '26-11-2026',
    '2026/11/26',
    '20261126',
    '2026-11-26T00:00',
    '+2026-11-26',
    '2026-11-26x',
  ])('S-5 input rules: rejects the badly formed date %j', (text) => {
    expect(parseIsoDate(text)).toBeNull();
  });
});

describe('day numbers', () => {
  // Expected values computed independently with Python's datetime.
  const known: [string, number][] = [
    ['1970-01-01', 0],
    ['1969-12-31', -1],
    ['2000-03-01', 11017],
    ['2026-11-26', 20783],
    ['2028-02-29', 21243],
    ['2100-03-01', 47541],
  ];

  it.each(known)('D-4: toDayNumber(%s) is %i', (text, dayNumber) => {
    expect(toDayNumber(iso(text))).toBe(dayNumber);
  });

  it.each(known)('D-4: fromDayNumber gives back %s for %i', (text, dayNumber) => {
    expect(fromDayNumber(dayNumber)).toBe(text);
  });

  it('D-4: every day from 1999 to 2032 is a valid date, round-trips, and none is skipped', () => {
    const first = toDayNumber(iso('1999-01-01'));
    const last = toDayNumber(iso('2032-12-31'));
    expect(last - first + 1).toBe(12419); // 34 years including 9 leap days

    const problems: string[] = [];
    let previous = '';
    for (let n = first; n <= last; n++) {
      const date = fromDayNumber(n);
      if (parseIsoDate(date) !== date) problems.push(`${n} -> ${date} is not a valid date`);
      if (toDayNumber(date) !== n) problems.push(`${date} does not round-trip to ${n}`);
      if (date <= previous) problems.push(`${date} does not come after ${previous}`);
      previous = date;
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });
});

describe('addDays', () => {
  it.each([
    ['2026-11-26', 0, '2026-11-26'],
    ['2026-11-26', 1, '2026-11-27'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-02-29', 1, '2028-03-01'],
    ['2026-11-26', -26, '2026-10-31'],
    ['2026-11-26', 1826, '2031-11-26'], // D-9: the 5-year date limit
  ])('D-4: %s plus %i days is %s', (start, days, expected) => {
    expect(addDays(iso(start), days)).toBe(expected);
  });
});

describe('weekdayOf (0 = Sunday)', () => {
  it.each([
    ['2026-11-26', 4], // Thursday, used in the docs' examples
    ['2026-11-27', 5],
    ['2026-11-28', 6],
    ['2026-11-29', 0],
    ['2026-11-30', 1],
    ['2028-02-29', 2],
    ['1970-01-01', 4],
    ['1969-12-31', 3], // before day 0: checks that negative numbers wrap correctly
  ])('S-2 AC-3: %s is weekday %i', (text, weekday) => {
    expect(weekdayOf(iso(text))).toBe(weekday);
  });
});

describe('formatDisplayDate', () => {
  it.each([
    ['2026-12-03', 'Thu 3 Dec 2026'],
    ['2028-02-29', 'Tue 29 Feb 2028'],
    ['2027-01-01', 'Fri 1 Jan 2027'],
    ['2026-11-26', 'Thu 26 Nov 2026'],
  ])('D-11: %s is shown as %s', (text, shown) => {
    expect(formatDisplayDate(iso(text))).toBe(shown);
  });
});
