# Khutwa (خطوة, "step")

A training-deadline calculator for two kinds of users:

- **Learners** with an assigned course and a due date see how many minutes they need each working day, and
  whether they will finish on time at the pace they can manage. If they will be late, they see when they would
  finish and by how many working days.
- **L&D admins** who assign training see the earliest due date employees can meet at the daily learning time they
  are given, and a recommended date that leaves a margin.

One calculation engine (working days × minutes per day) serves both. It runs entirely in the browser: no
backend, accounts, API keys or cloud services.

## Run it

Needs **Node 22.12 or newer** (`.nvmrc` says 22; Node 20 is end-of-life and the test libraries need 22).

```
nvm use            # optional, picks Node 22 from .nvmrc
npm ci             # or npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | All 406 automated tests (Vitest and Testing Library) |
| `npm run test:tz` | The whole suite again in UTC+14 and UTC−10, to show results don't depend on the time zone |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Type check and production build into `dist/` |

## Try it

With today as Thu 26 Nov 2026 (the examples in the docs assume this date; on another day the counts differ):

| Enter | You see |
|---|---|
| Learner: 7 h 40 total, 1 h 10 done, due Thu 31 Dec, Mon–Fri | **15 min a day over 26 working days (Mon–Fri)** |
| …then spare 30 / 18 / 14 / 0 min a day | On track / Tight / Late, finishing Mon 4 Jan 2027, 2 working days late / Late, "ask for learning time" |
| Admin: 5 h course, 60 min a day, start today | Earliest **Wed 2 Dec 2026**, recommended **Fri 4 Dec 2026** |
| Letters, decimals, minutes over 59, an empty working week | A clear message at the field; fixing it brings the result back |

## Product decisions

The full list, with IDs that the tests cite, is in [docs/user-stories.md](docs/user-stories.md#product-decisions).
The ones that shape the answers:

| Decision | Why |
|---|---|
| Minutes per day are **rounded up**, never to the nearest | Falling short of a deadline costs more than one extra minute a day. |
| **On track** up to 80% of spare time, **Tight** above 80% up to 100%, **Late** above 100% | Below 80%, one bad day still leaves a margin. The threshold is one constant, compared in whole numbers. |
| **Today counts only if it is a working day**; the due date counts | A weekend day can't be counted on for work-time learning; people can still study on the due day. |
| **"Today" is passed into the engine**, which never reads the clock | Same results on any machine and in any time zone. A test fails if engine code reads the clock. |
| **No public holidays** in v1 | They differ by country and year; saying so on screen beats guessing wrong. |
| **0 spare minutes is Late, not an error** (and 0 daily minutes gives the admin "no date") | Many people really get no learning time at work. The useful answer is "you won't finish, ask for time". |
| Presets **Mon–Fri** (default) and **Sun–Thu**, and **every result names the working days** it used | MENA is mixed (Saudi Arabia Fri–Sat, UAE and Tunisia Sat–Sun). No default fits everyone, so a wrong one must be easy to spot. |
| The admin also gets a **recommended date** at 80% of the daily time | It matches the learner's "On track" rule, so a whole group isn't one bad day from late. |
| Number fields are text fields; Arabic-Indic digits (١٥) are accepted | Browser number fields hide what was typed, so the app couldn't say what's wrong; Arabic keyboards are normal here. |

## How it was built and checked

- **Docs first.** [Jobs](docs/jobs-to-be-done.md), [roles](docs/app-roles.md) and [user stories with numbered
  acceptance criteria](docs/user-stories.md) came before any code. Every message and label in
  `src/lib/messages.ts` is checked word for word against the docs, so the two can't drift apart.
- **Tests first.** The engine, the form parser and the first UI were each committed with failing tests before
  the code that makes them pass; the git history shows each red and green step. Later visual rounds (the redesign,
  the date picker) added their tests alongside the change. Most test names carry the criterion they check
  (`S-3 AC-2`).
- **Promises checked by sweeps, not only examples.** A learner is never shown On track or Tight when the numbers
  say Late (checked across due dates, amounts and spare times). An admin date is never unachievable: for all 127
  working-day choices, every start weekday and a range of courses, the earliest date is not Late, the day before
  it is, and the recommended date is On track. Working-day counts are checked against a day-by-day walk.
- **Planted bugs.** To show the tests can fail, bugs were put in on purpose one at a time (wrong leap year, the
  80% and 100% boundaries, rounding, unreachable dates, a clock read in the engine, a missing live region, and
  more). Each made tests fail.
- **Never NaN, Infinity or a crash.** The engine returns results or errors instead of throwing, and sweeps check
  every number it returns is finite.

Results and what is not checked yet: [docs/verification.md](docs/verification.md).

## Accessibility

Every input has a visible label. Errors are linked to their fields (`aria-invalid`, `aria-describedby`). The
result area is a polite live region, so changes are announced. Status is a word and an icon, never colour alone.
The role switch, day toggles and presets are real radio buttons, checkboxes and buttons. The date picker follows
the WAI-ARIA date picker pattern and works with the keyboard alone. Text and controls pass WCAG AA contrast.

**Checked by hand:** the whole app with the keyboard only. **Not checked yet:** VoiceOver. See the manual checks
in [docs/verification.md](docs/verification.md).

## Not implemented

- **S-7 English/Arabic:** partly done. Arabic-Indic digits are accepted and the header shows خطوة; Arabic text
  and a right-to-left layout are not built. [S-7](docs/user-stories.md#s-7-stretch-english--arabic) lists where
  the text lives today.
- **S-8** several courses with a combined pace, **S-9** public holidays per country, **S-10** calendar (.ics)
  export, **S-11** the timeline from the design preview (it needs a finish date for On track and Tight, which the
  engine only calculates for Late).
- GitHub Actions and a GitHub Pages URL (optional in the plan).

Known limits, such as dates being picked rather than typed: [docs/verification.md](docs/verification.md#known-limits).

## Project layout

```
src/lib/          the engine and its helpers: pure TypeScript, no React, no clock
  dates.ts        calendar dates as whole day numbers
  workingDays.ts  counting and stepping over working days
  learner.ts      S-1 to S-3        admin.ts   S-4
  parse.ts        form text to checked input (S-5)
  messages.ts     every label and message     format.ts   the result sentences
src/components/   the two forms, the date picker, the working-day picker
src/today.ts      the only place the app reads the clock
docs/             plan, jobs, roles, user stories, verification, design screenshots
transcripts/      the design-session excerpt and this session's transcript
```
