# KnowledgeCity take-home: plan (submit Thu 26 Nov, as promised)

## Product: Khutwa (خطوة, "step"), a training-deadline calculator
Problem: companies assign mandatory training with due dates. Learners find out too late that the deadline was not
achievable at the pace they can manage. Admins set due dates without checking they are achievable.
One calculation engine (working days x minutes per day) serves both sides.

## Roles (both implemented)
- Learner: an employee with assigned courses and a due date. They can enter their workload and see the daily pace they
  need and whether they will finish on time. They must never be shown "on track" when the numbers say they will be late.
- L&D Admin: the person who assigns training to employees. They can enter course time and the daily learning time
  employees are given, and see the earliest due date that is achievable. They must never be shown a due date that cannot be met
  at that daily time.

## Jobs (no app features mentioned)
- J-1 (Learner): When my company assigns training with a deadline, I want to know how much I must do each working day, so I can finish on time without a last-minute rush.
- J-2 (Learner): When I fall behind, I want to know how late I will be at my real pace, so I can act early (ask for more time or time off work to learn).
- J-3 (L&D Admin): When I plan a training rollout, I want to set a due date employees can realistically meet, so completion is high and I avoid chasing people.

## Stories
- S-1 (J-1): Remaining time / working days left gives minutes needed per working day, ROUNDED UP.
- S-2 (J-1): Choose working days (Mon–Fri or Sun–Thu presets, that is a Sat–Sun or Fri–Sat weekend, or custom) and see the working days left, today included if it is a working day.
- S-3 (J-2): Enter the minutes you can spare per day and get the status:
  - On track: needed <= 80% of spare.
  - Tight: needed > 80% and <= 100% of spare.
  - Late: needed > spare. Show the projected finish date and how many working days late.
- S-4 (J-3): Admin mode: course time + daily learning time (+ start date) gives the earliest achievable due date.
- S-5 (J-1..J-3): Clear errors, never a crash, NaN or Infinity, and correct recovery when the user keeps editing after an error:
  - due date in the past;
  - no working days selected (this is the app's "division by zero");
  - time done greater than the total; equal to the total gives "Already complete";
  - minutes outside 0-59, negative or empty input;
  - over the cap.
- S-6: Keyboard use, labelled inputs, and the result announced to screen readers (aria-live).
- S-7 (STRETCH): English/Arabic with right-to-left layout. Otherwise Not implemented.
- Not implemented (next): S-8 per-course list, S-9 public holidays per country, S-10 calendar (.ics) export.

## Product decisions (README, each with its reason)
- Round UP, never to nearest: undershooting a deadline costs more than one extra minute a day.
- "Tight" threshold is 80%: below that, one bad day still leaves a margin; above it, it does not. The number is documented and easy to change.
- No public holidays in v1: they differ by country and year. Saying so is better than guessing wrong.
- Today counts only if it is a selected working day.
- "Today" is passed into the engine (never read from the clock inside it), so tests give the same result on any machine and in any time zone.

## Tech
- Vite, React and TypeScript, on Node 22.12+ (Node 20 is end-of-life, and the current test libraries need Node 22).
- Vitest for tests, plus Testing Library.
- The engine is pure functions in src/lib/.
- Test names carry their story and criterion IDs (e.g. "S-3 AC-2").
- Optional: GitHub Actions to run the tests and a GitHub Pages live URL.

## Package layout
```
iheb-sebai-calculator/
  README.md
  src/
  docs/plan.md
  docs/app-roles.md
  docs/jobs-to-be-done.md
  docs/user-stories.md
  docs/verification.md
  transcripts/session-01.md
```

## Method
One Claude Code session does both the planning and the building. Every prompt is written by me, and I make the decisions, review and test.

## Timeline (4 h max; cut S-7 first)
- 0:00-0:40: brief and docs
- 0:40-2:30: tests and build
- 2:30-3:15: review, attack pass, accessibility
- 3:15-4:00: README, verification, export, push
- Then: Claude (this chat) checks the package, and you send the email
