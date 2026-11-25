# Verification

How each acceptance criterion in [user-stories.md](user-stories.md) is checked, and the result.

> **Status: nothing has been built or run yet.** This file is filled in during the review phase. A row says
> "pass" only after the test or manual check has actually been run.

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
| S-1 AC-1 to AC-6 | `src/lib/learner.test.ts` | not run |
| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | not run |
| S-5 date rules, D-4, D-9, D-11 | `src/lib/dates.test.ts` | not run |
| S-2 AC-1, AC-2 | `src/components/WorkingDaysPicker.test.tsx` | not run |
| S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts` | not run |
| S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | not run |
| S-4 AC-1 to AC-5 | `src/lib/admin.test.ts` | not run |
| S-4 AC-6 (rules across both roles) | `src/lib/admin.test.ts` | not run |
| S-5 input rules | `src/lib/parse.test.ts` | not run |
| S-5 AC-1, AC-3, AC-5 | `src/lib/learner.test.ts`, `src/lib/admin.test.ts` | not run |
| S-5 AC-2, AC-4, AC-6 | `src/components/App.test.tsx` | not run |
| S-6 AC-1, AC-3 to AC-5 | `src/components/App.test.tsx` | not run |
| Engine never reads the clock | `src/lib/noClock.test.ts` | not run |
| Same results in every time zone | `npm run test:tz` | not run |
| Fast working-day count matches a day-by-day count (all 127 weekday sets) | `src/lib/workingDays.test.ts` | not run |

## Manual checks

| Check | Status |
|---|---|
| S-6 AC-2: whole app with the keyboard only, focus always visible | not run |
| S-6 AC-3: VoiceOver announces the result after an edit | not run |
| S-5 attack pass: paste, very long input, typing quickly while errors show, switching role mid-error | not run |
| S-3 AC-8: statuses readable without colour (greyscale) | not run |

## Known limits

Filled in after the review phase.
