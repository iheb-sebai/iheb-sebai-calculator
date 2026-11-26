import { describe, expect, it } from 'vitest';
import {
  adminOptionSentence,
  formatMinutes,
  formatMinutesUnit,
  lateParts,
  lateSentence,
  learnerPlanSentence,
  markerPosition,
  meterIsOffScale,
  meterPosition,
  METER_ZONES,
  onTrackSentence,
  paceMeterText,
  pacePercent,
  workingDaysPhrase,
} from './format';
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

describe('the parts used for the large result', () => {
  it.each([
    [15, 'min'],
    [60, 'min (1 h)'],
    [85, 'min (1 h 25 min)'],
  ])('S-1 AC-5: the text after %i is %j', (minutes, unit) => {
    expect(formatMinutesUnit(minutes)).toBe(unit);
  });

  it('S-2 AC-6: the working days phrase is "26 working days (Mon–Fri)"', () => {
    expect(workingDaysPhrase(26, monFri)).toBe('26 working days (Mon–Fri)');
  });

  it('S-3 AC-5: the Late sentence splits into lead, date and days late', () => {
    expect(lateParts(14, iso('2027-01-04'), 2)).toEqual({
      lead: "At 14 min a day you'll finish on",
      date: 'Mon 4 Jan 2027',
      lateBy: '2 working days late',
    });
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

describe('the pace meter', () => {
  it.each([
    [15, 30, 50],
    [15, 18, 83], // 83.3%: rounded normally, not up
    [5, 9, 56], // 55.6%
    [1, 8, 13], // 12.5%: halves round up
    [80, 100, 80],
    [100, 100, 100],
    [101, 100, 101],
  ])('S-3 AC-10, D-16: %i needed of %i spare is shown as %i%% (rounded to the nearest)', (needed, spare, percent) => {
    expect(pacePercent(needed, spare)).toBe(percent);
  });

  it('S-3 AC-10, D-16: the shown percentage is never more than half a percent from the exact share', () => {
    const problems: string[] = [];
    for (let spare = 1; spare <= 480; spare++) {
      for (let needed = 1; needed <= spare + 5; needed++) {
        const exact = (needed * 100) / spare;
        if (Math.abs(pacePercent(needed, spare) - exact) > 0.5) problems.push(`${needed}/${spare}`);
      }
    }
    expect(problems, problems.slice(0, 5).join('\n')).toEqual([]);
  });

  it('S-3 AC-10: the marker uses the exact share, so 80.2% sits in the Tight zone even when it reads "80%"', () => {
    expect(pacePercent(401, 500)).toBe(80);
    expect(markerPosition(401, 500)).toBeGreaterThan(METER_ZONES.onTrack);
    expect(markerPosition(80, 100)).toBe(METER_ZONES.onTrack);
    expect(markerPosition(101, 100)).toBeGreaterThan(meterPosition(100));
  });

  it('S-3 AC-10: the marker stops at the end of the scale, and the zones fill the bar', () => {
    expect(meterPosition(0)).toBe(0);
    expect(meterPosition(80)).toBe(64);
    expect(meterPosition(100)).toBe(80);
    expect(meterPosition(187)).toBe(100);
    expect(METER_ZONES.onTrack + METER_ZONES.tight + METER_ZONES.late).toBe(100);
  });

  it('S-3 AC-10: the text reads "15 min of your 30 min spare · 50%"', () => {
    expect(paceMeterText(15, 30)).toBe('15 min of your 30 min spare · 50%');
  });

  it('S-3 AC-10, S-1 AC-5: from 60 minutes up the pace line also shows hours', () => {
    expect(paceMeterText(400, 480)).toBe('400 min (6 h 40 min) of your 480 min (8 h) spare · 83%');
  });

  it('S-3 AC-11: more than a full working day (480 min) is off the scale', () => {
    expect(meterIsOffScale(480)).toBe(false);
    expect(meterIsOffScale(481)).toBe(true);
    expect(meterIsOffScale(29_970)).toBe(true);
  });

  it('S-3 AC-9: the On track message talks to the person', () => {
    expect(onTrackSentence(50)).toBe("Comfortable: you're using 50% of your spare time.");
  });
});
