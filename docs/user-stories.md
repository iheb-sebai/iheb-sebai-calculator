# User stories and acceptance criteria

Each criterion has an ID (`S-3 AC-2`). Test names start with that ID, so a failing test points to the rule it
breaks. [verification.md](verification.md) maps every criterion to its test.

**Example dates.** 2026-11-26 is a Thursday. Mon–Fri means Saturday and Sunday are the weekend. Sun–Thu means
Friday and Saturday are the weekend.

**"Today"** is the device's local date at the time of the calculation. The calculation engine never reads the
clock: today is passed in as a parameter.

---

## S-1 (J-1): Minutes needed per working day

As a learner, I enter my total course time and the time I've already done, and I see how many minutes I need on
each working day left.

- **AC-1** Remaining time = total time − time done.
- **AC-2** Minutes per working day = remaining minutes ÷ working days left, **rounded up** to a whole minute.
  Example: 100 min over 3 working days gives **34** (33.3 rounded up), never 33.
- **AC-3** A division that comes out even is not rounded further. Example: 90 min over 3 days gives **30**.
- **AC-4** If the minutes needed are more than 480 (8 h), the number is still shown, with the note "That's more
  than a full working day." It is a real answer, not an error.
- **AC-5** Times of 60 minutes or more are also shown in hours and minutes. Example: "85 min (1 h 25 min)".
- **AC-6** Realistic example: total 7 h 40 min (460 min), 1 h 10 min done (70 min), today Thu 2026-11-26, due
  Thu 2026-12-31, Mon–Fri.
  - Remaining time: 390 min.
  - Working days left: **26** (2 + 5 + 5 + 5 + 5 + 4). Fri 2026-12-25 counts as a working day because v1 has no
    public holidays (D-10).
  - Result: **15 min a day over 26 working days (Mon–Fri)**.

## S-2 (J-1): Working days

As a learner, I choose which days I work, and I see how many working days I have left.

- **AC-1** Presets: **Mon–Fri** (the default) and **Sun–Thu**. There is also one checkbox for each of the 7 days.
- **AC-2** Picking a preset sets the checkboxes. The preset selector always matches the checkboxes: if they match a
  preset, it shows that preset, otherwise it shows **Custom**.
- **AC-3** Working days left = every checked weekday from today to the due date. Both ends are included.
- **AC-4** Today counts only if it is a checked weekday.
  - Today Thu 2026-11-26, Mon–Fri, due Thu 2026-11-26: **1** working day left.
  - Today Sat 2026-11-28, Mon–Fri, due Fri 2026-12-04: **5** (Saturday does not count).
  - Today Thu 2026-11-26, Sun–Thu, due Sun 2026-11-29: **2** (Thursday and Sunday).
- **AC-5** A due date that falls on a non-working day is allowed. Only the working days before it count.
- **AC-6** Every result sentence repeats the working days it used, so a wrong default is easy to spot. Example:
  "15 min a day over 26 working days (Mon–Fri)". Presets show as "Mon–Fri" and "Sun–Thu". A custom choice lists
  the days in week order starting from Monday ("Mon, Wed, Fri", "Sat, Sun"), and all seven days show as "every
  day". Admin results do the same.

## S-3 (J-2): Pace status

As a learner, I enter the minutes I can spare per working day, and I see whether I'll finish on time.

- **AC-1** **On track** when minutes needed ≤ 80% of spare minutes. Example, spare 100: needed 80 is On track.
- **AC-2** **Tight** when minutes needed > 80% and ≤ 100% of spare minutes. Example, spare 100: needed 81 and
  needed 100 are both Tight.
- **AC-3** **Late** when minutes needed > spare minutes. Example, spare 100: needed 101 is Late.
- **AC-4** The comparison uses whole numbers (needed × 100 ≤ spare × 80), so no rounding error can move a
  borderline case into the wrong status.
- **AC-5** When the status is Late, the learner also sees:
  - the **projected finish date**. If n = remaining ÷ spare (rounded up), the finish date is the nth working day
    counting from today, with today included if it is a working day;
  - **working days late** = n − working days left.
  - Example: today Thu 2026-11-26, Mon–Fri, due Mon 2026-11-30 (3 working days), 300 min remaining, 50 min spare.
    Needed is 100, so Late. n = 6, finish **Thu 2026-12-03**, **3 working days late**.
- **AC-6** **Spare = 0 is Late, not an error.** The message reads: "At 0 minutes a day you won't finish. Ask for
  learning time or a new due date." No finish date and no days-late number are shown. Nothing shows "Infinity".
- **AC-7** If spare is left blank, no status is shown and the minutes per working day are still shown. A blank
  spare field is not an error.
- **AC-8** The status is written as a word ("On track", "Tight", "Late"), never shown by colour alone.

## S-4 (J-3): Admin: earliest and recommended due date

As an L&D admin, I enter the course time, the daily learning time employees are given, a start date and the
working days. I see the earliest due date they can meet, and a recommended due date that leaves a margin.

