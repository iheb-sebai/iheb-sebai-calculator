import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayIso } from './today';

afterEach(() => {
  vi.useRealTimers();
});

describe('todayIso: the one place the app reads the clock', () => {
  // Built from local parts, so "just after midnight" is local midnight in whatever
  // time zone the run uses. npm run test:tz runs this in UTC+14 and UTC-10, where a
  // version that used UTC (toISOString) would return the wrong day.
  it.each([
    [new Date(2026, 10, 26, 0, 5), '2026-11-26'],
    [new Date(2026, 10, 26, 23, 55), '2026-11-26'],
    [new Date(2026, 11, 31, 23, 59), '2026-12-31'],
    [new Date(2028, 1, 29, 12, 0), '2028-02-29'],
  ])('D-4: %s is the local date %s', (now, expected) => {
    expect(todayIso(now)).toBe(expected);
  });

  it('D-4: with no argument it reads the device clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 26, 0, 5));
    expect(todayIso()).toBe('2026-11-26');
  });
});
