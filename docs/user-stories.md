# User stories and acceptance criteria

Each story follows the brief's format: who wants what and why, the one job it serves
([jobs-to-be-done.md](jobs-to-be-done.md)), its status, and acceptance criteria written as Given / when / then.

Each criterion has an ID (`S-3 AC-2`). Most test names cite the criterion they check, or the story or decision
(`D-1`) when no single criterion fits, so a failing test points to the rule it breaks. The word-for-word checks of
the screen text are named after the text they check. [verification.md](verification.md) maps every criterion to
its test.

**Example dates.** 2026-11-26 is a Thursday. Mon–Fri means Saturday and Sunday are the weekend. Sun–Thu means
Friday and Saturday are the weekend.

**"Today"** is the device's local date at the time of the calculation. The calculation engine never reads the
clock: today is passed in as a parameter.

| Story | Job | Status |
|---|---|---|
| S-1 Minutes needed per working day | J-1 | Implemented |
| S-2 Working days | J-1 | Implemented |
| S-3 Pace status | J-2 | Implemented |
| S-4 Earliest and recommended due date | J-3 | Implemented |
| S-5 Clear errors, no crash, and recovery (learner) | J-1 | Implemented |
| S-6 Accessibility (learner) | J-1 | Implemented |
| S-12 Clear errors, no crash, and recovery (L&D admin) | J-3 | Implemented |
| S-13 Accessibility (L&D admin) | J-3 | Implemented |
| S-7 English / Arabic | J-1 | Not implemented |
| S-8 Several courses | J-1 | Not implemented |
| S-9 Public holidays per country | J-3 | Not implemented |
| S-10 Calendar export | J-1 | Not implemented |
| S-11 Timeline | J-2 | Not implemented |

---

## Implemented

### S-1: Minutes needed per working day

**Job:** J-1 · **Status:** Implemented

As a learner, I want to see how many minutes I need on each working day left, so that I can finish my training
by the due date without a last-minute rush.

- **AC-1** Given a total course time and the time already done, when the result is shown, then the remaining time
  is the total minus the time done.
- **AC-2** Given 100 minutes remaining and 3 working days left, when the result is shown, then I need **34** min a
  day (33.3 rounded up), never 33.
- **AC-3** Given 90 minutes remaining and 3 working days left, when the result is shown, then I need exactly **30**
  min a day: a division that comes out even is not rounded further.
- **AC-4** Given the minutes needed per day are more than 480 (8 h), when the result is shown, then the number is
  still shown, with the note "That's more than a full working day." It is a real answer, not an error.
- **AC-5** Given a time of 60 minutes or more, when it is shown, then it also appears in hours and minutes, for
  example "85 min (1 h 25 min)".
- **AC-6** Given a total of 7 h 40 min (460 min), 1 h 10 min done (70 min), today Thu 2026-11-26, a due date of
  Thu 2026-12-31 and Mon–Fri, when the result is shown, then:
  - the remaining time is 390 min;
  - there are **26** working days left (2 + 5 + 5 + 5 + 5 + 4). Fri 2026-12-25 counts as a working day because v1
    has no public holidays (D-10);
  - the result reads **15 min a day over 26 working days (Mon–Fri)**.
