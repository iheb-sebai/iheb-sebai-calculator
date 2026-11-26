# App roles

Khutwa has two roles. Both use the same calculation engine (working days × minutes per day). The role is a
switch at the top of the page, not a login: the app is frontend only and stores nothing.

## Learner

A learner is an employee who has been assigned training with a due date.

They can enter their total course time and the time already done (hours + minutes), the due date, their working
days (the Mon–Fri or Sun–Thu preset, or their own days) and, optionally, the minutes they can spare per working
day. They can then see:

- the minutes needed per working day, rounded up;
- the working days left, today included only if it is a working day;
- the working days used, repeated in the result: "15 min a day over 26 working days (Mon–Fri)". Mon–Fri is the
  default, and no default fits every MENA country, so a wrong default has to be easy to spot;
- if they entered spare time: **On track**, **Tight** or **Late**, with a pace meter. When the status is Late,
  they also see the projected finish date and how many working days late that is.

They must never be shown "On track" or "Tight" when the numbers say they will be late.

## L&D Admin

An L&D admin is the person who assigns training to employees and sets the due date.

They can enter the course time (hours + minutes), the daily learning time employees are given (minutes per
working day), the start date (today by default) and the working days. They can then see:

- the **earliest achievable due date** at that daily time;
- a **recommended due date**, explained on screen as "Keeps the daily pace to 80% or less of the time you give."
  This matches the learner's "On track" rule;
- how many working days each date gives, and which working days were used (as for the learner).

They must never be shown a due date that cannot be met at the daily time they entered.

## Out of scope for both roles (v1)

- Public holidays (S-9). They differ by country and year, so a single list would be wrong for many users.
- Several courses at once (S-8), calendar export (S-10), the timeline (S-11), Arabic text and layout (S-7).
- Accounts, saving or sharing results.
