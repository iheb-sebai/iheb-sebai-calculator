# Verification

How each acceptance criterion in [user-stories.md](user-stories.md) is checked, and the result.

> **Status: the calculation engine (`src/lib/`) is built and tested. The form parser and the UI are not built
> yet.** A row says "pass" only after the test or manual check has actually been run.

## How to run

```
npm install
npm test            # all automated tests
npm run test:tz     # all tests again under UTC+14 and UTC-10
npm run dev         # manual checks in the browser
```

## Automated checks

| Criterion | Test file | Status |
|---|---|---|
| S-1 AC-1 to AC-4, AC-6 | `src/lib/learner.test.ts` | pass |
| S-1 AC-5 (times shown in hours and minutes) | `src/lib/format.test.ts` | not run |
| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | pass |
| S-2 AC-1, AC-2 (presets and matching) | `src/lib/workingDays.test.ts` | pass |
| S-2 AC-1, AC-2 (the picker on screen) | `src/components/WorkingDaysPicker.test.tsx` | not run |
| S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts`, `src/lib/learner.test.ts` | pass |
| S-2 AC-6 (label text) | `src/lib/workingDays.test.ts` | pass |
| S-2 AC-6 (label in the result sentence) | `src/components/App.test.tsx` | not run |
| S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | pass |
| S-3 AC-3 (Late exactly when spare × working days left < remaining, swept) | `src/lib/learner.test.ts` | pass |
| S-4 AC-1 (start date is today by default) | `src/components/App.test.tsx` | not run |
| S-4 AC-2 to AC-5 | `src/lib/admin.test.ts` | pass |
| S-4 AC-6 (rules across both roles, all 127 working-day choices) | `src/lib/admin.test.ts` | pass |
| S-5 input rules (numbers) | `src/lib/parse.test.ts` | not run |
| S-5 input rules (a real calendar date) | `src/lib/dates.test.ts` | pass |
| S-5 AC-1, AC-3, AC-5 (engine) | `src/lib/learner.test.ts`, `src/lib/admin.test.ts` | pass |
| S-5 AC-1, AC-2, AC-4, AC-6, AC-7 (on screen) | `src/components/App.test.tsx` | not run |
| S-6 AC-1, AC-3 to AC-5 | `src/components/App.test.tsx` | not run |
| D-4, D-9, D-11 | `src/lib/dates.test.ts` | pass |
| Engine never reads the clock | `src/lib/noClock.test.ts` | not run |
| Same results in every time zone | `npm run test:tz` | pass (engine tests) |
| Fast working-day count matches a day-by-day count (all 127 weekday sets) | `src/lib/workingDays.test.ts` | pass |

## Planted-bug checks

To check that the tests can fail, each bug below was put into the code on its own, the suite was run, and the
file was restored.

| Planted bug | Tests that failed |
|---|---|
| 2000 not treated as a leap year | 2 |
| One leftover day counted too many in `countWorkingDays` | 7 |
| One week too many skipped in `nthWorkingDay` | 3 (before the fix, this froze the run: see below) |
| Exactly 80% counted as Tight instead of On track | 4 |
| Exactly 100% counted as Late instead of Tight | 4 |
| Minutes rounded to the nearest instead of up | 6 |
| Working days late off by one | 3 |
| Recommended date at 100% of the daily time instead of 80% | 4 |
| Admin working days rounded down, giving a date that can't be met | 4 |

The `nthWorkingDay` bug first sent the function into an endless loop. Its last step is now capped at 7 days, so a
mistake there fails a test instead of freezing the page.

## Manual checks

| Check | Status |
|---|---|
| S-6 AC-2: whole app with the keyboard only, focus always visible | not run |
| S-6 AC-3: VoiceOver announces the result after an edit | not run |
| S-5 attack pass: paste, very long input, typing quickly while errors show, switching role mid-error | not run |
| S-3 AC-8: statuses readable without colour (greyscale) | not run |

## Known limits

- The 80% check uses whole numbers (S-3 AC-4). No floating-point version of it gave a wrong answer for any spare
  time from 1 to 480, so this is a safeguard rather than a fix for a bug that was seen.

More are added after the review phase.