- **AC-7** Given a plan is shown, when I read below it, then I see the time left and the public holidays note, for
  example "390 min (6 h 30 min) left. Public holidays are not counted: remove them from your plan yourself." (see
  [Screen text](#screen-text)).

### S-2: Working days

**Job:** J-1 · **Status:** Implemented

As a learner, I want to choose which days I work, so that my daily amount is spread only over the days I can
actually learn at work.

- **AC-1** Given the working-days control, when I look at it, then there are two preset buttons, **Mon–Fri** (the
  default) and **Sun–Thu**, and one toggle for each of the 7 days, Mon to Sun: a checkbox styled as a button (S-6
  AC-5).
- **AC-2** Given any choice of days, when I press a preset, then the days are set to it; and whenever the days
  match a preset, that preset shows as pressed, otherwise **Custom** is shown.
- **AC-3** Given today and a due date, when the working days left are counted, then every checked weekday from today
  to the due date counts, both ends included.
- **AC-4** Given today is not a checked weekday, when the working days left are counted, then today does not count.
  - Today Thu 2026-11-26, Mon–Fri, due Thu 2026-11-26: **1** working day left.
  - Today Sat 2026-11-28, Mon–Fri, due Fri 2026-12-04: **5** (Saturday does not count).
  - Today Thu 2026-11-26, Sun–Thu, due Sun 2026-11-29: **2** (Thursday and Sunday).
- **AC-5** Given a due date that falls on a non-working day, when I enter it, then it is allowed, and only the working
  days before it count.
- **AC-6** Given any result, when it is shown, then its sentence repeats the working days it used, so a wrong default
  is easy to spot. Example: "15 min a day over 26 working days (Mon–Fri)". Presets show as "Mon–Fri" and
  "Sun–Thu". A custom choice lists the days in week order starting from Monday ("Mon, Wed, Fri", "Sat, Sun"), and
  all seven days show as "every day". Admin results do the same.

### S-3: Pace status

**Job:** J-2 · **Status:** Implemented

As a learner, I want to enter the minutes I can spare each working day, so that I know early whether I will be
late, and by how much, while there is still time to ask for more time or time off work to learn.

- **AC-1** Given 100 spare minutes, when I need 80 (80% or less of my spare time), then the status is **On track**.
- **AC-2** Given 100 spare minutes, when I need 81 or 100 (more than 80% and at most 100%), then the status is
  **Tight**.
- **AC-3** Given 100 spare minutes, when I need 101 (more than my spare time), then the status is **Late**.
- **AC-4** Given a borderline case, when the status is decided, then it is compared in whole numbers (needed × 100 ≤
  spare × 80), so no rounding error can move it into the wrong status.
- **AC-5** Given the status is Late, when the result is shown, then I also see:
  - the **projected finish date**: if n = remaining ÷ spare (rounded up), the finish date is the nth working day
    counting from today, with today included if it is a working day;
  - **working days late** = n − working days left.
  - Example: today Thu 2026-11-26, Mon–Fri, due Mon 2026-11-30 (3 working days), 300 min remaining, 50 min spare.
    Needed is 100, so Late. n = 6, finish **Thu 2026-12-03**, **3 working days late**.
  - On screen this is three lines, with the date large: "At 50 min a day you'll finish on" / "Thu 3 Dec 2026" /
    "3 working days late".
- **AC-6** Given 0 spare minutes, when the result is shown, then the status is **Late**, not an error, with the
  message "At 0 minutes a day you won't finish. Ask for learning time or a new due date." No finish date and no
  days-late number are shown, and nothing shows "Infinity".
- **AC-7** Given the spare time is left blank, when the result is shown, then no status is shown, the minutes per
  working day are still shown with the hint "Add the minutes you can spare to see if you're on track.", and the
  blank field is not an error.
- **AC-8** Given any status, when it is shown, then it is written as a word ("On track", "Tight", "Late"), never
  shown by colour alone.
- **AC-9** Given the status is On track or Tight, when it is shown, then one line explains it:
  - On track, with the person's own share from the pace meter: "Comfortable: you're using 50% of your spare
    time."
  - Tight: "You need more than 80% of your spare time, so one bad day could make you late."
- **AC-10** Given the spare time is more than 0, when the result is shown, then a pace meter shows the minutes
  needed as a share of the spare time: "Your pace" and "15 min of your 18 min spare · 83%". From 60 minutes up the
  times also show hours (S-1 AC-5): "400 min (6 h 40 min) of your 480 min (8 h) spare · 83%". The percentage is
  rounded to the nearest whole percent (D-16): 15 of 18 is 83.3%, shown as 83%. The bar has three zones marked
  0%, 80%, 100% and "over": On track, Tight and Late. A marker shows the exact share, so it always sits in its
  status's zone, and it stops at the end of the bar past 125%. The bar repeats the status in the panel and the
  chip, so it is hidden from screen readers; the text line is read.
- **AC-11** Given the minutes needed per day are more than a full working day (480, D-8), for example 999 hours due
  tomorrow, when the pace meter is shown, then it reads "way over" instead of a huge percentage, and the bar is
  hidden.

### S-4: Earliest and recommended due date

**Job:** J-3 · **Status:** Implemented

As an L&D admin, I want to enter the course time, the daily learning time employees are given, a start date and
the working days, so that I can set a due date employees can realistically meet, and one with a margin.

- **AC-1** Given the admin form opens, when I look at the start date, then it is today.
- **AC-2** Given a course time and a daily time, when the result is shown, then the working days needed are course
  minutes ÷ daily minutes, rounded up, and the **earliest due date** is the working day with that number, counting
  from the start date (the start date counts if it is a working day; if not, counting begins at the next working
  day).
  - Example: 300 min, 60 min a day, start Thu 2026-11-26, Mon–Fri. That is 5 working days, so the earliest date is
    **Wed 2026-12-02**.
- **AC-3** Given a course time and a daily time, when the result is shown, then I also see the **recommended due
  date**: the earliest date where the daily pace stays at or under 80% of the daily time (the learner's On track
  rule). It is labelled "Recommended due date", with the line "Keeps the daily pace to 80% or less of the time you
  give." Pace = daily × 80 ÷ 100, rounded down. Working days = course ÷ pace, rounded up.
  - Example: 300 min, 60 min a day gives a pace of 48 and 7 working days, so the recommended date is
    **Fri 2026-12-04**.
- **AC-4** Given a daily time of 1 minute, when the result is shown, then the pace rounds down to 0, so the
  recommended date reads "Not available at 1 minute a day. Raise the daily time to get a date with a margin." The
  earliest date is still shown.
- **AC-5** Given a daily time of 0, when the result is shown, then no date is shown and the result reads "At 0
  minutes a day employees can't finish. Give them learning time to get a due date." It is a result, not an error.
- **AC-6** Given a learner with the same course, 0 done, today = the start date and spare time = the daily time,
  when that learner uses the admin's dates, then:
  - with the earliest due date, that learner is **not Late**;
  - with the working day before the earliest due date, that learner **is Late** (whenever that day is not before
    the start date);
  - with the recommended due date, that learner is **On track**.

### S-5: Clear errors, no crash, and recovery (learner)

**Job:** J-1 · **Status:** Implemented

As a learner, I want a clear message when something I enter can't be used, so that I can fix it and still get a
correct daily amount, never a crash or a wrong number.

The input rules and messages are in [Input rules and messages](#input-rules-and-messages), shared with S-12.

- **AC-1** Given any condition in the messages table that applies to the learner form, when it happens, then its
  message is shown, and none of them causes a crash, a blank page, an uncaught exception, or the text "NaN",
  "Infinity" or "undefined" anywhere on the page.
- **AC-2** Given several fields are wrong, when the form is shown, then all field errors appear at the same time,
  each next to its own field.
- **AC-3** Given the fields are valid but more than one check below fails, when the result is shown, then only the
  first matching check is shown: time done > total → already complete → no working day checked → due date in the
  past → no working days left → result.
- **AC-4** Given an error is shown, when I fix the input, then the message goes and the correct result appears. No
  reload is needed, and no earlier result is left on screen.
- **AC-5** Given today Fri 2026-11-27, Sun–Thu and a due date of Sat 2026-11-28, when the result is shown, then it
  says there are no working days left: a different case, with its own message, from no working day checked.
- **AC-6** Given a field I have not changed or left yet, when I edit another field, then that field shows no error.
- **AC-7** Given not every field is valid, when I look at the result area, then it is never blank; it shows a
  friendly empty state: "Enter your training to see your daily pace."

### S-6: Accessibility (learner)

**Job:** J-1 · **Status:** Implemented

As a learner who uses a keyboard or a screen reader, I want every part of the learner calculator to work without
a mouse and to be read out, so that I can find out my daily amount like anyone else.

- **AC-1** Given any input on the learner form, when it is shown, then it has a visible label tied to it, so a
  screen reader reads the label and tests can find the input by its label.
- **AC-2** Given only a keyboard, when I use the learner calculator, then everything works and keyboard focus is
  always visible.
- **AC-3** Given a screen reader, when the result changes, then it is announced: the result area is a live region
  (`role="status"`, polite).
- **AC-4** Given a field with an error, when a screen reader reaches it, then it has `aria-invalid="true"` and its
  message is linked with `aria-describedby`. For the working days, each day toggle is marked and linked; for hours
  and minutes, both inputs of the group are.
- **AC-5** Given the Learner/Admin switch, the day toggles and the presets, when I use them with the keyboard, then
  they behave as what they are: the switch is a two-option segmented control built on radio buttons, so it works
  with the arrow keys and shows which role is selected; the day toggles are checkboxes and the presets are
  buttons, so Tab, Space and Enter work on them.
- **AC-6** Given an error from the checks in S-5 AC-3, when it is shown, then it appears next to its field and is
  repeated in the result area, so screen readers announce it.
- **AC-7** Given a small screen, when I scroll the form, then a short summary of the result (minutes a day and
  status) stays at the top. It only repeats the result visually (`aria-hidden`), so screen readers announce the
  result once, from the live region.
- **AC-8** Given the due date field, when I pick a date, then I use a calendar, not the browser's date field (D-15):
  - the field shows the date ("Thu 31 Dec 2026"), or "Pick a date" when empty, and opens a month calendar, Monday
    first, with "Previous month" and "Next month" buttons;
  - today and the picked day are marked; non-working days are lighter but can still be picked (S-2 AC-5); days
    before today are greyed out and can't be picked, though the arrow keys still pass over them. The "in the past"
    errors (S-5) stay: a page left open past midnight can still hold yesterday's date;
  - it works with the keyboard alone: Enter or Down opens it on the picked day (else today), arrows move by day and
    week, Home/End go to the start or end of the week, Page Up/Down change month (with Shift, year), Enter picks.
    Escape closes it and returns focus to the field; the field has not been left, so an empty date shows no error
    yet (S-5 AC-6). A click outside or Tab out also closes it;
  - the field is a combobox labelled with the field's name; the calendar is a dialog with a grid.

### S-12: Clear errors, no crash, and recovery (L&D admin)

**Job:** J-3 · **Status:** Implemented

As an L&D admin, I want a clear message when something I enter can't be used, so that I can fix it and still get
a due date employees can meet, never a crash or a wrong date.

The input rules and messages are in [Input rules and messages](#input-rules-and-messages), shared with S-5.

- **AC-1** Given any condition in the messages table that applies to the admin form (course time, daily learning
  time, start date, working days), when it happens, then its message is shown, and none of them causes a crash, a
  blank page, an uncaught exception, or the text "NaN", "Infinity" or "undefined" anywhere on the page.
- **AC-2** Given several fields are wrong, when the form is shown, then all field errors appear at the same time,
  each next to its own field.
- **AC-3** Given the fields are valid but more than one check below fails, when the result is shown, then only the
  first matching check is shown: no working day checked → start date before today → result.
- **AC-4** Given an error is shown, when I fix the input, then the message goes and the correct dates appear. No
  reload is needed, and no earlier result is left on screen.
- **AC-5** Given a field I have not changed or left yet, when I edit another field, then that field shows no error.
- **AC-6** Given not every field is valid, when I look at the result area, then it is never blank; it shows a
  friendly empty state: "Enter your course to see the earliest due date."
- **AC-7** Given the start date was today when the page opened, when the page is still open the next day, then "The
  start date can't be before today." is shown at the start date and in the result.

### S-13: Accessibility (L&D admin)

**Job:** J-3 · **Status:** Implemented

As an L&D admin who uses a keyboard or a screen reader, I want every part of the admin calculator to work without
a mouse and to be read out, so that I can set a due date employees can meet like anyone else.

- **AC-1** Given any input on the admin form, when it is shown, then it has a visible label tied to it, so a screen
  reader reads the label and tests can find the input by its label.
- **AC-2** Given only a keyboard, when I use the admin calculator, then everything works and keyboard focus is
  always visible.
- **AC-3** Given a screen reader, when the earliest or recommended date changes, then it is announced: the result
  area is the same live region as for the learner (`role="status"`, polite).
- **AC-4** Given a field with an error, when a screen reader reaches it, then it has `aria-invalid="true"` and its
  message is linked with `aria-describedby`, as in S-6 AC-4.
- **AC-5** Given the Learner/Admin switch, the day toggles and the presets, when I use them with the keyboard, then
  they work as in S-6 AC-5: arrow keys on the switch; Tab, Space and Enter on the toggles and presets.
- **AC-6** Given an error from the checks in S-12 AC-3, when it is shown, then it appears next to its field and is
  repeated in the result area, so screen readers announce it.
- **AC-7** Given a small screen, when I scroll the form, then a short summary with the earliest due date stays at
  the top, `aria-hidden` as in S-6 AC-7.
- **AC-8** Given the start date field, when I pick a date, then it uses the same calendar as S-6 AC-8, with days
  before today greyed out and the "start date can't be before today" error kept for a page left open past midnight.

## Input rules and messages

Shared by S-5 (learner) and S-12 (L&D admin).

### Input rules

| Field | Allowed |
|---|---|
| Hours (any time field) | whole number, 0–999 |
| Minutes (any time field) | whole number, 0–59 |
| Learner total time | more than 0 in total |
| Admin course time | more than 0 in total |
| Spare minutes / daily learning time | whole number, 0–480 (spare can also be blank) |
| Due date / start date | a real calendar date, no more than 1,826 days (5 years) after today |

Spaces around a number are ignored. Time fields start at "0" rather than blank.

### Messages

| Condition | Shown at | Message |
|---|---|---|
| Field empty | field | Enter a number. |
| Negative number | field | Can't be negative. |
| Decimal, letters, `1e3` | field | Use whole numbers only. |
| Minutes above 59 | field | Minutes must be 0–59. |
| Hours above 999 | field | Must be 999 hours or less. |
| Per-day above 480 | field | Must be 480 minutes (8 hours) or less. |
| Total time / course time is 0 | field | Total time must be more than 0. |
| Date empty or not a real date | field | Enter a valid date. |
| Date more than 5 years ahead | field | Pick a date within 5 years of today. |
| Time done > total | time done | Time done can't be more than the total time. |
| Time done = total | result | Already complete: nothing left to do. |
| No working day checked | working days | Select at least one working day. |
| Due date before today | due date | The due date is in the past. Pick today or a later date. |
| No working days from today to the due date | result | There are no working days between today and the due date. Pick a later date or add working days. |
| Admin start date before today | start date | The start date can't be before today. |
| The engine gets an impossible number (a parser bug; should never be seen) | result | Something in the form isn't valid. Check the fields above. |

---

## Not implemented (next)

### S-7: English / Arabic (stretch)

**Job:** J-1 · **Status:** Not implemented

As a learner who reads Arabic, I want the calculator in Arabic with a right-to-left layout, so that I can
understand my daily amount in my own language.

- **AC-1** Given Arabic is chosen, when any page is shown, then all its text is in Arabic and the layout runs right
  to left.

Already in place: Arabic-Indic digits (١٥, ۱۵) are accepted in every number field (D-13), and the header shows the
name in Arabic (خطوة). Where the visible text lives today, for whoever builds it:

- `src/lib/messages.ts`: labels, headings, messages, statuses and empty states;
- `src/lib/format.ts`: the result sentences built from the numbers;
- `src/components/LearnerForm.tsx`: the words "a day" and "over" around the big number and in the phone summary;
- `src/lib/dates.ts`: weekday short names and the date format ("Thu 3 Dec 2026");
- `src/lib/calendar.ts`: month names and full weekday names in the date picker;
- `src/lib/workingDays.ts`: the working-day labels in result sentences ("Mon–Fri", "Sun–Thu", "every day").

`src/lib/messages.test.ts` checks only the text in `messages.ts` against this file.

### S-8: Several courses

**Job:** J-1 · **Status:** Not implemented

As a learner with several assigned courses, I want one combined daily pace, so that I know how much to do each
working day across all of them.

- **AC-1** Given two or more courses, each with its own due date, when the result is shown, then I see one number
  of minutes per working day that finishes every course by its own due date.

### S-9: Public holidays per country

**Job:** J-3 · **Status:** Not implemented

As an L&D admin, I want my country's public holidays left out of the working days, so that the due date I set can
really be met.

- **AC-1** Given a country is chosen, when working days are counted, then that country's public holidays are not
  counted (for the learner as well as the admin).

### S-10: Calendar export

**Job:** J-1 · **Status:** Not implemented

As a learner, I want to export my study plan to my calendar, so that the daily amount is blocked out on each
working day.

- **AC-1** Given a plan, when I export it, then I get a calendar file (.ics) with one event on each working day up
  to the due date, each as long as the daily amount.

### S-11: Timeline

**Job:** J-2 · **Status:** Not implemented

As a learner, I want a timeline from today to my finish date and the due date (from the design preview), so that I
can see at a glance how far apart they are.

- **AC-1** Given a plan with spare time entered, when the result is shown, then a timeline marks today, the
  projected finish date and the due date.

Not implemented because it needs a finish date for On track and Tight, and the engine only calculates one for
Late.

---

## Screen text

Every fixed text on the page, word for word. `src/lib/messages.test.ts` checks that each text in
`src/lib/messages.ts` appears in this file.

| Where | Text |
|---|---|
| Header | Khutwa · خطوة · Training deadlines you can actually meet |
| Role switch | I am · a learner · an L&D admin |
| Learner sections | 1 Your training · 2 Deadline and working days · 3 Your time |
| Admin sections | 1 The course · 2 Start date and working days · 3 Learning time |
| Fields | Total course time · Time already done · Course time · Hours · Minutes · Due date · Start date · Minutes you can spare per working day (optional) · Daily learning time employees get (minutes per working day) |
| Working days | Working days · Presets · Mon–Fri · Sun–Thu · Custom · Mon · Tue · Wed · Thu · Fri · Sat · Sun |
| Date picker (S-6 AC-8) | Pick a date · Previous month · Next month · the month and year, e.g. "December 2026" |
| Result headings | Result (read by screen readers only) · You need · Earliest due date · Recommended due date |
| Pace meter (S-3 AC-10, AC-11) | Your pace · 0% · 80% · 100% · over · way over |
| Under a learner plan | "\<time left\> left. Public holidays are not counted: remove them from your plan yourself." |
| Under an admin result | Public holidays are not counted: remove them from your plan yourself. |

The empty states, statuses, explanations and error messages are in S-3, S-4 and S-5 above. The result sentences
are built from the numbers, as in the examples in S-1 to S-4.

---

## Product decisions

Tests cite these decisions by ID when no story criterion covers the rule (e.g. `D-11`).

| ID | Decision | Reason |
|---|---|---|
| D-1 | Minutes are rounded up, never to the nearest | Falling short of a deadline costs more than one extra minute a day. |
| D-2 | "Tight" starts above 80% | Below 80%, one bad day still leaves a margin. Above it, it does not. The threshold is one constant. |
| D-3 | Today counts only if it is a working day | A weekend day can't be counted on for work-time learning. |
| D-4 | "Today" is passed into the engine | Tests give the same result on any machine and in any time zone. |
| D-5 | Due date is included | People can still study on the due day. |
| D-6 | 0 spare minutes is Late, and 0 daily minutes gives the admin a "no date" message; neither is an error | Many people really get no learning time at work. It isn't a typo, and the useful answer is "you won't finish, ask for time". More than 480 needed per day is shown for the same reason. |
| D-7 | The admin sees a recommended date as well as the earliest one | The earliest date can put learners in "Tight" (300 min at 60 a day needs the full 60 every day). The recommended date uses the same 80% rule as the learner's "On track". "Recommended" is plainer for an admin than "comfortable". |
| D-8 | Per-day inputs are capped at 480 minutes | 8 hours is a full working day. A larger value is almost certainly a typo. |
| D-9 | Dates are capped at 5 years ahead | Training deadlines further out than that are almost certainly typos. |
| D-10 | No public holidays in v1 | They differ by country and year. Saying so is better than guessing wrong. |
| D-11 | Dates are shown as "Thu 3 Dec 2026" | "12/03" means different dates in different countries. |
| D-12 | Mon–Fri is the default, and every result names the working days it used | MENA is mixed: Saudi Arabia's weekend is Fri–Sat, while the UAE and Tunisia have Sat–Sun. No default fits everyone, so the result makes the choice visible. |
| D-13 | Arabic-Indic digits (١٥, ۱۵) are accepted in number fields | Someone typing on an Arabic keyboard shouldn't be told that 15 is not a number. |
| D-14 | Number fields are text fields with a numeric keyboard, not `type="number"` | Browser number fields hide what was typed: "1e3" arrives as 1000 and letters arrive as blank. The app then couldn't say what is wrong. |
| D-15 | Dates are picked from the app's own calendar, not the browser's date field | The browser's field looks different in every browser and can't be styled to match the app. The calendar follows the WAI-ARIA date picker pattern, so it keeps full keyboard and screen reader use. |
| D-16 | The pace meter's percentage is rounded to the nearest whole percent, not up | It describes a share of spare time, not an amount to plan with, so D-1 does not apply: 15 of 18 minutes reads 83%, not 84%. The status still comes from the exact numbers (S-3 AC-4). |
