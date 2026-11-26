# Verification

How each acceptance criterion in [user-stories.md](user-stories.md) is checked, and the result.

> **Status: the engine and the UI are built, and every automated check passes. The manual checks in the browser
> have not been done yet.** A row says "pass" only after the test or manual check has actually been run.

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
| S-1 AC-4, AC-6 on screen | `src/App.test.tsx` | pass |
| S-1 AC-5 (times shown in hours and minutes) | `src/lib/format.test.ts` | pass |
| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | pass |
| S-2 AC-1, AC-2 (presets and matching) | `src/lib/workingDays.test.ts` | pass |
| S-2 AC-1, AC-2 (the picker on screen) | `src/App.test.tsx` | pass |
| S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts`, `src/lib/learner.test.ts` | pass |
| S-2 AC-6 (label text and sentences) | `src/lib/workingDays.test.ts`, `src/lib/format.test.ts` | pass |
| S-2 AC-6 (label in the result on screen) | `src/App.test.tsx` | pass |
| S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | pass |
| S-3 AC-3 (Late exactly when spare × working days left < remaining, swept) | `src/lib/learner.test.ts` | pass |
| S-3 AC-1, AC-2, AC-5, AC-6 on screen | `src/App.test.tsx` | pass |
| S-3 AC-8 (status is a word) | `src/lib/messages.test.ts` | pass |
| S-4 AC-1 (start date is today by default) | `src/App.test.tsx` | pass |
| S-4 AC-2 to AC-5 | `src/lib/admin.test.ts`, `src/App.test.tsx` | pass |
| S-4 AC-6 (rules across both roles, all 127 working-day choices) | `src/lib/admin.test.ts` | pass |
| S-5 input rules | `src/lib/parse.test.ts`, `src/lib/dates.test.ts` | pass |
| S-5 messages are the docs' wording, word for word | `src/lib/messages.test.ts` | pass |
| S-5 AC-1, AC-3, AC-5 (engine) | `src/lib/learner.test.ts`, `src/lib/admin.test.ts` | pass |
| S-5 AC-1, AC-2, AC-4 to AC-7 (on screen) | `src/App.test.tsx` | pass |
| S-6 AC-1, AC-3 to AC-6 | `src/App.test.tsx` | pass |
| D-4, D-9, D-11 | `src/lib/dates.test.ts` | pass |
| D-4: engine never reads the clock | `src/lib/noClock.test.ts` | pass |
| D-4: the app's one clock read gives the local date | `src/today.test.ts` | pass |
| D-13: Arabic-Indic digits | `src/lib/parse.test.ts` | pass |
| Same results in every time zone | `npm run test:tz` | pass (all 304 tests, twice) |
| Fast working-day count matches a day-by-day count (all 127 weekday sets) | `src/lib/workingDays.test.ts` | pass |
| Production build | `npm run build` | pass |

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
| A message reworded away from the docs | 1 |
| Decimals like 1.5 accepted | 2 |
| 5-year date limit one day short | 1 |
| A total time of 0 accepted | 1 |
| `Date.now()` and `new Date()` added to two engine files | 2 (the clock guard) |
| Result area not a live region | 1 |
| Errors shown before a field is touched | 2 |
| An engine error not repeated in the result area | 3 |

The `nthWorkingDay` bug first sent the function into an endless loop. Its last step is now capped at 7 days, so a
mistake there fails a test instead of freezing the page.

## Manual checks

| Check | Status |
|---|---|
| Every story by hand in the browser (`npm run dev`) | not run |
| S-6 AC-2: whole app with the keyboard only, focus always visible | not run |
| S-6 AC-3: VoiceOver announces the result after an edit | not run |
| S-5 attack pass: paste, very long input, typing quickly while errors show, switching role mid-error | not run (role switch is covered by `src/App.test.tsx`) |
| S-3 AC-8: statuses readable without colour (greyscale) | not run |

## Known limits

- The 80% check uses whole numbers (S-3 AC-4). No floating-point version of it gave a wrong answer for any spare
  time from 1 to 480, so this is a safeguard rather than a fix for a bug that was seen.
- The admin start date is set to today when the page opens. If the page stays open past midnight, it shows "The
  start date can't be before today." until the date is changed.

More are added after the review phase.
