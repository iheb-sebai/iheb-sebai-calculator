import { describe, expect, it } from 'vitest';
import { addMonths, endOfWeek, monthGrid, monthTitle, startOfWeek } from './calendar';
import { addDays, weekdayOf } from './dates';
import { iso } from './test-helpers';

describe('date picker month grid (S-6 AC-8)', () => {
  it('S-6 AC-8: December 2026 starts on a Tuesday, Monday first, in 5 weeks', () => {
    const weeks = monthGrid(iso('2026-12-15'));
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([null, '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06']);
    expect(weeks[4]).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', null, null, null]);
  });

  it('S-6 AC-8: February 2026 starts on a Sunday, so the first week has 6 blanks', () => {
    const weeks = monthGrid(iso('2026-02-10'));
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-02-01']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(28);
  });

  it('S-6 AC-8: every month from 2026 to 2032 has each day once, in a Monday-first column', () => {
    const problems: string[] = [];
    for (let first = iso('2026-01-01'); first < '2033-01-01'; first = addMonths(first, 1)) {
      const weeks = monthGrid(first);
      const days = weeks.flat().filter((d) => d !== null);
      if (days[0] !== first) problems.push(`${first}: starts at ${days[0]}`);
      days.forEach((day, i) => {
        if (i > 0 && day !== addDays(days[i - 1]!, 1)) problems.push(`${first}: ${day} does not follow ${days[i - 1]}`);
      });
      weeks.forEach((week) =>
        week.forEach((day, column) => {
          if (day !== null && (weekdayOf(day) + 6) % 7 !== column) problems.push(`${day} is in the wrong column`);
        }),
      );
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });

  it('S-6 AC-8: the title is the month and year', () => {
    expect(monthTitle(iso('2026-12-31'))).toBe('December 2026');
  });

  it.each([
    ['2026-12-15', 1, '2027-01-15'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2026-11-26', -12, '2025-11-26'],
    ['2026-11-26', 12, '2027-11-26'],
  ])('S-6 AC-8: Page Up/Down from %s by %i months lands on %s', (from, months, to) => {
    expect(addMonths(iso(from), months)).toBe(to);
  });

  it.each([
    ['2026-11-26', '2026-11-23', '2026-11-29'], // Thursday
    ['2026-11-23', '2026-11-23', '2026-11-29'], // Monday
    ['2026-11-29', '2026-11-23', '2026-11-29'], // Sunday
  ])('S-6 AC-8: Home/End from %s go to %s and %s', (from, monday, sunday) => {
    expect(startOfWeek(iso(from))).toBe(monday);
    expect(endOfWeek(iso(from))).toBe(sunday);
  });
});
