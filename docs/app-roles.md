# App roles

Khutwa has two roles. Both use the same calculation engine (working days × minutes per day). The role is a
switch at the top of the page, not a login: the app is frontend only and stores nothing.

## Learner

**Who:** an employee who has been assigned training with a due date.

**Enters:**
- total course time (hours + minutes)
- time already done (hours + minutes)
- due date
- working days (Mon–Fri preset, Sun–Thu preset, or custom)
- optional: minutes they can spare per working day

**Sees:**
- minutes needed per working day (rounded up)
- working days left, today included only if it is a working day
- if they entered spare time: **On track**, **Tight** or **Late**. When the status is Late, they also see the
  projected finish date and how many working days late that is.
- the working days used, repeated in the result: "15 min a day over 26 working days (Mon–Fri)". Mon–Fri is the
  default, and no default fits every MENA country, so a wrong default has to be easy to spot.

**Promise:** a learner is never shown "On track" or "Tight" when the numbers say they will be late.

## L&D Admin

**Who:** the person who assigns training to employees and sets the due date.

**Enters:**
- course time (hours + minutes)
- daily learning time employees are given (minutes per working day)
- start date (today by default)
- working days

**Sees:**
- the **earliest achievable due date** at that daily time
- a **recommended due date**, explained on screen as "Keeps the daily pace to 80% or less of the time you give."
  This matches the learner's "On track" rule.
- how many working days each date gives, and which working days were used (as for the learner)

**Promise:** an admin is never shown a due date that cannot be met at the daily time they entered.

## Out of scope for both roles (v1)

- Public holidays. They differ by country and year, so a single list would be wrong for many users.
- Several courses at once (S-8), calendar export (S-10).
- Accounts, saving or sharing results.