- **AC-1** The start date is today by default.
- **AC-2** Working days needed = course minutes ÷ daily minutes, rounded up. The **earliest due date** is the
  working day with that number, counting from the start date (the start date counts if it is a working day). If
  the start date is not a working day, counting begins at the next working day.
  - Example: 300 min, 60 min a day, start Thu 2026-11-26, Mon–Fri. That is 5 working days, so the earliest date
    is **Wed 2026-12-02**.
- **AC-3** **Recommended due date**: the earliest date where the daily pace stays at or under 80% of the daily
  time (the learner's On track rule). It is labelled "Recommended due date", with the line "Keeps the daily pace to
  80% or less of the time you give." Pace = daily × 80 ÷ 100, rounded down. Working days = course ÷ pace, rounded
  up.
  - Example: 300 min, 60 min a day gives a pace of 48 and 7 working days, so the recommended date is
    **Fri 2026-12-04**.
- **AC-4** With a daily time of 1 minute, the pace rounds down to 0. In that case the recommended date reads
  "Not available at 1 minute a day. Raise the daily time to get a date with a margin." The earliest date is still
  shown.
- **AC-5** A **daily time of 0 is a result, not an error**: "At 0 minutes a day employees can't finish. Give them
  learning time to get a due date." No date is shown.
- **AC-6** Rules that hold across both roles. Take a learner with the same course, 0 done, today = start date and
  spare = daily time.
  - With the earliest due date, that learner is **not Late**.
  - With the working day before the earliest due date, that learner **is Late** (whenever that day is not before
    the start date).
  - With the recommended due date, that learner is **On track**.

## S-5 (J-1..J-3): Clear errors, no crash, and recovery

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

### Acceptance criteria

- **AC-1** Every condition in the table shows its message. None of them causes a crash, a blank page, an uncaught
  exception, or the text "NaN", "Infinity" or "undefined" anywhere on the page.
- **AC-2** All field errors are shown at the same time, each next to its own field.
- **AC-3** Once the fields are valid, only the first matching check below is shown:
  - **Learner:** time done > total → already complete → no working day checked → due date in the past → no
    working days left → result.
  - **Admin:** no working day checked → start date before today → result.
- **AC-4** **Recovery:** after any error, fixing the input removes the message and shows the correct result. No
  reload is needed, and no earlier result is left on screen.
- **AC-5** No working days left is a different case from no working day checked, and it has its own message.
  Example: today Fri 2026-11-27, Sun–Thu, due Sat 2026-11-28.
- **AC-6** A field shows its error only after the user has changed it or moved focus out of it.
- **AC-7** The result area is never blank. Until every field is valid, it shows a friendly empty state:
  - Learner: "Enter your training to see your daily pace."
  - Admin: "Enter your course to see the earliest due date."

## S-6 (J-1..J-3): Accessibility

- **AC-1** Every input has a visible label tied to it, so a screen reader reads the label and tests can find the
  input by its label.
- **AC-2** The whole app works with the keyboard alone, and keyboard focus is always visible.
- **AC-3** The result area is a live region (`role="status"`, polite), so screen readers announce changes to it.
- **AC-4** A field with an error has `aria-invalid="true"`, and its message is linked with `aria-describedby`.
- **AC-5** The Learner/Admin switch works with the keyboard and shows which role is selected.

## S-7 (STRETCH): English / Arabic

English and Arabic, with a right-to-left layout. **Done only if time is left after S-1 to S-6.** All visible
text comes from one messages file, so adding a language later means adding one table. If it isn't built, the
README lists it under "Not implemented".

## Not implemented (next)

- **S-8** A list of several courses with a combined pace.
- **S-9** Public holidays per country.
- **S-10** Export the study plan to a calendar file (.ics).

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
| D-6 | 0 spare / 0 daily minutes is Late, not an error | Many people really get no learning time at work. It isn't a typo, and the useful answer is "you won't finish, ask for time". More than 480 needed per day is shown for the same reason. |
| D-7 | The admin sees a recommended date as well as the earliest one | The earliest date puts learners in "Tight". The recommended date uses the same 80% rule as the learner's "On track". "Recommended" is plainer for an admin than "comfortable". |
| D-8 | Per-day inputs are capped at 480 minutes | 8 hours is a full working day. A larger value is almost certainly a typo. |
| D-9 | Dates are capped at 5 years ahead | Training deadlines further out than that are almost certainly typos. |
| D-10 | No public holidays in v1 | They differ by country and year. Saying so is better than guessing wrong. |
| D-11 | Dates are shown as "Thu 3 Dec 2026" | "12/03" means different dates in different countries. |
| D-12 | Mon–Fri is the default, and every result names the working days it used | MENA is mixed: Saudi Arabia's weekend is Fri–Sat, while the UAE and Tunisia have Sat–Sun. No default fits everyone, so the result makes the choice visible. |
