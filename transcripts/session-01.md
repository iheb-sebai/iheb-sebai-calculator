
❯ I'm doing a take-home assignment: a calculator web app built with an AI
  coding tool. Don't write any code yet.

  Read docs/plan.md first. Short version: Khutwa is a training-deadline
  calculator for two kinds of users:

  Learners have assigned courses with a due date. They need to know how many
  minutes per working day they need, and whether they'll finish on time at the
  pace they can manage.
  L&D admins assign training. They need the earliest due date employees can
  realistically meet.
  Constraints: it must run locally with npm, with no paid accounts, API keys or
  cloud services. Frontend only, no backend. Use Vite + React + TypeScript,
  and Vitest with Testing Library.

  Rules:

  Minutes per day are always rounded up, never down.
  Today counts only if it is one of the selected working days.
  The calculation logic never reads the clock: "today" is passed in as a
  parameter, so tests give the same result on any machine and in any time zone.
  Public holidays are out of scope for this version.
  Every error shows a clear message, never a crash, NaN or Infinity.
  Ask me any questions you need answered, then propose a plan: the modules, the
  main function signatures, and how you'll test them.

⏺ I'll start by finding and reading the plan.

  Listed 1 directory (ctrl+o to expand)

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && ls -la && cat docs/plan.md &&
      ls docs && git log --oneline -5 2>/dev/null)
  ⎿  (file diff unavailable for this command)

⏺ I read docs/plan.md. The folder contains only that file so far. One thing to
  know first: iheb-sebai-calculator/ has no git repo of its own. It sits inside
  the git repo of your home folder, which is on main and has hundreds of
  unrelated deleted files. Before the first commit I'd run git init
  inside the project folder so your submission doesn't carry that history.

  Questions

  Each question has my default in bold. If you reply "defaults", I'll go ahead
  with all of them.

  1. What is "the cap"? The plan lists "over the cap" as an error but never
     defines it. Default: course time and time done up to 999 h 59 min. Minutes
     per day 1–480, since a full working day is a sensible ceiling for learning
     time. Due and start dates no more than 5 years out. If the needed minutes
     per day go over 480, I show the number with a "not achievable in a working
     day" note, not an error, because that is a real answer the learner should
     see.
  2. Is the due date included? Default: yes. The learner can still study on the
     due date if it's a working day, and a due date of today is valid, not "in
     the past". The admin's date uses the same rule: it is the day of the last
     study session.
  3. Should the admin's earliest date leave a margin? At exactly 100% of the
     daily time, a learner on that date often lands in "Tight" by our own 80%
     rule. Default: the main answer is the earliest achievable date. Below it I
     also show a "comfortable" date where the pace stays at or under 80%. It's
     the same function with a different pace, so it costs about 15 minutes.
  4. Admin start date. Default: it starts as today and can't be earlier than
     today. If it isn't a working day, counting starts at the next working day.
  5. Is spare time required for learners? Default: optional. S-1 works on its
     own: leave it blank and you see minutes per day only. The status appears
     once you enter it. A spare time of 0 is an error ("Enter at least 1
     minute"), because otherwise the projected finish would be infinite.
  6. Small ones. Default: Mon–Fri preset selected, Fri–Sat one click away.
     Results update live as you type, with no Calculate button. GitHub Actions
     and Pages only if there is time left after README and verification.

  Proposed plan

  Modules

  src/lib/            pure, never reads the clock, never throws
    dates.ts          ISO 'YYYY-MM-DD' handled as whole day numbers (no Date
  objects with times)
    workingDays.ts    counting and stepping over working days
    learner.ts        S-1, S-2, S-3
    admin.ts          S-4
    parse.ts          raw form strings → typed input or field errors (S-5)
    messages.ts       error code → English text (one place, so S-7 is just a
  second table)
    result.ts         Result<T, E> type
  src/today.ts        the ONLY clock read: local date → IsoDate
  src/components/     App (mode switch), LearnerForm, AdminForm,
  WorkingDaysPicker,
                      DurationInput (h + min), ResultPanel (aria-live),
  FieldError

  Main signatures

  type IsoDate = string & { __brand: 'IsoDate' };   // validated 'YYYY-MM-DD'
  type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;          // 0 = Sunday
  type WorkingDays = ReadonlySet<Weekday>;
  type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

  // dates.ts
  parseIsoDate(s: string): IsoDate | null            // rejects 2026-02-30
  toDayNumber(d: IsoDate): number                    // via Date.UTC, so time
  zone never matters
  fromDayNumber(n: number): IsoDate
  weekdayOf(d: IsoDate): Weekday

  // workingDays.ts
  countWorkingDays(from: IsoDate, to: IsoDate, days: WorkingDays): number   //
  both ends included, 0 if to < from
  nthWorkingDay(from: IsoDate, n: number, days: WorkingDays): IsoDate       // n
  ≥ 1, from counts if it's a working day
  // O(1) math (whole weeks + remainder), so a very slow pace can't loop for
  centuries

  // learner.ts
  calculateLearner(i: {
    today: IsoDate; dueDate: IsoDate; workingDays: WorkingDays;
    totalMinutes: number; doneMinutes: number; spareMinutesPerDay?: number;
  }): Result<LearnerResult, CalcError>
  type LearnerResult =
    | { kind: 'complete' }
    | { kind: 'plan'; remainingMinutes: number; workingDaysLeft: number;
        neededPerDay: number;                        // Math.ceil, never rounded
  down
        pace?: { status: 'on-track' | 'tight' }
             | { status: 'late'; projectedFinish: IsoDate; workingDaysLate:
  number } };
  paceStatus(needed: number, spare: number): 'on-track' | 'tight' | 'late'
  // integer compare: needed * 100 <= spare * TIGHT_PERCENT (80), no float edge
  cases

  // admin.ts
  calculateAdmin(i: {
    today: IsoDate; startDate: IsoDate; workingDays: WorkingDays;
    courseMinutes: number; dailyMinutes: number;
  }): Result<{ earliestDueDate: IsoDate; workingDaysNeeded: number;
  comfortableDueDate: IsoDate }, CalcError>

  // parse.ts
  parseWholeNumber(raw: string, min: number, max: number): Result<number,
  FieldErrorCode>
  //   'required' | 'negative' | 'not-whole' | 'too-large' | 'too-small'
  parseLearnerForm(raw: LearnerFormValues): Result<Omit<LearnerInput, 'today'>,
  FieldError[]>
  parseAdminForm(raw: AdminFormValues): Result<Omit<AdminInput, 'today'>,
  FieldError[]>

  Order of errors. Field format errors come first, all shown at once next to
  their inputs. After that, the first match wins:
  1. Time done is greater than the total.
  2. Time done equals the total: "Already complete". This is a result, not an
     error.
  3. No working days selected.
  4. Due date is in the past.
  5. No working days between today and the due date. For example, today is
     Friday, the due date is Saturday, and the weekend is Fri–Sat. This is a
     separate case from 3 and needs its own message.

  Recovery. React state holds only the raw strings, and the result is
  recalculated from them on every render. There is no stored result that could
  go stale, so the app recovers by design, and a test proves it.

  Testing

  Test names carry story and criterion IDs, e.g. "S-3 AC-2: needed exactly 80%
  of spare is On track".

  - dates and workingDays: leap day 2028-02-29, month and year ends, invalid
    dates. An exhaustive oracle test compares the O(1) functions with a simple
    day-by-day loop. It covers all 127 non-empty weekday sets × 7 start weekdays
    × ranges of 0–60 days. It is deterministic and needs no extra library.
  - learner: rounding (100 min over 3 days → 34). Status boundaries: with spare
    100, needed 80 is On track, 81 and 100 are Tight, 101 is Late. Projected
    finish date and working days late. Every error path. A sweep asserts every
    number in the output is Number.isFinite.
  - admin: S-4 criteria plus a check across both roles. A learner given the
    admin's earliest date at that daily time is never Late, and one working day
    earlier is always Late. That backs up the plan's "never shown a date that
    can't be met".
  - parse: table-driven tests: "", "-5", "1.5", "1e3", " 7 ", minutes of 60,
    values over the cap.
  - Components (Testing Library + user-event + jsdom): App takes a today prop,
    so UI tests are fixed in time too. Tests find fields by label, which proves
    the labels exist (S-6), and use only the keyboard. They check that the
    result sits in a role="status" live region. One test walks error → fix →
    correct result (S-5 recovery).
  - Time zones: npm run test:tz runs the whole suite under TZ=Pacific/Kiritimati
    (UTC+14) and TZ=America/Adak (UTC−10). A small guard test also fails if
    Date.now or new Date() with no arguments appears anywhere in src/lib/.

  The only dependencies are vite, react, typescript, vitest,
  @testing-library/{react,user-event,jest-dom} and jsdom, all free from npm.
  Nothing needs an account or key.

  Order, matching your timeline

  1. docs/ user stories with numbered acceptance criteria, so test names have
     IDs to point at.
  2. dates and workingDays, with tests.
  3. learner, then admin, then parse.
  4. The UI, then accessibility.
  5. README, with each product decision and its reason, and verification.md.

  S-7 (Arabic) stays cut unless there's time left. messages.ts keeps it cheap to
  add later.

  Answer the questions, or just say "defaults", and I'll start with the docs.

❯ go with your defaults for 1 2 3 4 and 6 i like the comfortable date idea it
  fits our 80% rule

  for 5 i'd change one thing 0 spare minutes shouldn't be an error
  you said yourself more than 480 is a real answer and 0 is the same thing
  lots of people really have no learning time at work so it's not a typo
  show it as late with a message like "at 0 minutes a day you won't finish ask
  for learning time or a new due date"
  no finish date and no infinity

  and yes do git init in this folder first

  start with the docs no code yet

⏺ Bash(git init -b main && git status --short && git rev-parse --show-toplevel)
  ⎿  (file diff unavailable for this command)

⏺ Repo created at iheb-sebai-calculator/.git, branch main, nothing committed
  yet. Now I'll check the weekdays for the worked examples I'll put in the
  acceptance criteria.

⏺ Bash(for d in 2026-11-26 2026-11-27 2026-11-28 2026-11-29 2026-11-30
      2026-12-01 2026-12-02 2026-12-03 2026-12-04 2028-02-29; do printf "%s
      %s\n" $d "$(date -j -f %Y-…)
  ⎿  (No output)

⏺ Write(docs/app-roles.md)
  ⎿  Wrote 47 lines to docs/app-roles.md
       1 # App roles
       2
       3 Khutwa has two roles. Both use the same calculation engine (work
         ing days × minutes per day). The role is a
       4 switch at the top of the page, not a login: the app is frontend
         only and stores nothing.
       5
       6 ## Learner
       7
       8 **Who:** an employee who has been assigned training with a due d
     … +40 lines (~1 KB) (ctrl+o to expand)

⏺ Write(docs/jobs-to-be-done.md)
  ⎿  Wrote 35 lines to docs/jobs-to-be-done.md
       1 # Jobs to be done
       2
       3 The jobs describe the situation and the outcome people want. The
         y name no app features. Each story in
       4 [user-stories.md](user-stories.md) points back to a job.
       5
       6 ## The problem
       7
       8 Companies assign mandatory training with due dates. Learners fin
         d out too late that the deadline was not
     … +27 lines (ctrl+o to expand)

⏺ Write(docs/user-stories.md)
  ⎿  Wrote 179 lines to docs/user-stories.md
       1 # User stories and acceptance criteria
       2
       3 Each criterion has an ID (`S-3 AC-2`). Test names start with tha
         t ID, so a failing test points to the rule it
       4 breaks. [verification.md](verification.md) maps every criterion
         to its test.
       5
       6 **Example dates.** 2026-11-26 is a Thursday. Mon–Fri means Satur
         day and Sunday are the weekend. Sun–Thu means
       7 Friday and Saturday are the weekend.
     … +172 lines (ctrl+o to expand)

⏺ Write(docs/verification.md)
  ⎿  Wrote 46 lines to docs/verification.md
       1 # Verification
       2
       3 How each acceptance criterion in [user-stories.md](user-stories.
         md) is checked, and the result.
       4
       5 > **Status: nothing has been built or run yet.** This file is fi
         lled in during the review phase. A row says
       6 > "pass" only after the test or manual check has actually been r
         un.
       7
     … +39 lines (ctrl+o to expand)

⏺ I've run git init in the project folder, and I've written the docs. There's no
  code yet and nothing is committed.

  Written for: the reviewers who will read the submission.

  - docs/app-roles.md: what each role enters and sees, and the promise each role
    gets.
  - docs/jobs-to-be-done.md: J-1 to J-3 from your plan, each with a "done well
    when" line.
  - docs/user-stories.md: S-1 to S-10 with numbered acceptance criteria, worked
    examples using real dates, every error message word for word, and a product
    decisions table for the README.
  - docs/verification.md: a map from each criterion to its test. Every row says
    "not run" until it actually is.

  Your 0-minute change is S-3 AC-6. At 0 spare minutes the status is Late with
  your message. There is no finish date and no days-late number. It's in the
  decisions table with your reason. The spare-minutes range is now 0–480.

  Decisions I made that you didn't explicitly approve:

  1. 0 daily minutes for the admin works the same way (S-4 AC-5). It shows the
     message "At 0 minutes a day employees can't finish. Give them learning time
     to get a due date." and no date, instead of an error.
  2. 1 daily minute has no comfortable date (S-4 AC-4). The 80% pace rounds down
     to 0, so the comfortable date shows "Not available" while the earliest
     date still shows. This is the one edge case the comfortable-date idea
     creates.
  3. Time fields start at "0", not blank (S-5 input rules). An empty field is
     still an error, but typing "10" hours doesn't make the minutes field
     complain.
  4. Errors appear only after a field is changed or left (S-5 AC-6). A fresh
     form isn't covered in red.
  5. "Today" means the device's local date at the moment of each calculation
     (top of user-stories.md). A tab left open past midnight doesn't keep using
     yesterday.
  6. Dates are shown as "Thu 3 Dec 2026" (decisions table). "12/03" would mean
     different dates in the US and the Middle East.

  Each worked example in the criteria is meant to become a test case. I checked
  their weekdays with the system calendar, and those tests will confirm the
  counts. Review the docs, especially the error table and the order of checks in
  S-5 AC-3. Then tell me when to start on src/lib/ with its tests.

❯ went through all 4 docs
  no job mentions the app every story points to a job and the s-1 example gives
  15 min a day over 26 working days like i expected

  two product points

  1 working days default
  mon–fri is a western default but this role is mena and mena is mixed, saudi
  weekend is fri–sat while uae and tunisia are sat–sun
  so no default fits everyone
  keep mon–fri but repeat the chosen weekend in the result sentence like "15
  min a day over 26 working days (mon–fri)" so a wrong default is easy to spot

  2 the word "comfortable"
  an l&d admin might not get what comfortable means
  call it "recommended due date" and add "keeps the daily pace under 80% of the
  time you give"

  one question
  what does the result side show on a fresh empty form
  i want a friendly empty state like "enter your training to see your daily
  pace" not a blank box

  ok with your 6 extra decisions
  after these start src/lib with dates and workingDays tests first and show me
  they fail

⏺ Before editing, one thing to correct: the docs don't contain a "15 min a day
  over 26 working days" example. The only S-1 example is 100 min over 3 working
  days, which gives 34 (S-1 AC-2). Your figure may come from your own numbers.
  I'll still use your sentence as the format for the result line, since that's
  the point of your working-days change.

  Now the doc edits.

⏺ Update(docs/app-roles.md)
  ⎿  Added 2 lines
      19  - working days left, today included only if it is a working day
      20  - if they entered spare time: **On track**, **Tight** or **Late
          **. When the status is Late, they also see the
      21    projected finish date and how many working days late that is.
      22 +- the working days used, repeated in the result: "15 min a day 
         +over 26 working days (Mon–Fri)". Mon–Fri is the                
      23 +  default, and no default fits every MENA country, so a wrong d
         +efault has to be easy to spot.                                 
      24 
      25  **Promise:** a learner is never shown "On track" or "Tight" whe
          n the numbers say they will be late.
      26 

⏺ Update(docs/app-roles.md)
  ⎿  Added 3 lines, removed 3 lines
      36 
      37  **Sees:**
      38  - the **earliest achievable due date** at that daily time
      39 -- a **comfortable due date**, where the daily pace stays at or 
         -under 80% of the daily time. This matches the                  
      40 -  learner's "On track" rule.                                   
      41 -- how many working days each date gives                        
      39 +- a **recommended due date**, explained on screen as "Keeps the
         + daily pace to 80% or less of the time you give."              
      40 +  This matches the learner's "On track" rule.                  
      41 +- how many working days each date gives, and which working days
         + were used (as for the learner)                                
      42 
      43  **Promise:** an admin is never shown a due date that cannot be
          met at the daily time they entered.
      44 

⏺ Update(docs/user-stories.md)
  ⎿  Added 4 lines
      37    - Today Sat 2026-11-28, Mon–Fri, due Fri 2026-12-04: **5** (S
          aturday does not count).
      38    - Today Thu 2026-11-26, Sun–Thu, due Sun 2026-11-29: **2** (T
          hursday and Sunday).
      39  - **AC-5** A due date that falls on a non-working day is allowe
          d. Only the working days before it count.
      40 +- **AC-6** Every result sentence repeats the working days it us
         +ed, so a wrong default is easy to spot. Example:               
      41 +  "15 min a day over 26 working days (Mon–Fri)". Presets show a
         +s "Mon–Fri" and "Sun–Thu". A custom choice lists               
      42 +  the days in week order starting from Monday ("Mon, Wed, Fri",
         + "Sat, Sun"), and all seven days show as "every                
      43 +  day". Admin results do the same.                             
      44 
      45  ## S-3 (J-2): Pace status
      46 

⏺ Update(docs/user-stories.md)
  ⎿  Added 2 lines, removed 2 lines
      64    spare field is not an error.
      65  - **AC-8** The status is written as a word ("On track", "Tight"
          , "Late"), never shown by colour alone.
      66 
      67 -## S-4 (J-3): Admin: earliest achievable due date              
      67 +## S-4 (J-3): Admin: earliest and recommended due date         
      68 
      69  As an L&D admin, I enter the course time, the daily learning ti
          me employees are given, a start date and the
      70 -working days, and I see the earliest due date they can meet.   
      70 +working days. I see the earliest due date they can meet, and a 
         +recommended due date that leaves a margin.                     
      71 
      72  - **AC-1** The start date is today by default.
      73  - **AC-2** Working days needed = course minutes ÷ daily minutes
          , rounded up. The **earliest due date** is the

⏺ Update(docs/user-stories.md)
  ⎿  Added 6 lines, removed 5 lines
      75    the start date is not a working day, counting begins at the n
          ext working day.
      76    - Example: 300 min, 60 min a day, start Thu 2026-11-26, Mon–F
          ri. That is 5 working days, so the earliest date
      77      is **Wed 2026-12-02**.
      78 -- **AC-3** **Comfortable due date**: the earliest date where th
         -e daily pace stays at or under 80% of the daily                
      79 -  time (the learner's On track rule). Pace = daily × 80 ÷ 100, 
         -rounded down. Working days = course ÷ pace,                    
      80 -  rounded up.                                                  
      81 -  - Example: 300 min, 60 min a day gives a pace of 48 and 7 wor
         -king days, so the comfortable date is                          
      78 +- **AC-3** **Recommended due date**: the earliest date where th
         +e daily pace stays at or under 80% of the daily                
      79 +  time (the learner's On track rule). It is labelled "Recommend
         +ed due date", with the line "Keeps the daily pace to           
      80 +  80% or less of the time you give." Pace = daily × 80 ÷ 100, r
         +ounded down. Working days = course ÷ pace, rounded             
      81 +  up.                                                          
      82 +  - Example: 300 min, 60 min a day gives a pace of 48 and 7 wor
         +king days, so the recommended date is                          
      83      **Fri 2026-12-04**.
      83 -- **AC-4** With a daily time of 1 minute, the pace rounds down 
         -to 0. In that case the comfortable date reads                  
      84 +- **AC-4** With a daily time of 1 minute, the pace rounds down 
         +to 0. In that case the recommended date reads                  
      85    "Not available at 1 minute a day. Raise the daily time to get
           a date with a margin." The earliest date is still
      86    shown.
      87  - **AC-5** A **daily time of 0 is a result, not an error**: "At
           0 minutes a day employees can't finish. Give them

⏺ Update(docs/user-stories.md)
  ⎿  Added 1 line, removed 1 line
      91    - With the earliest due date, that learner is **not Late**.
      92    - With the working day before the earliest due date, that lea
          rner **is Late** (whenever that day is not before
      93      the start date).
      94 -  - With the comfortable due date, that learner is **On track**
         -.                                                              
      94 +  - With the recommended due date, that learner is **On track**
         +.                                                              
      95 
      96  ## S-5 (J-1..J-3): Clear errors, no crash, and recovery
      97 

⏺ Update(docs/user-stories.md)
  ⎿  Added 4 lines, removed 2 lines
      141    reload is needed, and no earlier result is left on screen.
      142  - **AC-5** No working days left is a different case from no wo
           rking day checked, and it has its own message.
      143    Example: today Fri 2026-11-27, Sun–Thu, due Sat 2026-11-28.
      144 -- **AC-6** A field shows its error only after the user has cha
          -nged it or moved focus out of it. Until every field           
      145 -  is valid, the result area reads "Fill in the form to see you
          -r result."                                                    
      144 +- **AC-6** A field shows its error only after the user has cha
          +nged it or moved focus out of it.                             
      145 +- **AC-7** The result area is never blank. Until every field i
          +s valid, it shows a friendly empty state:                     
      146 +  - Learner: "Enter your training to see your daily pace."    
      147 +  - Admin: "Enter your course to see the earliest due date."  
      148 
      149  ## S-6 (J-1..J-3): Accessibility
      150 

⏺ Update(docs/user-stories.md)  ⎿  Added 16 lines, removed 13 lines
      171 
      172  ## Product decisions
      173 
      174 -| Decision | Reason |                                         
      175 -|---|---|                                                     
      176 -| Minutes are rounded up, never to the nearest | Falling short
          - of a deadline costs more than one extra minute a day. |      
      177 -| "Tight" starts above 80% | Below 80%, one bad day still leav
          -es a margin. Above it, it does not. The threshold is one const
          -ant. |                                                        
      178 -| Today counts only if it is a working day | A weekend day can
          -'t be counted on for work-time learning. |                    
      179 -| "Today" is passed into the engine | Tests give the same resu
          -lt on any machine and in any time zone. |                     
      180 -| Due date is included | People can still study on the due day
          -. |                                                           
      181 -| 0 spare / 0 daily minutes is Late, not an error | Many peopl
          -e really get no learning time at work. It isn't a typo, and th
          -e useful answer is "you won't finish, ask for time". More than
          - 480 needed per day is shown for the same reason. |           
      182 -| The admin sees a comfortable date as well as the earliest on
          -e | The earliest date puts learners in "Tight". The comfortabl
          -e date uses the same 80% rule as the learner's "On track". |  
      183 -| Per-day inputs are capped at 480 minutes | 8 hours is a full
          - working day. A larger value is almost certainly a typo. |    
      184 -| Dates are capped at 5 years ahead | Training deadlines furth
          -er out than that are almost certainly typos. |                
      185 -| No public holidays in v1 | They differ by country and year. 
          -Saying so is better than guessing wrong. |                    
      186 -| Dates are shown as "Thu 3 Dec 2026" | "12/03" means differen
          -t dates in different countries. |                             
      174 +Tests cite these decisions by ID when no story criterion cover
          +s the rule (e.g. `D-11`).                                     
      175 +                                                              
      176 +| ID | Decision | Reason |                                    
      177 +|---|---|---|                                                 
      178 +| D-1 | Minutes are rounded up, never to the nearest | Falling
          + short of a deadline costs more than one extra minute a day. |
      179 +| D-2 | "Tight" starts above 80% | Below 80%, one bad day stil
          +l leaves a margin. Above it, it does not. The threshold is one
          + constant. |                                                  
      180 +| D-3 | Today counts only if it is a working day | A weekend d
          +ay can't be counted on for work-time learning. |              
      181 +| D-4 | "Today" is passed into the engine | Tests give the sam
          +e result on any machine and in any time zone. |               
      182 +| D-5 | Due date is included | People can still study on the d
          +ue day. |                                                     
      183 +| D-6 | 0 spare / 0 daily minutes is Late, not an error | Many
          + people really get no learning time at work. It isn't a typo, 
          +and the useful answer is "you won't finish, ask for time". Mor
          +e than 480 needed per day is shown for the same reason. |     
      184 +| D-7 | The admin sees a recommended date as well as the earli
          +est one | The earliest date puts learners in "Tight". The reco
          +mmended date uses the same 80% rule as the learner's "On track
          +". "Recommended" is plainer for an admin than "comfortable". |
      185 +| D-8 | Per-day inputs are capped at 480 minutes | 8 hours is 
          +a full working day. A larger value is almost certainly a typo.
          + |                                                            
      186 +| D-9 | Dates are capped at 5 years ahead | Training deadlines
          + further out than that are almost certainly typos. |          
      187 +| D-10 | No public holidays in v1 | They differ by country and
          + year. Saying so is better than guessing wrong. |             
      188 +| D-11 | Dates are shown as "Thu 3 Dec 2026" | "12/03" means d
          +ifferent dates in different countries. |                      
      189 +| D-12 | Mon–Fri is the default, and every result names the wo
          +rking days it used | MENA is mixed: Saudi Arabia's weekend is 
          +Fri–Sat, while the UAE and Tunisia have Sat–Sun. No default fi
          +ts everyone, so the result makes the choice visible. |        

⏺ Bash(grep -rn -i "comfortable" docs/ ; node -v; npm -v; python3 -c "
      import datetime as d…)
  ⎿  (No output)

⏺ Docs are updated: "comfortable" now appears only in D-7's reason, and
  decisions have IDs D-1 to D-12. There is a problem with npm on this machine,
  though, so I'll look into that before scaffolding.

⏺ Bash(which -a node npm npx corepack 2>/dev/null; ls ~/.nvm/versions/node
      2>/dev/null; ls /opt/homebrew/Cellar/ 2>/dev/null | grep -i node; ls
      /opt/homebrew/opt | gre…)
  ⎿  (No output)

⏺ The shell is mixing nvm's Node 20.7 with Homebrew's npm 11, and current Vite
  needs Node 20.19 or newer. I'm switching this project to the installed nvm
  Node 22.19 and pinning it in .nvmrc. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"; node -v; npm
      -v; npm view vite version; npm view vitest version; npm view react
      version; npm view @vi…)
  ⎿  (No output)

⏺ npm's cache in ~/.npm has root-owned files, and fixing that needs a sudo chown
  that you would have to run yourself. I'm pointing npm at a scratchpad cache
  in the meantime so no sudo is needed. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"; export
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/s…)
  ⎿  (No output)

⏺ The latest test packages need newer Node than the plan's "Node 20+": jsdom 31
  needs 22.22 or later and vitest 5 needs 22.12 or later. I'll look for the
  newest versions that still run on Node 20.19.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"; export
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/s…)
  ⎿  (No output)

⏺ The newest compatible versions are vite 7, vitest 4, jsdom 27, jest-dom 6,
  plugin-react 5 and TypeScript 5.9, which makes Node 22.12 the floor since Node
  20 is end-of-life. I'm adding that to the README, then scaffolding the two
  test files with stub modules that throw. · summary

⏺ Bash(python3 -c "
      import datetime as d…)
  ⎿  (No output)

⏺ Write(package.json)
  ⎿  Wrote 19 lines to package.json
       1 {
       2   "name": "khutwa",
       3   "private": true,
       4   "version": "0.1.0",
       5   "description": "Khutwa: a training-deadline calculator for lea
         rners and L&D admins",
       6   "type": "module",
       7   "engines": {
       8     "node": ">=22.12"
       9   },
     … +10 lines (ctrl+o to expand)

⏺ Write(tsconfig.json)
  ⎿  Wrote 18 lines to tsconfig.json
       1 {
       2   "compilerOptions": {
       3     "target": "ES2022",
       4     "lib": ["ES2022", "DOM", "DOM.Iterable"],
       5     "module": "ESNext",
       6     "moduleResolution": "bundler",
       7     "jsx": "react-jsx",
       8     "strict": true,
       9     "noUncheckedIndexedAccess": true,
      10     "noFallthroughCasesInSwitch": true,
     … +8 lines (ctrl+o to expand)

⏺ Write(vite.config.ts)
  ⎿  Wrote 10 lines to vite.config.ts
       1 import react from '@vitejs/plugin-react';
       2 import { defineConfig } from 'vitest/config';
       3
       4 export default defineConfig({
       5   plugins: [react()],
       6   test: {
       7     include: ['src/**/*.test.{ts,tsx}'],
       8     environment: 'node',
       9   },
      10 });

⏺ Write(scripts/test-tz.mjs)
  ⎿  Wrote 16 lines to scripts/test-tz.mjs
       1 // Runs the whole test suite in two extreme time zones (D-4).
       2 // UTC+14 and UTC-10 are 24 hours apart, so if any code mixed up
          "today" across
       3 // time zones, one of these runs would land on a different calen
         dar day.
       4 import { spawnSync } from 'node:child_process';
       5
       6 const zones = ['Pacific/Kiritimati', 'America/Adak'];
       7
       8 for (const tz of zones) {
     … +8 lines (ctrl+o to expand)

⏺ Bash(printf 'node_modules/\ndist/\ncoverage/\n*.log\n.DS_Store\n' > .gitignore
      && echo 22 > .nvmrc && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" npm_c…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The first install worked. The second hit an internal npm error, so I'll read
  the log.

  Searched for 1 pattern (ctrl+o to expand)

⏺ This is a known npm 10 bug in resolving vitest's optional peer dependencies.
  The usual workaround is to list the dependencies in package.json and run a
  plain npm install.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/scratchpa…)
  ⎿  Error: Exit code 1
     npm error Cannot read properties of null (reading 'edgesOut')
     npm error A complete log of this run can be found in:
     /private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d1f9
     /scratchpad/npm-cache/_logs/2026-11-25T23_31_28_098Z-debug-0.log
     khutwa@0.1.0 /Users/macmini/iheb-sebai-calculator
     +-- UNMET DEPENDENCY @testing-library/jest-dom@^6
     +-- UNMET DEPENDENCY @testing-library/react@^16
     +-- UNMET DEPENDENCY @testing-library/user-event@^14
     +-- UNMET DEPENDENCY @types/node@^22
     +-- UNMET DEPENDENCY @types/react-dom@^19
     +-- UNMET DEPENDENCY @types/react@^19
     … +21 lines (ctrl+o to expand)

⏺ That didn't work either. Next I'll try a clean install, then the newer npm 11,
  run through npx without installing it globally.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/scratchpa…)
  ⎿  (No output)
  ⎿  (timeout 6m 40s)

⏺ npm 11 installed everything cleanly. Reviewers might be on npm 10, so I'll
  check that a fresh npm ci from the lockfile works with npm 10.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/ci-check && rm -rf $S && mkdir -p $S && cp
      /Users/macmini/iheb-sebai-ca…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ With the lockfile in place, npm 10 installs work either way, and only a fresh
  dependency resolve hits the bug, so I'm committing package-lock.json; the stub
  modules and tests are next. · summary
⏺ Write(src/lib/dates.ts)
  ⎿  Wrote 44 lines to src/lib/dates.ts
      1 /**
      2  * Calendar dates with no time of day and no time zone.
      3  *
      4  * A date is a 'YYYY-MM-DD' string. All arithmetic is done on who
        le day numbers
      5  * (days since 1970-01-01), so no result can depend on the machin
        e's time zone
      6  * or clock (D-4).
      7  *
      8  * RED PHASE: signatures only. The tests in dates.test.ts describ
     … +37 lines (~1 KB) (ctrl+o to expand)

⏺ Write(src/lib/workingDays.ts)
  ⎿  Wrote 46 lines to src/lib/workingDays.ts
      1 /**
      2  * Counting and stepping over working days.
      3  *
      4  * Both functions work in whole weeks plus a remainder, so they t
        ake the same
      5  * time for 3 days or 300 years (a slow pace can project a finish
         date far away).
      6  *
      7  * RED PHASE: the presets are real data, the functions are not bu
        ilt yet.
     … +39 lines (ctrl+o to expand)

⏺ Write(src/lib/dates.test.ts)
  ⎿  Wrote 135 lines to src/lib/dates.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import {
       3   addDays,
       4   formatDisplayDate,
       5   fromDayNumber,
       6   parseIsoDate,
       7   toDayNumber,
       8   weekdayOf,
       9   type IsoDate,
      10 } from './dates';
     … +125 lines (ctrl+o to expand)

⏺ Write(src/lib/workingDays.test.ts)
  ⎿  Wrote 207 lines to src/lib/workingDays.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import { addDays, weekdayOf, type IsoDate, type Weekday } from '
         ./dates';
       3 import {
       4   PRESETS,
       5   countWorkingDays,
       6   describeWorkingDays,
       7   nthWorkingDay,
       8   presetFor,
       9   type WorkingDays,
     … +198 lines (ctrl+o to expand)

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Added 1 line, removed 1 line
      155    });
      156 
      157    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      158 -    'S-5 AC-1: n = %d gives null, not an exception or an endle
          -ss loop',                                                     
      158 +    'S-5 AC-1: n = %s gives null, not an exception or an endle
          +ss loop',                                                     
      159      (n) => {
      160        expect(nthWorkingDay(THU, n, monFri)).toBeNull();
      161      },

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "=== typecheck
      ===" && npx tsc --noEmit && echo "ty…)
  ⎿  (No output)

⏺ 57 tests fail on "not implemented", all in dates.test.ts, because
  workingDays.test.ts crashed at load when its start-date list called the
  addDays stub. I'm replacing that list with plain date literals so the suite
  fails for the right reason. · summary

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Added 2 lines, removed 2 lines
      24    days(...WEEKDAYS.filter((d) => ((i + 1) >> d) & 1)),
      25  );
      26 
      27 -/** One start date on each weekday (Mon 23 to Sun 29 Nov 2026).
         - */                                                            
      28 -const START_DATES: IsoDate[] = WEEKDAYS.map((i) => addDays(iso(
         -'2026-11-23'), i));                                            
      27 +/** One start date on each weekday, Mon 23 to Sun 29 Nov 2026. 
         +Literals, so loading this file runs no engine code. */         
      28 +const START_DATES: IsoDate[] = ['23', '24', '25', '26', '27', '
         +28', '29'].map((d) => iso(`2026-11-${d}`));                    
      29 
      30  const label = (choice: WorkingDays) => [...choice].sort().join(
          '');
      31 

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npx vitest run --reporter=verbose 2>&1 | grep
      -E "^\s+(✓|×)" |…)
  ⎿  (No output)

⏺ 94 fail and 2 pass. But the failure causes add up to 93, so one test is
  failing for some other reason. I'll find it.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run 2>&1 | grep -E "^(Error|TypeError|AssertionError|RangeError)" | grep
      -v "not impleme…)
  ⎿  (No output)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run 2>&1 | grep -c "^ FAIL "; npx vitest run 2>&1 | grep -A1 "^ FAIL " |
      grep -vE "^ FAI…)
  ⎿  No matches found

⏺ All 4 docs are updated, and the dates and workingDays tests are written and
  fail as they should. Nothing is committed yet.

  The red run: 96 tests, 94 failing. Every failure is a "not implemented" error
  from a stub, and the type check passes. The 2 passing tests check the two
  working-day presets, which are plain data rather than logic.

   Test Files  2 failed (2)
        Tests  94 failed | 2 passed (96)

  My first run was a false red. The working-days test file crashed while
  loading, so none of its tests ran, and only the dates tests showed as failing.
  I fixed it so all of them run and fail on their own assertions.

  What the tests cover
  - Dates: strict parsing (rejects 2026-02-30, 2100-02-29, 2026/11/26),
    conversion to day numbers checked against values computed separately in
    Python, and every day from 1999 to 2032 converting back to itself. Also
    weekdays (including dates before 1970) and the "Thu 3 Dec 2026" display
    format.
  - Working days: each worked example in the docs. Plus a check against a simple
    day-by-day count for all 127 working-day choices, every start weekday and
    0–60 days. Plus a projected finish 59,999 Sundays away, to show a very slow
    pace doesn't make it loop for centuries.

  Your two product points
  - Working days in the result: added as S-2 AC-6 and decision D-12, with your
    Saudi / UAE / Tunisia reasoning. Custom choices are listed from Monday
    ("Mon, Wed, Fri"), and all seven days show as "every day".
  - Recommended due date: renamed everywhere. I changed one word of your line,
    to "Keeps the daily pace to 80% or less of the time you give". The rule
    allows exactly 80%: 60 min a day gives a pace of 48, which is exactly 80%.
    "Under 80%" would describe that case wrongly.

  Your empty-state question: it wasn't blank before; it said "Fill in the form
  to see your result." It now uses your wording: "Enter your training to see
  your daily pace." I wrote the admin version myself: "Enter your course to see
  the earliest due date." Both are in S-5 AC-7.

  The 15 min / 26 working days example isn't in the docs. The only S-1 example
  is 100 min over 3 days, which gives 34. If you checked other numbers on your
  own, they're fine; I just don't want you to think the doc says that. I did use
  your sentence as the example format in S-2 AC-6.

  Changes to the setup on this machine
  - Node 22.12 or newer instead of "Node 20+". Node 20 reached end of life in
    April 2026, and the current test libraries need Node 22. I added .nvmrc and
    engines. The README needs to say this.
  - npm workarounds. Your shell pairs nvm's Node 20.7 with Homebrew's npm 11,
    and that combination breaks. I used nvm's Node 22.19 instead. ~/.npm also
    contains files owned by root; sudo chown -R 501:20 ~/.npm fixes that if you
    want, and I didn't run it. npm 10 crashed while resolving dependencies, so I
    installed with npm 11 through npx. A fresh npm ci from the lockfile works
    on npm 10, so reviewers are fine as long as package-lock.json is committed.

  I'd commit the docs, the setup and these failing tests now, before writing any
  logic. Then your history shows the tests failing before the code that makes
  them pass. Should I commit, then implement dates.ts and workingDays.ts and
  show the tests passing?

❯ right the 15 min / 26 days numbers were from my own planning example not from
  the docs, my mistake
  add it to s-1 as a realistic worked example: 7 h 40 min total, 1 h 10 min
  done, today thu 26 nov 2026, due thu 31 dec 2026, mon–fri, should give 26
  working days and 15 min a day
  and good catch on "80% or less", keep your wording

  yes commit the docs setup and failing tests first
  then implement dates.ts and workingDays.ts, run all the tests and show me
  they pass, then commit

⏺ I'll check your example before adding it: 7 h 40 min is 460 min, minus 1 h 10
  min (70 min) done leaves 390 min. Mon–Fri from Thu 26 Nov to Thu 31 Dec 2026
  is 2 + 5 + 5 + 5 + 5 + 4 = 26 working days, and 390 ÷ 26 = 15 exactly. That
  matches. Fri 25 Dec counts as a working day because v1 has no public holidays
  (D-10), so I'll note that in the example as well.

⏺ Update(docs/user-stories.md)
  ⎿  Added 6 lines
      23  - **AC-4** If the minutes needed are more than 480 (8 h), the n
          umber is still shown, with the note "That's more
      24    than a full working day." It is a real answer, not an error.
      25  - **AC-5** Times of 60 minutes or more are also shown in hours
          and minutes. Example: "85 min (1 h 25 min)".
      26 +- **AC-6** Realistic example: total 7 h 40 min (460 min), 1 h 1
         +0 min done (70 min), today Thu 2026-11-26, due                 
      27 +  Thu 2026-12-31, Mon–Fri.                                     
      28 +  - Remaining time: 390 min.                                   
      29 +  - Working days left: **26** (2 + 5 + 5 + 5 + 5 + 4). Fri 2026
         +-12-25 counts as a working day because v1 has no               
      30 +    public holidays (D-10).                                    
      31 +  - Result: **15 min a day over 26 working days (Mon–Fri)**.   
      32 
      33  ## S-2 (J-1): Working days
      34 

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Added 4 lines
      90      expect(countWorkingDays(THU, iso('2026-11-29'), sunThu)).to
          Be(2);
      91    });
      92 
      93 +  it('S-1 AC-6: Thu 26 Nov to Thu 31 Dec 2026, Mon–Fri, is 26 w
         +orking days', () => {                                          
      94 +    expect(countWorkingDays(THU, iso('2026-12-31'), monFri)).to
         +Be(26);                                                        
      95 +  });                                                          
      96 +                                                               
      97    it('S-2 AC-3: both ends are included (Mon 30 Nov to Fri 4 Dec
           is 5)', () => {
      98      expect(countWorkingDays(iso('2026-11-30'), iso('2026-12-04'
          ), monFri)).toBe(5);
      99    });

⏺ Update(docs/verification.md)
  ⎿  Added 3 lines, removed 1 line
      18 
      19  | Criterion | Test file | Status |
      20  |---|---|---|
      21 -| S-1 AC-1 to AC-5 | `src/lib/learner.test.ts` | not run |     
      21 +| S-1 AC-1 to AC-6 | `src/lib/learner.test.ts` | not run |     
      22 +| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | 
         +not run |                                                      
      23 +| S-5 date rules, D-4, D-9, D-11 | `src/lib/dates.test.ts` | no
         +t run |                                                        
      24  | S-2 AC-1, AC-2 | `src/components/WorkingDaysPicker.test.tsx`
          | not run |
      25  | S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts` | not run |
      26  | S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | not run |

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && npx vitest run 2>&1 | grep -E "Test Files|Tests "; git status
      --short; git conf…)
  ⎿  (No output)

⏺ The new S-1 AC-6 test fails too: 95 failing, 2 passing. Only the intended
  files are untracked, and node_modules is ignored. Committing the red state:

⏺ Bash(git add .gitignore .nvmrc docs package.json package-lock.json scripts src
      tsconfig.json vite.config.ts && git commit -q -F - <<'EOF'
      Add docs, project setup and…)
  ⎿  Error: Exit code 128
     error: gpg failed to sign the data:
     [GNUPG:] KEY_CONSIDERED AA0A7A3BC048F467C022B4DCF9FF2A84C79AA82A 2
     [GNUPG:] BEGIN_SIGNING H8
     [GNUPG:] PINENTRY_LAUNCHED 72428 mac 1.3.1.1 - - - - 501/20 0
     gpg: signing failed: Operation cancelled
     [GNUPG:] FAILURE sign 83886179
     gpg: signing failed: Operation cancelled

     fatal: failed to write commit object
     … +1 line (ctrl+o to expand)

⏺ The GPG passphrase prompt was cancelled, so the commit failed and nothing was
  recorded. The red-state files are staged, so I'll write the implementation now
  and commit the red and green snapshots once signing works; whether to turn
  signing off is your call, which I'll ask about at the end. · summary

⏺ Write(src/lib/dates.ts)
  ⎿  Added 70 lines, removed 10 lines
       2   * Calendar dates with no time of day and no time zone.
       3   *
       4   * A date is a 'YYYY-MM-DD' string. All arithmetic is done on w
          hole day numbers
       5 - * (days since 1970-01-01), so no result can depend on the mach
         -ine's time zone                                                
       6 - * or clock (D-4).                                             
       7 - *                                                             
       8 - * RED PHASE: signatures only. The tests in dates.test.ts descr
         -ibe the behaviour.                                             
       5 + * (days since 1970-01-01) using plain integer maths, never the
         + Date object, so                                               
       6 + * no result can depend on the machine's time zone or clock (D-
         +4).                                                            
       7   */
       8 
       9  /** A validated 'YYYY-MM-DD' calendar date. Create one with par
          seIsoDate. */
     ...
       12  /** Day of the week, numbered as in JavaScript: 0 = Sunday ...
            6 = Saturday. */
       13  export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
       14 
       15 +export const WEEKDAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed'
          +, 'Thu', 'Fri', 'Sat'] as const;                              
       16 +                                                              
       17 +const MONTH_SHORT_NAMES = [                                   
       18 +  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep
          +', 'Oct', 'Nov', 'Dec',                                       
       19 +] as const;                                                   
       20 +                                                              
       21 +const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;                 
       22 +                                                              
       23 +function isLeapYear(year: number): boolean {                  
       24 +  return year % 4 === 0 && (year % 100 !== 0 || year % 400 ===
          + 0);                                                          
       25 +}                                                             
       26 +                                                              
       27 +function daysInMonth(year: number, month: number): number {   
       28 +  if (month === 2) return isLeapYear(year) ? 29 : 28;         
       29 +  return [4, 6, 9, 11].includes(month) ? 30 : 31;             
       30 +}                                                             
       31 +                                                              
       32 +/** Year, month (1–12) and day of a date that is already known
          + to be valid. */                                              
       33 +function parts(date: IsoDate): [year: number, month: number, d
          +ay: number] {                                                 
       34 +  return [Number(date.slice(0, 4)), Number(date.slice(5, 7)), 
          +Number(date.slice(8, 10))];                                   
       35 +}                                                             
       36 +                                                              
       37 +function format(year: number, month: number, day: number): Iso
          +Date {                                                        
       38 +  const pad = (value: number, width: number) => String(value).
          +padStart(width, '0');                                         
       39 +  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as 
          +IsoDate;                                                      
       40 +}                                                             
       41 +                                                              
       42  /** Returns the date if `text` is a real calendar date in 'YYY
           Y-MM-DD' form, otherwise null. */
       43  export function parseIsoDate(text: string): IsoDate | null {
       19 -  throw new Error(`parseIsoDate not implemented (${text})`);  
       44 +  const match = ISO_DATE.exec(text.trim());                   
       45 +  if (!match) return null;                                    
       46 +  const [year, month, day] = [Number(match[1]), Number(match[2
          +]), Number(match[3])];                                        
       47 +  if (month < 1 || month > 12) return null;                   
       48 +  if (day < 1 || day > daysInMonth(year, month)) return null; 
       49 +  return format(year, month, day);                            
       50  }
       51 
       52 +// toDayNumber and fromDayNumber use Howard Hinnant's civil-da
          +te algorithms                                                 
       53 +// (https://howardhinnant.github.io/date_algorithms.html). The
          +y count years from                                            
       54 +// March, so the leap day falls at the end of the year and nee
          +ds no special case.                                           
       55 +                                                              
       56  /** Days since 1970-01-01 (negative before it). */
       57  export function toDayNumber(date: IsoDate): number {
       24 -  throw new Error(`toDayNumber not implemented (${date})`);   
       58 +  const [year, month, day] = parts(date);                     
       59 +  const y = month <= 2 ? year - 1 : year;                     
       60 +  const era = Math.floor(y / 400);                            
       61 +  const yearOfEra = y - era * 400;                            
       62 +  const monthFromMarch = (month + 9) % 12;                    
       63 +  const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5)
          + + day - 1;                                                   
       64 +  const dayOfEra =                                            
       65 +    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(y
          +earOfEra / 100) + dayOfYear;                                  
       66 +  return era * 146097 + dayOfEra - 719468;                    
       67  }
       68 
       69  /** The date for a day number. Inverse of toDayNumber. */
       70  export function fromDayNumber(dayNumber: number): IsoDate {
       29 -  throw new Error(`fromDayNumber not implemented (${dayNumber}
          -)`);                                                          
       71 +  const z = dayNumber + 719468;                               
       72 +  const era = Math.floor(z / 146097);                         
       73 +  const dayOfEra = z - era * 146097;                          
       74 +  const yearOfEra = Math.floor(                               
       75 +    (dayOfEra -                                               
       76 +      Math.floor(dayOfEra / 1460) +                           
       77 +      Math.floor(dayOfEra / 36524) -                          
       78 +      Math.floor(dayOfEra / 146096)) /                        
       79 +      365,                                                    
       80 +  );                                                          
       81 +  const dayOfYear =                                           
       82 +    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - 
          +Math.floor(yearOfEra / 100));                                 
       83 +  const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153)
          +;                                                             
       84 +  const day = dayOfYear - Math.floor((153 * monthFromMarch + 2
          +) / 5) + 1;                                                   
       85 +  const month = monthFromMarch < 10 ? monthFromMarch + 3 : mon
          +thFromMarch - 9;                                              
       86 +  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);  
       87 +  return format(year, month, day);                            
       88  }
       89 
       90  /** The date `days` days later (or earlier, if negative). */
       91  export function addDays(date: IsoDate, days: number): IsoDate
           {
       34 -  throw new Error(`addDays not implemented (${date}, ${days})`
          -);                                                            
       92 +  return fromDayNumber(toDayNumber(date) + days);             
       93  }
       94 
       95  export function weekdayOf(date: IsoDate): Weekday {
       38 -  throw new Error(`weekdayOf not implemented (${date})`);     
       96 +  // Day 0 (1970-01-01) was a Thursday. The double modulo keep
          +s dates before 1970 positive.                                 
       97 +  return (((toDayNumber(date) + 4) % 7) + 7) % 7 as Weekday;  
       98  }
       99 
      100  /** 'Thu 3 Dec 2026', the same on every machine and locale (D-
           11). */
      101  export function formatDisplayDate(date: IsoDate): string {
       43 -  throw new Error(`formatDisplayDate not implemented (${date})
          -`);                                                           
      102 +  const [year, month, day] = parts(date);                     
      103 +  return `${WEEKDAY_SHORT_NAMES[weekdayOf(date)]} ${day} ${MON
          +TH_SHORT_NAMES[month - 1]} ${year}`;                          
      104  }

⏺ Write(src/lib/workingDays.ts)  ⎿  Added 52 lines, removed 8 lines
       1  /**
       2   * Counting and stepping over working days.
       3   *
       4 - * Both functions work in whole weeks plus a remainder, so they
         - take the same                                                 
       5 - * time for 3 days or 300 years (a slow pace can project a fini
         -sh date far away).                                             
       6 - *                                                             
       7 - * RED PHASE: the presets are real data, the functions are not 
         -built yet.                                                     
       4 + * Both functions work in whole weeks plus a remainder of under
         + 7 days, so they                                               
       5 + * take the same time for 3 days or 300 years (a slow pace can 
         +project a finish                                               
       6 + * date far away). workingDays.test.ts checks them against a da
         +y-by-day walk.                                                 
       7   */
       8 +import { WEEKDAY_SHORT_NAMES, fromDayNumber, toDayNumber, weekd
         +ayOf } from './dates';                                         
       9  import type { IsoDate, Weekday } from './dates';
      10 
      11  /** The weekdays someone works on. */
     ...
      19    sunThu: new Set<Weekday>([0, 1, 2, 3, 4]),
      20  };
      21 
      22 +const PRESET_LABELS: Readonly<Record<PresetId, string>> = { mon
         +Fri: 'Mon–Fri', sunThu: 'Sun–Thu' };                           
      23 +                                                               
      24 +/** Week order used in labels and the day checkboxes (S-2 AC-6)
         +. */                                                           
      25 +const MONDAY_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];
      26 +                                                               
      27 +const nextWeekday = (day: Weekday) => ((day + 1) % 7) as Weekda
         +y;                                                             
      28 +                                                               
      29  /**
      30   * Working days from `from` to `to`, both included (S-2 AC-3, D
          -3, D-5).
      31   * Returns 0 when `to` is before `from` or no day is selected.
      32   */
      33  export function countWorkingDays(from: IsoDate, to: IsoDate, da
          ys: WorkingDays): number {
      27 -  throw new Error(`countWorkingDays not implemented (${from}, $
         -{to}, ${days.size})`);                                         
      34 +  const totalDays = toDayNumber(to) - toDayNumber(from) + 1;   
      35 +  if (totalDays <= 0 || days.size === 0) return 0;             
      36 +                                                               
      37 +  // Every run of 7 days contains each weekday once.           
      38 +  let count = Math.floor(totalDays / 7) * days.size;           
      39 +                                                               
      40 +  // The leftover days start on the same weekday as `from`.    
      41 +  let day = weekdayOf(from);                                   
      42 +  for (let i = 0; i < totalDays % 7; i++) {                    
      43 +    if (days.has(day)) count++;                                
      44 +    day = nextWeekday(day);                                    
      45 +  }                                                            
      46 +  return count;                                                
      47  }
      48 
      49  /**
     ...
      51   * Returns null when n is not a whole number ≥ 1 or no day is s
          elected.
      52   */
      53  export function nthWorkingDay(from: IsoDate, n: number, days: W
          orkingDays): IsoDate | null {
      35 -  throw new Error(`nthWorkingDay not implemented (${from}, ${n}
         -, ${days.size})`);                                             
      54 +  if (!Number.isSafeInteger(n) || n < 1 || days.size === 0) ret
         +urn null;                                                      
      55 +                                                               
      56 +  // Skip whole weeks that each hold `days.size` working days, 
         +leaving 1..days.size to find.                                  
      57 +  const wholeWeeks = Math.floor((n - 1) / days.size);          
      58 +  let left = n - wholeWeeks * days.size;                       
      59 +  let dayNumber = toDayNumber(from) + wholeWeeks * 7;          
      60 +                                                               
      61 +  // The rest lies within the next 7 days, starting on the same
         + weekday as `from`.                                            
      62 +  let day = weekdayOf(from);                                   
      63 +  for (;;) {                                                   
      64 +    if (days.has(day) && --left === 0) return fromDayNumber(day
         +Number);                                                       
      65 +    dayNumber++;                                               
      66 +    day = nextWeekday(day);                                    
      67 +  }                                                            
      68  }
      69 
      70 +function sameDays(a: WorkingDays, b: WorkingDays): boolean {   
      71 +  return a.size === b.size && [...a].every((day) => b.has(day))
         +;                                                              
      72 +}                                                              
      73 +                                                               
      74  /** Which preset the selection matches, or 'custom' (S-2 AC-2).
           */
      75  export function presetFor(days: WorkingDays): PresetId | 'custo
          m' {
      40 -  throw new Error(`presetFor not implemented (${days.size})`); 
      76 +  if (sameDays(days, PRESETS.monFri)) return 'monFri';         
      77 +  if (sameDays(days, PRESETS.sunThu)) return 'sunThu';         
      78 +  return 'custom';                                             
      79  }
      80 
      81  /** Short label repeated in every result sentence: 'Mon–Fri', '
          Mon, Wed, Fri', 'every day' (S-2 AC-6). */
      82  export function describeWorkingDays(days: WorkingDays): string
          {
      45 -  throw new Error(`describeWorkingDays not implemented (${days.
         -size})`);                                                      
      83 +  const preset = presetFor(days);                              
      84 +  if (preset !== 'custom') return PRESET_LABELS[preset];       
      85 +  if (days.size === 0) return 'no working days';               
      86 +  if (days.size === 7) return 'every day';                     
      87 +  return MONDAY_FIRST.filter((day) => days.has(day))           
      88 +    .map((day) => WEEKDAY_SHORT_NAMES[day])                    
      89 +    .join(', ');                                               
      90  }

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "===
      typecheck ===" && npx tsc --noEmit && echo "types OK"; echo "=== npm test
      ===" && npm tes…)
  ⎿  (No output)

⏺ All 97 tests pass under both UTC+14 and UTC−10, and since they passed on the
  first run, I'm planting three bugs one at a time to confirm they catch them,
  restoring from a scratchpad backup each time rather than using git checkout.
  · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut && mkd…)
  ⎿  Running in the background (↓ to manage)

⏺ The third planted bug made nthWorkingDay loop forever, which vitest can't time
  out. I'm stopping the run and restoring workingDays.ts, since that file's
  change on disk came from the planted bug rather than from me. · summary

⏺ Stop Task
  ⎿  export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
     B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e68
     9e5d1f9/scratchpad/mut && mkd… · stopped

⏺ Bash(pkill -f "iheb-sebai-calculator/node_modules/.*vitest" ; pkill -f "vitest
      run" ; sleep 0;
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e68…)
  ⎿  (No output)

⏺ Restored the planted bug; I'm capping the nthWorkingDay loop at 7 days so a
  future fault returns null instead of freezing the page, then re-planting the
  bug with a time limit. · summary

⏺ Update(src/lib/workingDays.ts)
  ⎿  Added 4 lines, removed 1 line
      60 
      61    // The rest lies within the next 7 days, starting on the same
           weekday as `from`.
      62    let day = weekdayOf(from);
      63 -  for (;;) {                                                   
      63 +  for (let i = 0; i < 7; i++) {                                
      64      if (days.has(day) && --left === 0) return fromDayNumber(day
          Number);
      65      dayNumber++;
      66      day = nextWeekday(day);
      67    }
      68 +  // Unreachable while the week maths above is right. Capping t
         +he loop means a                                                
      69 +  // mistake there shows up as a failed test, not a frozen page
         +.                                                              
      70 +  return null;                                                 
      71  }
      72 
      73  function sameDays(a: WorkingDays, b: WorkingDays): boolean {

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut && cp…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ The planted-bug run printed nothing, maybe because macOS has no timeout
  command. I'll check that, and read the file back to confirm the restore and my
  edit are both in place.

⏺ Bash(command -v timeout gtimeout; sed -n 49,72p src/lib/workingDays.ts)
  ⎿  (No output)

⏺ The file is correct, and timeout isn't available. I'll run the planted bug
  again without it, since the loop is now capped and can't hang.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut && cp…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ All three planted bugs are caught: 2, 7 and 3 failing tests. Last, I'll
  confirm the staged red snapshot is still intact before asking you about
  signing.

⏺ Bash(echo "--- staged (red commit) ---" && git diff --cached --stat | tail -2
      && git show :src/lib/dates.ts | grep -c "not implemented" && echo "---
      unstaged (green…)
  ⎿  (No output)

⏺ Signing is now off for this repo only (commit.gpgsign=false in .git/config). I
  didn't set that, so I take it you did after the failed commit. Committing the
  red snapshot, then the green one.

⏺ Bash(git commit -q -F - <<'EOF'
      Add docs, project setup and failing tests for dates and working days…)
  ⎿  (No output)

⏺ Both commits are in, and dates.ts and workingDays.ts now pass every test.

  d1f4001 Implement dates and working days; all 97 tests pass
  d270d60 Add docs, project setup and failing tests for dates and working days

  - Your example: added to S-1 as AC-6. Before adding it I checked the numbers:
    390 min left, 26 working days (2 + 5 + 5 + 5 + 5 + 4), so 15 min a day with
    nothing to round. The example notes that Fri 25 Dec counts as a working day
    because v1 has no public holidays. The 26-day count is also a test now.
  - Red commit: 97 tests, 95 failing on "not implemented" and 2 passing (the
    preset data).
  - Green commit: all 97 pass. The type check passes, and npm run test:tz passes
    97/97 under UTC+14 and again under UTC−10.

  Checking that the tests catch bugs. Everything passed on the first run, so I
  planted three bugs one at a time:

  ┌────────────────────────────────────────────┬──────────────┐
  │                Planted bug                 │    Result    │
  ├────────────────────────────────────────────┼──────────────┤
  │ 2000 not treated as a leap year            │ 2 tests fail │
  ├────────────────────────────────────────────┼──────────────┤
  │ One leftover day counted too many          │ 7 tests fail │
  ├────────────────────────────────────────────┼──────────────┤
  │ One week too many skipped in nthWorkingDay │ 3 tests fail │
  └────────────────────────────────────────────┴──────────────┘

  A real problem those checks found. The first time I planted the third bug,
  nthWorkingDay looped forever and froze the test run. In the app, the same kind
  of mistake would freeze the page. The final step of that function is now
  capped at 7 days, so a mistake in that maths makes it return no date and the
  tests fail, instead of hanging. It's in workingDays.ts:63-71
  (src/lib/workingDays.ts#L63-L71).

  Commit signing: when I came back to commit, signing was turned off for this
  repo only (commit.gpgsign=false in .git/config). I didn't change it, so I
  assumed you did after the failed commit and went ahead. Your global setting is
  unchanged. If that setting wasn't you, tell me and I'll redo both commits
  signed once your passphrase prompt works.

  Next in the plan are learner.ts and admin.ts, tests first, including the check
  that the earliest date is never Late and the recommended date is On track.
  Should I start?

❯ yes the signing was me i handle it
  i ran npm test myself and got 97 passing
  nice work planting the bugs, and good catch on the freeze, keep that 7-day
  cap

  go ahead with learner.ts and admin.ts, tests first and show me they fail,
  then implement, then commit

⏺ I'll keep the red-then-green pattern: one commit with the failing tests, one
  with the code. First, one number for a test. S-3 AC-4 says the status check
  uses whole numbers. To prove that matters, I need a case where floating-point
  maths (needed <= spare * 0.8) gets the wrong answer.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"; node -e '
      const out=[];for(let s=1;s<=480;s++){ if((4*s)%5) continue; const n=4*s/5;
      const float = n…)
  ⎿  (No output)

⏺ Both the needed <= spare * 0.8 and needed / spare <= 0.8 forms behave the same
  across 1–480, so that test wouldn't prove anything; I'm trying the percentage
  form next. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"; node -e '
      const bad=[];for(let s=1;s<=480;s++){ for(let n=1;n<=s;n++){ const pct =
      n/s*100; const exa…)
  ⎿  (No output)

⏺ No float form of the 80% check fails across 1–480, so the whole-number
  comparison is only a precaution, and I'm testing the exact boundaries instead
  of claiming a float bug. Next I'll move the shared helpers and the 127-choice
  list out of workingDays.test.ts so the admin tests can reuse it. · summary

⏺ Write(src/lib/rules.ts)  ⎿  Wrote 15 lines to src/lib/rules.ts
      1 /**
      2  * Product rules, each in one place. The IDs point to docs/user-s
        tories.md.
      3  */
      4
      5 /** D-2: "On track" up to this share of the spare time, "Tight" a
        bove it. */
      6 export const TIGHT_PERCENT = 80;
      7
      8 /** D-8, S-1 AC-4: a full working day, and the cap on per-day inp
     … +8 lines (ctrl+o to expand)

⏺ Write(src/lib/result.ts)
  ⎿  Wrote 13 lines to src/lib/result.ts
      1 /**
      2  * The engine returns a Result instead of throwing, so every outc
        ome, including
      3  * every error, is a value the UI must handle (S-5 AC-1).
      4  */
      5 export type Result<T, E> = { ok: true; value: T } | { ok: false;
        error: E };
      6
      7 export function ok<T>(value: T): { ok: true; value: T } {
      8   return { ok: true, value };
     … +5 lines (ctrl+o to expand)

⏺ Write(src/lib/test-helpers.ts)
  ⎿  Wrote 31 lines to src/lib/test-helpers.ts
       1 /**
       2  * Shared test data and checks. Used by the *.test.ts files only
         , never by app code.
       3  */
       4 import type { IsoDate, Weekday } from './dates';
       5 import type { WorkingDays } from './workingDays';
       6
       7 /** A date literal the test knows is valid, so tests don't depen
         d on parseIsoDate. */
       8 export const iso = (text: string) => text as IsoDate;
     … +23 lines (ctrl+o to expand)

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Added 2 lines, removed 1 line
      1  import { describe, expect, it } from 'vitest';
      2 -import { addDays, weekdayOf, type IsoDate, type Weekday } from '
        -./dates';                                                       
      2 +import { addDays, weekdayOf, type IsoDate } from './dates';     
      3 +import { ALL_CHOICES, START_DATES, WEEKDAYS, days, iso } from '.
        +/test-helpers';                                                 
      4  import {
      5    PRESETS,
      6    countWorkingDays,

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Removed 2 lines
      10    type WorkingDays,
      11  } from './workingDays';
      12 
      13 -const iso = (text: string) => text as IsoDate;                 
      14 -const days = (...weekdays: Weekday[]): WorkingDays => new Set(w
         -eekdays);                                                      
      13  const { monFri, sunThu } = PRESETS;
      14 
      15  const THU = iso('2026-11-26');

⏺ Update(src/lib/workingDays.test.ts)
  ⎿  Removed 10 lines
      16  const FRI = iso('2026-11-27');
      17  const SAT = iso('2026-11-28');
      18 
      19 -const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];             
      20 -                                                               
      21 -/** Every non-empty choice of working days: 2^7 - 1 = 127 sets.
         - */                                                            
      22 -const ALL_CHOICES: WorkingDays[] = Array.from({ length: 127 }, 
         -(_, i) =>                                                      
      23 -  days(...WEEKDAYS.filter((d) => ((i + 1) >> d) & 1)),         
      24 -);                                                             
      25 -                                                               
      26 -/** One start date on each weekday, Mon 23 to Sun 29 Nov 2026. 
         -Literals, so loading this file runs no engine code. */         
      27 -const START_DATES: IsoDate[] = ['23', '24', '25', '26', '27', '
         -28', '29'].map((d) => iso(`2026-11-${d}`));                    
      28 -                                                               
      19  const label = (choice: WorkingDays) => [...choice].sort().join(
          '');
      20 
      21  // The oracles: walk one day at a time. Slow, but obviously rig
          ht.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && npx vitest run 2>&1 | grep -E "Tests ")
  ⎿  (No output)

⏺ The refactor is clean: still 97 passing. Now the learner and admin stubs and
  their tests.

⏺ Write(src/lib/learner.ts)
  ⎿  Wrote 58 lines to src/lib/learner.ts
       1 /**
       2  * The learner calculation (S-1, S-2, S-3, S-5).
       3  *
       4  * Pure: `today` is passed in, nothing reads the clock (D-4), an
         d nothing
       5  * throws. Every outcome is a Result.
       6  *
       7  * RED PHASE: types and signatures only.
       8  */
       9 import type { IsoDate } from './dates';
     … +49 lines (ctrl+o to expand)

⏺ Write(src/lib/admin.ts)
  ⎿  Wrote 44 lines to src/lib/admin.ts
       1 /**
       2  * The L&D admin calculation (S-4, S-5).
       3  *
       4  * Pure: `today` is passed in, nothing reads the clock (D-4), an
         d nothing
       5  * throws. Every outcome is a Result.
       6  *
       7  * RED PHASE: types and signatures only.
       8  */
       9 import type { IsoDate } from './dates';
     … +35 lines (ctrl+o to expand)

⏺ Write(src/lib/learner.test.ts)
  ⎿  Wrote 254 lines to src/lib/learner.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import { addDays } from './dates';
       3 import { calculateLearner, paceStatus, type LearnerInput, type L
         earnerResult } from './learner';
       4 import { days, iso, nonFiniteNumbers, WEEKDAYS } from './test-he
         lpers';
       5 import { PRESETS, countWorkingDays } from './workingDays';
       6
       7 const { monFri, sunThu } = PRESETS;
       8 const THU = iso('2026-11-26');
     … +246 lines (ctrl+o to expand)

⏺ Write(src/lib/admin.test.ts)
  ⎿  Wrote 167 lines to src/lib/admin.test.ts
      1 import { describe, expect, it } from 'vitest';
      2 import { calculateAdmin, type AdminInput, type AdminResult } from
         './admin';
      3 import { calculateLearner } from './learner';
      4 import { ALL_CHOICES, START_DATES, days, iso, nonFiniteNumbers }
        from './test-helpers';
      5 import { PRESETS, nthWorkingDay } from './workingDays';
      6
      7 const { monFri, sunThu } = PRESETS;
      8 const THU = iso('2026-11-26');
     … +159 lines (ctrl+o to expand)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "===
      typecheck ===" && npx tsc --noEmit && echo "types OK"; echo "=== tests
      ===" && npx vitest…)
  ⎿  (No output)

⏺ Most failing tests come from stubs, and two AssertionErrors likely come from
  the NaN sweeps catching exceptions. Since vitest reports shared errors once,
  the count falls short of 70, so I'm checking each failing test with the JSON
  reporter. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run --reporter=json
      --outputFile=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-40…)
  ⎿  Error: Exit code 1
     failed: 70 | without a not-implemented message: 2
     [eval]:6
     for (const a of
     failed.filter(a=>a.failureMessages[0].startsWith("AssertionError")))
     console.log(" -", a.title, "=>", a.failureMessages[0].split("\n").find(l=>l
     .includes("threw")).trim().slice(0,110));


                                 ^

     TypeError: Cannot read properties of undefined (reading 'trim')
         at [eval]:6:180
         at runScriptInThisContext (node:internal/vm:209:10)
         at node:internal/process/execution:446:12
     … +7 lines (ctrl+o to expand)

⏺ Bash(node -e '
      const r=require("/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/scratchpad/red2.json");…)
  ⎿  (No output)

⏺ Both NaN sweeps failed as expected, but vitest truncates the failure output to
  expected [ …(5) ], hiding which cases broke. I'll make each sweep print its
  first five problems in the failure message. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator/src/lib && grep -n "slice(0,
      5)).toEqual(\[\])" *.test.ts | wc -l && sed -i '' -E
      's/expect\((problems|mismatches)\.slic…)
  ⎿  (No output)

⏺ The sweep failures now name the cases that failed. Those file-change notices
  are from my own sed. I'll switch the quotes to match the rest of the code, run
  the full red suite once more, and commit.

⏺ Bash(sed -i '' "s/join(\"\\\\n\")/join('\\\\n')/" src/lib/*.test.ts && grep -c
      "join('\\\\n')).toEqual" src/lib/*.test.ts && export
      PATH="$HOME/.nvm/versions/node/v2…)
  ⎿  (No output)

⏺ The red state is as intended: all 70 new tests fail, every failure is a "not
  implemented" stub, and the 97 earlier tests still pass. Committing:

⏺ Bash(git add src/lib && git status --short && git commit -q -F - <<'EOF'
      Add failing tests for the learner and admin calculations…)
  ⎿  (No output)

⏺ Red commit 22512ea is in. Now the implementation. Both modules share two small
  helpers, a whole-number check and division that rounds up, so those go in one
  place.

⏺ Write(src/lib/numbers.ts)  ⎿  Wrote 15 lines to src/lib/numbers.ts
       1 /** A whole number ≥ 0 that JavaScript stores exactly (so never
         NaN, Infinity or a decimal). */
       2 export function isWholeNumber(value: number): boolean {
       3   return Number.isSafeInteger(value) && value >= 0;
       4 }
       5
       6 /**
       7  * a ÷ b rounded up (D-1), for whole numbers a ≥ 0 and b ≥ 1.
       8  *
       9  * Floating-point division is exact enough here: when b divides
     … +7 lines (ctrl+o to expand)

⏺ Write(src/lib/learner.ts)
  ⎿  Added 67 lines, removed 8 lines
       3   *
       4   * Pure: `today` is passed in, nothing reads the clock (D-4), a
          nd nothing
       5   * throws. Every outcome is a Result.
       6 - *                                                             
       7 - * RED PHASE: types and signatures only.                       
       6   */
       9 -import type { IsoDate } from './dates';                        
      10 -import type { Result } from './result';                        
      11 -import type { WorkingDays } from './workingDays';              
       7 +import { toDayNumber, type IsoDate } from './dates';           
       8 +import { divideRoundingUp, isWholeNumber } from './numbers';   
       9 +import { err, ok, type Result } from './result';               
      10 +import { TIGHT_PERCENT, WORKING_DAY_MINUTES } from './rules';  
      11 +import { countWorkingDays, nthWorkingDay, type WorkingDays } fr
         +om './workingDays';                                            
      12 
      13  export interface LearnerInput {
      14    today: IsoDate;
     ...
       48    | 'due-date-in-past'
       49    | 'no-working-days-left';
       50 
       51 -/** S-3 AC-1 to AC-4, compared in whole numbers. */           
       51 +/** S-3 AC-1 to AC-4, compared in whole numbers: needed ≤ 80% 
          +of spare is On track. */                                      
       52  export function paceStatus(neededPerDay: number, spareMinutesP
           erDay: number): PaceStatus {
       53 -  throw new Error(`paceStatus not implemented (${neededPerDay}
          -, ${spareMinutesPerDay})`);                                   
       53 +  if (neededPerDay * 100 <= spareMinutesPerDay * TIGHT_PERCENT
          +) return 'on-track';                                          
       54 +  if (neededPerDay <= spareMinutesPerDay) return 'tight';     
       55 +  return 'late';                                              
       56  }
       57 
       58  export function calculateLearner(input: LearnerInput): Result<
           LearnerResult, LearnerError> {
       57 -  throw new Error(`calculateLearner not implemented (${input.t
          -oday})`);                                                     
       59 +  const { today, dueDate, workingDays, totalMinutes, doneMinut
          +es, spareMinutesPerDay } = input;                             
       60 +                                                              
       61 +  // The form parser rejects these first; the engine still ref
          +uses them (S-5 AC-1).                                         
       62 +  if (                                                        
       63 +    !isWholeNumber(totalMinutes) ||                           
       64 +    totalMinutes === 0 ||                                     
       65 +    !isWholeNumber(doneMinutes) ||                            
       66 +    (spareMinutesPerDay !== null && !isWholeNumber(spareMinute
          +sPerDay))                                                     
       67 +  ) {                                                         
       68 +    return err('invalid-input');                              
       69 +  }                                                           
       70 +                                                              
       71 +  // S-5 AC-3: the first matching check wins, in this order.  
       72 +  if (doneMinutes > totalMinutes) return err('done-over-total'
          +);                                                            
       73 +  if (doneMinutes === totalMinutes) return ok({ kind: 'complet
          +e' });                                                        
       74 +  if (workingDays.size === 0) return err('no-working-days-sele
          +cted');                                                       
       75 +  if (toDayNumber(dueDate) < toDayNumber(today)) return err('d
          +ue-date-in-past');                                            
       76 +  const workingDaysLeft = countWorkingDays(today, dueDate, wor
          +kingDays);                                                    
       77 +  if (workingDaysLeft === 0) return err('no-working-days-left'
          +);                                                            
       78 +                                                              
       79 +  const remainingMinutes = totalMinutes - doneMinutes;        
       80 +  const neededPerDay = divideRoundingUp(remainingMinutes, work
          +ingDaysLeft);                                                 
       81 +                                                              
       82 +  return ok({                                                 
       83 +    kind: 'plan',                                             
       84 +    remainingMinutes,                                         
       85 +    workingDaysLeft,                                          
       86 +    neededPerDay,                                             
       87 +    moreThanAWorkingDay: neededPerDay > WORKING_DAY_MINUTES,  
       88 +    pace:                                                     
       89 +      spareMinutesPerDay === null                             
       90 +        ? null                                                
       91 +        : paceFor({ today, workingDays, remainingMinutes, work
          +ingDaysLeft, neededPerDay, spareMinutesPerDay }),             
       92 +  });                                                         
       93  }
       94 +                                                              
       95 +function paceFor(p: {                                         
       96 +  today: IsoDate;                                             
       97 +  workingDays: WorkingDays;                                   
       98 +  remainingMinutes: number;                                   
       99 +  workingDaysLeft: number;                                    
      100 +  neededPerDay: number;                                       
      101 +  spareMinutesPerDay: number;                                 
      102 +}): Pace {                                                    
      103 +  const status = paceStatus(p.neededPerDay, p.spareMinutesPerD
          +ay);                                                          
      104 +  if (status !== 'late') return { status };                   
      105 +                                                              
      106 +  // S-3 AC-6: with no time at all there is no finish date to 
          +show.                                                         
      107 +  if (p.spareMinutesPerDay === 0) return { status: 'late', fin
          +ish: null };                                                  
      108 +                                                              
      109 +  // S-3 AC-5: at the spare pace, the work ends on this workin
          +g day, counting from today.                                   
      110 +  const workingDaysToFinish = divideRoundingUp(p.remainingMinu
          +tes, p.spareMinutesPerDay);                                   
      111 +  const date = nthWorkingDay(p.today, workingDaysToFinish, p.w
          +orkingDays);                                                  
      112 +  return {                                                    
      113 +    status: 'late',                                           
      114 +    // nthWorkingDay can't return null here (n ≥ 1 and days ar
          +e selected); null keeps it total.                             
      115 +    finish: date === null ? null : { date, workingDaysLate: wo
          +rkingDaysToFinish - p.workingDaysLeft },                      
      116 +  };                                                          
      117 +}                                                             

⏺ Write(src/lib/admin.ts)
  ⎿  Added 41 lines, removed 6 lines
       3   *
       4   * Pure: `today` is passed in, nothing reads the clock (D-4), a
          nd nothing
       5   * throws. Every outcome is a Result.
       6 - *                                                             
       7 - * RED PHASE: types and signatures only.                       
       6   */
       9 -import type { IsoDate } from './dates';                        
      10 -import type { Result } from './result';                        
      11 -import type { WorkingDays } from './workingDays';              
       7 +import { toDayNumber, type IsoDate } from './dates';           
       8 +import { divideRoundingUp, isWholeNumber } from './numbers';   
       9 +import { err, ok, type Result } from './result';               
      10 +import { TIGHT_PERCENT } from './rules';                       
      11 +import { nthWorkingDay, type WorkingDays } from './workingDays'
         +;                                                              
      12 
      13  export interface AdminInput {
      14    today: IsoDate;
     ...
      40  export type AdminError = 'invalid-input' | 'no-working-days-sel
          ected' | 'start-date-in-past';
      41 
      42  export function calculateAdmin(input: AdminInput): Result<Admin
          Result, AdminError> {
      43 -  throw new Error(`calculateAdmin not implemented (${input.toda
         -y})`);                                                         
      43 +  const { today, startDate, workingDays, courseMinutes, dailyMi
         +nutes } = input;                                               
      44 +                                                               
      45 +  // The form parser rejects these first; the engine still refu
         +ses them (S-5 AC-1).                                           
      46 +  if (!isWholeNumber(courseMinutes) || courseMinutes === 0 || !
         +isWholeNumber(dailyMinutes)) {                                 
      47 +    return err('invalid-input');                               
      48 +  }                                                            
      49 +                                                               
      50 +  // S-5 AC-3: the first matching check wins, in this order.   
      51 +  if (workingDays.size === 0) return err('no-working-days-selec
         +ted');                                                         
      52 +  if (toDayNumber(startDate) < toDayNumber(today)) return err('
         +start-date-in-past');                                          
      53 +  if (dailyMinutes === 0) return ok({ kind: 'no-time' });      
      54 +                                                               
      55 +  // S-4 AC-2: as fast as the daily time allows.               
      56 +  const earliest = dueDateAtPace(startDate, workingDays, course
         +Minutes, dailyMinutes);                                        
      57 +  // Unreachable: the checks above guarantee a date. Kept so th
         +e function is total.                                           
      58 +  if (earliest === null) return err('invalid-input');          
      59 +                                                               
      60 +  // S-4 AC-3: the learner's On track rule, so at most 80% of t
         +he daily time.                                                 
      61 +  const recommendedPace = Math.floor((dailyMinutes * TIGHT_PERC
         +ENT) / 100);                                                   
      62 +  const recommended =                                          
      63 +    recommendedPace === 0 ? null : dueDateAtPace(startDate, wor
         +kingDays, courseMinutes, recommendedPace);                     
      64 +                                                               
      65 +  return ok({ kind: 'dates', earliest, recommended });         
      66  }
      67 +                                                               
      68 +/** The first date by which `courseMinutes` fit at no more than
         + `pace` minutes per working day. */                            
      69 +function dueDateAtPace(                                        
      70 +  startDate: IsoDate,                                          
      71 +  workingDays: WorkingDays,                                    
      72 +  courseMinutes: number,                                       
      73 +  pace: number,                                                
      74 +): DueDateOption | null {                                      
      75 +  const workingDayCount = divideRoundingUp(courseMinutes, pace)
         +;                                                              
      76 +  const date = nthWorkingDay(startDate, workingDayCount, workin
         +gDays);                                                        
      77 +  if (date === null) return null;                              
      78 +  return { date, workingDayCount, minutesPerDay: divideRounding
         +Up(courseMinutes, workingDayCount) };                          
      79 +}                                                              

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "===
      typecheck ===" && npx tsc --noEmit && echo "types OK"; echo "=== npm test
      ===" && npm tes…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 167 tests pass under npm test, including the UTC+14 and UTC−10 runs; next
  I'm planting six bugs, each breaking a documented promise, to confirm the
  tests catch them. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut2 && mk…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ All six planted bugs are caught, and I'm updating the verification doc so
  engine rows read "pass" while UI-dependent rows stay "not run" and a few mixed
  rows get split before I commit. · summary

⏺ Write(docs/verification.md)
  ⎿  Added 46 lines, removed 16 lines
      2 
      3  How each acceptance criterion in [user-stories.md](user-stories.
         md) is checked, and the result.
      4 
      5 -> **Status: nothing has been built or run yet.** This file is fi
        -lled in during the review phase. A row says                     
      6 -> "pass" only after the test or manual check has actually been r
        -un.                                                             
      5 +> **Status: the calculation engine (`src/lib/`) is built and tes
        +ted. The form parser and the UI are not built                   
      6 +> yet.** A row says "pass" only after the test or manual check h
        +as actually been run.                                           
      7 
      8  ## How to run
      9 
     ...
      18 
      19  | Criterion | Test file | Status |
      20  |---|---|---|
      21 -| S-1 AC-1 to AC-6 | `src/lib/learner.test.ts` | not run |     
      22 -| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | 
         -not run |                                                      
      23 -| S-5 date rules, D-4, D-9, D-11 | `src/lib/dates.test.ts` | no
         -t run |                                                        
      24 -| S-2 AC-1, AC-2 | `src/components/WorkingDaysPicker.test.tsx` 
         -| not run |                                                    
      25 -| S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts` | not run | 
      26 -| S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | not run |     
      27 -| S-4 AC-1 to AC-5 | `src/lib/admin.test.ts` | not run |       
      28 -| S-4 AC-6 (rules across both roles) | `src/lib/admin.test.ts` 
         -| not run |                                                    
      29 -| S-5 input rules | `src/lib/parse.test.ts` | not run |        
      30 -| S-5 AC-1, AC-3, AC-5 | `src/lib/learner.test.ts`, `src/lib/ad
         -min.test.ts` | not run |                                       
      31 -| S-5 AC-2, AC-4, AC-6 | `src/components/App.test.tsx` | not ru
         -n |                                                            
      21 +| S-1 AC-1 to AC-4, AC-6 | `src/lib/learner.test.ts` | pass |  
      22 +| S-1 AC-5 (times shown in hours and minutes) | `src/lib/format
         +.test.ts` | not run |                                          
      23 +| S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` | 
         +pass |                                                         
      24 +| S-2 AC-1, AC-2 (presets and matching) | `src/lib/workingDays.
         +test.ts` | pass |                                              
      25 +| S-2 AC-1, AC-2 (the picker on screen) | `src/components/Worki
         +ngDaysPicker.test.tsx` | not run |                             
      26 +| S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts`, `src/lib/le
         +arner.test.ts` | pass |                                        
      27 +| S-2 AC-6 (label text) | `src/lib/workingDays.test.ts` | pass 
         +|                                                              
      28 +| S-2 AC-6 (label in the result sentence) | `src/components/App
         +.test.tsx` | not run |                                         
      29 +| S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | pass |        
      30 +| S-3 AC-3 (Late exactly when spare × working days left < remai
         +ning, swept) | `src/lib/learner.test.ts` | pass |              
      31 +| S-4 AC-1 (start date is today by default) | `src/components/A
         +pp.test.tsx` | not run |                                       
      32 +| S-4 AC-2 to AC-5 | `src/lib/admin.test.ts` | pass |          
      33 +| S-4 AC-6 (rules across both roles, all 127 working-day choice
         +s) | `src/lib/admin.test.ts` | pass |                          
      34 +| S-5 input rules (numbers) | `src/lib/parse.test.ts` | not run
         + |                                                             
      35 +| S-5 input rules (a real calendar date) | `src/lib/dates.test.
         +ts` | pass |                                                   
      36 +| S-5 AC-1, AC-3, AC-5 (engine) | `src/lib/learner.test.ts`, `s
         +rc/lib/admin.test.ts` | pass |                                 
      37 +| S-5 AC-1, AC-2, AC-4, AC-6, AC-7 (on screen) | `src/component
         +s/App.test.tsx` | not run |                                    
      38  | S-6 AC-1, AC-3 to AC-5 | `src/components/App.test.tsx` | not
          run |
      39 +| D-4, D-9, D-11 | `src/lib/dates.test.ts` | pass |            
      40  | Engine never reads the clock | `src/lib/noClock.test.ts` | no
          t run |
      34 -| Same results in every time zone | `npm run test:tz` | not run
         - |                                                             
      35 -| Fast working-day count matches a day-by-day count (all 127 we
         -ekday sets) | `src/lib/workingDays.test.ts` | not run |        
      41 +| Same results in every time zone | `npm run test:tz` | pass (e
         +ngine tests) |                                                 
      42 +| Fast working-day count matches a day-by-day count (all 127 we
         +ekday sets) | `src/lib/workingDays.test.ts` | pass |           
      43 
      44 +## Planted-bug checks                                          
      45 +                                                               
      46 +To check that the tests can fail, each bug below was put into t
         +he code on its own, the suite was run, and the                 
      47 +file was restored.                                             
      48 +                                                               
      49 +| Planted bug | Tests that failed |                            
      50 +|---|---|                                                      
      51 +| 2000 not treated as a leap year | 2 |                        
      52 +| One leftover day counted too many in `countWorkingDays` | 7 |
      53 +| One week too many skipped in `nthWorkingDay` | 3 (before the 
         +fix, this froze the run: see below) |                          
      54 +| Exactly 80% counted as Tight instead of On track | 4 |       
      55 +| Exactly 100% counted as Late instead of Tight | 4 |          
      56 +| Minutes rounded to the nearest instead of up | 6 |           
      57 +| Working days late off by one | 3 |                           
      58 +| Recommended date at 100% of the daily time instead of 80% | 4
         + |                                                             
      59 +| Admin working days rounded down, giving a date that can't be 
         +met | 4 |                                                      
      60 +                                                               
      61 +The `nthWorkingDay` bug first sent the function into an endless
         + loop. Its last step is now capped at 7 days, so a             
      62 +mistake there fails a test instead of freezing the page.       
      63 +                                                               
      64  ## Manual checks
      65 
      66  | Check | Status |
     ...
      72 
      73  ## Known limits
      74 
      48 -Filled in after the review phase.                              
      75 +- The 80% check uses whole numbers (S-3 AC-4). No floating-poin
         +t version of it gave a wrong answer for any spare              
      76 +  time from 1 to 480, so this is a safeguard rather than a fix 
         +for a bug that was seen.                                       
      77 +                                                               
      78 +More are added after the review phase.                         

⏺ Bash(git add src/lib docs/verification.md && git status --short && git commit
      -q -F - <<'EOF'
      Implement the learner and admin calculations; all 167 tests pass…)
  ⎿  (No output)

⏺ learner.ts and admin.ts are built and committed, tests first as before. All
  167 tests pass, including under UTC+14 and UTC−10.

  57ae4ce Implement the learner and admin calculations; all 167 tests pass
  22512ea Add failing tests for the learner and admin calculations

  Red: 70 new tests: 47 for the learner, 23 for the admin. All 70 failed. I
  checked each failure with vitest's JSON output, and every one was the "not
  implemented" error from a stub. The 97 earlier tests kept passing.

  Green: everything passes, and the type check is clean. Besides each worked
  example in the docs, two sweeps check the promises from docs/app-roles.md
  directly:
  - Learner: the status is Late exactly when spare minutes × working days left
    is less than the time remaining. That is checked for every combination of
    due dates, amounts and spare times in the sweep. Whenever it is Late, the
    finish date falls after the due date and the working days late add up.
  - Admin: this covers all 127 working-day choices, every start weekday, and a
    range of course and daily times. In each case a learner given the earliest
    date is not Late, one working day earlier is Late, and the recommended date
    is On track.

  Planted bugs: all six were caught:

  ┌────────────────────────────────────────────────────────┬────────────────┐
  │                      Planted bug                       │  Tests that    │
  │                                                        │     failed     │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Exactly 80% counted as Tight                           │ 4              │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Exactly 100% counted as Late                           │ 4              │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Minutes rounded to the nearest instead of up           │ 6              │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Working days late off by one                           │ 3              │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Recommended date at 100% instead of 80%                │ 4              │
  ├────────────────────────────────────────────────────────┼────────────────┤
  │ Admin working days rounded down, giving a date that    │ 4              │
  │ can't be met                                           │                │
  └────────────────────────────────────────────────────────┴────────────────┘

  Two things I found along the way
  - A flaw in the tests. When a sweep test failed, vitest shortened the message
    to expected [ …(5) ], which hid which cases broke. Every sweep now prints
    its first five failing cases.
  - The whole-number 80% check is a safeguard, not a fix. I looked for a spare
    time from 1 to 480 where a floating-point version of the check gives the
    wrong answer, and found none. So the tests check the exact boundaries and
    don't claim a float bug. I recorded this under "Known limits" in
    docs/verification.md.

  Other changes
  - Shared modules. I added rules.ts (src/lib/rules.ts), which holds the 80%
    threshold, the 480-minute cap and the 5-year limit, each in one place. I
    also added numbers.ts (src/lib/numbers.ts) with the round-up division both
    modules share.
  - docs/verification.md. The engine rows now say "pass", with the table of all
    nine planted bugs. Rows that depend on the UI still say "not run". I split
    rows that mixed the two, such as S-4 AC-1 "start date is today by default",
    which only the form can show.

  Next in the plan: parse.ts, which turns form text into checked numbers,
  messages.ts with the exact error wording from the docs, and the test that
  fails if anything in src/lib/ reads the clock. After that comes the UI. Should
  I go ahead, using the same tests-first pattern?

❯ good, the sweeps proving the two promises from app-roles is exactly what i
  wanted
  go ahead with parse.ts, messages.ts and the clock guard test, same pattern
  tests first

  keep an eye on time, after that go straight to the ui because that's where
  i'll test everything by hand in the browser
  keep the ui simple first and get every story working before any extra polish

⏺ I'll do parse.ts, messages.ts and the clock guard red then green, then build
  the UI with the same pattern, and stop there so you can test in the browser.

  Some decisions for parsing and copy first. I'll add them to the docs so the
  tests can cite them:
  - Number fields are plain text fields with a numeric keyboard, not
    type="number". Browsers' number fields hide what was typed: 1e3 comes
    through as 1000 and letters come through as blank. The app then couldn't say
    "Use whole numbers only."
  - Arabic-Indic digits (١٥) are accepted. For a MENA audience, someone typing
    on an Arabic keyboard shouldn't be told "15" isn't a number.
  - Errors from the S-5 AC-3 checks are also shown in the result area. That area
    is the live region, so screen readers announce them.

  Searched for 1 pattern (ctrl+o to expand)

⏺ Update(docs/user-stories.md)
  ⎿  Added 1 line
      133  | Due date before today | due date | The due date is in the pa
           st. Pick today or a later date. |
      134  | No working days from today to the due date | result | There
           are no working days between today and the due date. Pick a lat
           er date or add working days. |
      135  | Admin start date before today | start date | The start date
           can't be before today. |
      136 +| The engine gets an impossible number (a parser bug; should n
          +ever be seen) | result | Something in the form isn't valid. Ch
          +eck the fields above. |                                       
      137 
      138  ### Acceptance criteria
      139 

⏺ Update(docs/user-stories.md)
  ⎿  Added 2 lines
      161  - **AC-3** The result area is a live region (`role="status"`,
           polite), so screen readers announce changes to it.
      162  - **AC-4** A field with an error has `aria-invalid="true"`, an
           d its message is linked with `aria-describedby`.
      163  - **AC-5** The Learner/Admin switch works with the keyboard an
           d shows which role is selected.
      164 +- **AC-6** An error from the checks in S-5 AC-3 is shown next 
          +to its field and repeated in the result area, so              
      165 +  screen readers announce it.                                 
      166 
      167  ## S-7 (STRETCH): English / Arabic
      168 

⏺ Update(docs/user-stories.md)
  ⎿  Added 2 lines
      196  | D-10 | No public holidays in v1 | They differ by country and
            year. Saying so is better than guessing wrong. |
      197  | D-11 | Dates are shown as "Thu 3 Dec 2026" | "12/03" means d
           ifferent dates in different countries. |
      198  | D-12 | Mon–Fri is the default, and every result names the wo
           rking days it used | MENA is mixed: Saudi Arabia's weekend is
           Fri–Sat, while the UAE and Tunisia have Sat–Sun. No default fi
           ts everyone, so the result makes the choice visible. |
      199 +| D-13 | Arabic-Indic digits (١٥, ۱۵) are accepted in number f
          +ields | Someone typing on an Arabic keyboard shouldn't be told
          + that 15 is not a number. |                                   
      200 +| D-14 | Number fields are text fields with a numeric keyboard
          +, not `type="number"` | Browser number fields hide what was ty
          +ped: "1e3" arrives as 1000 and letters arrive as blank. The ap
          +p then couldn't say what is wrong. |                          

⏺ Write(src/lib/parse.ts)
  ⎿  Wrote 84 lines to src/lib/parse.ts
       1 /**
       2  * Form text → checked engine input, or every field error at onc
         e (S-5).
       3  *
       4  * Only checks one field at a time (format and limits). Checks t
         hat compare
       5  * fields, or compare with today, belong to the engine, in the S
         -5 AC-3 order.
       6  *
       7  * RED PHASE: types and signatures only.
     … +77 lines (ctrl+o to expand)

⏺ Write(src/lib/messages.ts)
  ⎿  Wrote 32 lines to src/lib/messages.ts
       1 /**
       2  * Every fixed piece of text the user reads, in one place (and t
         he one file to
       3  * translate for S-7). The wording is the contract in docs/user-
         stories.md;
       4  * messages.test.ts checks each message appears there word for w
         ord.
       5  *
       6  * RED PHASE: the shapes are real, the text is not filled in.
       7  */
     … +25 lines (ctrl+o to expand)

⏺ Write(src/lib/format.ts)
  ⎿  Wrote 28 lines to src/lib/format.ts
       1 /**
       2  * Numbers and dates turned into the result sentences (S-1 AC-5,
          S-2 AC-6, S-3 AC-5, S-4).
       3  *
       4  * RED PHASE: signatures only.
       5  */
       6 import type { DueDateOption } from './admin';
       7 import type { IsoDate } from './dates';
       8 import type { WorkingDays } from './workingDays';
       9
     … +19 lines (ctrl+o to expand)

⏺ Now the four test files.

⏺ Write(src/lib/parse.test.ts)
  ⎿  Wrote 209 lines to src/lib/parse.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import {
       3   parseAdminForm,
       4   parseLearnerForm,
       5   parseWholeNumber,
       6   type AdminFormText,
       7   type FieldError,
       8   type LearnerFormText,
       9 } from './parse';
      10 import type { Result } from './result';
     … +199 lines (ctrl+o to expand)

⏺ Write(src/lib/messages.test.ts)
  ⎿  Wrote 63 lines to src/lib/messages.test.ts
       1 import { readFileSync } from 'node:fs';
       2 import { describe, expect, it } from 'vitest';
       3 import { CALC_ERROR_PLACE, CALC_ERROR_TEXT, FIELD_ERROR_TEXT, ST
         ATUS_LABEL, TEXT, type CalcError } from './messages';
       4 import type { FieldErrorCode } from './parse';
       5
       6 const userStories = readFileSync(new URL('../../docs/user-storie
         s.md', import.meta.url), 'utf8');
       7
       8 const FIELD_CODES: FieldErrorCode[] = [
     … +55 lines (ctrl+o to expand)

⏺ Write(src/lib/format.test.ts)
  ⎿  Wrote 65 lines to src/lib/format.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import { adminOptionSentence, formatMinutes, lateSentence, learn
         erPlanSentence } from './format';
       3 import { days, iso } from './test-helpers';
       4 import { PRESETS } from './workingDays';
       5
       6 const { monFri, sunThu } = PRESETS;
       7
       8 describe('formatMinutes', () => {
       9   it.each([
     … +56 lines (ctrl+o to expand)

⏺ Write(src/lib/noClock.test.ts)
  ⎿  Wrote 32 lines to src/lib/noClock.test.ts
       1 import { readdirSync, readFileSync } from 'node:fs';
       2 import { describe, expect, it } from 'vitest';
       3
       4 /**
       5  * D-4: the calculation engine never reads the clock. "Today" is
          always passed in,
       6  * so every result is the same on any machine, on any day, in an
         y time zone.
       7  * This reads the source of every engine file and fails on anyth
         ing that reads the time.
     … +25 lines (ctrl+o to expand)
⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npx vitest run --reporter=json
      --outputFile=/private/tmp/claud…)
  ⎿  (No output)

⏺ The 94 new tests fail as expected, and the clock guard's 12 passing tests need
  checking, so I'm planting a clock read in two files to confirm the guard
  catches it. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut3 && mk…)
  ⎿  (No output)

⏺ Bash(git add docs src/lib && git status --short && git commit -q -F - <<'EOF'
      Add failing tests for form parsing, messages and result sentences…)
  ⎿  (No output)

⏺ Red commit b6a69f3 is in. Now the implementation: the parser, the message text
  copied from the docs, and the sentence formatting.

⏺ Bash(python3 - <<'PY'
      import re…)
  ⎿  (No output)

⏺ Write(src/lib/messages.ts)
  ⎿  Added 77 lines, removed 16 lines
      1  /**
      2   * Every fixed piece of text the user reads, in one place (and t
         he one file to
      3 - * translate for S-7). The wording is the contract in docs/user-
        -stories.md;                                                     
      4 - * messages.test.ts checks each message appears there word for w
        -ord.                                                            
      5 - *                                                              
      6 - * RED PHASE: the shapes are real, the text is not filled in.   
      3 + * translate for S-7, with the sentences in format.ts). The word
        +ing is the                                                      
      4 + * contract in docs/user-stories.md; messages.test.ts checks eac
        +h message                                                       
      5 + * appears there word for word.                                 
      6   */
      7  import type { AdminError } from './admin';
      8  import type { LearnerError, PaceStatus } from './learner';
     ...
      10 
      11  export type CalcError = LearnerError | AdminError;
      12 
      14 -export const FIELD_ERROR_TEXT = {} as Readonly<Record<FieldErro
         -rCode, string>>;                                               
      13 +export const FIELD_ERROR_TEXT: Readonly<Record<FieldErrorCode, 
         +string>> = {                                                   
      14 +  required: 'Enter a number.',                                 
      15 +  negative: "Can't be negative.",                              
      16 +  'not-whole': 'Use whole numbers only.',                      
      17 +  'minutes-over-59': 'Minutes must be 0–59.',                  
      18 +  'hours-over-max': 'Must be 999 hours or less.',              
      19 +  'per-day-over-max': 'Must be 480 minutes (8 hours) or less.',
      20 +  'total-zero': 'Total time must be more than 0.',             
      21 +  'date-invalid': 'Enter a valid date.',                       
      22 +  'date-too-far': 'Pick a date within 5 years of today.',      
      23 +};                                                             
      24 
      16 -export const CALC_ERROR_TEXT = {} as Readonly<Record<CalcError,
         - string>>;                                                     
      25 +export const CALC_ERROR_TEXT: Readonly<Record<CalcError, string
         +>> = {                                                         
      26 +  'invalid-input': "Something in the form isn't valid. Check th
         +e fields above.",                                              
      27 +  'done-over-total': "Time done can't be more than the total ti
         +me.",                                                          
      28 +  'no-working-days-selected': 'Select at least one working day.
         +',                                                             
      29 +  'due-date-in-past': 'The due date is in the past. Pick today 
         +or a later date.',                                             
      30 +  'no-working-days-left':                                      
      31 +    'There are no working days between today and the due date. 
         +Pick a later date or add working days.',                       
      32 +  'start-date-in-past': "The start date can't be before today."
         +,                                                              
      33 +};                                                             
      34 
      35  /** Where each engine error is shown (S-5 messages table). It i
          s also repeated in the result area (S-6 AC-6). */
      19 -export const CALC_ERROR_PLACE = {} as Readonly<Record<CalcError
         -, FieldId | 'result'>>;                                        
      36 +export const CALC_ERROR_PLACE: Readonly<Record<CalcError, Field
         +Id | 'result'>> = {                                            
      37 +  'invalid-input': 'result',                                   
      38 +  'done-over-total': 'done',                                   
      39 +  'no-working-days-selected': 'workingDays',                   
      40 +  'due-date-in-past': 'dueDate',                               
      41 +  'no-working-days-left': 'result',                            
      42 +  'start-date-in-past': 'startDate',                           
      43 +};                                                             
      44 
      21 -export const STATUS_LABEL = {} as Readonly<Record<PaceStatus, s
         -tring>>;                                                       
      45 +/** S-3 AC-8: the status is always a word. */                  
      46 +export const STATUS_LABEL: Readonly<Record<PaceStatus, string>>
         + = {                                                           
      47 +  'on-track': 'On track',                                      
      48 +  tight: 'Tight',                                              
      49 +  late: 'Late',                                                
      50 +};                                                             
      51 
      52 +export const STATUS_DETAIL: Readonly<Record<'on-track' | 'tight
         +', string>> = {                                                
      53 +  'on-track': 'You need 80% or less of your spare time.',      
      54 +  tight: 'You need more than 80% of your spare time, so one bad
         + day could make you late.',                                    
      55 +};                                                             
      56 +                                                               
      57  export const TEXT = {
      24 -  learnerEmpty: '',                                            
      25 -  adminEmpty: '',                                              
      26 -  alreadyComplete: '',                                         
      27 -  moreThanAWorkingDay: '',                                     
      28 -  noSpareTime: '',                                             
      29 -  adminNoTime: '',                                             
      30 -  noRecommended: '',                                           
      31 -  recommendedExplainer: '',                                    
      58 +  learnerEmpty: 'Enter your training to see your daily pace.', 
      59 +  adminEmpty: 'Enter your course to see the earliest due date.'
         +,                                                              
      60 +  alreadyComplete: 'Already complete: nothing left to do.',    
      61 +  moreThanAWorkingDay: "That's more than a full working day.", 
      62 +  noSpareTime: "At 0 minutes a day you won't finish. Ask for le
         +arning time or a new due date.",                               
      63 +  adminNoTime: "At 0 minutes a day employees can't finish. Give
         + them learning time to get a due date.",                       
      64 +  noRecommended: 'Not available at 1 minute a day. Raise the da
         +ily time to get a date with a margin.',                        
      65 +  recommendedExplainer: 'Keeps the daily pace to 80% or less of
         + the time you give.',                                          
      66  };
      67 +                                                               
      68 +/** Labels and headings on the page. */                        
      69 +export const LABELS = {                                        
      70 +  appTitle: 'Khutwa',                                          
      71 +  appTagline: 'Training deadlines you can actually meet',      
      72 +  roleQuestion: 'I am',                                        
      73 +  roleLearner: 'a learner',                                    
      74 +  roleAdmin: 'an L&D admin',                                   
      75 +  totalTime: 'Total course time',                              
      76 +  doneTime: 'Time already done',                               
      77 +  courseTime: 'Course time',                                   
      78 +  hours: 'Hours',                                              
      79 +  minutes: 'Minutes',                                          
      80 +  dueDate: 'Due date',                                         
      81 +  startDate: 'Start date',                                     
      82 +  spare: 'Minutes you can spare per working day (optional)',   
      83 +  daily: 'Daily learning time employees get (minutes per workin
         +g day)',                                                       
      84 +  workingDays: 'Working days',                                 
      85 +  preset: 'Preset',                                            
      86 +  presetMonFri: 'Mon–Fri',                                     
      87 +  presetSunThu: 'Sun–Thu',                                     
      88 +  presetCustom: 'Custom',                                      
      89 +  result: 'Result',                                            
      90 +  earliest: 'Earliest due date',                               
      91 +  recommended: 'Recommended due date',                         
      92 +  noHolidays: 'Public holidays are not counted: remove them fro
         +m your plan yourself.',                                        
      93 +};                                                             

⏺ Write(src/lib/format.ts)
  ⎿  Added 11 lines, removed 8 lines
       1  /**
       2   * Numbers and dates turned into the result sentences (S-1 AC-5
          , S-2 AC-6, S-3 AC-5, S-4).
       3 - *                                                             
       4 - * RED PHASE: signatures only.                                 
       3   */
       4  import type { DueDateOption } from './admin';
       7 -import type { IsoDate } from './dates';                        
       8 -import type { WorkingDays } from './workingDays';              
       5 +import { formatDisplayDate, type IsoDate } from './dates';     
       6 +import { describeWorkingDays, type WorkingDays } from './workin
         +gDays';                                                        
       7 
       8  /** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 
          AC-5). */
       9  export function formatMinutes(minutes: number): string {
      12 -  throw new Error(`formatMinutes not implemented (${minutes})`)
         -;                                                              
      10 +  if (minutes < 60) return `${minutes} min`;                   
      11 +  const hours = Math.floor(minutes / 60);                      
      12 +  const rest = minutes % 60;                                   
      13 +  return `${minutes} min (${hours} h${rest === 0 ? '' : ` ${res
         +t} min`})`;                                                    
      14  }
      15 
      16 +const workingDayCount = (count: number) => `${count} working da
         +y${count === 1 ? '' : 's'}`;                                   
      17 +                                                               
      18  /** '15 min a day over 26 working days (Mon–Fri)' (S-2 AC-6). *
          /
      19  export function learnerPlanSentence(neededPerDay: number, worki
          ngDaysLeft: number, workingDays: WorkingDays): string {
      17 -  throw new Error(`learnerPlanSentence not implemented (${neede
         -dPerDay}, ${workingDaysLeft}, ${workingDays.size})`);          
      20 +  return `${formatMinutes(neededPerDay)} a day over ${workingDa
         +yCount(workingDaysLeft)} (${describeWorkingDays(workingDays)})`
         +;                                                              
      21  }
      22 
      23  /** "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working
           days late." (S-3 AC-5). */
      24  export function lateSentence(spareMinutesPerDay: number, finish
          Date: IsoDate, workingDaysLate: number): string {
      22 -  throw new Error(`lateSentence not implemented (${spareMinutes
         -PerDay}, ${finishDate}, ${workingDaysLate})`);                 
      25 +  return `At ${formatMinutes(spareMinutesPerDay)} a day you'll 
         +finish on ${formatDisplayDate(finishDate)}, ${workingDayCount(w
         +orkingDaysLate)} late.`;                                       
      26  }
      27 
      28  /** '5 working days (Mon–Fri) at 60 min a day' (S-4, S-2 AC-6).
           */
      29  export function adminOptionSentence(option: DueDateOption, work
          ingDays: WorkingDays): string {
      27 -  throw new Error(`adminOptionSentence not implemented (${optio
         -n.date}, ${workingDays.size})`);                               
      30 +  return `${workingDayCount(option.workingDayCount)} (${describ
         +eWorkingDays(workingDays)}) at ${formatMinutes(option.minutesPe
         +rDay)} a day`;                                                 
      31  }

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npm test 2>&1 | grep -E "×|FAIL|Test
      Files|Tests " | head -20;…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Five test failures, all from my own test mistakes rather than the code: one
  expectation ignored the spec's hours format, and four line-wrapped doc checks
  need whitespace collapsed before matching. I'm fixing the tests next.
  · summary

⏺ Bash(python3 - <<'PY'
      p='src/lib/messages.test.ts'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 273 pass, in all three time-zone runs. The doc check is new, so I'll plant
  bugs there and in the parser to confirm both can fail.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut4 && mk…)
  ⎿  (No output)
  ⎿  (timeout 3m 20s)

⏺ Bash(git add src/lib && git status --short && git commit -q -F - <<'EOF'
      Implement form parsing, messages and result sentences; 273 tests pass…)
  ⎿  (No output)

⏺ Engine side is committed at 8499ea6 with 273 tests passing. Next I'm writing
  the UI tests against a stub App, using only labels and roles. · summary

⏺ Write(src/App.test.tsx)
  ⎿  Wrote 260 lines to src/App.test.tsx
       1 // @vitest-environment jsdom
       2 import '@testing-library/jest-dom/vitest';
       3 import { cleanup, fireEvent, render, screen, within } from '@tes
         ting-library/react';
       4 import userEvent, { type UserEvent } from '@testing-library/user
         -event';
       5 import { afterEach, describe, expect, it } from 'vitest';
       6 import { App } from './App';
       7 import { CALC_ERROR_TEXT, FIELD_ERROR_TEXT, TEXT } from './lib/m
         essages';
     … +253 lines (ctrl+o to expand)

⏺ Write(src/today.test.ts)
  ⎿  Wrote 26 lines to src/today.test.ts
       1 import { afterEach, describe, expect, it, vi } from 'vitest';
       2 import { todayIso } from './today';
       3
       4 afterEach(() => {
       5   vi.useRealTimers();
       6 });
       7
       8 describe('todayIso: the one place the app reads the clock', () =
         > {
       9   // Built from local parts, so "just after midnight" is local m
     … +18 lines (ctrl+o to expand)

⏺ Bash(cat > src/App.tsx <<'EOF'
      // RED PHASE: renders nothing yet. App.test.tsx describes the page.…)
  ⎿  (No output)

⏺ The red state is as intended. All 31 UI tests fail: 26 can't find elements
  because App renders nothing, and 5 fail on the todayIso stub. The 273 engine
  tests still pass. Committing:

⏺ Bash(git add src tsconfig.json && git commit -q -F - <<'EOF'
      Add failing UI tests for both roles…)
  ⎿  (No output)

⏺ Red commit b96fb07 is in. Now the UI: small components, with each form
  recalculating from the raw text on every render. That makes recovery after an
  error automatic (S-5 AC-4).

⏺ Write(src/today.ts)
  ⎿  Added 8 lines, removed 3 lines
       1 -// RED PHASE: not built yet.                                   
       1  import type { IsoDate } from './lib/dates';
       2 
       4 -export function todayIso(now?: Date): IsoDate {                
       5 -  throw new Error(`todayIso not implemented (${String(now)})`);
       3 +/**                                                            
       4 + * The only place the app reads the clock (D-4): the device's l
         +ocal calendar date.                                            
       5 + * Built from local parts, never toISOString(), which gives the
         + UTC date and is a                                             
       6 + * day off for part of every day in most time zones.           
       7 + */                                                            
       8 +export function todayIso(now: Date = new Date()): IsoDate {    
       9 +  const pad = (value: number) => String(value).padStart(2, '0')
         +;                                                              
      10 +  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad
         +(now.getDate())}` as IsoDate;                                  
      11  }

⏺ Write(src/components/formState.ts)
  ⎿  Wrote 29 lines to src/components/formState.ts
       1 import { CALC_ERROR_PLACE, CALC_ERROR_TEXT, FIELD_ERROR_TEXT, ty
         pe CalcError } from '../lib/messages';
       2 import type { FieldError, FieldId } from '../lib/parse';
       3
       4 /** What the person typed, and which fields they have changed or
          left (S-5 AC-6). */
       5 export interface FormState<T> {
       6   text: T;
       7   touched: ReadonlySet<FieldId>;
       8 }
     … +21 lines (ctrl+o to expand)

⏺ Write(src/components/fields.tsx)  ⎿  Wrote 125 lines to src/components/fields.tsx
       1 import type { ReactNode } from 'react';
       2 import { LABELS } from '../lib/messages';
       3 import type { DurationText, FieldId } from '../lib/parse';
       4
       5 export const errorId = (id: string) => `${id}-error`;
       6
       7 const joinIds = (...ids: (string | null)[]) => ids.filter(Boolea
         n).join(' ') || undefined;
       8
       9 export function FieldMessage({ id, message }: { id: string; mess
     … +117 lines (~4 KB) (ctrl+o to expand)

⏺ Write(src/components/WorkingDaysPicker.tsx)
  ⎿  Wrote 53 lines to src/components/WorkingDaysPicker.tsx
       1 import { WEEKDAY_SHORT_NAMES, type Weekday } from '../lib/dates'
         ;
       2 import { LABELS } from '../lib/messages';
       3 import { PRESETS, presetFor, type WorkingDays } from '../lib/wor
         kingDays';
       4 import { FieldMessage, errorId } from './fields';
       5
       6 /** Week order from Monday, as in the result labels (S-2 AC-6).
         */
       7 const DAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];
     … +46 lines (ctrl+o to expand)

⏺ Write(src/components/LearnerForm.tsx)
  ⎿  Wrote 107 lines to src/components/LearnerForm.tsx
       1 import type { IsoDate } from '../lib/dates';
       2 import { formatMinutes, lateSentence, learnerPlanSentence } from
          '../lib/format';
       3 import { calculateLearner } from '../lib/learner';
       4 import { CALC_ERROR_TEXT, LABELS, STATUS_DETAIL, STATUS_LABEL, T
         EXT } from '../lib/messages';
       5 import { parseLearnerForm, type FieldId, type LearnerFormText }
         from '../lib/parse';
       6 import { DateField, DurationField, NumberField, ResultArea } fro
         m './fields';
     … +101 lines (ctrl+o to expand)

⏺ Write(src/components/AdminForm.tsx)
  ⎿  Wrote 98 lines to src/components/AdminForm.tsx
      1 import { calculateAdmin, type DueDateOption } from '../lib/admin'
        ;
      2 import { formatDisplayDate, type IsoDate } from '../lib/dates';
      3 import { adminOptionSentence } from '../lib/format';
      4 import { CALC_ERROR_TEXT, LABELS, TEXT } from '../lib/messages';
      5 import { parseAdminForm, type AdminFormText, type FieldId } from
        '../lib/parse';
      6 import type { WorkingDays } from '../lib/workingDays';
      7 import { DateField, DurationField, NumberField, ResultArea } from
         './fields';
     … +91 lines (ctrl+o to expand)

⏺ Write(src/App.tsx)
  ⎿  Added 59 lines, removed 3 lines
       1 -// RED PHASE: renders nothing yet. App.test.tsx describes the p
         -age.                                                           
       1 +import { useState } from 'react';                              
       2 +import { AdminForm } from './components/AdminForm';            
       3 +import type { FormState } from './components/formState';       
       4 +import { LearnerForm } from './components/LearnerForm';        
       5  import type { IsoDate } from './lib/dates';
       6 +import { LABELS } from './lib/messages';                       
       7 +import type { AdminFormText, LearnerFormText } from './lib/pars
         +e';                                                            
       8 +import { PRESETS } from './lib/workingDays';                   
       9 +import { todayIso } from './today';                            
      10 
       4 -export function App(_props: { today?: IsoDate }) {             
       5 -  return null;                                                 
      11 +type Role = 'learner' | 'admin';                               
      12 +                                                               
      13 +const ROLES: readonly { role: Role; label: string }[] = [      
      14 +  { role: 'learner', label: LABELS.roleLearner },              
      15 +  { role: 'admin', label: LABELS.roleAdmin },                  
      16 +];                                                             
      17 +                                                               
      18 +const zero = () => ({ hours: '0', minutes: '0' });             
      19 +                                                               
      20 +/**                                                            
      21 + * `today` is fixed in tests. In the browser it is read on ever
         +y render, so a page                                            
      22 + * left open past midnight uses the new day.                   
      23 + */                                                            
      24 +export function App({ today: fixedToday }: { today?: IsoDate })
         + {                                                             
      25 +  const today = fixedToday ?? todayIso();                      
      26 +  const [role, setRole] = useState<Role>('learner');           
      27 +                                                               
      28 +  // Both forms' state lives here, so switching role and back k
         +eeps what was typed.                                           
      29 +  const [learner, setLearner] = useState<FormState<LearnerFormT
         +ext>>(() => ({                                                 
      30 +    text: { total: zero(), done: zero(), dueDate: '', spare: ''
         +, workingDays: PRESETS.monFri },                               
      31 +    touched: new Set(),                                        
      32 +  }));                                                         
      33 +  const [admin, setAdmin] = useState<FormState<AdminFormText>>(
         +() => ({                                                       
      34 +    text: { course: zero(), startDate: today, daily: '', workin
         +gDays: PRESETS.monFri },                                       
      35 +    touched: new Set(),                                        
      36 +  }));                                                         
      37 +                                                               
      38 +  return (                                                     
      39 +    <main className="app">                                     
      40 +      <header>                                                 
      41 +        <h1>{LABELS.appTitle}</h1>                             
      42 +        <p className="tagline">{LABELS.appTagline}</p>         
      43 +      </header>                                                
      44 +                                                               
      45 +      <fieldset className="role-switch">                       
      46 +        <legend>{LABELS.roleQuestion}</legend>                 
      47 +        {ROLES.map(({ role: value, label }) => (               
      48 +          <label key={value}>                                  
      49 +            <input type="radio" name="role" value={value} check
         +ed={role === value} onChange={() => setRole(value)} />         
      50 +            {label}                                            
      51 +          </label>                                             
      52 +        ))}                                                    
      53 +      </fieldset>                                              
      54 +                                                               
      55 +      {role === 'learner' ? (                                  
      56 +        <LearnerForm state={learner} today={today} onChange={se
         +tLearner} />                                                   
      57 +      ) : (                                                    
      58 +        <AdminForm state={admin} today={today} onChange={setAdm
         +in} />                                                         
      59 +      )}                                                       
      60 +    </main>                                                    
      61 +  );                                                           
      62  }

⏺ Bash(cat > index.html <<'EOF'
      <!doctype html>…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 304 tests pass on the first run. I'll also run the time-zone suite and a
  production build, then plant three UI bugs to check the UI tests can fail too.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npm run
      test:tz 2>&1 | grep -E "=== TZ|Tests "; echo "=== build ==="; npm run
      build 2>&1 | tail -5…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The time-zone runs and the build both pass, and each of the three planted UI
  bugs is caught. Last check before handing over: npm run dev should start and
  serve the page.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && (npx vite
      --port 5179 --strictPort >
      /private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e…)
  ⎿  (No output)

⏺ The dev server starts cleanly and serves the page, and the App module
  compiles. I'll update docs/verification.md and commit.

⏺ Write(docs/verification.md)
  ⎿  Added 32 lines, removed 15 lines
      2 
      3  How each acceptance criterion in [user-stories.md](user-stories.
         md) is checked, and the result.
      4 
      5 -> **Status: the calculation engine (`src/lib/`) is built and tes
        -ted. The form parser and the UI are not built                   
      6 -> yet.** A row says "pass" only after the test or manual check h
        -as actually been run.                                           
      5 +> **Status: the engine and the UI are built, and every automated
        + check passes. The manual checks in the browser                 
      6 +> have not been done yet.** A row says "pass" only after the tes
        +t or manual check has actually been run.                        
      7 
      8  ## How to run
      9 
     ...
      19  | Criterion | Test file | Status |
      20  |---|---|---|
      21  | S-1 AC-1 to AC-4, AC-6 | `src/lib/learner.test.ts` | pass |
      22 -| S-1 AC-5 (times shown in hours and minutes) | `src/lib/format
         -.test.ts` | not run |                                          
      22 +| S-1 AC-4, AC-6 on screen | `src/App.test.tsx` | pass |       
      23 +| S-1 AC-5 (times shown in hours and minutes) | `src/lib/format
         +.test.ts` | pass |                                             
      24  | S-1 AC-6 (26 working days) | `src/lib/workingDays.test.ts` |
          pass |
      25  | S-2 AC-1, AC-2 (presets and matching) | `src/lib/workingDays.
          test.ts` | pass |
      25 -| S-2 AC-1, AC-2 (the picker on screen) | `src/components/Worki
         -ngDaysPicker.test.tsx` | not run |                             
      26 +| S-2 AC-1, AC-2 (the picker on screen) | `src/App.test.tsx` | 
         +pass |                                                         
      27  | S-2 AC-3 to AC-5 | `src/lib/workingDays.test.ts`, `src/lib/le
          arner.test.ts` | pass |
      27 -| S-2 AC-6 (label text) | `src/lib/workingDays.test.ts` | pass 
         -|                                                              
      28 -| S-2 AC-6 (label in the result sentence) | `src/components/App
         -.test.tsx` | not run |                                         
      28 +| S-2 AC-6 (label text and sentences) | `src/lib/workingDays.te
         +st.ts`, `src/lib/format.test.ts` | pass |                      
      29 +| S-2 AC-6 (label in the result on screen) | `src/App.test.tsx`
         + | pass |                                                      
      30  | S-3 AC-1 to AC-7 | `src/lib/learner.test.ts` | pass |
      31  | S-3 AC-3 (Late exactly when spare × working days left < remai
          ning, swept) | `src/lib/learner.test.ts` | pass |
      31 -| S-4 AC-1 (start date is today by default) | `src/components/A
         -pp.test.tsx` | not run |                                       
      32 -| S-4 AC-2 to AC-5 | `src/lib/admin.test.ts` | pass |          
      32 +| S-3 AC-1, AC-2, AC-5, AC-6 on screen | `src/App.test.tsx` | p
         +ass |                                                          
      33 +| S-3 AC-8 (status is a word) | `src/lib/messages.test.ts` | pa
         +ss |                                                           
      34 +| S-4 AC-1 (start date is today by default) | `src/App.test.tsx
         +` | pass |                                                     
      35 +| S-4 AC-2 to AC-5 | `src/lib/admin.test.ts`, `src/App.test.tsx
         +` | pass |                                                     
      36  | S-4 AC-6 (rules across both roles, all 127 working-day choice
          s) | `src/lib/admin.test.ts` | pass |
      34 -| S-5 input rules (numbers) | `src/lib/parse.test.ts` | not run
         - |                                                             
      35 -| S-5 input rules (a real calendar date) | `src/lib/dates.test.
         -ts` | pass |                                                   
      37 +| S-5 input rules | `src/lib/parse.test.ts`, `src/lib/dates.tes
         +t.ts` | pass |                                                 
      38 +| S-5 messages are the docs' wording, word for word | `src/lib/
         +messages.test.ts` | pass |                                     
      39  | S-5 AC-1, AC-3, AC-5 (engine) | `src/lib/learner.test.ts`, `s
          rc/lib/admin.test.ts` | pass |
      37 -| S-5 AC-1, AC-2, AC-4, AC-6, AC-7 (on screen) | `src/component
         -s/App.test.tsx` | not run |                                    
      38 -| S-6 AC-1, AC-3 to AC-5 | `src/components/App.test.tsx` | not 
         -run |                                                          
      40 +| S-5 AC-1, AC-2, AC-4 to AC-7 (on screen) | `src/App.test.tsx`
         + | pass |                                                      
      41 +| S-6 AC-1, AC-3 to AC-6 | `src/App.test.tsx` | pass |         
      42  | D-4, D-9, D-11 | `src/lib/dates.test.ts` | pass |
      40 -| Engine never reads the clock | `src/lib/noClock.test.ts` | no
         -t run |                                                        
      41 -| Same results in every time zone | `npm run test:tz` | pass (e
         -ngine tests) |                                                 
      43 +| D-4: engine never reads the clock | `src/lib/noClock.test.ts`
         + | pass |                                                      
      44 +| D-4: the app's one clock read gives the local date | `src/tod
         +ay.test.ts` | pass |                                           
      45 +| D-13: Arabic-Indic digits | `src/lib/parse.test.ts` | pass | 
      46 +| Same results in every time zone | `npm run test:tz` | pass (a
         +ll 304 tests, twice) |                                         
      47  | Fast working-day count matches a day-by-day count (all 127 we
          ekday sets) | `src/lib/workingDays.test.ts` | pass |
      48 +| Production build | `npm run build` | pass |                  
      49 
      50  ## Planted-bug checks
      51 
     ...
      63  | Working days late off by one | 3 |
      64  | Recommended date at 100% of the daily time instead of 80% | 4
           |
      65  | Admin working days rounded down, giving a date that can't be
          met | 4 |
      66 +| A message reworded away from the docs | 1 |                  
      67 +| Decimals like 1.5 accepted | 2 |                             
      68 +| 5-year date limit one day short | 1 |                        
      69 +| A total time of 0 accepted | 1 |                             
      70 +| `Date.now()` and `new Date()` added to two engine files | 2 (
         +the clock guard) |                                             
      71 +| Result area not a live region | 1 |                          
      72 +| Errors shown before a field is touched | 2 |                 
      73 +| An engine error not repeated in the result area | 3 |        
      74 
      75  The `nthWorkingDay` bug first sent the function into an endless
           loop. Its last step is now capped at 7 days, so a
      76  mistake there fails a test instead of freezing the page.
     ...
      79 
      80  | Check | Status |
      81  |---|---|
      82 +| Every story by hand in the browser (`npm run dev`) | not run 
         +|                                                              
      83  | S-6 AC-2: whole app with the keyboard only, focus always visi
          ble | not run |
      84  | S-6 AC-3: VoiceOver announces the result after an edit | not
          run |
      70 -| S-5 attack pass: paste, very long input, typing quickly while
         - errors show, switching role mid-error | not run |             
      85 +| S-5 attack pass: paste, very long input, typing quickly while
         + errors show, switching role mid-error | not run (role switch i
         +s covered by `src/App.test.tsx`) |                             
      86  | S-3 AC-8: statuses readable without colour (greyscale) | not
          run |
      87 
      88  ## Known limits
      89 
      90  - The 80% check uses whole numbers (S-3 AC-4). No floating-poin
          t version of it gave a wrong answer for any spare
      91    time from 1 to 480, so this is a safeguard rather than a fix
          for a bug that was seen.
      92 +- The admin start date is set to today when the page opens. If 
         +the page stays open past midnight, it shows "The               
      93 +  start date can't be before today." until the date is changed.
      94 
      95  More are added after the review phase.

⏺ Bash(git add -A && git status --short && git commit -q -F - <<'EOF'
      Build the UI for both roles; all 304 tests pass…)
  ⎿  (No output)

⏺ The app is ready for you to test in the browser. Parsing, messages and the
  clock guard went red then green, and so did the UI. Every story S-1 to S-6 is
  built and passes its automated tests: 304 in total, again under UTC+14 and
  UTC−10, and the production build works.

  d8955d7 Build the UI for both roles; all 304 tests pass
  b96fb07 Add failing UI tests for both roles
  8499ea6 Implement form parsing, messages and result sentences; 273 tests pass
  b6a69f3 Add failing tests for form parsing, messages and result sentences

  Running it

  Your shell's default Node (20.7, with Homebrew's npm) is the broken pairing
  from earlier, so switch to Node 22 first:

  cd ~/iheb-sebai-calculator
  nvm use          # reads .nvmrc, picks your installed 22.19
  npm run dev      # then open http://localhost:5173

  I started the dev server once and confirmed it serves the page without errors.
  I haven't looked at it in a browser; that is your manual pass.

  Quick cases to try

  ┌──────────────────────┬──────────────────────────────────────────────────┐
  │        Enter         │                  You should see                  │
  ├──────────────────────┼──────────────────────────────────────────────────┤
  │ 7 h 40 total, 1 h 10 │                                                  │
  │  done, due 31 Dec    │ 15 min a day over 26 working days (Mon–Fri)      │
  │ 2026                 │                                                  │
  ├──────────────────────┼──────────────────────────────────────────────────┤
  │ …then spare 30 / 18  │ On track / Tight / Late, finishing Mon 4 Jan     │
  │ / 14 / 0             │ 2027, 2 working days late / Late with the "ask   │
  │                      │ for learning time" message                       │
  ├──────────────────────┼──────────────────────────────────────────────────┤
  │ Admin: 5 h course,   │ Earliest Wed 2 Dec 2026, Recommended Fri 4 Dec   │
  │ 60 min a day         │ 2026                                             │
  ├──────────────────────┼──────────────────────────────────────────────────┤
  │ abc, 1.5, -3, 75     │ Each field's error, which clears when you fix it │
  │ minutes, a past date │                                                  │
  └──────────────────────┴──────────────────────────────────────────────────┘

  Typing abc into a time field and then fixing it is the quickest check that
  recovery after an error works.

  What these steps found

  - Two mistakes in my tests, not in the code. One test contradicted S-1 AC-5:
    "60 min" should be shown as "60 min (1 h)". The "word for word" check also
    failed because the Markdown wraps long lines. I fixed both tests and
    explained it in the commit.
  - The clock guard can fail. It passed from the start, because nothing reads
    the clock. When I planted Date.now() and new Date() in two engine files, it
    flagged both.
  - The UI tests catch bugs too. I planted three: removing the live region,
    showing errors before a field is touched, and leaving an engine error out of
    the result area. Each made tests fail.

  Decisions I made that you didn't explicitly approve

  All of them are in the docs:
  - Number fields are text fields with a numeric keyboard (D-14), so the app
    sees exactly what was typed and can say what's wrong with it.
  - Arabic-Indic digits like ١٥ are accepted (D-13).
  - An engine error, such as "due date in the past", appears next to its field
    and again in the result area, so screen readers announce it (S-6 AC-6).
  - I added two small lines to the result that aren't in the docs: the minutes
    left, and "Public holidays are not counted". The short On track and Tight
    explanations aren't in the docs either.

  Still to do

  - Your browser pass.
  - The manual rows in docs/verification.md: keyboard only, VoiceOver,
    greyscale, and the attack pass.
  - README, the session transcript, and S-7 if time allows.

  Tell me what you find in the browser and I'll fix it first.

❯ run it

⏺ Skill(run)
  ⎿  Loaded skill

⏺ Bash(d=$PWD; while :; do grep -Hm1 '^description:'
      "$d"/.claude/skills/*/SKILL.md 2>/dev/null; [ -e "$d/.git" ] || [ "$d" = /
      ] && break; d=$(dirname "$d"); done; ec…)
  ⎿  Error: Exit code 1
     (eval):1: no matches found:
     /Users/macmini/iheb-sebai-calculator/.claude/skills/*/SKILL.md

⏺ Bash(ls /Users/macmini/iheb-sebai-calculator/.claude 2>/dev/null || echo "no
      project .claude dir"; cat
      /private/tmp/claude-501/bundled-skills/2.1.332/cd4166658d00919…)
  ⎿  (No output)

⏺ No project skill covers this app, and the browser recipe's chromium-cli isn't
  installed, though Playwright's Chromium is cached here. I'm starting the dev
  server in the background so it stays up. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && lsof
      -ti:5173 -sTCP:LISTEN && echo "port 5173 busy" || exec npx vite --port
      5173 --strictPort)
  ⎿  Running in the background (↓ to manage)

⏺ Bash(for i in $(seq 1 60); do curl -sf -o /dev/null http://localhost:5173/ &&
      { echo "serving on :5173"; break; }; perl -e
      'select(undef,undef,undef,0.5)'; done; ls…)
  ⎿  (No output)
  ⎿  (timeout 1m)

⏺ The dev server is up at localhost:5173, and I'm installing playwright-core
  into the scratchpad to drive it, pinned to match the cached Chromium.
  · summary

⏺ Bash(D=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/driver && mkdir -p $D && cd $D && export
      PATH="$HOME/.nvm/versions/node…)
  ⎿  (No output)
⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && mkdir -p $S/drive $S/shots && cat > $S/drive/drive.mjs
      <<'EOF'
      // Dr…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ Every step works in a real browser and the console shows no errors. I'll look
  at the screenshots to check the layout too.

  Read 3 files (ctrl+o to expand)

⏺ The app is running at http://localhost:5173. I drove it in a headless Chromium
  through both roles, and every step gave the expected result with no console
  errors.

  ┌─────────────────────┬───────────────────────────────────────────────────┐
  │        Step         │                Result area showed                 │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ Fresh page          │ "Enter your training to see your daily pace."     │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ 7 h 40 total, 1 h   │ 15 min a day over 26 working days (Mon–Fri)       │
  │ 10 done, due 31 Dec │                                                   │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ Spare 14            │ Late: "At 14 min a day you'll finish on Mon 4 Jan │
  │                     │  2027, 2 working days late."                      │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ Spare 0             │ Late: "At 0 minutes a day you won't finish. Ask   │
  │                     │ for learning time or a new due date."             │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │                     │ Red border with "Use whole numbers only." under   │
  │ Hours abc           │ the field, and the result went back to the empty  │
  │                     │ state                                             │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ Hours fixed to 7,   │ Recovered: On track                               │
  │ spare 30            │                                                   │
  ├─────────────────────┼───────────────────────────────────────────────────┤
  │ Admin: 5 h at 60    │ Earliest Wed 2 Dec 2026, recommended Fri 4 Dec    │
  │ min a day           │ 2026 with the 80% line                            │
  └─────────────────────┴───────────────────────────────────────────────────┘

  I looked at the screenshots: the two-column layout, the red Late badge and the
  error styling all display correctly. The device date was Thu 26 Nov 2026, the
  same date the docs' examples use, so these numbers match them exactly. On
  another day the counts would change.

  One layout detail: in the working days box, "Sun" wraps onto its own line. I
  left it alone, since you asked for every story working before any polish.

  The server keeps running in the background while we work. Tell me when to stop
  it.

  Next time, /run-skill-generator could save this setup as a project skill. It
  needed two workarounds: Node 22 from nvm, and playwright-core 1.63.0 installed
  in the scratchpad to match the cached Chromium.

❯ i opened it, it works but it looks like a plain browser form and the result
  feels like an afterthought, the result is the most important thing on the
  page

  make it look like a real product, visual changes only, don't touch any
  calculation

  result is the hero: big number for minutes per day, coloured status chip on
  track / tight / late, finish date clearly visible
  learner / l&d admin as a two option segmented control instead of radios
  working days as 7 toggle buttons mon…sun and the presets as small buttons
  instead of the dropdown
  numbered sections 1 your training 2 deadline and working days 3 your time
  on mobile the result is at the very bottom, put it right after the main
  inputs or show a small summary at the top so people see the answer without
  scrolling
  keep all accessibility: labels, keyboard, visible focus, live region,
  contrast
  also two decisions

  the extra lines you added to the result (minutes left, public holidays not
  counted, the status explanations) keep them but add them to the docs, the
  docs must match exactly what's on screen
  arabic digits are accepted now so update s-9 status to match reality

⏺ I'll start by checking which parts of the current UI the tests and docs depend
  on, so the redesign keeps every behaviour and only changes the look.

  One correction first: S-9 in the docs is public holidays. Arabic is S-7
  (English/Arabic). I'll update S-7 to "partly done", since Arabic digits are
  accepted but there's no Arabic text or right-to-left layout.

  Plan:
  - Role switch and day toggles: they stay native radio buttons and checkboxes,
    styled as a segmented control and toggle buttons. Arrow keys, Space and
    screen-reader roles keep working as they do now.
  - Presets: become real buttons with aria-pressed.
  - Mobile summary: a short summary stays at the top of the screen. It's
    aria-hidden, so screen readers still announce the result once, from the live
    region.
  - Splitting the result for the hero layout: that needs small helpers in
    format.ts. They are text-only, and the calculation modules stay untouched.
  - Docs must match the screen: I'll add a "Screen text" section to the docs,
    and extend the word-for-word test to every label.

⏺ Write(src/lib/format.ts)
  ⎿  Added 30 lines, removed 9 lines
       1  /**
       2 - * Numbers and dates turned into the result sentences (S-1 AC-5
         -, S-2 AC-6, S-3 AC-5, S-4).                                    
       2 + * Numbers and dates turned into the result text (S-1 AC-5, S-2
         + AC-6, S-3 AC-5, S-4).                                         
       3 + * Presentation only: nothing here calculates.                 
       4   */
       5  import type { DueDateOption } from './admin';
       6  import { formatDisplayDate, type IsoDate } from './dates';
       7  import { describeWorkingDays, type WorkingDays } from './workin
          gDays';
       8 
       8 -/** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 
         -AC-5). */                                                      
       9 -export function formatMinutes(minutes: number): string {       
      10 -  if (minutes < 60) return `${minutes} min`;                   
       9 +/** What follows the number: 'min', or 'min (1 h 25 min)' from 
         +60 minutes up (S-1 AC-5). */                                   
      10 +export function formatMinutesUnit(minutes: number): string {   
      11 +  if (minutes < 60) return 'min';                              
      12    const hours = Math.floor(minutes / 60);
      13    const rest = minutes % 60;
      13 -  return `${minutes} min (${hours} h${rest === 0 ? '' : ` ${res
         -t} min`})`;                                                    
      14 +  return `min (${hours} h${rest === 0 ? '' : ` ${rest} min`})`;
      15  }
      16 
      17 +/** '34 min', or '85 min (1 h 25 min)' from 60 minutes up (S-1 
         +AC-5). */                                                      
      18 +export function formatMinutes(minutes: number): string {       
      19 +  return `${minutes} ${formatMinutesUnit(minutes)}`;           
      20 +}                                                              
      21 +                                                               
      22  const workingDayCount = (count: number) => `${count} working da
          y${count === 1 ? '' : 's'}`;
      23 
      24 +/** '26 working days (Mon–Fri)' (S-2 AC-6). */                 
      25 +export function workingDaysPhrase(count: number, workingDays: W
         +orkingDays): string {                                          
      26 +  return `${workingDayCount(count)} (${describeWorkingDays(work
         +ingDays)})`;                                                   
      27 +}                                                              
      28 +                                                               
      29  /** '15 min a day over 26 working days (Mon–Fri)' (S-2 AC-6). *
          /
      30  export function learnerPlanSentence(neededPerDay: number, worki
          ngDaysLeft: number, workingDays: WorkingDays): string {
      20 -  return `${formatMinutes(neededPerDay)} a day over ${workingDa
         -yCount(workingDaysLeft)} (${describeWorkingDays(workingDays)})`
         -;                                                              
      31 +  return `${formatMinutes(neededPerDay)} a day over ${workingDa
         +ysPhrase(workingDaysLeft, workingDays)}`;                      
      32  }
      33 
      34 +/** The Late sentence in three parts, so the finish date can be
         + shown large (S-3 AC-5). */                                    
      35 +export function lateParts(spareMinutesPerDay: number, finishDat
         +e: IsoDate, workingDaysLate: number) {                         
      36 +  return {                                                     
      37 +    lead: `At ${formatMinutes(spareMinutesPerDay)} a day you'll
         + finish on`,                                                   
      38 +    date: formatDisplayDate(finishDate),                       
      39 +    lateBy: `${workingDayCount(workingDaysLate)} late`,        
      40 +  };                                                           
      41 +}                                                              
      42 +                                                               
      43  /** "At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working
           days late." (S-3 AC-5). */
      44  export function lateSentence(spareMinutesPerDay: number, finish
          Date: IsoDate, workingDaysLate: number): string {
      25 -  return `At ${formatMinutes(spareMinutesPerDay)} a day you'll 
         -finish on ${formatDisplayDate(finishDate)}, ${workingDayCount(w
         -orkingDaysLate)} late.`;                                       
      45 +  const { lead, date, lateBy } = lateParts(spareMinutesPerDay, 
         +finishDate, workingDaysLate);                                  
      46 +  return `${lead} ${date}, ${lateBy}.`;                        
      47  }
      48 
      28 -/** '5 working days (Mon–Fri) at 60 min a day' (S-4, S-2 AC-6).
         - */                                                            
      49 +/** '5 working days (Mon–Fri) at 60 min (1 h) a day' (S-4, S-2 
         +AC-6). */                                                      
      50  export function adminOptionSentence(option: DueDateOption, work
          ingDays: WorkingDays): string {
      30 -  return `${workingDayCount(option.workingDayCount)} (${describ
         -eWorkingDays(workingDays)}) at ${formatMinutes(option.minutesPe
         -rDay)} a day`;                                                 
      51 +  return `${workingDaysPhrase(option.workingDayCount, workingDa
         +ys)} at ${formatMinutes(option.minutesPerDay)} a day`;         
      52  }

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='src/lib/format.test.ts'; s=open(p).read()…)
  ⎿  (No output)

⏺ The format helpers pass, and the existing sentences are unchanged. Next, the
  labels and texts in messages.ts.

⏺ Update(src/lib/messages.ts)
  ⎿  Added 12 lines, removed 2 lines
      63    adminNoTime: "At 0 minutes a day employees can't finish. Give
           them learning time to get a due date.",
      64    noRecommended: 'Not available at 1 minute a day. Raise the da
          ily time to get a date with a margin.',
      65    recommendedExplainer: 'Keeps the daily pace to 80% or less of
           the time you give.',
      66 +  addSpareHint: "Add the minutes you can spare to see if you're
         + on track.",                                                   
      67  };
      68 
      68 -/** Labels and headings on the page. */                        
      69 +/** Labels and headings on the page. Each one is listed in "Scr
         +een text" in docs/user-stories.md. */                          
      70  export const LABELS = {
      71    appTitle: 'Khutwa',
      72 +  appTitleArabic: 'خطوة',                                      
      73    appTagline: 'Training deadlines you can actually meet',
      74    roleQuestion: 'I am',
      75    roleLearner: 'a learner',
      76    roleAdmin: 'an L&D admin',
      77 +  sectionTraining: 'Your training',                            
      78 +  sectionDeadline: 'Deadline and working days',                
      79 +  sectionTime: 'Your time',                                    
      80 +  sectionCourse: 'The course',                                 
      81 +  sectionStart: 'Start date and working days',                 
      82 +  sectionLearningTime: 'Learning time',                        
      83    totalTime: 'Total course time',
      84    doneTime: 'Time already done',
      85    courseTime: 'Course time',
     ...
       90    spare: 'Minutes you can spare per working day (optional)',
       91    daily: 'Daily learning time employees get (minutes per worki
           ng day)',
       92    workingDays: 'Working days',
       85 -  preset: 'Preset',                                           
       93 +  presets: 'Presets',                                         
       94    presetMonFri: 'Mon–Fri',
       95    presetSunThu: 'Sun–Thu',
       96    presetCustom: 'Custom',
       97    result: 'Result',
       98 +  youNeed: 'You need',                                        
       99    earliest: 'Earliest due date',
      100    recommended: 'Recommended due date',
      101 +  left: 'left.',                                              
      102    noHolidays: 'Public holidays are not counted: remove them fr
           om your plan yourself.',
      103  };

⏺ Bash(python3 - <<'PY'
      p='src/lib/messages.test.ts'; s=open(p).read()…)
  ⎿  (No output)

⏺ Now the docs: S-1 AC-7, the S-2 controls, the S-3 explanations and finish-date
  display, the S-6 control and mobile summary, the S-7 status, and a new
  "Screen text" section listing every fixed string.

⏺ Bash(python3 - <<'PY'
      p='docs/user-stories.md'; s=open(p).read()…)
  ⎿  (No output)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run src/lib/messages.test.ts 2>&1 | grep -E "×|Tests "; sed -n 74,81p
      docs/user-stories.…)
  ⎿  (No output)

⏺ The docs match and all 65 checks pass; I'm now changing only the markup and
  styling of the components, with the form logic left as is. · summary

⏺ Write(src/components/fields.tsx)
  ⎿  Added 46 lines, removed 2 lines
      14    );
      15  }
      16 
      17 +/** A numbered step of the form: "1 Your training". */         
      18 +export function Section({ step, title, children }: { step: numb
         +er; title: string; children: ReactNode }) {                    
      19 +  const headingId = `step-${step}`;                            
      20 +  return (                                                     
      21 +    <section className="step" aria-labelledby={headingId}>     
      22 +      <h2 id={headingId} className="step-title">               
      23 +        <span className="step-number">{step}</span> {title}    
      24 +      </h2>                                                    
      25 +      {children}                                               
      26 +    </section>                                                 
      27 +  );                                                           
      28 +}                                                              
      29 +                                                               
      30  interface InputProps {
      31    id: FieldId;
      32    label: ReactNode;
     ...
       98    const groupErrorId = groupError === null ? null : errorId(gr
           oup);
       99 
      100    return (
       88 -    <fieldset className="duration" aria-describedby={groupErro
          -rId ?? undefined}>                                            
      101 +    <fieldset className="group" aria-describedby={groupErrorId
          + ?? undefined}>                                               
      102        <legend>{legend}</legend>
      103        <div className="duration-inputs">
      104          <NumberField
     ...
      129  export function ResultArea({ children }: { children: ReactNode
            }) {
      130    return (
      131      <section className="result" aria-labelledby="result-headin
           g">
      119 -      <h2 id="result-heading">{LABELS.result}</h2>            
      132 +      <h2 id="result-heading" className="result-heading">     
      133 +        {LABELS.result}                                       
      134 +      </h2>                                                   
      135        <div role="status" aria-live="polite" aria-atomic="true"
           >
      136          {children}
      137        </div>
      138      </section>
      139    );
      140  }
      141 +                                                              
      142 +/**                                                           
      143 + * S-6 AC-7: on small screens, a short copy of the result stay
          +s at the top while scrolling.                                 
      144 + * Hidden from screen readers, which hear the result once, fro
          +m the live region.                                            
      145 + */                                                           
      146 +export function ResultSummary({ children }: { children: ReactN
          +ode }) {                                                      
      147 +  return children === null ? null : (                         
      148 +    <div className="summary" aria-hidden="true">              
      149 +      {children}                                              
      150 +    </div>                                                    
      151 +  );                                                          
      152 +}                                                             
      153 +                                                              
      154 +export function EmptyState({ text }: { text: string }) {      
      155 +  return (                                                    
      156 +    <div className="empty">                                   
      157 +      <svg className="empty-icon" viewBox="0 0 48 48" aria-hid
          +den="true" focusable="false">                                 
      158 +        <rect x="6" y="30" width="10" height="12" rx="2" />   
      159 +        <rect x="19" y="20" width="10" height="22" rx="2" />  
      160 +        <rect x="32" y="8" width="10" height="34" rx="2" />   
      161 +      </svg>                                                  
      162 +      <p>{text}</p>                                           
      163 +    </div>                                                    
      164 +  );                                                          
      165 +}                                                             
      166 +                                                              
      167 +export function ResultError({ text }: { text: string }) {     
      168 +  return <p className="result-error">{text}</p>;              
      169 +}                                                             

⏺ Write(src/components/WorkingDaysPicker.tsx)
  ⎿  Added 32 lines, removed 21 lines
       1  import { WEEKDAY_SHORT_NAMES, type Weekday } from '../lib/dates
          ';
       2  import { LABELS } from '../lib/messages';
       3 -import { PRESETS, presetFor, type WorkingDays } from '../lib/wo
         -rkingDays';                                                    
       3 +import { PRESETS, presetFor, type PresetId, type WorkingDays } 
         +from '../lib/workingDays';                                     
       4  import { FieldMessage, errorId } from './fields';
       5 
       6  /** Week order from Monday, as in the result labels (S-2 AC-6).
           */
       7  const DAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];
       8 
       9 +const PRESET_BUTTONS: readonly { id: PresetId; label: string }[
         +] = [                                                          
      10 +  { id: 'monFri', label: LABELS.presetMonFri },                
      11 +  { id: 'sunThu', label: LABELS.presetSunThu },                
      12 +];                                                             
      13 +                                                               
      14  interface Props {
      15    value: WorkingDays;
      16    error: string | null;
      17    onChange: (value: WorkingDays) => void;
      18  }
      19 
      15 -/** S-2 AC-1, AC-2: two presets plus one checkbox per day; the 
         -preset always matches the boxes. */                            
      20 +/**                                                            
      21 + * S-2 AC-1, AC-2: two preset buttons plus a toggle for each da
         +y.                                                             
      22 + * The toggles are real checkboxes and the presets real buttons
         + (S-6 AC-5).                                                   
      23 + */                                                            
      24  export function WorkingDaysPicker({ value, error, onChange }: P
          rops) {
      25 +  const preset = presetFor(value);                             
      26    const toggle = (day: Weekday) => {
      27      const next = new Set(value);
      28      if (next.has(day)) next.delete(day);
     ...
      31    };
      32 
      33    return (
      25 -    <fieldset className="working-days" aria-describedby={error 
         -=== null ? undefined : errorId('workingDays')}>                
      34 +    <fieldset className="group" aria-describedby={error === nul
         +l ? undefined : errorId('workingDays')}>                       
      35        <legend>{LABELS.workingDays}</legend>
      27 -      <div className="field">                                  
      28 -        <label htmlFor="preset">{LABELS.preset}</label>        
      29 -        <select                                                
      30 -          id="preset"                                          
      31 -          value={presetFor(value)}                             
      32 -          onChange={(event) => {                               
      33 -            const choice = event.target.value;                 
      34 -            if (choice === 'monFri' || choice === 'sunThu') onC
         -hange(PRESETS[choice]);                                        
      35 -          }}                                                   
      36 -        >                                                      
      37 -          <option value="monFri">{LABELS.presetMonFri}</option>
      38 -          <option value="sunThu">{LABELS.presetSunThu}</option>
      39 -          <option value="custom">{LABELS.presetCustom}</option>
      40 -        </select>                                              
      36 +      <div className="presets" role="group" aria-labelledby="pr
         +esets-label">                                                  
      37 +        <span id="presets-label" className="presets-label">    
      38 +          {LABELS.presets}                                     
      39 +        </span>                                                
      40 +        {PRESET_BUTTONS.map(({ id, label }) => (               
      41 +          <button                                              
      42 +            key={id}                                           
      43 +            type="button"                                      
      44 +            className="preset"                                 
      45 +            aria-pressed={preset === id}                       
      46 +            onClick={() => onChange(PRESETS[id])}              
      47 +          >                                                    
      48 +            {label}                                            
      49 +          </button>                                            
      50 +        ))}                                                    
      51 +        {preset === 'custom' && <span className="custom-tag">{L
         +ABELS.presetCustom}</span>}                                    
      52        </div>
      42 -      <div className="days">                                   
      53 +      <div className="day-toggles">                            
      54          {DAY_ORDER.map((day) => (
      44 -          <label key={day} className="day">                    
      45 -            <input type="checkbox" checked={value.has(day)} onC
         -hange={() => toggle(day)} />                                   
      46 -            {WEEKDAY_SHORT_NAMES[day]}                         
      55 +          <label key={day} className="day-toggle">             
      56 +            <input type="checkbox" className="day-input" checke
         +d={value.has(day)} onChange={() => toggle(day)} />             
      57 +            <span className="day-label">{WEEKDAY_SHORT_NAMES[da
         +y]}</span>                                                     
      58            </label>
      59          ))}
      60        </div>

⏺ Write(src/components/LearnerForm.tsx)
  ⎿  Added 131 lines, removed 69 lines
       1  import type { IsoDate } from '../lib/dates';
       2 -import { formatMinutes, lateSentence, learnerPlanSentence } fro
         -m '../lib/format';                                             
       3 -import { calculateLearner } from '../lib/learner';             
       2 +import { formatMinutes, formatMinutesUnit, lateParts, workingDa
         +ysPhrase } from '../lib/format';                               
       3 +import { calculateLearner, type LearnerResult } from '../lib/le
         +arner';                                                        
       4  import { CALC_ERROR_TEXT, LABELS, STATUS_DETAIL, STATUS_LABEL,
          TEXT } from '../lib/messages';
       5  import { parseLearnerForm, type FieldId, type LearnerFormText }
           from '../lib/parse';
       6 -import { DateField, DurationField, NumberField, ResultArea } fr
         -om './fields';                                                 
       6 +import type { WorkingDays } from '../lib/workingDays';         
       7 +import {                                                       
       8 +  DateField,                                                   
       9 +  DurationField,                                               
      10 +  EmptyState,                                                  
      11 +  NumberField,                                                 
      12 +  ResultArea,                                                  
      13 +  ResultError,                                                 
      14 +  ResultSummary,                                               
      15 +  Section,                                                     
      16 +} from './fields';                                             
      17  import { messageFinder, withTouched, type FormState } from './f
          ormState';
      18  import { WorkingDaysPicker } from './WorkingDaysPicker';
      19 
      20 +type Plan = Extract<LearnerResult, { kind: 'plan' }>;          
      21 +                                                               
      22  interface Props {
      23    state: FormState<LearnerFormText>;
      24    today: IsoDate;
      25    onChange: (state: FormState<LearnerFormText>) => void;
      26  }
      27 
      28 +function StatusChip({ status }: { status: 'on-track' | 'tight' 
         +| 'late' }) {                                                  
      29 +  return <span className={`chip chip-${status}`}>{STATUS_LABEL[
         +status]}</span>;                                               
      30 +}                                                              
      31 +                                                               
      32 +/** S-3: the status panel under the daily pace. */             
      33 +function PacePanel({ plan, spare }: { plan: Plan; spare: number
         + | null }) {                                                   
      34 +  const { pace } = plan;                                       
      35 +  if (pace === null) return <p className="panel panel-neutral">
         +{TEXT.addSpareHint}</p>;                                       
      36 +  if (pace.status !== 'late') {                                
      37 +    return (                                                   
      38 +      <div className={`panel panel-${pace.status}`}>           
      39 +        <StatusChip status={pace.status} />                    
      40 +        <p>{STATUS_DETAIL[pace.status]}</p>                    
      41 +      </div>                                                   
      42 +    );                                                         
      43 +  }                                                            
      44 +  if (pace.finish === null) {                                  
      45 +    return (                                                   
      46 +      <div className="panel panel-late">                       
      47 +        <StatusChip status="late" />                           
      48 +        <p>{TEXT.noSpareTime}</p>                              
      49 +      </div>                                                   
      50 +    );                                                         
      51 +  }                                                            
      52 +  const { lead, date, lateBy } = lateParts(spare ?? 0, pace.fin
         +ish.date, pace.finish.workingDaysLate);                        
      53 +  return (                                                     
      54 +    <div className="panel panel-late">                         
      55 +      <StatusChip status="late" />                             
      56 +      <p className="finish-lead">{lead}</p>                    
      57 +      <p className="finish-date">{date}</p>                    
      58 +      <p className="finish-late">{lateBy}</p>                  
      59 +    </div>                                                     
      60 +  );                                                           
      61 +}                                                              
      62 +                                                               
      63 +/** S-1: the daily pace is the hero of the page. */            
      64 +function PlanView({ plan, workingDays, spare }: { plan: Plan; w
         +orkingDays: WorkingDays; spare: number | null }) {             
      65 +  return (                                                     
      66 +    <>                                                         
      67 +      <p className="hero-label">{LABELS.youNeed}</p>           
      68 +      <p className="hero">                                     
      69 +        <span className="hero-number">{plan.neededPerDay}</span
         +>{' '}                                                         
      70 +        <span className="hero-unit">{formatMinutesUnit(plan.nee
         +dedPerDay)} a day</span>{' '}                                  
      71 +        <span className="hero-detail">over {workingDaysPhrase(p
         +lan.workingDaysLeft, workingDays)}</span>                      
      72 +      </p>                                                     
      73 +      {plan.moreThanAWorkingDay && <p className="warning">{TEXT
         +.moreThanAWorkingDay}</p>}                                     
      74 +      <PacePanel plan={plan} spare={spare} />                  
      75 +      <p className="note">                                     
      76 +        {formatMinutes(plan.remainingMinutes)} {LABELS.left} {L
         +ABELS.noHolidays}                                              
      77 +      </p>                                                     
      78 +    </>                                                        
      79 +  );                                                           
      80 +}                                                              
      81 +                                                               
      82  export function LearnerForm({ state, today, onChange }: Props)
          {
      83    const { text } = state;
      84    const edit = (patch: Partial<LearnerFormText>, fields: FieldI
          d[]) =>
     ...
       90    const calc = parsed.ok ? calculateLearner(parsed.value) : nu
           ll;
       91    const calcError = calc !== null && !calc.ok ? calc.error : n
           ull;
       92    const messageFor = messageFinder(parsed.ok ? [] : parsed.err
           or, calcError, state.touched);
       93 +  const spare = parsed.ok ? parsed.value.spareMinutesPerDay : 
          +null;                                                         
       94 +  const value = calc !== null && calc.ok ? calc.value : null; 
       95 
       96    return (
       97      <div className="calculator">
       98 +      <ResultSummary>                                         
       99 +        {value?.kind === 'plan' ? (                           
      100 +          <>                                                  
      101 +            <span className="summary-number">{value.neededPerD
          +ay}</span>                                                    
      102 +            <span>{formatMinutesUnit(value.neededPerDay)} a da
          +y</span>                                                      
      103 +            {value.pace !== null && <StatusChip status={value.
          +pace.status} />}                                              
      104 +          </>                                                 
      105 +        ) : value?.kind === 'complete' ? (                    
      106 +          <span>{TEXT.alreadyComplete}</span>                 
      107 +        ) : null}                                             
      108 +      </ResultSummary>                                        
      109 +                                                              
      110        <div className="inputs">
       31 -        <DurationField                                        
       32 -          group="total"                                       
       33 -          legend={LABELS.totalTime}                           
       34 -          value={text.total}                                  
       35 -          messageFor={messageFor}                             
       36 -          onChange={(total, field) => edit({ total }, [field, 
          -'total'])}                                                    
       37 -          onTouch={touch}                                     
       38 -        />                                                    
       39 -        <DurationField                                        
       40 -          group="done"                                        
       41 -          legend={LABELS.doneTime}                            
       42 -          value={text.done}                                   
       43 -          messageFor={messageFor}                             
       44 -          onChange={(done, field) => edit({ done }, [field, 'd
          -one'])}                                                       
       45 -          onTouch={touch}                                     
       46 -        />                                                    
       47 -        <DateField                                            
       48 -          id="dueDate"                                        
       49 -          label={LABELS.dueDate}                              
       50 -          value={text.dueDate}                                
       51 -          error={messageFor('dueDate')}                       
       52 -          onChange={(dueDate) => edit({ dueDate }, ['dueDate']
          -)}                                                            
       53 -          onTouch={() => touch(['dueDate'])}                  
       54 -        />                                                    
       55 -        <NumberField                                          
       56 -          id="spare"                                          
       57 -          label={LABELS.spare}                                
       58 -          value={text.spare}                                  
       59 -          error={messageFor('spare')}                         
       60 -          onChange={(spare) => edit({ spare }, ['spare'])}    
       61 -          onTouch={() => touch(['spare'])}                    
       62 -        />                                                    
       63 -        <WorkingDaysPicker                                    
       64 -          value={text.workingDays}                            
       65 -          error={messageFor('workingDays')}                   
       66 -          onChange={(workingDays) => edit({ workingDays }, ['w
          -orkingDays'])}                                                
       67 -        />                                                    
      111 +        <Section step={1} title={LABELS.sectionTraining}>     
      112 +          <DurationField                                      
      113 +            group="total"                                     
      114 +            legend={LABELS.totalTime}                         
      115 +            value={text.total}                                
      116 +            messageFor={messageFor}                           
      117 +            onChange={(total, field) => edit({ total }, [field
          +, 'total'])}                                                  
      118 +            onTouch={touch}                                   
      119 +          />                                                  
      120 +          <DurationField                                      
      121 +            group="done"                                      
      122 +            legend={LABELS.doneTime}                          
      123 +            value={text.done}                                 
      124 +            messageFor={messageFor}                           
      125 +            onChange={(done, field) => edit({ done }, [field, 
          +'done'])}                                                     
      126 +            onTouch={touch}                                   
      127 +          />                                                  
      128 +        </Section>                                            
      129 +        <Section step={2} title={LABELS.sectionDeadline}>     
      130 +          <DateField                                          
      131 +            id="dueDate"                                      
      132 +            label={LABELS.dueDate}                            
      133 +            value={text.dueDate}                              
      134 +            error={messageFor('dueDate')}                     
      135 +            onChange={(dueDate) => edit({ dueDate }, ['dueDate
          +'])}                                                          
      136 +            onTouch={() => touch(['dueDate'])}                
      137 +          />                                                  
      138 +          <WorkingDaysPicker                                  
      139 +            value={text.workingDays}                          
      140 +            error={messageFor('workingDays')}                 
      141 +            onChange={(workingDays) => edit({ workingDays }, [
          +'workingDays'])}                                              
      142 +          />                                                  
      143 +        </Section>                                            
      144 +        <Section step={3} title={LABELS.sectionTime}>         
      145 +          <NumberField                                        
      146 +            id="spare"                                        
      147 +            label={LABELS.spare}                              
      148 +            value={text.spare}                                
      149 +            error={messageFor('spare')}                       
      150 +            onChange={(spare) => edit({ spare }, ['spare'])}  
      151 +            onTouch={() => touch(['spare'])}                  
      152 +          />                                                  
      153 +        </Section>                                            
      154        </div>
      155 
      156        <ResultArea>
       71 -        {!parsed.ok || calc === null ? (                      
       72 -          <p>{TEXT.learnerEmpty}</p>                          
      157 +        {calc === null ? (                                    
      158 +          <EmptyState text={TEXT.learnerEmpty} />             
      159          ) : !calc.ok ? (
       74 -          <p className="result-error">{CALC_ERROR_TEXT[calc.er
          -ror]}</p>                                                     
      160 +          <ResultError text={CALC_ERROR_TEXT[calc.error]} />  
      161          ) : calc.value.kind === 'complete' ? (
       76 -          <p className="headline">{TEXT.alreadyComplete}</p>  
      162 +          <p className="hero-complete">{TEXT.alreadyComplete}<
          +/p>                                                           
      163          ) : (
       78 -          <>                                                  
       79 -            <p className="headline">                          
       80 -              {learnerPlanSentence(calc.value.neededPerDay, ca
          -lc.value.workingDaysLeft, text.workingDays)}                  
       81 -            </p>                                              
       82 -            {calc.value.moreThanAWorkingDay && <p>{TEXT.moreTh
          -anAWorkingDay}</p>}                                           
       83 -            {calc.value.pace !== null && (                    
       84 -              <p>                                             
       85 -                <strong className={`status status-${calc.value
          -.pace.status}`}>                                              
       86 -                  {STATUS_LABEL[calc.value.pace.status]}      
       87 -                </strong>{' '}                                
       88 -                {calc.value.pace.status !== 'late'            
       89 -                  ? STATUS_DETAIL[calc.value.pace.status]     
       90 -                  : calc.value.pace.finish === null           
       91 -                    ? TEXT.noSpareTime                        
       92 -                    : lateSentence(                           
       93 -                        parsed.value.spareMinutesPerDay ?? 0, 
       94 -                        calc.value.pace.finish.date,          
       95 -                        calc.value.pace.finish.workingDaysLate
          -,                                                             
       96 -                      )}                                      
       97 -              </p>                                            
       98 -            )}                                                
       99 -            <p className="note">                              
      100 -              {formatMinutes(calc.value.remainingMinutes)} lef
          -t. {LABELS.noHolidays}                                        
      101 -            </p>                                              
      102 -          </>                                                 
      164 +          <PlanView plan={calc.value} workingDays={text.workin
          +gDays} spare={spare} />                                       
      165          )}
      166        </ResultArea>
      167      </div>

⏺ Write(src/components/AdminForm.tsx)
  ⎿  Added 77 lines, removed 56 lines
       1 -import { calculateAdmin, type DueDateOption } from '../lib/admi
         -n';                                                            
       1 +import { calculateAdmin } from '../lib/admin';                 
       2  import { formatDisplayDate, type IsoDate } from '../lib/dates';
       3  import { adminOptionSentence } from '../lib/format';
       4  import { CALC_ERROR_TEXT, LABELS, TEXT } from '../lib/messages'
          ;
       5  import { parseAdminForm, type AdminFormText, type FieldId } fro
          m '../lib/parse';
       6 -import type { WorkingDays } from '../lib/workingDays';         
       7 -import { DateField, DurationField, NumberField, ResultArea } fr
         -om './fields';                                                 
       6 +import {                                                       
       7 +  DateField,                                                   
       8 +  DurationField,                                               
       9 +  EmptyState,                                                  
      10 +  NumberField,                                                 
      11 +  ResultArea,                                                  
      12 +  ResultError,                                                 
      13 +  ResultSummary,                                               
      14 +  Section,                                                     
      15 +} from './fields';                                             
      16  import { messageFinder, withTouched, type FormState } from './f
          ormState';
      17  import { WorkingDaysPicker } from './WorkingDaysPicker';
      18 
     ...
      22    onChange: (state: FormState<AdminFormText>) => void;
      23  }
      24 
      17 -function DueDate({ option, workingDays }: { option: DueDateOpti
         -on; workingDays: WorkingDays }) {                              
      18 -  return (                                                     
      19 -    <>                                                         
      20 -      <p className="headline">{formatDisplayDate(option.date)}<
         -/p>                                                            
      21 -      <p>{adminOptionSentence(option, workingDays)}</p>        
      22 -    </>                                                        
      23 -  );                                                           
      24 -}                                                              
      25 -                                                               
      25  export function AdminForm({ state, today, onChange }: Props) {
      26    const { text } = state;
      27    const edit = (patch: Partial<AdminFormText>, fields: FieldId[
          ]) =>
     ...
       33    const calc = parsed.ok ? calculateAdmin(parsed.value) : null
           ;
       34    const calcError = calc !== null && !calc.ok ? calc.error : n
           ull;
       35    const messageFor = messageFinder(parsed.ok ? [] : parsed.err
           or, calcError, state.touched);
       36 +  const value = calc !== null && calc.ok ? calc.value : null; 
       37 
       38    return (
       39      <div className="calculator">
       40 +      <ResultSummary>                                         
       41 +        {value?.kind === 'dates' ? (                          
       42 +          <>                                                  
       43 +            <span className="summary-label">{LABELS.earliest}<
          +/span>                                                        
       44 +            <strong>{formatDisplayDate(value.earliest.date)}</
          +strong>                                                       
       45 +          </>                                                 
       46 +        ) : null}                                             
       47 +      </ResultSummary>                                        
       48 +                                                              
       49        <div className="inputs">
       41 -        <DurationField                                        
       42 -          group="course"                                      
       43 -          legend={LABELS.courseTime}                          
       44 -          value={text.course}                                 
       45 -          messageFor={messageFor}                             
       46 -          onChange={(course, field) => edit({ course }, [field
          -, 'course'])}                                                 
       47 -          onTouch={touch}                                     
       48 -        />                                                    
       49 -        <NumberField                                          
       50 -          id="daily"                                          
       51 -          label={LABELS.daily}                                
       52 -          value={text.daily}                                  
       53 -          error={messageFor('daily')}                         
       54 -          onChange={(daily) => edit({ daily }, ['daily'])}    
       55 -          onTouch={() => touch(['daily'])}                    
       56 -        />                                                    
       57 -        <DateField                                            
       58 -          id="startDate"                                      
       59 -          label={LABELS.startDate}                            
       60 -          value={text.startDate}                              
       61 -          error={messageFor('startDate')}                     
       62 -          onChange={(startDate) => edit({ startDate }, ['start
          -Date'])}                                                      
       63 -          onTouch={() => touch(['startDate'])}                
       64 -        />                                                    
       65 -        <WorkingDaysPicker                                    
       66 -          value={text.workingDays}                            
       67 -          error={messageFor('workingDays')}                   
       68 -          onChange={(workingDays) => edit({ workingDays }, ['w
          -orkingDays'])}                                                
       69 -        />                                                    
       50 +        <Section step={1} title={LABELS.sectionCourse}>       
       51 +          <DurationField                                      
       52 +            group="course"                                    
       53 +            legend={LABELS.courseTime}                        
       54 +            value={text.course}                               
       55 +            messageFor={messageFor}                           
       56 +            onChange={(course, field) => edit({ course }, [fie
          +ld, 'course'])}                                               
       57 +            onTouch={touch}                                   
       58 +          />                                                  
       59 +        </Section>                                            
       60 +        <Section step={2} title={LABELS.sectionStart}>        
       61 +          <DateField                                          
       62 +            id="startDate"                                    
       63 +            label={LABELS.startDate}                          
       64 +            value={text.startDate}                            
       65 +            error={messageFor('startDate')}                   
       66 +            onChange={(startDate) => edit({ startDate }, ['sta
          +rtDate'])}                                                    
       67 +            onTouch={() => touch(['startDate'])}              
       68 +          />                                                  
       69 +          <WorkingDaysPicker                                  
       70 +            value={text.workingDays}                          
       71 +            error={messageFor('workingDays')}                 
       72 +            onChange={(workingDays) => edit({ workingDays }, [
          +'workingDays'])}                                              
       73 +          />                                                  
       74 +        </Section>                                            
       75 +        <Section step={3} title={LABELS.sectionLearningTime}> 
       76 +          <NumberField                                        
       77 +            id="daily"                                        
       78 +            label={LABELS.daily}                              
       79 +            value={text.daily}                                
       80 +            error={messageFor('daily')}                       
       81 +            onChange={(daily) => edit({ daily }, ['daily'])}  
       82 +            onTouch={() => touch(['daily'])}                  
       83 +          />                                                  
       84 +        </Section>                                            
       85        </div>
       86 
       87        <ResultArea>
       73 -        {!parsed.ok || calc === null ? (                      
       74 -          <p>{TEXT.adminEmpty}</p>                            
       88 +        {calc === null ? (                                    
       89 +          <EmptyState text={TEXT.adminEmpty} />               
       90          ) : !calc.ok ? (
       76 -          <p className="result-error">{CALC_ERROR_TEXT[calc.er
          -ror]}</p>                                                     
       91 +          <ResultError text={CALC_ERROR_TEXT[calc.error]} />  
       92          ) : calc.value.kind === 'no-time' ? (
       78 -          <p className="headline">{TEXT.adminNoTime}</p>      
       93 +          <div className="panel panel-late">                  
       94 +            <p>{TEXT.adminNoTime}</p>                         
       95 +          </div>                                              
       96          ) : (
       97            <>
       81 -            <h3>{LABELS.earliest}</h3>                        
       82 -            <DueDate option={calc.value.earliest} workingDays=
          -{text.workingDays} />                                         
       83 -            <h3>{LABELS.recommended}</h3>                     
       84 -            {calc.value.recommended === null ? (              
       85 -              <p>{TEXT.noRecommended}</p>                     
       86 -            ) : (                                             
       87 -              <>                                              
       88 -                <DueDate option={calc.value.recommended} worki
          -ngDays={text.workingDays} />                                  
       89 -                <p className="note">{TEXT.recommendedExplainer
          -}</p>                                                         
       90 -              </>                                             
       91 -            )}                                                
       98 +            <h3 className="hero-label">{LABELS.earliest}</h3> 
       99 +            <p className="hero-date">{formatDisplayDate(calc.v
          +alue.earliest.date)}</p>                                      
      100 +            <p className="hero-detail">{adminOptionSentence(ca
          +lc.value.earliest, text.workingDays)}</p>                     
      101 +            <div className="panel panel-on-track">            
      102 +              <h3 className="panel-title">{LABELS.recommended}
          +</h3>                                                         
      103 +              {calc.value.recommended === null ? (            
      104 +                <p>{TEXT.noRecommended}</p>                   
      105 +              ) : (                                           
      106 +                <>                                            
      107 +                  <p className="finish-date">{formatDisplayDat
          +e(calc.value.recommended.date)}</p>                           
      108 +                  <p>{adminOptionSentence(calc.value.recommend
          +ed, text.workingDays)}</p>                                    
      109 +                  <p className="panel-note">{TEXT.recommendedE
          +xplainer}</p>                                                 
      110 +                </>                                           
      111 +              )}                                              
      112 +            </div>                                            
      113              <p className="note">{LABELS.noHolidays}</p>
      114            </>
      115          )}

⏺ Write(src/App.tsx)
  ⎿  Added 32 lines, removed 11 lines
      37 
      38    return (
      39      <main className="app">
      40 -      <header>                                                 
      41 -        <h1>{LABELS.appTitle}</h1>                             
      42 -        <p className="tagline">{LABELS.appTagline}</p>         
      40 +      <header className="masthead">                            
      41 +        <svg className="logo" viewBox="0 0 48 48" aria-hidden="
         +true" focusable="false">                                       
      42 +          <rect width="48" height="48" rx="12" />              
      43 +          <path d="M12 34h8v-8h8v-8h8" />                      
      44 +        </svg>                                                 
      45 +        <div>                                                  
      46 +          <h1 className="brand">                               
      47 +            {LABELS.appTitle}{' '}                             
      48 +            <span className="brand-ar" lang="ar" dir="rtl">    
      49 +              {LABELS.appTitleArabic}                          
      50 +            </span>                                            
      51 +          </h1>                                                
      52 +          <p className="tagline">{LABELS.appTagline}</p>       
      53 +        </div>                                                 
      54        </header>
      55 
      45 -      <fieldset className="role-switch">                       
      46 -        <legend>{LABELS.roleQuestion}</legend>                 
      47 -        {ROLES.map(({ role: value, label }) => (               
      48 -          <label key={value}>                                  
      49 -            <input type="radio" name="role" value={value} check
         -ed={role === value} onChange={() => setRole(value)} />         
      50 -            {label}                                            
      51 -          </label>                                             
      52 -        ))}                                                    
      56 +      {/* S-6 AC-5: a segmented control built on real radio but
         +tons, so arrow keys work. */}                                  
      57 +      <fieldset className="segmented">                         
      58 +        <legend className="segmented-legend">{LABELS.roleQuesti
         +on}</legend>                                                   
      59 +        <div className="segments">                             
      60 +          {ROLES.map(({ role: value, label }) => (             
      61 +            <label key={value} className="segment">            
      62 +              <input                                           
      63 +                type="radio"                                   
      64 +                className="segment-input"                      
      65 +                name="role"                                    
      66 +                value={value}                                  
      67 +                checked={role === value}                       
      68 +                onChange={() => setRole(value)}                
      69 +              />                                               
      70 +              <span className="segment-label">{label}</span>   
      71 +            </label>                                           
      72 +          ))}                                                  
      73 +        </div>                                                 
      74        </fieldset>
      75 
      76        {role === 'learner' ? (

⏺ Now the stylesheet. Colours are chosen to pass WCAG AA in light and dark mode,
  and I'll check the contrast numbers with a script afterwards.

⏺ Write(src/styles.css)
  ⎿  Added 169 lines, removed 42 lines
        1 +/* Khutwa. Colour pairs are checked for WCAG AA contrast in li
          +ght and dark (see docs/verification.md). */                   
        2  :root {
        3    color-scheme: light dark;
        3 -  --fg: #1b1f24;                                              
        4 -  --muted: #545c66;                                           
        5 -  --bg: #f6f7f9;                                              
        4 +  --bg: #f3f5f4;                                              
        5    --card: #ffffff;
        7 -  --border: #c9ced6;                                          
        6 +  --fg: #16201c;                                              
        7 +  --muted: #4f5a56;                                           
        8 +  --border: #d3dad7;                                          
        9 +  --track: #e4e9e7;                                           
       10    --accent: #0b6e4f;
       11 +  --accent-strong: #08583f;                                   
       12 +  --accent-soft: #e2f1ea;                                     
       13 +  --on-accent: #ffffff;                                       
       14 +  --focus: #0b57d0;                                           
       15    --error: #b3261e;
       16 +  --error-soft: #fcebea;                                      
       17    --on-track: #0b6e4f;
       18 +  --on-track-soft: #e2f1ea;                                   
       19    --tight: #8a5a00;
       20 +  --tight-soft: #fdf2dc;                                      
       21    --late: #b3261e;
       13 -  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, s
          -ans-serif;                                                    
       22 +  --late-soft: #fcebea;                                       
       23 +  --on-chip: #ffffff;                                         
       24 +  --radius: 16px;                                             
       25 +  --shadow: 0 1px 2px rgb(16 32 24 / 0.06), 0 8px 24px rgb(16 
          +32 24 / 0.07);                                                
       26 +  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', 
          +Roboto, sans-serif;                                           
       27    line-height: 1.5;
       28 +  -webkit-font-smoothing: antialiased;                        
       29  }
       30 
       31  @media (prefers-color-scheme: dark) {
       32    :root {
       19 -    --fg: #e8eaed;                                            
       20 -    --muted: #a9b0ba;                                         
       21 -    --bg: #15181c;                                            
       22 -    --card: #1e2228;                                          
       23 -    --border: #3d444e;                                        
       33 +    --bg: #0f1412;                                            
       34 +    --card: #182019;                                          
       35 +    --fg: #e6ece9;                                            
       36 +    --muted: #a7b3ae;                                         
       37 +    --border: #2e3a35;                                        
       38 +    --track: #232d29;                                         
       39      --accent: #5fd3a5;
       40 +    --accent-strong: #7fe0b8;                                 
       41 +    --accent-soft: #1d3a2f;                                   
       42 +    --on-accent: #062117;                                     
       43 +    --focus: #8ab4f8;                                         
       44      --error: #ff8a80;
       45 +    --error-soft: #3a1d1b;                                    
       46      --on-track: #5fd3a5;
       47 +    --on-track-soft: #1a332a;                                 
       48      --tight: #f2c14e;
       49 +    --tight-soft: #352b14;                                    
       50      --late: #ff8a80;
       51 +    --late-soft: #3a1d1b;                                     
       52 +    --on-chip: #111614;                                       
       53 +    --shadow: none;                                           
       54    }
       55  }
       56 
       57 +* { box-sizing: border-box; }                                 
       58  body { margin: 0; background: var(--bg); color: var(--fg); }
       33 -.app { max-width: 980px; margin: 0 auto; padding: 1.5rem 1rem 
          -3rem; }                                                       
       34 -h1 { margin: 0; font-size: 1.75rem; }                         
       35 -.tagline { margin: 0 0 1.25rem; color: var(--muted); }        
       59 +.app { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25re
          +m 4rem; }                                                     
       60 +:focus-visible { outline: 3px solid var(--focus); outline-offs
          +et: 2px; }                                                    
       61 
       37 -fieldset { border: 1px solid var(--border); border-radius: 8px
          -; padding: 0.75rem 1rem; margin: 0 0 1rem; min-width: 0; }    
       38 -legend { font-weight: 600; padding: 0 0.25rem; }              
       39 -.role-switch { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5
          -rem; align-items: center; }                                   
       40 -.role-switch label { display: inline-flex; gap: 0.4rem; align-
          -items: center; }                                              
       62 +/* Header */                                                  
       63 +.masthead { display: flex; align-items: center; gap: 0.9rem; m
          +argin-bottom: 1.75rem; }                                      
       64 +.logo { width: 3rem; height: 3rem; flex: none; }              
       65 +.logo rect { fill: var(--accent); }                           
       66 +.logo path { fill: none; stroke: var(--on-accent); stroke-widt
          +h: 4; stroke-linecap: round; stroke-linejoin: round; }        
       67 +.brand { margin: 0; font-size: 1.6rem; line-height: 1.2; lette
          +r-spacing: -0.01em; }                                         
       68 +.brand-ar { font-weight: 600; color: var(--muted); font-size: 
          +1.25rem; margin-inline-start: 0.35rem; }                      
       69 +.tagline { margin: 0.1rem 0 0; color: var(--muted); }         
       70 
       42 -.calculator { display: grid; gap: 1.5rem; grid-template-column
          -s: minmax(0, 1fr) minmax(0, 1fr); }                           
       43 -@media (max-width: 720px) { .calculator { grid-template-column
          -s: 1fr; } }                                                   
       71 +/* Role switch: radio buttons styled as a segmented control (S
          +-6 AC-5) */                                                   
       72 +.segmented { border: 0; padding: 0; margin: 0 0 1.5rem; displa
          +y: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
       73 +.segmented-legend { float: left; padding: 0; font-weight: 600;
          + color: var(--muted); margin-inline-end: 0.75rem; line-height:
          + 2.75rem; }                                                   
       74 +.segments { display: inline-grid; grid-template-columns: 1fr 1
          +fr; background: var(--track); padding: 4px; border-radius: 999
          +px; }                                                         
       75 +.segment { position: relative; }                              
       76 +.segment-input, .day-input { position: absolute; inset: 0; opa
          +city: 0; margin: 0; cursor: pointer; }                        
       77 +.segment-label {                                              
       78 +  display: block; padding: 0.55rem 1.25rem; border-radius: 999
          +px; text-align: center;                                       
       79 +  font-weight: 600; color: var(--muted); white-space: nowrap; 
          +transition: background 0.15s, color 0.15s;                    
       80 +}                                                             
       81 +.segment-input:checked + .segment-label { background: var(--ca
          +rd); color: var(--fg); box-shadow: 0 1px 3px rgb(0 0 0 / 0.15)
          +; }                                                           
       82 +.segment-input:focus-visible + .segment-label { outline: 3px s
          +olid var(--focus); outline-offset: 2px; }                     
       83 
       45 -.field { display: flex; flex-direction: column; gap: 0.25rem; 
          -margin-bottom: 0.75rem; }                                     
       84 +/* Layout */                                                  
       85 +.calculator { display: grid; grid-template-columns: minmax(0, 
          +1.15fr) minmax(0, 0.85fr); gap: 1.5rem; align-items: start; } 
       86 +.inputs { display: flex; flex-direction: column; gap: 1rem; } 
       87 +                                                              
       88 +/* Numbered sections */                                       
       89 +.step { background: var(--card); border: 1px solid var(--borde
          +r); border-radius: var(--radius); padding: 1.25rem 1.35rem 1.3
          +5rem; box-shadow: var(--shadow); }                            
       90 +.step-title { display: flex; align-items: center; gap: 0.6rem;
          + margin: 0 0 1rem; font-size: 1.05rem; }                      
       91 +.step-number {                                                
       92 +  display: inline-grid; place-items: center; width: 1.75rem; h
          +eight: 1.75rem; flex: none;                                   
       93 +  border-radius: 50%; background: var(--accent); color: var(--
          +on-accent); font-size: 0.875rem; font-weight: 700;            
       94 +}                                                             
       95 +                                                              
       96 +/* Fields */                                                  
       97 +.group { border: 0; padding: 0; margin: 0 0 1.1rem; min-width:
          + 0; }                                                         
       98 +.group:last-child { margin-bottom: 0; }                       
       99 +.group legend { padding: 0; margin-bottom: 0.45rem; font-weigh
          +t: 600; }                                                     
      100 +.field { display: flex; flex-direction: column; gap: 0.3rem; m
          +argin-bottom: 1.1rem; }                                       
      101  .field:last-child { margin-bottom: 0; }
       47 -label { font-weight: 500; }                                   
       48 -input[type='text'], input[type='date'], select {              
       49 -  font: inherit; padding: 0.45rem 0.6rem; border: 1px solid va
          -r(--border); border-radius: 6px;                              
       50 -  background: var(--card); color: var(--fg); min-width: 0;    
      102 +.field label { font-weight: 500; font-size: 0.95rem; }        
      103 +.duration-inputs { display: grid; grid-template-columns: 1fr 1
          +fr; gap: 0.75rem; }                                           
      104 +.duration-inputs .field label { color: var(--muted); font-size
          +: 0.875rem; }                                                 
      105 +input[type='text'], input[type='date'] {                      
      106 +  font: inherit; font-size: 1rem; height: 2.85rem; padding: 0 
          +0.8rem; min-width: 0; width: 100%;                            
      107 +  border: 1.5px solid var(--border); border-radius: 10px; back
          +ground: var(--card); color: var(--fg);                        
      108  }
       52 -.duration-inputs { display: flex; gap: 0.75rem; }             
       53 -.duration-inputs .field { flex: 1; margin-bottom: 0; }        
      109 +input[type='text'] { font-variant-numeric: tabular-nums; }    
      110 +input[type='text']:hover, input[type='date']:hover { border-co
          +lor: var(--muted); }                                          
      111  input[aria-invalid='true'] { border: 2px solid var(--error); }
       55 -.field-error { color: var(--error); margin: 0.25rem 0 0; font-
          -size: 0.9rem; font-weight: 500; }                             
       56 -:focus-visible { outline: 3px solid var(--accent); outline-off
          -set: 2px; }                                                   
      112 +.field-error { margin: 0.35rem 0 0; color: var(--error); font-
          +size: 0.9rem; font-weight: 600; }                             
      113 
       58 -.days { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }   
       59 -.day { display: inline-flex; gap: 0.35rem; align-items: center
          -; font-weight: 400; }                                         
      114 +/* Working days: preset buttons and day toggles (S-2 AC-1, AC-
          +2) */                                                         
      115 +.presets { display: flex; align-items: center; flex-wrap: wrap
          +; gap: 0.45rem; margin-bottom: 0.75rem; }                     
      116 +.presets-label { color: var(--muted); font-size: 0.875rem; mar
          +gin-inline-end: 0.2rem; }                                     
      117 +.preset, .custom-tag {                                        
      118 +  font: inherit; font-size: 0.875rem; font-weight: 600; paddin
          +g: 0.3rem 0.8rem; border-radius: 999px;                       
      119 +  border: 1.5px solid var(--border); background: var(--card); 
          +color: var(--fg);                                             
      120 +}                                                             
      121 +.preset { cursor: pointer; }                                  
      122 +.preset:hover { border-color: var(--muted); }                 
      123 +.preset[aria-pressed='true'], .custom-tag { border-color: var(
          +--accent); background: var(--accent-soft); color: var(--accent
          +-strong); }                                                   
      124 +.day-toggles { display: grid; grid-template-columns: repeat(7,
          + minmax(0, 1fr)); gap: 0.4rem; }                              
      125 +.day-toggle { position: relative; }                           
      126 +.day-label {                                                  
      127 +  display: block; text-align: center; padding: 0.6rem 0; borde
          +r-radius: 10px; font-weight: 600; font-size: 0.9rem;          
      128 +  border: 1.5px solid var(--border); color: var(--muted); back
          +ground: var(--card); transition: background 0.15s, color 0.15s
          +;                                                             
      129 +}                                                             
      130 +.day-toggle:hover .day-label { border-color: var(--muted); }  
      131 +.day-input:checked + .day-label { background: var(--accent); b
          +order-color: var(--accent); color: var(--on-accent); }        
      132 +.day-input:focus-visible + .day-label { outline: 3px solid var
          +(--focus); outline-offset: 2px; }                             
      133 
      134 +/* Result card: the hero of the page */                       
      135  .result {
       62 -  background: var(--card); border: 1px solid var(--border); bo
          -rder-radius: 8px;                                             
       63 -  padding: 1rem 1.25rem; align-self: start; position: sticky; 
          -top: 1rem;                                                    
      136 +  position: sticky; top: 1.25rem; background: var(--card); bor
          +der: 1px solid var(--border);                                 
      137 +  border-radius: var(--radius); padding: 1.5rem 1.5rem 1.35rem
          +; box-shadow: var(--shadow);                                  
      138  }
       65 -.result h2 { margin: 0 0 0.5rem; font-size: 1rem; color: var(-
          --muted); text-transform: uppercase; letter-spacing: 0.04em; } 
       66 -.result h3 { margin: 1rem 0 0; font-size: 1rem; }             
       67 -.result h3:first-child { margin-top: 0; }                     
       68 -.headline { font-size: 1.3rem; font-weight: 600; margin: 0.25r
          -em 0; }                                                       
       69 -.status { display: inline-block; padding: 0 0.5rem; border: 2p
          -x solid currentColor; border-radius: 999px; font-weight: 700; 
          -}                                                             
       70 -.status-on-track { color: var(--on-track); }                  
       71 -.status-tight { color: var(--tight); }                        
       72 -.status-late { color: var(--late); }                          
       73 -.result-error { color: var(--error); font-weight: 600; }      
       74 -.note { color: var(--muted); font-size: 0.875rem; }           
      139 +.result-heading { margin: 0 0 0.9rem; font-size: 0.8rem; text-
          +transform: uppercase; letter-spacing: 0.08em; color: var(--mut
          +ed); }                                                        
      140 +.result p { margin: 0; }                                      
      141 +.hero-label { margin: 0; font-size: 0.95rem; font-weight: 600;
          + color: var(--muted); }                                       
      142 +.hero { margin: 0.15rem 0 0; line-height: 1.1; }              
      143 +.hero-number { font-size: clamp(3.5rem, 8vw, 5rem); font-weigh
          +t: 800; letter-spacing: -0.04em; color: var(--accent-strong); 
          +font-variant-numeric: tabular-nums; }                         
      144 +.hero-unit { font-size: 1.4rem; font-weight: 700; }           
      145 +.hero-detail { display: block; margin-top: 0.5rem; font-size: 
          +1rem; font-weight: 500; color: var(--muted); line-height: 1.4;
          + }                                                            
      146 +.hero-date { margin: 0.2rem 0 0; font-size: clamp(2rem, 5vw, 2
          +.6rem); font-weight: 800; letter-spacing: -0.02em; line-height
          +: 1.15; color: var(--accent-strong); }                        
      147 +.hero-complete { font-size: 1.5rem; font-weight: 700; color: v
          +ar(--accent-strong); }                                        
      148 +.warning { margin-top: 0.75rem !important; font-weight: 600; c
          +olor: var(--tight); }                                         
      149 +                                                              
      150 +.panel { margin-top: 1.25rem !important; padding: 1rem 1.1rem;
          + border-radius: 12px; display: flex; flex-direction: column; g
          +ap: 0.45rem; align-items: flex-start; }                       
      151 +.panel-neutral { background: var(--track); color: var(--fg); }
      152 +.panel-on-track { background: var(--on-track-soft); }         
      153 +.panel-tight { background: var(--tight-soft); }               
      154 +.panel-late { background: var(--late-soft); }                 
      155 +.panel-title { margin: 0; font-size: 0.95rem; }               
      156 +.panel-note { font-size: 0.9rem; color: var(--muted); }       
      157 +                                                              
      158 +.chip {                                                       
      159 +  display: inline-flex; align-items: center; gap: 0.45rem; pad
          +ding: 0.3rem 0.85rem 0.3rem 0.7rem;                           
      160 +  border-radius: 999px; font-weight: 700; font-size: 0.95rem; 
          +color: var(--on-chip); line-height: 1.3;                      
      161 +}                                                             
      162 +.chip::before { content: ''; width: 0.5rem; height: 0.5rem; bo
          +rder-radius: 50%; background: currentColor; }                 
      163 +.chip-on-track { background: var(--on-track); }               
      164 +.chip-tight { background: var(--tight); }                     
      165 +.chip-late { background: var(--late); }                       
      166 +                                                              
      167 +.finish-lead { color: var(--fg); }                            
      168 +.finish-date { font-size: 1.75rem; font-weight: 800; letter-sp
          +acing: -0.02em; line-height: 1.2; }                           
      169 +.finish-late { font-weight: 700; color: var(--late); }        
      170 +                                                              
      171 +.note { margin-top: 1.1rem !important; padding-top: 0.9rem; bo
          +rder-top: 1px solid var(--border); font-size: 0.875rem; color:
          + var(--muted); }                                              
      172 +                                                              
      173 +.empty { display: flex; flex-direction: column; align-items: c
          +enter; text-align: center; gap: 0.75rem; padding: 1.5rem 0.5re
          +m; color: var(--muted); }                                     
      174 +.empty-icon { width: 3rem; height: 3rem; fill: var(--accent-so
          +ft); stroke: var(--accent); stroke-width: 2; }                
      175 +.result-error { display: flex; gap: 0.6rem; padding: 0.9rem 1r
          +em; border-radius: 12px; background: var(--error-soft); color:
          + var(--error); font-weight: 600; }                            
      176 +.result-error::before {                                       
      177 +  content: '!'; flex: none; display: inline-grid; place-items:
          + center; width: 1.4rem; height: 1.4rem;                       
      178 +  border-radius: 50%; background: var(--error); color: var(--c
          +ard); font-weight: 800; font-size: 0.9rem;                    
      179 +}                                                             
      180 +                                                              
      181 +/* Small screens: one column, and a short summary that stays a
          +t the top (S-6 AC-7) */                                       
      182 +.summary { display: none; }                                   
      183 +@media (max-width: 760px) {                                   
      184 +  html { scroll-padding-top: 4.5rem; }                        
      185 +  .app { padding-top: 1.25rem; }                              
      186 +  .calculator { grid-template-columns: 1fr; }                 
      187 +  .result { position: static; }                               
      188 +  .summary {                                                  
      189 +    display: flex; align-items: center; gap: 0.5rem; flex-wrap
          +: wrap; position: sticky; top: 0; z-index: 10;                
      190 +    margin: 0 -1.25rem; padding: 0.65rem 1.25rem; background: 
          +var(--card); border-bottom: 1px solid var(--border);          
      191 +    box-shadow: 0 4px 12px rgb(0 0 0 / 0.08); font-weight: 600
          +;                                                             
      192 +  }                                                           
      193 +  .summary-number { font-size: 1.6rem; font-weight: 800; color
          +: var(--accent-strong); line-height: 1; }                     
      194 +  .summary-label { color: var(--muted); font-weight: 500; }   
      195 +  .summary .chip { margin-inline-start: auto; }               
      196 +  .day-label { padding: 0.55rem 0; font-size: 0.85rem; }      
      197 +}                                                             
      198 +                                                              
      199 +@media (prefers-reduced-motion: reduce) {                     
      200 +  * { transition: none !important; }                          
      201 +}                                                             

⏺ Three UI tests need updating for the new preset buttons and the three-line
  Late text, and I'm adding tests for the pressed state, the no-spare hint, the
  note lines and the hidden mobile summary. · summary

⏺ Bash(python3 - <<'PY'
      p='src/App.test.tsx'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run src/App.test.tsx -t "small-screen summary" 2>&1 | grep -E
      "Error|Expected|Received|e…)
  ⎿  (No output)
⏺ The summary showed "15min a day" because two adjacent spans lacked a space;
  the flex gap hides it on screen, but copied text would be wrong. I'm adding
  the spaces. · summary

⏺ Update(src/components/LearnerForm.tsx)
  ⎿  Added 2 lines, removed 2 lines
       98        <ResultSummary>
       99          {value?.kind === 'plan' ? (
      100            <>
      101 -            <span className="summary-number">{value.neededPerD
          -ay}</span>                                                    
      102 -            <span>{formatMinutesUnit(value.neededPerDay)} a da
          -y</span>                                                      
      101 +            <span className="summary-number">{value.neededPerD
          +ay}</span>{' '}                                               
      102 +            <span>{formatMinutesUnit(value.neededPerDay)} a da
          +y</span>{' '}                                                 
      103              {value.pace !== null && <StatusChip status={value.
           pace.status} />}
      104            </>
      105          ) : value?.kind === 'complete' ? (

⏺ Update(src/components/AdminForm.tsx)
  ⎿  Added 1 line, removed 1 line
      40        <ResultSummary>
      41          {value?.kind === 'dates' ? (
      42            <>
      43 -            <span className="summary-label">{LABELS.earliest}</
         -span>                                                          
      43 +            <span className="summary-label">{LABELS.earliest}</
         +span>{' '}                                                     
      44              <strong>{formatDisplayDate(value.earliest.date)}</s
          trong>
      45            </>
      46          ) : null}

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npm test 2>&1 | grep -E "×|Test Files|Tests
      "; npm run test:tz…)
  ⎿  (No output)
  ⎿  (timeout 4m)

⏺ All 349 tests pass across three time zones and the build works, with no
  calculation files changed. I'm checking contrast with a script next, since I
  suspect the light grey input borders are too faint to outline fields.
  · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/drive && cat > $S/contrast.mjs <<'EOF'
      const css = (await import('node:…)
  ⎿  (No output)

⏺ As expected, there was no separate border colour for controls. I'll add
  --control-border, use it on the inputs, presets and day toggles, and recheck.

⏺ Bash(python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)

⏺ All 46 colour pairs pass in both themes. Now screenshots on the running dev
  server: desktop and phone, light and dark, plus one with keyboard focus
  showing.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && curl -sf -o /dev/null http://localhost:5173/ && echo
      "dev server up"…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ My keyboard check was wrong: the first Tab already reached the role radios, so
  the arrow key only moved the text cursor. I'll recheck after reviewing the
  screenshots. · summary

  Read 3 files (ctrl+o to expand)

⏺ The desktop layout, admin view and phone summary bar all look right. I'll
  check dark mode and the top of the phone screen too.

  Read 2 files (ctrl+o to expand)

⏺ Dark mode and the phone summary bar look right, but on phones the "I am" label
  sits alone with a large gap above the switch. I'm tightening that on small
  screens, then redoing the keyboard check with one Tab and the arrow keys.
  · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  Error: Exit code 1
     Tab 1 focuses: a learner
     node:internal/modules/run_main:123
         triggerUncaughtException(
         ^

     locator.isVisible: Error: strict mode violation: getByLabel('Start date')
     resolved to 2 elements:
         1) <section class="step" aria-labelledby="step-2">…</section> aka
     getByRole('region', { name: 'Start date and working days' })
         2) <input type="date" id="startDate" value="2026-11-26"
     aria-invalid="false"/> aka getByRole('textbox', { name: 'Start date' })

     … +8 lines (ctrl+o to expand)

⏺ The script's error came from Playwright's substring label matching, not the
  app, though the arrow key did switch to the admin form. I'm making the match
  exact and rerunning. · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && sed -i '' "s/getByLabel('Start date')/getByLabel('Start
      date', { exa…)
  ⎿  (No output)

⏺ Keyboard navigation works across the form, with "Due date" repeating because
  Chrome splits the date field into parts. I'm checking the focus ring and the
  corrected phone header next. · summary

  Read 2 files (ctrl+o to expand)

⏺ The phone header is fixed and the faded "Sat" toggle is probably a 0.15 s
  colour transition caught mid-way, which I'll confirm before assuming. The
  "Enter a valid date." message is correct, since tabbing out of the empty due
  date counts as touching the field (S-5 AC-6). · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && cat > $S/drive/drive4.mjs <<'EOF'
      const { chromium } = await import(…)
  ⎿  (No output)

  Read 1 file (ctrl+o to expand)

⏺ The computed style shows the faded look was just the transition mid-way; once
  it finishes, "Sat" is white on green at the 6.3:1 contrast pair, so the colour
  check is the evidence since my last screenshot missed the toggles. I'm
  updating docs/verification.md, rerunning everything, and then committing.
  · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='docs/verification.md'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 4m)

⏺ The redesign is done, and the calculation is untouched: no file in src/lib/
  that calculates changed. Only the text helpers in format.ts and the wording in
  messages.ts changed. All 349 tests pass, including both time-zone runs, and
  the build works. I haven't committed this yet. Say if you want it committed
  the same way as the earlier steps.

  The dev server is still running, so refresh http://localhost:5173 to see it.

  What changed on screen

  - The result is the hero. It shows "You need", then a huge 15 with "min a day"
    beside it and "over 26 working days (Mon–Fri)" underneath. Below that is a
    tinted panel with a coloured chip reading On track, Tight or Late.
  - When Late, the finish date is the biggest line in the panel: "At 14 min a
    day you'll finish on" / Mon 4 Jan 2027 / "2 working days late".
  - Admin: the earliest date is the hero, and the recommended date sits in its
    own green panel.
  - Role switch: a two-option segmented control. It is still real radio buttons
    underneath, so the arrow keys and screen readers work as before.
  - Working days: seven toggle buttons, Mon to Sun, plus Mon–Fri and Sun–Thu
    preset buttons that show as pressed. Custom appears when neither matches.
  - Numbered sections: for the learner, 1 Your training, 2 Deadline and working
    days, 3 Your time. For the admin, I chose 1 The course, 2 Start date and
    working days, 3 Learning time.
  - Phone: I went with the summary at the top. A bar showing "15 min a day" and
    the status chip stays at the top while you scroll the form. Screen readers
    skip it (aria-hidden), so they still hear the result once, from the live
    region.
  - Header: a step-shaped logo, with "خطوة" next to the name.

  Accessibility

  - Contrast: a script checks 46 colour pairs in light and dark mode, and all
    pass AA. It caught that the light grey input borders were too faint to
    outline a field, so controls now have a darker border.
  - Keyboard, checked in Chromium by script: Tab reaches the role switch, the
    arrow keys switch role, Tab then runs top to bottom, and Space toggles a
    day. The focus ring shows on every control.
  - Tests: labels and the single live region are still tested. New tests cover
    the preset pressed state, the keyboard toggles and the hidden summary.

  Problems found while checking

  - Summary text missing a space. It read "15min a day", because the flex gap
    had hidden the missing space visually. Fixed.
  - "I am" label on the phone. It sat on a line of its own with a large gap.
    Fixed.

  Your two decisions

  - The extra lines are now in the docs. The minutes-left line is S-1 AC-7, the
    no-spare hint is S-3 AC-7, and the On track and Tight explanations are S-3
    AC-9. A new Screen text section lists every label. The word-for-word test
    now checks every label on the page against the docs, so they can't drift
    apart.
  - Arabic is S-7, not S-9. S-9 is public holidays. S-7 is now marked partly
    done: Arabic-Indic digits are accepted and the header shows خطوة, but there
    is no Arabic text or right-to-left layout yet.

  Still to do

  - Your own pass in the browser.
  - The VoiceOver check.
  - README and transcript.

❯ the design is still not good, it works but it looks like a plain form, not a
  product
  i want it modern and beautiful, like a professional saas tool, clean and calm
  the result is the most important thing on the page so make it the star, big
  and clear, with the status easy to see at a glance
  make it feel finished and polished on desktop and on the phone
  only visual changes, no calculation changes, keep all accessibility, run all
  tests after and show me they pass

⏺ A design skill fits this brief, so I'll load it before redesigning.

⏺ Skill(product-ui-design)
  ⎿  Loaded skill
⏺ I'm applying the skill's palette and hero layout to the existing plain CSS,
  since a purely visual change doesn't need Tailwind. · summary

⏺ Bash(cd /Users/macmini/.claude/skills/product-ui-design && wc -l
      reference/*.md && sed -n 1,140p reference/web-tokens.md)
  ⎿  (No output)

⏺ Bash(cat /Users/macmini/.claude/skills/product-ui-design/reference/layout
      -patterns.md | sed -n 1,53p)
  ⎿  (No output)

⏺ I'm applying the skill's design rules in self-hosted Fraunces and Inter, with
  a dark hero card and status tones. I'm darkening its muted text and control
  border, which fail WCAG contrast, until they pass. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51a…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Inter and Fraunces are installed (OFL licence, files served locally). Next:
  the new labels, then the components, starting with a small icon set and the
  page header.

⏺ Update(src/lib/messages.ts)
  ⎿  Added 4 lines
      71    appTitle: 'Khutwa',
      72    appTitleArabic: 'خطوة',
      73    appTagline: 'Training deadlines you can actually meet',
      74 +  learnerTitle: 'Plan your training',                          
      75 +  learnerSubtitle: "See how much to learn each working day, and
         + whether you'll finish on time.",                              
      76 +  adminTitle: 'Set a due date people can meet',                
      77 +  adminSubtitle: 'Enter the course and the daily time employees
         + get, and see the earliest date they can meet.',               
      78    roleQuestion: 'I am',
      79    roleLearner: 'a learner',
      80    roleAdmin: 'an L&D admin',

⏺ Write(src/components/icons.tsx)
  ⎿  Wrote 61 lines to src/components/icons.tsx
       1 /** Small line icons. All decorative: the text next to them carr
         ies the meaning. */
       2 import type { ReactNode } from 'react';
       3 import type { PaceStatus } from '../lib/learner';
       4
       5 function Icon({ children, className }: { children: ReactNode; cl
         assName?: string }) {
       6   return (
       7     <svg
       8       className={className ?? 'icon'}
     … +53 lines (ctrl+o to expand)

⏺ Bash(python3 - <<'PY'
      p='src/components/fields.tsx'; s=open(p).read()…)
  ⎿  (No output)

⏺ Now the learner result. The status gets an icon and a large word inside a
  tinted panel, the finish date is shown large in serif, and the hero number
  fades in again whenever it changes.

⏺ Write(src/components/LearnerForm.tsx)
  ⎿  Added 53 lines, removed 36 lines
      1  import type { IsoDate } from '../lib/dates';
      2  import { formatMinutes, formatMinutesUnit, lateParts, workingDay
         sPhrase } from '../lib/format';
      3 -import { calculateLearner, type LearnerResult } from '../lib/lea
        -rner';                                                          
      3 +import { calculateLearner, type LearnerResult, type PaceStatus }
        + from '../lib/learner';                                         
      4  import { CALC_ERROR_TEXT, LABELS, STATUS_DETAIL, STATUS_LABEL, T
         EXT } from '../lib/messages';
      5  import { parseLearnerForm, type FieldId, type LearnerFormText }
         from '../lib/parse';
      6  import type { WorkingDays } from '../lib/workingDays';
     ...
      15    Section,
      16  } from './fields';
      17  import { messageFinder, withTouched, type FormState } from './f
          ormState';
      18 +import { CheckIcon, StatusIcon } from './icons';               
      19  import { WorkingDaysPicker } from './WorkingDaysPicker';
      20 
      21  type Plan = Extract<LearnerResult, { kind: 'plan' }>;
     ...
      26    onChange: (state: FormState<LearnerFormText>) => void;
      27  }
      28 
      28 -function StatusChip({ status }: { status: 'on-track' | 'tight' 
         -| 'late' }) {                                                  
      29 +function StatusChip({ status }: { status: PaceStatus }) {      
      30    return <span className={`chip chip-${status}`}>{STATUS_LABEL[
          status]}</span>;
      31  }
      32 
      32 -/** S-3: the status panel under the daily pace. */             
      33 +/** S-3: the status, readable at a glance: icon, word and tone 
         +colour together (never colour alone). */                       
      34 +function StatusPanel({ status, children }: { status: PaceStatus
         +; children: React.ReactNode }) {                               
      35 +  return (                                                     
      36 +    <div className={`status status-${status}`}>                
      37 +      <p className="status-head">                              
      38 +        <StatusIcon status={status} />                         
      39 +        <span className="status-word">{STATUS_LABEL[status]}</s
         +pan>                                                           
      40 +      </p>                                                     
      41 +      {children}                                               
      42 +    </div>                                                     
      43 +  );                                                           
      44 +}                                                              
      45 +                                                               
      46  function PacePanel({ plan, spare }: { plan: Plan; spare: number
           | null }) {
      47    const { pace } = plan;
      35 -  if (pace === null) return <p className="panel panel-neutral">
         -{TEXT.addSpareHint}</p>;                                       
      48 +  if (pace === null) return <p className="hint">{TEXT.addSpareH
         +int}</p>;                                                      
      49    if (pace.status !== 'late') {
      50      return (
      38 -      <div className={`panel panel-${pace.status}`}>           
      39 -        <StatusChip status={pace.status} />                    
      40 -        <p>{STATUS_DETAIL[pace.status]}</p>                    
      41 -      </div>                                                   
      51 +      <StatusPanel status={pace.status}>                       
      52 +        <p className="status-text">{STATUS_DETAIL[pace.status]}
         +</p>                                                           
      53 +      </StatusPanel>                                           
      54      );
      55    }
      56    if (pace.finish === null) {
      57      return (
      46 -      <div className="panel panel-late">                       
      47 -        <StatusChip status="late" />                           
      48 -        <p>{TEXT.noSpareTime}</p>                              
      49 -      </div>                                                   
      58 +      <StatusPanel status="late">                              
      59 +        <p className="status-text">{TEXT.noSpareTime}</p>      
      60 +      </StatusPanel>                                           
      61      );
      62    }
      63    const { lead, date, lateBy } = lateParts(spare ?? 0, pace.fin
          ish.date, pace.finish.workingDaysLate);
      64    return (
      54 -    <div className="panel panel-late">                         
      55 -      <StatusChip status="late" />                             
      56 -      <p className="finish-lead">{lead}</p>                    
      65 +    <StatusPanel status="late">                                
      66 +      <p className="status-text">{lead}</p>                    
      67        <p className="finish-date">{date}</p>
      68        <p className="finish-late">{lateBy}</p>
      59 -    </div>                                                     
      69 +    </StatusPanel>                                             
      70    );
      71  }
      72 
      63 -/** S-1: the daily pace is the hero of the page. */            
      73 +/** S-1: the daily pace is the star of the page. */            
      74  function PlanView({ plan, workingDays, spare }: { plan: Plan; w
          orkingDays: WorkingDays; spare: number | null }) {
      75    return (
      76      <>
      67 -      <p className="hero-label">{LABELS.youNeed}</p>           
      77 +      <p className="eyebrow">{LABELS.youNeed}</p>              
      78        <p className="hero">
      69 -        <span className="hero-number">{plan.neededPerDay}</span
         ->{' '}                                                         
      79 +        <span className="hero-number" key={plan.neededPerDay}> 
      80 +          {plan.neededPerDay}                                  
      81 +        </span>{' '}                                           
      82          <span className="hero-unit">{formatMinutesUnit(plan.nee
          dedPerDay)} a day</span>{' '}
      83          <span className="hero-detail">over {workingDaysPhrase(p
          lan.workingDaysLeft, workingDays)}</span>
      84        </p>
     ...
      121 
      122        <div className="inputs">
      123          <Section step={1} title={LABELS.sectionTraining}>
      112 -          <DurationField                                      
      113 -            group="total"                                     
      114 -            legend={LABELS.totalTime}                         
      115 -            value={text.total}                                
      116 -            messageFor={messageFor}                           
      117 -            onChange={(total, field) => edit({ total }, [field
          -, 'total'])}                                                  
      118 -            onTouch={touch}                                   
      119 -          />                                                  
      120 -          <DurationField                                      
      121 -            group="done"                                      
      122 -            legend={LABELS.doneTime}                          
      123 -            value={text.done}                                 
      124 -            messageFor={messageFor}                           
      125 -            onChange={(done, field) => edit({ done }, [field, 
          -'done'])}                                                     
      126 -            onTouch={touch}                                   
      127 -          />                                                  
      124 +          <div className="pair">                              
      125 +            <DurationField                                    
      126 +              group="total"                                   
      127 +              legend={LABELS.totalTime}                       
      128 +              value={text.total}                              
      129 +              messageFor={messageFor}                         
      130 +              onChange={(total, field) => edit({ total }, [fie
          +ld, 'total'])}                                                
      131 +              onTouch={touch}                                 
      132 +            />                                                
      133 +            <DurationField                                    
      134 +              group="done"                                    
      135 +              legend={LABELS.doneTime}                        
      136 +              value={text.done}                               
      137 +              messageFor={messageFor}                         
      138 +              onChange={(done, field) => edit({ done }, [field
          +, 'done'])}                                                   
      139 +              onTouch={touch}                                 
      140 +            />                                                
      141 +          </div>                                              
      142          </Section>
      143          <Section step={2} title={LABELS.sectionDeadline}>
      144            <DateField
     ...
      173          ) : !calc.ok ? (
      174            <ResultError text={CALC_ERROR_TEXT[calc.error]} />
      175          ) : calc.value.kind === 'complete' ? (
      162 -          <p className="hero-complete">{TEXT.alreadyComplete}<
          -/p>                                                           
      176 +          <p className="complete">                            
      177 +            <CheckIcon />                                     
      178 +            <span>{TEXT.alreadyComplete}</span>               
      179 +          </p>                                                
      180          ) : (
      181            <PlanView plan={calc.value} workingDays={text.workin
           gDays} spare={spare} />
      182          )}

⏺ Bash(python3 - <<'PY'
      p='src/components/AdminForm.tsx'; s=open(p).read()…)
  ⎿  (No output)

⏺ Next the stylesheet, built only on tokens. Everything follows the skill's
  rules except the two contrast fixes above.

⏺ Write(src/styles.css)
  ⎿  Couldn't write file

  Read 1 file (ctrl+o to expand)

⏺ Write(src/styles.css)
  ⎿  Added 286 lines, removed 155 lines
        1 -/* Khutwa. Colour pairs are checked for WCAG AA contrast in li
          -ght and dark (see docs/verification.md). */                   
        1 +/*                                                            
        2 + * Khutwa styles. Every colour, radius and shadow is a token b
          +elow; components use only the tokens.                         
        3 + * Contrast of every text, border and focus pair is checked in
          + light and dark (docs/verification.md).                       
        4 + */                                                           
        5  :root {
        6    color-scheme: light dark;
        4 -  --bg: #f3f5f4;                                              
        5 -  --card: #ffffff;                                            
        6 -  --fg: #16201c;                                              
        7 -  --muted: #4f5a56;                                           
        8 -  --border: #d3dad7;                                          
        9 -  --control-border: #848f8a;                                  
       10 -  --track: #e4e9e7;                                           
       11 -  --accent: #0b6e4f;                                          
       12 -  --accent-strong: #08583f;                                   
       13 -  --accent-soft: #e2f1ea;                                     
       14 -  --on-accent: #ffffff;                                       
       15 -  --focus: #0b57d0;                                           
       16 -  --error: #b3261e;                                           
       17 -  --error-soft: #fcebea;                                      
       18 -  --on-track: #0b6e4f;                                        
       19 -  --on-track-soft: #e2f1ea;                                   
       20 -  --tight: #8a5a00;                                           
       21 -  --tight-soft: #fdf2dc;                                      
       22 -  --late: #b3261e;                                            
       23 -  --late-soft: #fcebea;                                       
       24 -  --on-chip: #ffffff;                                         
       25 -  --radius: 16px;                                             
       26 -  --shadow: 0 1px 2px rgb(16 32 24 / 0.06), 0 8px 24px rgb(16 
          -32 24 / 0.07);                                                
       27 -  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', 
          -Roboto, sans-serif;                                           
       28 -  line-height: 1.5;                                           
       29 -  -webkit-font-smoothing: antialiased;                        
        7 +  --font-sans: 'Inter Variable', 'Inter', ui-sans-serif, syste
          +m-ui, -apple-system, 'Segoe UI', sans-serif;                  
        8 +  --font-display: 'Fraunces Variable', 'Fraunces', ui-serif, G
          +eorgia, serif;                                                
        9 +                                                              
       10 +  /* Brand green */                                           
       11 +  --brand-50: #eef7f2;                                        
       12 +  --brand-600: #256b4d;                                       
       13 +  --brand-700: #1f5f45;                                       
       14 +  --on-brand: #ffffff;                                        
       15 +                                                              
       16 +  /* Warm neutrals */                                         
       17 +  --paper: #f7f5f2;                                           
       18 +  --surface: #ffffff;                                         
       19 +  --surface-muted: #f2efea;                                   
       20 +  --line: #e7e2db;                                            
       21 +  --control: #8f8880;                                         
       22 +  --ink: #1c1917;                                             
       23 +  --ink-soft: #57534e;                                        
       24 +  --ink-muted: #6f6963;                                       
       25 +  --focus: #256b4d;                                           
       26 +                                                              
       27 +  /* The result card */                                       
       28 +  --hero: #0a2018;                                            
       29 +  --hero-ink: #ffffff;                                        
       30 +  --hero-soft: #c9d6cf;                                       
       31 +  --hero-muted: #9fb4a8;                                      
       32 +  --hero-line: #23402f;                                       
       33 +  --hero-tile: #15352a;                                       
       34 +  --hero-glow: #1d5a40;                                       
       35 +  --hero-success: #86efac;                                    
       36 +  --hero-warning: #fcd58a;                                    
       37 +                                                              
       38 +  /* Status tones: a panel background, text on it, and a solid
          + colour for icons */                                          
       39 +  --success-bg: #ecfdf3;                                      
       40 +  --success-ink: #166534;                                     
       41 +  --success-solid: #15803d;                                   
       42 +  --warning-bg: #fffbeb;                                      
       43 +  --warning-ink: #92400e;                                     
       44 +  --warning-solid: #b45309;                                   
       45 +  --danger-bg: #fef2f2;                                       
       46 +  --danger-ink: #991b1b;                                      
       47 +  --danger-solid: #b91c1c;                                    
       48 +                                                              
       49 +  /* Chips stay pastel with dark text in both themes */       
       50 +  --success-chip: #d1fae5;                                    
       51 +  --success-chip-ink: #166534;                                
       52 +  --warning-chip: #fef3c7;                                    
       53 +  --warning-chip-ink: #92400e;                                
       54 +  --danger-chip: #fee2e2;                                     
       55 +  --danger-chip-ink: #991b1b;                                 
       56 +                                                              
       57 +  --radius-control: 12px;                                     
       58 +  --radius-panel: 18px;                                       
       59 +  --radius-card: 20px;                                        
       60 +  --radius-hero: 28px;                                        
       61 +  --shadow-card: 0 1px 2px rgb(28 25 23 / 0.04), 0 1px 3px rgb
          +(28 25 23 / 0.06);                                            
       62 +  --shadow-lift: 0 8px 24px -8px rgb(28 25 23 / 0.18), 0 2px 6
          +px rgb(28 25 23 / 0.06);                                      
       63 +  --shadow-hero: 0 30px 60px -28px rgb(10 32 24 / 0.6), 0 2px 
          +6px rgb(10 32 24 / 0.12);                                     
       64 +  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);                     
       65  }
       66 
       67  @media (prefers-color-scheme: dark) {
       68    :root {
       34 -    --bg: #0f1412;                                            
       35 -    --card: #182019;                                          
       36 -    --fg: #e6ece9;                                            
       37 -    --muted: #a7b3ae;                                         
       38 -    --border: #2e3a35;                                        
       39 -    --control-border: #6f7e77;                                
       40 -    --track: #232d29;                                         
       41 -    --accent: #5fd3a5;                                        
       42 -    --accent-strong: #7fe0b8;                                 
       43 -    --accent-soft: #1d3a2f;                                   
       44 -    --on-accent: #062117;                                     
       45 -    --focus: #8ab4f8;                                         
       46 -    --error: #ff8a80;                                         
       47 -    --error-soft: #3a1d1b;                                    
       48 -    --on-track: #5fd3a5;                                      
       49 -    --on-track-soft: #1a332a;                                 
       50 -    --tight: #f2c14e;                                         
       51 -    --tight-soft: #352b14;                                    
       52 -    --late: #ff8a80;                                          
       53 -    --late-soft: #3a1d1b;                                     
       54 -    --on-chip: #111614;                                       
       55 -    --shadow: none;                                           
       69 +    --brand-50: #163126;                                      
       70 +    --brand-600: #4cb584;                                     
       71 +    --brand-700: #94dcb6;                                     
       72 +    --on-brand: #04140c;                                      
       73 +                                                              
       74 +    --paper: #0d1210;                                         
       75 +    --surface: #151b18;                                       
       76 +    --surface-muted: #1b231f;                                 
       77 +    --line: #27312c;                                          
       78 +    --control: #74827b;                                       
       79 +    --ink: #ece8e3;                                           
       80 +    --ink-soft: #c4beb6;                                      
       81 +    --ink-muted: #a8a29a;                                     
       82 +    --focus: #7fd6a8;                                         
       83 +                                                              
       84 +    --hero: #0f2a1f;                                          
       85 +    --hero-line: #2a4a3b;                                     
       86 +    --hero-tile: #1b3d30;                                     
       87 +    --hero-glow: #1f6046;                                     
       88 +                                                              
       89 +    --success-bg: #10291c;                                    
       90 +    --success-ink: #a7f3c4;                                   
       91 +    --success-solid: #4ade80;                                 
       92 +    --warning-bg: #2b210c;                                    
       93 +    --warning-ink: #fcd58a;                                   
       94 +    --warning-solid: #fbbf24;                                 
       95 +    --danger-bg: #331614;                                     
       96 +    --danger-ink: #fdb4ae;                                    
       97 +    --danger-solid: #f87171;                                  
       98 +                                                              
       99 +    --shadow-card: none;                                      
      100 +    --shadow-hero: none;                                      
      101    }
      102  }
      103 
      104 +/* Base */                                                    
      105  * { box-sizing: border-box; }
       60 -body { margin: 0; background: var(--bg); color: var(--fg); }  
       61 -.app { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25re
          -m 4rem; }                                                     
       62 -:focus-visible { outline: 3px solid var(--focus); outline-offs
          -et: 2px; }                                                    
      106 +html { -webkit-text-size-adjust: 100%; }                      
      107 +body {                                                        
      108 +  margin: 0; background: var(--paper); color: var(--ink);     
      109 +  font-family: var(--font-sans); font-size: 15px; line-height:
          + 1.5;                                                         
      110 +  font-feature-settings: 'cv11', 'ss01'; -webkit-font-smoothin
          +g: antialiased;                                               
      111 +}                                                             
      112 +::selection { background: var(--brand-50); color: var(--ink); 
          +}                                                             
      113 +:focus-visible { outline: 2px solid var(--focus); outline-offs
          +et: 2px; }                                                    
      114 +.sr-only {                                                    
      115 +  position: absolute; width: 1px; height: 1px; padding: 0; mar
          +gin: -1px;                                                    
      116 +  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; 
          +border: 0;                                                    
      117 +}                                                             
      118 +.icon { width: 1.25rem; height: 1.25rem; flex: none; }        
      119 
       64 -/* Header */                                                  
       65 -.masthead { display: flex; align-items: center; gap: 0.9rem; m
          -argin-bottom: 1.75rem; }                                      
       66 -.logo { width: 3rem; height: 3rem; flex: none; }              
       67 -.logo rect { fill: var(--accent); }                           
       68 -.logo path { fill: none; stroke: var(--on-accent); stroke-widt
          -h: 4; stroke-linecap: round; stroke-linejoin: round; }        
       69 -.brand { margin: 0; font-size: 1.6rem; line-height: 1.2; lette
          -r-spacing: -0.01em; }                                         
       70 -.brand-ar { font-weight: 600; color: var(--muted); font-size: 
          -1.25rem; margin-inline-start: 0.35rem; }                      
       71 -.tagline { margin: 0.1rem 0 0; color: var(--muted); }         
      120 +/* Top bar */                                                 
      121 +.topbar {                                                     
      122 +  position: sticky; top: 0; z-index: 20;                      
      123 +  background: color-mix(in srgb, var(--paper) 86%, transparent
          +);                                                            
      124 +  backdrop-filter: saturate(1.4) blur(12px); -webkit-backdrop-
          +filter: saturate(1.4) blur(12px);                             
      125 +  border-bottom: 1px solid var(--line);                       
      126 +}                                                             
      127 +.topbar-inner {                                               
      128 +  max-width: 1152px; margin: 0 auto; height: 64px; padding: 0 
          +1.5rem;                                                       
      129 +  display: flex; align-items: center; justify-content: space-b
          +etween; gap: 1rem;                                            
      130 +}                                                             
      131 +.brand { display: flex; align-items: center; gap: 0.6rem; min-
          +width: 0; }                                                   
      132 +.logo {                                                       
      133 +  display: grid; place-items: center; width: 36px; height: 36p
          +x; flex: none;                                                
      134 +  border-radius: 11px; background: var(--hero); color: var(--h
          +ero-ink); box-shadow: var(--shadow-card);                     
      135 +}                                                             
      136 +.logo-icon { width: 20px; height: 20px; stroke-width: 2.6; }  
      137 +.brand-name { font-family: var(--font-display); font-size: 1.3
          +rem; font-weight: 600; letter-spacing: -0.01em; }             
      138 +.brand-ar { font-size: 1.05rem; font-weight: 600; color: var(-
          +-ink-muted); }                                                
      139 +.brand-tagline {                                              
      140 +  margin-inline-start: 0.4rem; padding-inline-start: 0.9rem; b
          +order-inline-start: 1px solid var(--line);                    
      141 +  font-size: 0.875rem; color: var(--ink-muted); white-space: n
          +owrap;                                                        
      142 +}                                                             
      143 
      144  /* Role switch: radio buttons styled as a segmented control (S
           -6 AC-5) */
       74 -.segmented { border: 0; padding: 0; margin: 0 0 1.5rem; displa
          -y: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
       75 -.segmented-legend { float: left; padding: 0; font-weight: 600;
          - color: var(--muted); margin-inline-end: 0.75rem; line-height:
          - 2.75rem; }                                                   
       76 -.segments { display: inline-grid; grid-template-columns: 1fr 1
          -fr; background: var(--track); padding: 4px; border-radius: 999
          -px; }                                                         
      145 +.segmented { display: flex; align-items: center; gap: 0.6rem; 
          +min-width: 0; margin: 0; padding: 0; border: 0; }             
      146 +.segmented-label { font-size: 0.8125rem; font-weight: 500; col
          +or: var(--ink-muted); }                                       
      147 +.segments {                                                   
      148 +  display: inline-grid; grid-template-columns: 1fr 1fr; paddin
          +g: 4px;                                                       
      149 +  background: var(--surface-muted); border: 1px solid var(--li
          +ne); border-radius: 999px;                                    
      150 +}                                                             
      151  .segment { position: relative; }
       78 -.segment-input, .day-input { position: absolute; inset: 0; opa
          -city: 0; margin: 0; cursor: pointer; }                        
      152 +.segment-input, .day-input { position: absolute; inset: 0; wid
          +th: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer
          +; }                                                           
      153  .segment-label {
       80 -  display: block; padding: 0.55rem 1.25rem; border-radius: 999
          -px; text-align: center;                                       
       81 -  font-weight: 600; color: var(--muted); white-space: nowrap; 
          -transition: background 0.15s, color 0.15s;                    
      154 +  display: block; padding: 0.45rem 1.05rem; border-radius: 999
          +px; text-align: center; white-space: nowrap;                  
      155 +  font-size: 0.875rem; font-weight: 600; color: var(--ink-soft
          +);                                                            
      156 +  transition: background 0.2s var(--ease), color 0.2s var(--ea
          +se), box-shadow 0.2s var(--ease);                             
      157  }
       83 -.segment-input:checked + .segment-label { background: var(--ca
          -rd); color: var(--fg); box-shadow: 0 1px 3px rgb(0 0 0 / 0.15)
          -; }                                                           
       84 -.segment-input:focus-visible + .segment-label { outline: 3px s
          -olid var(--focus); outline-offset: 2px; }                     
      158 +.segment:hover .segment-label { color: var(--ink); }          
      159 +.segment-input:checked + .segment-label { background: var(--su
          +rface); color: var(--ink); box-shadow: var(--shadow-lift); }  
      160 +.segment-input:focus-visible + .segment-label { outline: 2px s
          +olid var(--focus); outline-offset: 2px; }                     
      161 
       86 -/* Layout */                                                  
       87 -.calculator { display: grid; grid-template-columns: minmax(0, 
          -1.15fr) minmax(0, 0.85fr); gap: 1.5rem; align-items: start; } 
       88 -.inputs { display: flex; flex-direction: column; gap: 1rem; } 
      162 +/* Page */                                                    
      163 +.app { max-width: 1152px; margin: 0 auto; padding: 2.5rem 1.5r
          +em 4rem; animation: fade-in 0.25s ease-out both; }            
      164 +.page-header { max-width: 40rem; margin-bottom: 1.75rem; }    
      165 +.page-title {                                                 
      166 +  margin: 0; font-family: var(--font-display); font-weight: 60
          +0;                                                            
      167 +  font-size: clamp(1.75rem, 3vw, 2.25rem); line-height: 1.15; 
          +letter-spacing: -0.02em; text-wrap: balance;                  
      168 +}                                                             
      169 +.page-subtitle { margin: 0.5rem 0 0; color: var(--ink-soft); f
          +ont-size: 1rem; }                                             
      170 +.calculator { display: grid; grid-template-columns: minmax(0, 
          +1fr) 420px; gap: 1.5rem; align-items: start; }                
      171 
       90 -/* Numbered sections */                                       
       91 -.step { background: var(--card); border: 1px solid var(--borde
          -r); border-radius: var(--radius); padding: 1.25rem 1.35rem 1.3
          -5rem; box-shadow: var(--shadow); }                            
       92 -.step-title { display: flex; align-items: center; gap: 0.6rem;
          - margin: 0 0 1rem; font-size: 1.05rem; }                      
      172 +/* The form: one card, three numbered steps */                
      173 +.inputs { background: var(--surface); border: 1px solid var(--
          +line); border-radius: var(--radius-card); box-shadow: var(--sh
          +adow-card); }                                                 
      174 +.step { padding: 1.5rem 1.75rem 1.75rem; }                    
      175 +.step + .step { border-top: 1px solid var(--line); }          
      176 +.step-title { display: flex; align-items: center; gap: 0.75rem
          +; margin: 0 0 1.25rem; font-size: 1rem; font-weight: 650; lett
          +er-spacing: -0.005em; }                                       
      177  .step-number {
       94 -  display: inline-grid; place-items: center; width: 1.75rem; h
          -eight: 1.75rem; flex: none;                                   
       95 -  border-radius: 50%; background: var(--accent); color: var(--
          -on-accent); font-size: 0.875rem; font-weight: 700;            
      178 +  display: inline-grid; place-items: center; width: 28px; heig
          +ht: 28px; flex: none; border-radius: 999px;                   
      179 +  background: var(--brand-50); color: var(--brand-700); font-s
          +ize: 0.8125rem; font-weight: 700; font-variant-numeric: tabula
          +r-nums;                                                       
      180  }
       97 -                                                              
       98 -/* Fields */                                                  
       99 -.group { border: 0; padding: 0; margin: 0 0 1.1rem; min-width:
          - 0; }                                                         
      100 -.group:last-child { margin-bottom: 0; }                       
      101 -.group legend { padding: 0; margin-bottom: 0.45rem; font-weigh
          -t: 600; }                                                     
      102 -.field { display: flex; flex-direction: column; gap: 0.3rem; m
          -argin-bottom: 1.1rem; }                                       
      181 +.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1.
          +25rem 1.75rem; }                                              
      182 +.group { min-width: 0; margin: 0 0 1.25rem; padding: 0; border
          +: 0; }                                                        
      183 +.group:last-child, .pair .group { margin-bottom: 0; }         
      184 +.group legend { margin-bottom: 0.55rem; padding: 0; font-size:
          + 0.875rem; font-weight: 600; }                                
      185 +.field { display: flex; flex-direction: column; gap: 0.375rem;
          + margin-bottom: 1.25rem; }                                    
      186  .field:last-child { margin-bottom: 0; }
      104 -.field label { font-weight: 500; font-size: 0.95rem; }        
      105 -.duration-inputs { display: grid; grid-template-columns: 1fr 1
          -fr; gap: 0.75rem; }                                           
      106 -.duration-inputs .field label { color: var(--muted); font-size
          -: 0.875rem; }                                                 
      187 +.field label { font-size: 0.875rem; font-weight: 600; }       
      188 +.duration-inputs { display: grid; grid-template-columns: 1fr 1
          +fr; gap: 0.625rem; }                                          
      189 +.duration-inputs .field label { font-size: 0.75rem; font-weigh
          +t: 600; color: var(--ink-muted); }                            
      190  input[type='text'], input[type='date'] {
      108 -  font: inherit; font-size: 1rem; height: 2.85rem; padding: 0 
          -0.8rem; min-width: 0; width: 100%;                            
      109 -  border: 1.5px solid var(--control-border); border-radius: 10
          -px; background: var(--card); color: var(--fg);                
      191 +  width: 100%; min-width: 0; height: 44px; padding: 0 0.875rem
          +;                                                             
      192 +  font: inherit; font-size: 0.9375rem; color: var(--ink); back
          +ground: var(--surface);                                       
      193 +  border: 1px solid var(--control); border-radius: var(--radiu
          +s-control);                                                   
      194 +  transition: border-color 0.15s, box-shadow 0.15s;           
      195  }
      196  input[type='text'] { font-variant-numeric: tabular-nums; }
      112 -input[type='text']:hover, input[type='date']:hover { border-co
          -lor: var(--fg); }                                             
      113 -input[aria-invalid='true'] { border: 2px solid var(--error); }
      114 -.field-error { margin: 0.35rem 0 0; color: var(--error); font-
          -size: 0.9rem; font-weight: 600; }                             
      197 +input[type='text']:hover, input[type='date']:hover { border-co
          +lor: var(--ink-soft); }                                       
      198 +input[type='text']:focus-visible, input[type='date']:focus-vis
          +ible { outline: 2px solid var(--focus); outline-offset: 1px; b
          +order-color: var(--focus); }                                  
      199 +input[aria-invalid='true'] { border-color: var(--danger-solid)
          +; box-shadow: inset 0 0 0 1px var(--danger-solid); }          
      200 +.field-error { margin: 0.4rem 0 0; color: var(--danger-solid);
          + font-size: 0.8125rem; font-weight: 600; }                    
      201 
      202  /* Working days: preset buttons and day toggles (S-2 AC-1, AC-
           2) */
      117 -.presets { display: flex; align-items: center; flex-wrap: wrap
          -; gap: 0.45rem; margin-bottom: 0.75rem; }                     
      118 -.presets-label { color: var(--muted); font-size: 0.875rem; mar
          -gin-inline-end: 0.2rem; }                                     
      203 +.presets { display: flex; flex-wrap: wrap; align-items: center
          +; gap: 0.5rem; margin-bottom: 0.75rem; }                      
      204 +.presets-label { margin-inline-end: 0.25rem; font-size: 0.75re
          +m; font-weight: 700; letter-spacing: 0.08em; text-transform: u
          +ppercase; color: var(--ink-muted); }                          
      205  .preset, .custom-tag {
      120 -  font: inherit; font-size: 0.875rem; font-weight: 600; paddin
          -g: 0.3rem 0.8rem; border-radius: 999px;                       
      121 -  border: 1.5px solid var(--control-border); background: var(-
          --card); color: var(--fg);                                     
      206 +  display: inline-flex; align-items: center; height: 32px; pad
          +ding: 0 0.875rem; border-radius: 999px;                       
      207 +  font: inherit; font-size: 0.8125rem; font-weight: 600; color
          +: var(--ink-soft);                                            
      208 +  background: var(--surface); border: 1px solid var(--control)
          +;                                                             
      209  }
      123 -.preset { cursor: pointer; }                                  
      124 -.preset:hover { border-color: var(--fg); }                    
      125 -.preset[aria-pressed='true'], .custom-tag { border-color: var(
          ---accent); background: var(--accent-soft); color: var(--accent
          --strong); }                                                   
      126 -.day-toggles { display: grid; grid-template-columns: repeat(7,
          - minmax(0, 1fr)); gap: 0.4rem; }                              
      210 +.preset { cursor: pointer; transition: background 0.15s, borde
          +r-color 0.15s, color 0.15s; }                                 
      211 +.preset:hover { border-color: var(--ink-soft); color: var(--in
          +k); }                                                         
      212 +.preset:active, .day-toggle:active .day-label { transform: sca
          +le(0.97); }                                                   
      213 +.preset[aria-pressed='true'], .custom-tag { background: var(--
          +brand-50); border-color: var(--brand-600); color: var(--brand-
          +700); }                                                       
      214 +.day-toggles { display: grid; grid-template-columns: repeat(7,
          + minmax(0, 1fr)); gap: 0.5rem; }                              
      215  .day-toggle { position: relative; }
      216  .day-label {
      129 -  display: block; text-align: center; padding: 0.6rem 0; borde
          -r-radius: 10px; font-weight: 600; font-size: 0.9rem;          
      130 -  border: 1.5px solid var(--control-border); color: var(--mute
          -d); background: var(--card); transition: background 0.15s, col
          -or 0.15s;                                                     
      217 +  display: grid; place-items: center; height: 44px; border-rad
          +ius: var(--radius-control);                                   
      218 +  font-size: 0.875rem; font-weight: 600; color: var(--ink-soft
          +); background: var(--surface); border: 1px solid var(--control
          +);                                                            
      219 +  transition: background 0.15s, border-color 0.15s, color 0.15
          +s, transform 0.1s;                                            
      220  }
      132 -.day-toggle:hover .day-label { border-color: var(--fg); }     
      133 -.day-input:checked + .day-label { background: var(--accent); b
          -order-color: var(--accent); color: var(--on-accent); }        
      134 -.day-input:focus-visible + .day-label { outline: 3px solid var
          -(--focus); outline-offset: 2px; }                             
      221 +.day-toggle:hover .day-label { border-color: var(--ink-soft); 
          +color: var(--ink); }                                          
      222 +.day-input:checked + .day-label { background: var(--brand-600)
          +; border-color: var(--brand-600); color: var(--on-brand); box-
          +shadow: var(--shadow-card); }                                 
      223 +.day-input:focus-visible + .day-label { outline: 2px solid var
          +(--focus); outline-offset: 2px; }                             
      224 
      136 -/* Result card: the hero of the page */                       
      225 +/* The result: the star of the page */                        
      226  .result {
      138 -  position: sticky; top: 1.25rem; background: var(--card); bor
          -der: 1px solid var(--border);                                 
      139 -  border-radius: var(--radius); padding: 1.5rem 1.5rem 1.35rem
          -; box-shadow: var(--shadow);                                  
      227 +  position: sticky; top: 88px; overflow: hidden; isolation: is
          +olate;                                                        
      228 +  color: var(--hero-ink); background: var(--hero); border: 1px
          + solid var(--hero-line);                                      
      229 +  border-radius: var(--radius-hero); box-shadow: var(--shadow-
          +hero);                                                        
      230  }
      141 -.result-heading { margin: 0 0 0.9rem; font-size: 0.8rem; text-
          -transform: uppercase; letter-spacing: 0.08em; color: var(--mut
          -ed); }                                                        
      142 -.result p { margin: 0; }                                      
      143 -.hero-label { margin: 0; font-size: 0.95rem; font-weight: 600;
          - color: var(--muted); }                                       
      144 -.hero { margin: 0.15rem 0 0; line-height: 1.1; }              
      145 -.hero-number { font-size: clamp(3.5rem, 8vw, 5rem); font-weigh
          -t: 800; letter-spacing: -0.04em; color: var(--accent-strong); 
          -font-variant-numeric: tabular-nums; }                         
      146 -.hero-unit { font-size: 1.4rem; font-weight: 700; }           
      147 -.hero-detail { display: block; margin-top: 0.5rem; font-size: 
          -1rem; font-weight: 500; color: var(--muted); line-height: 1.4;
          - }                                                            
      148 -.hero-date { margin: 0.2rem 0 0; font-size: clamp(2rem, 5vw, 2
          -.6rem); font-weight: 800; letter-spacing: -0.02em; line-height
          -: 1.15; color: var(--accent-strong); }                        
      149 -.hero-complete { font-size: 1.5rem; font-weight: 700; color: v
          -ar(--accent-strong); }                                        
      150 -.warning { margin-top: 0.75rem !important; font-weight: 600; c
          -olor: var(--tight); }                                         
      231 +.result::before {                                             
      232 +  content: ''; position: absolute; inset: 0; z-index: -1; poin
          +ter-events: none;                                             
      233 +  background: radial-gradient(520px 260px at 100% 0%, var(--he
          +ro-glow), transparent 70%);                                   
      234 +}                                                             
      235 +.result-body { display: flex; flex-direction: column; min-heig
          +ht: 360px; padding: 2rem 2rem 1.75rem; }                      
      236 +.result-body p, .result-body h3 { margin: 0; }                
      237 +.eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacin
          +g: 0.1em; text-transform: uppercase; color: var(--hero-muted);
          + }                                                            
      238 +.hero { margin-top: 0.75rem !important; line-height: 1; }     
      239 +.hero-number {                                                
      240 +  display: inline-block; font-family: var(--font-display); fon
          +t-weight: 600;                                                
      241 +  font-size: clamp(4.5rem, 9vw, 6.5rem); line-height: 0.9; let
          +ter-spacing: -0.045em;                                        
      242 +  font-variant-numeric: tabular-nums lining-nums; animation: r
          +ise 0.35s var(--ease) both;                                   
      243 +}                                                             
      244 +.hero-unit { margin-inline-start: 0.35rem; font-size: 1.375rem
          +; font-weight: 600; }                                         
      245 +.hero-detail { display: block; margin-top: 0.9rem !important; 
          +font-size: 1rem; line-height: 1.45; color: var(--hero-soft); }
      246 +.hero-date {                                                  
      247 +  margin-top: 0.6rem !important; font-family: var(--font-displ
          +ay); font-weight: 600;                                        
      248 +  font-size: clamp(2.25rem, 4.5vw, 3rem); line-height: 1.05; l
          +etter-spacing: -0.025em; animation: rise 0.35s var(--ease) bot
          +h;                                                            
      249 +}                                                             
      250 +.warning { margin-top: 1rem !important; font-weight: 600; colo
          +r: var(--hero-warning); }                                     
      251 
      152 -.panel { margin-top: 1.25rem !important; padding: 1rem 1.1rem;
          - border-radius: 12px; display: flex; flex-direction: column; g
          -ap: 0.45rem; align-items: flex-start; }                       
      153 -.panel-neutral { background: var(--track); color: var(--fg); }
      154 -.panel-on-track { background: var(--on-track-soft); }         
      155 -.panel-tight { background: var(--tight-soft); }               
      156 -.panel-late { background: var(--late-soft); }                 
      157 -.panel-title { margin: 0; font-size: 0.95rem; }               
      158 -.panel-note { font-size: 0.9rem; color: var(--muted); }       
      252 +.status { margin-top: 1.5rem !important; padding: 1.1rem 1.25r
          +em 1.2rem; border-radius: var(--radius-panel); color: var(--in
          +k); background: var(--tone-bg); }                             
      253 +.status-on-track { --tone-bg: var(--success-bg); --tone-ink: v
          +ar(--success-ink); --tone-solid: var(--success-solid); }      
      254 +.status-tight { --tone-bg: var(--warning-bg); --tone-ink: var(
          +--warning-ink); --tone-solid: var(--warning-solid); }         
      255 +.status-late { --tone-bg: var(--danger-bg); --tone-ink: var(--
          +danger-ink); --tone-solid: var(--danger-solid); }             
      256 +.status-head { display: flex; align-items: center; gap: 0.5rem
          +; color: var(--tone-ink); font-size: inherit; }               
      257 +.status-head .icon { width: 1.4rem; height: 1.4rem; color: var
          +(--tone-solid); }                                             
      258 +.status-word { font-size: 1.25rem; font-weight: 700; letter-sp
          +acing: -0.01em; }                                             
      259 +.status-text { margin-top: 0.4rem !important; font-size: 0.937
          +5rem; color: var(--ink); }                                    
      260 +.status-note { margin-top: 0.5rem !important; font-size: 0.812
          +5rem; color: var(--ink-soft); }                               
      261 +.finish-date {                                                
      262 +  margin-top: 0.15rem !important; font-family: var(--font-disp
          +lay); font-weight: 600;                                       
      263 +  font-size: 1.875rem; line-height: 1.15; letter-spacing: -0.0
          +2em; color: var(--ink);                                       
      264 +}                                                             
      265 +.finish-late { margin-top: 0.25rem !important; font-weight: 70
          +0; color: var(--tone-ink); }                                  
      266 +.hint {                                                       
      267 +  margin-top: 1.5rem !important; padding: 1rem 1.25rem; border
          +-radius: var(--radius-panel);                                 
      268 +  border: 1px dashed var(--hero-muted); color: var(--hero-soft
          +);                                                            
      269 +}                                                             
      270 +.note { margin-top: auto !important; padding-top: 1.5rem; font
          +-size: 0.8125rem; line-height: 1.5; color: var(--hero-muted); 
          +}                                                             
      271 +.note::before { content: ''; display: block; height: 1px; marg
          +in-bottom: 1rem; background: var(--hero-line); }              
      272 
      160 -.chip {                                                       
      161 -  display: inline-flex; align-items: center; gap: 0.45rem; pad
          -ding: 0.3rem 0.85rem 0.3rem 0.7rem;                           
      162 -  border-radius: 999px; font-weight: 700; font-size: 0.95rem; 
          -color: var(--on-chip); line-height: 1.3;                      
      273 +.empty { flex: 1; display: flex; flex-direction: column; align
          +-items: center; justify-content: center; gap: 1rem; padding: 1
          +.5rem 1rem; text-align: center; }                             
      274 +.empty-icon { display: grid; place-items: center; width: 56px;
          + height: 56px; border-radius: 16px; background: var(--hero-til
          +e); color: var(--hero-soft); }                                
      275 +.empty-icon .icon { width: 28px; height: 28px; }              
      276 +.empty-text { max-width: 17rem; font-size: 1.0625rem; font-wei
          +ght: 500; color: var(--hero-soft); }                          
      277 +.result-error {                                               
      278 +  display: flex; align-items: flex-start; gap: 0.75rem; paddin
          +g: 1rem 1.25rem; border-radius: var(--radius-panel);          
      279 +  background: var(--danger-bg); color: var(--danger-ink); font
          +-weight: 600;                                                 
      280  }
      164 -.chip::before { content: ''; width: 0.5rem; height: 0.5rem; bo
          -rder-radius: 50%; background: currentColor; }                 
      165 -.chip-on-track { background: var(--on-track); }               
      166 -.chip-tight { background: var(--tight); }                     
      167 -.chip-late { background: var(--late); }                       
      281 +.result-error::before {                                       
      282 +  content: '!'; display: grid; place-items: center; width: 1.4
          +rem; height: 1.4rem; flex: none; border-radius: 999px;        
      283 +  background: var(--danger-solid); color: var(--danger-bg); fo
          +nt-weight: 800; font-size: 0.85rem;                           
      284 +}                                                             
      285 +.complete { display: flex; align-items: center; gap: 0.75rem; 
          +font-family: var(--font-display); font-size: 1.75rem; font-wei
          +ght: 600; line-height: 1.2; }                                 
      286 +.complete .icon { width: 2.25rem; height: 2.25rem; color: var(
          +--hero-success); }                                            
      287 
      169 -.finish-lead { color: var(--fg); }                            
      170 -.finish-date { font-size: 1.75rem; font-weight: 800; letter-sp
          -acing: -0.02em; line-height: 1.2; }                           
      171 -.finish-late { font-weight: 700; color: var(--late); }        
      288 +/* Status chips (the phone summary) */                        
      289 +.chip { display: inline-flex; align-items: center; gap: 0.4rem
          +; height: 28px; padding: 0 0.75rem 0 0.6rem; border-radius: 99
          +9px; font-size: 0.8125rem; font-weight: 700; }                
      290 +.chip::before { content: ''; width: 0.45rem; height: 0.45rem; 
          +border-radius: 999px; background: currentColor; }             
      291 +.chip-on-track { background: var(--success-chip); color: var(-
          +-success-chip-ink); }                                         
      292 +.chip-tight { background: var(--warning-chip); color: var(--wa
          +rning-chip-ink); }                                            
      293 +.chip-late { background: var(--danger-chip); color: var(--dang
          +er-chip-ink); }                                               
      294 
      173 -.note { margin-top: 1.1rem !important; padding-top: 0.9rem; bo
          -rder-top: 1px solid var(--border); font-size: 0.875rem; color:
          - var(--muted); }                                              
      295 +/* Small-screen summary (S-6 AC-7): hidden on wide screens */ 
      296 +.summary { display: none; }                                   
      297 
      175 -.empty { display: flex; flex-direction: column; align-items: c
          -enter; text-align: center; gap: 0.75rem; padding: 1.5rem 0.5re
          -m; color: var(--muted); }                                     
      176 -.empty-icon { width: 3rem; height: 3rem; fill: var(--accent-so
          -ft); stroke: var(--accent); stroke-width: 2; }                
      177 -.result-error { display: flex; gap: 0.6rem; padding: 0.9rem 1r
          -em; border-radius: 12px; background: var(--error-soft); color:
          - var(--error); font-weight: 600; }                            
      178 -.result-error::before {                                       
      179 -  content: '!'; flex: none; display: inline-grid; place-items:
          - center; width: 1.4rem; height: 1.4rem;                       
      180 -  border-radius: 50%; background: var(--error); color: var(--c
          -ard); font-weight: 800; font-size: 0.9rem;                    
      298 +@media (max-width: 960px) {                                   
      299 +  .brand-tagline { display: none; }                           
      300 +  .calculator { grid-template-columns: minmax(0, 1fr) 360px; }
      301 +  .result-body { padding: 1.75rem 1.5rem 1.5rem; }            
      302  }
      303 
      183 -/* Small screens: one column, and a short summary that stays a
          -t the top (S-6 AC-7) */                                       
      184 -.summary { display: none; }                                   
      304  @media (max-width: 760px) {
      186 -  html { scroll-padding-top: 4.5rem; }                        
      187 -  .app { padding-top: 1.25rem; }                              
      188 -  .calculator { grid-template-columns: 1fr; }                 
      305 +  html { scroll-padding-top: 5.5rem; }                        
      306 +  .topbar { position: static; }                               
      307 +  .topbar-inner { height: auto; padding: 0.875rem 1rem; flex-w
          +rap: wrap; row-gap: 0.75rem; }                                
      308 +  .segmented { width: 100%; }                                 
      309 +  .segments { flex: 1; }                                      
      310 +  .app { padding: 1.5rem 1rem 3rem; }                         
      311 +  .page-header { margin-bottom: 1.25rem; }                    
      312 +  .page-subtitle { font-size: 0.9375rem; }                    
      313 +  .calculator { grid-template-columns: 1fr; gap: 1rem; }      
      314 +  .step { padding: 1.25rem 1.125rem 1.375rem; }               
      315 +  .pair { grid-template-columns: 1fr; gap: 1.25rem; }         
      316 +  .day-toggles { gap: 0.35rem; }                              
      317 +  .day-label { height: 42px; font-size: 0.8125rem; }          
      318    .result { position: static; }
      319 +  .result-body { min-height: 0; padding: 1.75rem 1.375rem 1.5r
          +em; }                                                         
      320 +  .empty { padding: 1rem; }                                   
      321    .summary {
      191 -    display: flex; align-items: center; gap: 0.5rem; flex-wrap
          -: wrap; position: sticky; top: 0; z-index: 10;                
      192 -    margin: 0 -1.25rem; padding: 0.65rem 1.25rem; background: 
          -var(--card); border-bottom: 1px solid var(--border);          
      193 -    box-shadow: 0 4px 12px rgb(0 0 0 / 0.08); font-weight: 600
          -;                                                             
      322 +    position: sticky; top: 0.75rem; z-index: 15; display: flex
          +; align-items: center; gap: 0.5rem;                           
      323 +    min-height: 56px; padding: 0.6rem 0.75rem 0.6rem 1.1rem; b
          +order-radius: var(--radius-panel);                            
      324 +    color: var(--hero-ink); background: var(--hero); border: 1
          +px solid var(--hero-line); box-shadow: var(--shadow-hero);    
      325 +    font-weight: 600; animation: rise 0.3s var(--ease) both;  
      326    }
      195 -  .summary-number { font-size: 1.6rem; font-weight: 800; color
          -: var(--accent-strong); line-height: 1; }                     
      196 -  .summary-label { color: var(--muted); font-weight: 500; }   
      327 +  .summary-number { font-family: var(--font-display); font-siz
          +e: 1.75rem; font-weight: 600; line-height: 1; font-variant-num
          +eric: tabular-nums; }                                         
      328 +  .summary-label { color: var(--hero-muted); font-weight: 500;
          + font-size: 0.8125rem; }                                      
      329    .summary .chip { margin-inline-start: auto; }
      198 -  .day-label { padding: 0.55rem 0; font-size: 0.85rem; }      
      199 -  .segmented { display: block; }                              
      200 -  .segmented-legend { float: none; line-height: 1.5; margin-bo
          -ttom: 0.4rem; }                                               
      201 -  .segments { display: grid; width: 100%; }                   
      330  }
      331 
      332 +@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      333 +@keyframes rise { from { opacity: 0; transform: translateY(6px
          +); } to { opacity: 1; transform: none; } }                    
      334 +                                                              
      335  @media (prefers-reduced-motion: reduce) {
      205 -  * { transition: none !important; }                          
      336 +  *, *::before, *::after { animation: none !important; transit
          +ion: none !important; }                                       
      337  }

⏺ Now the contrast check, rewritten for the new tokens. It also covers the pairs
  that sit inside the dark result card.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/drive && python3 - "$S/contrast.mjs" <<'PY'
      import sys,re…)
  ⎿  (No output)

⏺ The script printed nothing at all, which shouldn't happen. I'll look at its
  exit code and error output.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/drive && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && n…)
  ⎿  (No output)

⏺ My edit cut off the end of the script: I replaced the pair list but never put
  back the code after it, so the script ran to the end without printing
  anything. I'll rewrite the whole script.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/drive && python3 - "$S/contrast.mjs" <<'PY'
      import sys…)
  ⎿  (No output)

⏺ Two failures: the muted text over the brightest part of the green glow behind
  the result. I'll make the glow subtler so even its brightest point keeps
  4.5:1.

⏺ Bash(sed -i '' 's/--hero-glow: #1d5a40;/--hero-glow: #164030;/; s/--hero-glow:
      #1f6046;/--hero-glow: #184533;/' src/styles.css && grep -n "hero-glow:"
      src/styles.css…)
  ⎿  (No output)

⏺ All 80 pairs pass. Next I'll add the new page titles to the docs' "Screen
  text" section; the word-for-word test would fail without them. Then I'll run
  the whole suite.

⏺ Bash(python3 - <<'PY'
      p='docs/user-stories.md'; s=open(p).read()…)  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 353 tests pass, including the four new label checks. Next I'll take
  screenshots at 1360 px and 390 px, in light and dark, across the result
  states, and confirm the self-hosted fonts load. · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && curl -sf -o /dev/null http://localhost:5173/ && echo
      "dev server up"…)
  ⎿  (No output)
  ⎿  (timeout 3m)

  Read 2 files (ctrl+o to expand)

⏺ The Late state's screenshot looks right, but the empty-state shot is washed
  out because it was captured mid-fade; I'm retaking it once the fade finishes
  and then checking the other states. · summary

  Read 3 files (ctrl+o to expand)

⏺ The phone summary bar and Tight look right, but the admin hero date wraps onto
  two lines, so I'm sizing it to fit on one line. Then I'll reshoot the empty,
  dark, error and phone states. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

  Read 4 files (ctrl+o to expand)

⏺ A green glow bleeds into the phone header because the result card lacks
  position: relative, so I'm adding that to fix it. I'll also centre the error
  message vertically inside the card. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 2m)

  Read 3 files (ctrl+o to expand)

⏺ Both fixes are working, but the card on mobile has a large gap above it,
  caused by a leftover top: 88px from the desktop sticky rule. I'm removing that
  offset next. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && sed -i '' 's/  .result {
      position: relative; }/  .result { position: relative; top: auto; }/'
      src/styles.css && grep…)
  ⎿  (No output)

  Read 1 file (ctrl+o to expand)

⏺ The phone result now sits 16 px below the form, matching the spacing
  elsewhere. Next I'll run the full verification: all tests, both time zones,
  the build, contrast, and a check that no calculation file changed since the
  last commit. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "=== typecheck
      ===" && npx tsc --noEmit && echo "ty…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ All green. I'll update the numbers in docs/verification.md to match this run.

⏺ Bash(python3 - <<'PY'
      p='docs/verification.md'; s=open(p).read()…)
  ⎿  (No output)

⏺ The redesign is done, and all 353 tests pass, including both time-zone runs.

  Test Files  10 passed (10)
       Tests  353 passed (353)     npm test
       Tests  353 passed (353)     TZ=Pacific/Kiritimati
       Tests  353 passed (353)     TZ=America/Adak
  ✓ build    ✓ types    ✓ contrast: all 80 pairs pass

  No calculation file changed since the last commit; git diff on the eight
  engine files is empty. Refresh http://localhost:5173 to see it.

  What changed

  - The result card is the star. It's a deep green card on the right of the page
    and stays in view while you scroll on desktop. "You need" sits above a
    large serif 15, with "min a day" next to it.
  - Status at a glance. Under the number, a tinted panel combines an icon and a
    large word: green ✓ On track, amber ⚠ Tight, red ◷ Late. For Late, the
    finish date (Mon 4 Jan 2027) is shown large, with "2 working days late" in
    red below it.
  - Admin. The earliest date is the hero, and the recommended date sits in a
    green panel inside the card.
  - Calmer form. It's now one white card with three numbered steps separated by
    hairlines. Total time and time done sit side by side on desktop. Inputs are
    44 px tall.
  - Top bar. Logo, "Khutwa خطوة", tagline, and the learner/admin switch on the
    right. Each role gets a serif page title with a one-line subtitle.
  - Phone. A floating dark summary ("15 min a day" plus the status chip) stays
    at the top while you fill in the form. Nothing scrolls sideways at 360 px.

  This follows the design skill's style: warm paper background, deep
  green, Fraunces and Inter, soft shadows. Dark mode is supported too.

  Accessibility

  - Unchanged and still tested: labels, the radio buttons and checkboxes under
    the custom controls, the single live region, and visible focus.
  - Contrast: checked on 80 colour pairs in light and dark mode. The skill's own
    muted grey and input border fail WCAG (3.7:1 and 1.5:1), so I darkened
    both.
  - Reduced motion: animations switch off for people who turn motion off.

  Problems found in the screenshots

  - Admin date wrapped onto two lines. "Wed 2 Dec / 2026" broke across lines;
    resized to fit on one.
  - Glow bleeding on phones. The result card's green glow leaked into the phone
    header; fixed.
  - 88 px gap on phones. A side effect of that glow fix left a gap above the
    result card. It's now 16 px.
  - Error state. The message sat at the top of an empty card; it's now centred.
  - Glow contrast. The glow made the muted text fail contrast; I toned the glow
    down.

  Docs and dependencies

  - Two font packages added. @fontsource-variable/inter and
    @fontsource-variable/fraunces are free (OFL licence) and served from the app
    itself, with no Google Fonts call, so "no cloud services" still holds.
  - New text on screen. The page titles and subtitles are in the docs' Screen
    text section, and the word-for-word test checks them.

  Nothing is committed yet, from this round or the previous one. Should I commit
  both rounds now?

❯ i made this design in another session:
  https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu
  build the ui to look like it
  keep our app's behaviour and texts from the docs (our presets are mon–fri and
  sun–thu), take only the look from the design
  keep it responsive with your summary on the phone and all the accessibility
  pace meter and timeline last, only if everything else is done
  visual only, no calculation changes, run all tests after and show me they
  pass

⏺ I'll start by reading the design artifact.

⏺ Artifact(read https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu)
  ⎿  Received 36.6KB (200 OK)

⏺ The design lives on a canvas, so I'll list its files and then read its index
  and artboards. I'm only reading it, not changing it.

⏺ Artifact(list files of "Khutwa UI preview" ·
          https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu)
  ⎿  listed 39 files

⏺ Artifact(read 6 files of "Khutwa UI preview")
  ⎿  saved 6 files under
     /private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e
     5d1f9/scratchpad/artifact-files/f7abf2c6-9880-4fe2-9694-19399dfb844a

⏺ I have the main, Late and Admin boards. I'll pull the result section of the
  Error board too, so the error state matches the design.

⏺ Bash(F=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/artifact-files/f7abf2c6-9880-4fe2-9694-19399dfb844a/projec
      t/Error.dc.ht…)
  ⎿  (No output)

⏺ I'm matching the design's look, but dropping the weekend presets, Arabic
  toggle, text date inputs and extra stats; I'll darken the input borders to
  reach 3:1 contrast and remove the page titles from the docs too. The pace
  meter and timeline come last. · summary

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"
      npm_config_cache=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d
      -874e-f3e689e5d1f9/scratchpa…)  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Space Grotesk is in and Fraunces is out, both self-hosted and OFL-licensed.
  Next, I'll remove the page titles from messages.ts and the docs, and build the
  header the way the design has it.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ I'm moving the "h" and "min" labels after the small inputs while keeping the
  existing "Hours" and "Minutes" label elements, so accessibility stays the
  same. · summary

⏺ Bash(python3 - <<'PY'
      p='src/components/fields.tsx'; s=open(p).read()…)
  ⎿  (No output)

⏺ The markup is done and type-checks. Now the stylesheet in the design's
  palette. Every value is still a token, and dark mode is kept.

  Read 1 file (ctrl+o to expand)

⏺ Write(src/styles.css)
  ⎿  Added 203 lines, removed 243 lines
        1  /*
        2 - * Khutwa styles. Every colour, radius and shadow is a token b
          -elow; components use only the tokens.                         
        3 - * Contrast of every text, border and focus pair is checked in
          - light and dark (docs/verification.md).                       
        2 + * Khutwa styles, after the "Khutwa UI preview" design: warm g
          +rey page, white cards, Space Grotesk                          
        3 + * for the big numbers, blue for selection. Every colour, radi
          +us and shadow is a token below.                               
        4 + * Contrast of every text, border, icon and focus pair is chec
          +ked in light and dark (docs/verification.md).                 
        5   */
        6  :root {
        7    color-scheme: light dark;
        8    --font-sans: 'Inter Variable', 'Inter', ui-sans-serif, syste
           m-ui, -apple-system, 'Segoe UI', sans-serif;
        8 -  --font-display: 'Fraunces Variable', 'Fraunces', ui-serif, G
          -eorgia, serif;                                                
        9 +  --font-display: 'Space Grotesk Variable', 'Space Grotesk', '
          +Inter Variable', ui-sans-serif, sans-serif;                   
       10 
       10 -  /* Brand green */                                           
       11 -  --brand-50: #eef7f2;                                        
       12 -  --brand-600: #256b4d;                                       
       13 -  --brand-700: #1f5f45;                                       
       14 -  --on-brand: #ffffff;                                        
       11 +  /* Neutrals */                                              
       12 +  --page: #f4f4f0;                                            
       13 +  --card: #ffffff;                                            
       14 +  --card-line: #e3e3dc;                                       
       15 +  --divider: #ecece6;                                         
       16 +  --tile: #f4f4f0;                                            
       17 +  --track: #e7e7e0;                                           
       18 +  --control: #8b8c84;                                         
       19 +  --ink: #16181d;                                             
       20 +  --ink-2: #3d4048;                                           
       21 +  --ink-3: #4a4e57;                                           
       22 +  --muted: #5b5f68;                                           
       23 +  --on-ink: #ffffff;                                          
       24 
       16 -  /* Warm neutrals */                                         
       17 -  --paper: #f7f5f2;                                           
       18 -  --surface: #ffffff;                                         
       19 -  --surface-muted: #f2efea;                                   
       20 -  --line: #e7e2db;                                            
       21 -  --control: #8f8880;                                         
       22 -  --ink: #1c1917;                                             
       23 -  --ink-soft: #57534e;                                        
       24 -  --ink-muted: #6f6963;                                       
       25 -  --focus: #256b4d;                                           
       25 +  /* Accent (selection) */                                    
       26 +  --accent: #2b4fd8;                                          
       27 +  --on-accent: #ffffff;                                       
       28 +  --accent-soft: #eef2fd;                                     
       29 +  --accent-ink: #1e3aa8;                                      
       30 +  --info-ink: #23305c;                                        
       31 +  --focus: #2b4fd8;                                           
       32 
       27 -  /* The result card */                                       
       28 -  --hero: #0a2018;                                            
       29 -  --hero-ink: #ffffff;                                        
       30 -  --hero-soft: #c9d6cf;                                       
       31 -  --hero-muted: #9fb4a8;                                      
       32 -  --hero-line: #23402f;                                       
       33 -  --hero-tile: #15352a;                                       
       34 -  --hero-glow: #164030;                                       
       35 -  --hero-success: #86efac;                                    
       36 -  --hero-warning: #fcd58a;                                    
       33 +  /* Status tones: chip (background + text), message box (back
          +ground + text), icon */                                       
       34 +  --ok-chip: #e3f2e8;                                         
       35 +  --ok-chip-ink: #1a5e33;                                     
       36 +  --ok-box: #e9f5ee;                                          
       37 +  --ok-box-ink: #24452f;                                      
       38 +  --tight-chip: #fbf0d9;                                      
       39 +  --tight-chip-ink: #7a4b00;                                  
       40 +  --tight-box: #fdf5e4;                                       
       41 +  --tight-box-ink: #5c3b00;                                   
       42 +  --late-chip: #fbe4e4;                                       
       43 +  --late-chip-ink: #8f1b1b;                                   
       44 +  --late-box: #fbeded;                                        
       45 +  --late-box-ink: #5a2222;                                    
       46 +  --late-strong: #8f1b1b;                                     
       47 +  --error-box: #fdecea;                                       
       48 +  --error-ink: #8f1b13;                                       
       49 +  --error-icon: #b42318;                                      
       50 
       38 -  /* Status tones: a panel background, text on it, and a solid
          - colour for icons */                                          
       39 -  --success-bg: #ecfdf3;                                      
       40 -  --success-ink: #166534;                                     
       41 -  --success-solid: #15803d;                                   
       42 -  --warning-bg: #fffbeb;                                      
       43 -  --warning-ink: #92400e;                                     
       44 -  --warning-solid: #b45309;                                   
       45 -  --danger-bg: #fef2f2;                                       
       46 -  --danger-ink: #991b1b;                                      
       47 -  --danger-solid: #b91c1c;                                    
       48 -                                                              
       49 -  /* Chips stay pastel with dark text in both themes */       
       50 -  --success-chip: #d1fae5;                                    
       51 -  --success-chip-ink: #166534;                                
       52 -  --warning-chip: #fef3c7;                                    
       53 -  --warning-chip-ink: #92400e;                                
       54 -  --danger-chip: #fee2e2;                                     
       55 -  --danger-chip-ink: #991b1b;                                 
       56 -                                                              
       57 -  --radius-control: 12px;                                     
       58 -  --radius-panel: 18px;                                       
       51 +  --radius-control: 10px;                                     
       52 +  --radius-tile: 12px;                                        
       53 +  --radius-box: 14px;                                         
       54    --radius-card: 20px;
       60 -  --radius-hero: 28px;                                        
       61 -  --shadow-card: 0 1px 2px rgb(28 25 23 / 0.04), 0 1px 3px rgb
          -(28 25 23 / 0.06);                                            
       62 -  --shadow-lift: 0 8px 24px -8px rgb(28 25 23 / 0.18), 0 2px 6
          -px rgb(28 25 23 / 0.06);                                      
       63 -  --shadow-hero: 0 30px 60px -28px rgb(10 32 24 / 0.6), 0 2px 
          -6px rgb(10 32 24 / 0.12);                                     
       55 +  --shadow-card: 0 1px 2px rgb(22 24 29 / 0.04);              
       56 +  --shadow-raised: 0 1px 3px rgb(22 24 29 / 0.12);            
       57 +  --shadow-float: 0 12px 32px -12px rgb(22 24 29 / 0.35);     
       58    --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
       59  }
       60 
       61  @media (prefers-color-scheme: dark) {
       62    :root {
       69 -    --brand-50: #163126;                                      
       70 -    --brand-600: #4cb584;                                     
       71 -    --brand-700: #94dcb6;                                     
       72 -    --on-brand: #04140c;                                      
       63 +    --page: #111214;                                          
       64 +    --card: #1a1c20;                                          
       65 +    --card-line: #2a2d33;                                     
       66 +    --divider: #26292e;                                       
       67 +    --tile: #222429;                                          
       68 +    --track: #24272c;                                         
       69 +    --control: #70747d;                                       
       70 +    --ink: #eceef2;                                           
       71 +    --ink-2: #d3d6dc;                                         
       72 +    --ink-3: #c3c7ce;                                         
       73 +    --muted: #a9adb5;                                         
       74 +    --on-ink: #111214;                                        
       75 
       74 -    --paper: #0d1210;                                         
       75 -    --surface: #151b18;                                       
       76 -    --surface-muted: #1b231f;                                 
       77 -    --line: #27312c;                                          
       78 -    --control: #74827b;                                       
       79 -    --ink: #ece8e3;                                           
       80 -    --ink-soft: #c4beb6;                                      
       81 -    --ink-muted: #a8a29a;                                     
       82 -    --focus: #7fd6a8;                                         
       76 +    --accent: #7d9bff;                                        
       77 +    --on-accent: #0b1020;                                     
       78 +    --accent-soft: #1c2547;                                   
       79 +    --accent-ink: #c3d0ff;                                    
       80 +    --info-ink: #d6defd;                                      
       81 +    --focus: #7d9bff;                                         
       82 
       84 -    --hero: #0f2a1f;                                          
       85 -    --hero-line: #2a4a3b;                                     
       86 -    --hero-tile: #1b3d30;                                     
       87 -    --hero-glow: #184533;                                     
       83 +    --ok-box: #13281c;                                        
       84 +    --ok-box-ink: #bfe8cd;                                    
       85 +    --tight-box: #2c2310;                                     
       86 +    --tight-box-ink: #f6dca6;                                 
       87 +    --late-box: #331a1a;                                      
       88 +    --late-box-ink: #f5c4c4;                                  
       89 +    --late-strong: #ff9d9d;                                   
       90 +    --error-box: #3a1a17;                                     
       91 +    --error-ink: #ffb4ab;                                     
       92 +    --error-icon: #ff8a80;                                    
       93 
       89 -    --success-bg: #10291c;                                    
       90 -    --success-ink: #a7f3c4;                                   
       91 -    --success-solid: #4ade80;                                 
       92 -    --warning-bg: #2b210c;                                    
       93 -    --warning-ink: #fcd58a;                                   
       94 -    --warning-solid: #fbbf24;                                 
       95 -    --danger-bg: #331614;                                     
       96 -    --danger-ink: #fdb4ae;                                    
       97 -    --danger-solid: #f87171;                                  
       98 -                                                              
       94      --shadow-card: none;
      100 -    --shadow-hero: none;                                      
       95 +    --shadow-float: 0 12px 32px -12px rgb(0 0 0 / 0.7);       
       96    }
       97  }
       98 
     ...
      100  * { box-sizing: border-box; }
      101  html { -webkit-text-size-adjust: 100%; }
      102  body {
      108 -  margin: 0; background: var(--paper); color: var(--ink);     
      109 -  font-family: var(--font-sans); font-size: 15px; line-height:
          - 1.5;                                                         
      110 -  font-feature-settings: 'cv11', 'ss01'; -webkit-font-smoothin
          -g: antialiased;                                               
      103 +  margin: 0; background: var(--page); color: var(--ink);      
      104 +  font-family: var(--font-sans); font-size: 15px; line-height:
          + 1.5; -webkit-font-smoothing: antialiased;                    
      105  }
      112 -::selection { background: var(--brand-50); color: var(--ink); 
          -}                                                             
      106  :focus-visible { outline: 2px solid var(--focus); outline-offs
           et: 2px; }
      107  .sr-only {
      108    position: absolute; width: 1px; height: 1px; padding: 0; mar
           gin: -1px;
      109    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
           border: 0;
      110  }
      118 -.icon { width: 1.25rem; height: 1.25rem; flex: none; }        
      111 +.icon { width: 1.125rem; height: 1.125rem; flex: none; }      
      112 +p { margin: 0; }                                              
      113 
      120 -/* Top bar */                                                 
      121 -.topbar {                                                     
      122 -  position: sticky; top: 0; z-index: 20;                      
      123 -  background: color-mix(in srgb, var(--paper) 86%, transparent
          -);                                                            
      124 -  backdrop-filter: saturate(1.4) blur(12px); -webkit-backdrop-
          -filter: saturate(1.4) blur(12px);                             
      125 -  border-bottom: 1px solid var(--line);                       
      114 +/* Header: brand left, role switch right */                   
      115 +.masthead {                                                   
      116 +  max-width: 1152px; margin: 0 auto; padding: 2rem 2.75rem 0; 
      117 +  display: flex; align-items: center; justify-content: space-b
          +etween; gap: 1rem; flex-wrap: wrap;                           
      118  }
      127 -.topbar-inner {                                               
      128 -  max-width: 1152px; margin: 0 auto; height: 64px; padding: 0 
          -1.5rem;                                                       
      129 -  display: flex; align-items: center; justify-content: space-b
          -etween; gap: 1rem;                                            
      130 -}                                                             
      131 -.brand { display: flex; align-items: center; gap: 0.6rem; min-
          -width: 0; }                                                   
      132 -.logo {                                                       
      133 -  display: grid; place-items: center; width: 36px; height: 36p
          -x; flex: none;                                                
      134 -  border-radius: 11px; background: var(--hero); color: var(--h
          -ero-ink); box-shadow: var(--shadow-card);                     
      135 -}                                                             
      136 -.logo-icon { width: 20px; height: 20px; stroke-width: 2.6; }  
      137 -.brand-name { font-family: var(--font-display); font-size: 1.3
          -rem; font-weight: 600; letter-spacing: -0.01em; }             
      138 -.brand-ar { font-size: 1.05rem; font-weight: 600; color: var(-
          --ink-muted); }                                                
      139 -.brand-tagline {                                              
      140 -  margin-inline-start: 0.4rem; padding-inline-start: 0.9rem; b
          -order-inline-start: 1px solid var(--line);                    
      141 -  font-size: 0.875rem; color: var(--ink-muted); white-space: n
          -owrap;                                                        
      142 -}                                                             
      119 +.brand { display: flex; align-items: center; gap: 0.75rem; min
          +-width: 0; }                                                  
      120 +.logo { display: grid; place-items: center; width: 40px; heigh
          +t: 40px; flex: none; border-radius: 11px; background: var(--in
          +k); color: var(--on-ink); }                                   
      121 +.logo-icon { width: 22px; height: 22px; stroke-width: 2.4; }  
      122 +.brand-text { display: flex; flex-direction: column; gap: 1px;
          + min-width: 0; }                                              
      123 +.brand-name { margin: 0; font-family: var(--font-display); fon
          +t-size: 1.45rem; font-weight: 700; line-height: 1.2; letter-sp
          +acing: -0.01em; }                                             
      124 +.brand-ar { font-family: var(--font-sans); font-size: 1rem; fo
          +nt-weight: 600; color: var(--muted); }                        
      125 +.brand-tagline { font-size: 0.8125rem; color: var(--muted); } 
      126 
      127  /* Role switch: radio buttons styled as a segmented control (S
           -6 AC-5) */
      145 -.segmented { display: flex; align-items: center; gap: 0.6rem; 
          -min-width: 0; margin: 0; padding: 0; border: 0; }             
      146 -.segmented-label { font-size: 0.8125rem; font-weight: 500; col
          -or: var(--ink-muted); }                                       
      147 -.segments {                                                   
      148 -  display: inline-grid; grid-template-columns: 1fr 1fr; paddin
          -g: 4px;                                                       
      149 -  background: var(--surface-muted); border: 1px solid var(--li
          -ne); border-radius: 999px;                                    
      150 -}                                                             
      128 +.segmented { display: flex; align-items: center; gap: 0.625rem
          +; min-width: 0; margin: 0; padding: 0; border: 0; }           
      129 +.segmented-label { font-size: 0.8125rem; font-weight: 500; col
          +or: var(--muted); }                                           
      130 +.segments { display: inline-grid; grid-template-columns: 1fr 1
          +fr; gap: 4px; padding: 4px; border-radius: 12px; background: v
          +ar(--track); }                                                
      131  .segment { position: relative; }
      132  .segment-input, .day-input { position: absolute; inset: 0; wid
           th: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer
           ; }
      133  .segment-label {
      154 -  display: block; padding: 0.45rem 1.05rem; border-radius: 999
          -px; text-align: center; white-space: nowrap;                  
      155 -  font-size: 0.875rem; font-weight: 600; color: var(--ink-soft
          -);                                                            
      156 -  transition: background 0.2s var(--ease), color 0.2s var(--ea
          -se), box-shadow 0.2s var(--ease);                             
      134 +  display: grid; place-items: center; min-height: 44px; paddin
          +g: 0 1.125rem; border-radius: 9px;                            
      135 +  font-size: 0.875rem; font-weight: 500; color: var(--ink-3); 
          +white-space: nowrap;                                          
      136 +  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      137  }
      138  .segment:hover .segment-label { color: var(--ink); }
      159 -.segment-input:checked + .segment-label { background: var(--su
          -rface); color: var(--ink); box-shadow: var(--shadow-lift); }  
      139 +.segment-input:checked + .segment-label { background: var(--ca
          +rd); color: var(--ink); font-weight: 600; box-shadow: var(--sh
          +adow-raised); }                                               
      140  .segment-input:focus-visible + .segment-label { outline: 2px s
           olid var(--focus); outline-offset: 2px; }
      141 
      162 -/* Page */                                                    
      163 -.app { max-width: 1152px; margin: 0 auto; padding: 2.5rem 1.5r
          -em 4rem; animation: fade-in 0.25s ease-out both; }            
      164 -.page-header { max-width: 40rem; margin-bottom: 1.75rem; }    
      165 -.page-title {                                                 
      166 -  margin: 0; font-family: var(--font-display); font-weight: 60
          -0;                                                            
      167 -  font-size: clamp(1.75rem, 3vw, 2.25rem); line-height: 1.15; 
          -letter-spacing: -0.02em; text-wrap: balance;                  
      168 -}                                                             
      169 -.page-subtitle { margin: 0.5rem 0 0; color: var(--ink-soft); f
          -ont-size: 1rem; }                                             
      170 -.calculator { display: grid; grid-template-columns: minmax(0, 
          -1fr) 420px; gap: 1.5rem; align-items: start; }                
      142 +/* Page: two equal cards */                                   
      143 +.app { max-width: 1152px; margin: 0 auto; padding: 1.5rem 2.75
          +rem 3rem; animation: fade-in 0.25s ease-out both; }           
      144 +.calculator { display: grid; grid-template-columns: minmax(0, 
          +1fr) minmax(0, 1fr); gap: 1.375rem; align-items: start; }     
      145 +.inputs, .result { background: var(--card); border: 1px solid 
          +var(--card-line); border-radius: var(--radius-card); box-shado
          +w: var(--shadow-card); }                                      
      146 
      172 -/* The form: one card, three numbered steps */                
      173 -.inputs { background: var(--surface); border: 1px solid var(--
          -line); border-radius: var(--radius-card); box-shadow: var(--sh
          -adow-card); }                                                 
      174 -.step { padding: 1.5rem 1.75rem 1.75rem; }                    
      175 -.step + .step { border-top: 1px solid var(--line); }          
      176 -.step-title { display: flex; align-items: center; gap: 0.75rem
          -; margin: 0 0 1.25rem; font-size: 1rem; font-weight: 650; lett
          -er-spacing: -0.005em; }                                       
      147 +/* The form: three numbered steps */                          
      148 +.step { padding: 1.5rem 1.625rem; }                           
      149 +.step + .step { border-top: 1px solid var(--divider); }       
      150 +.step-title { display: flex; align-items: center; gap: 0.625re
          +m; margin: 0 0 0.875rem; font-size: 0.9375rem; font-weight: 70
          +0; }                                                          
      151  .step-number {
      178 -  display: inline-grid; place-items: center; width: 28px; heig
          -ht: 28px; flex: none; border-radius: 999px;                   
      179 -  background: var(--brand-50); color: var(--brand-700); font-s
          -ize: 0.8125rem; font-weight: 700; font-variant-numeric: tabula
          -r-nums;                                                       
      152 +  display: grid; place-items: center; width: 24px; height: 24p
          +x; flex: none; border-radius: 999px;                          
      153 +  background: var(--ink); color: var(--on-ink); font-size: 0.7
          +5rem; font-weight: 700; font-variant-numeric: tabular-nums;   
      154  }
      181 -.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1.
          -25rem 1.75rem; }                                              
      182 -.group { min-width: 0; margin: 0 0 1.25rem; padding: 0; border
          -: 0; }                                                        
      155 +.pair { display: grid; grid-template-columns: repeat(2, minmax
          +(0, 1fr)); gap: 0.875rem; }                                   
      156 +.group { min-width: 0; margin: 0 0 1rem; padding: 0; border: 0
          +; }                                                           
      157  .group:last-child, .pair .group { margin-bottom: 0; }
      184 -.group legend { margin-bottom: 0.55rem; padding: 0; font-size:
          - 0.875rem; font-weight: 600; }                                
      185 -.field { display: flex; flex-direction: column; gap: 0.375rem;
          - margin-bottom: 1.25rem; }                                    
      158 +.group legend { margin-bottom: 0.375rem; padding: 0; font-size
          +: 0.8125rem; font-weight: 600; color: var(--ink-2); }         
      159 +.field { display: flex; flex-direction: column; gap: 0.375rem;
          + margin-bottom: 1rem; }                                       
      160  .field:last-child { margin-bottom: 0; }
      187 -.field label { font-size: 0.875rem; font-weight: 600; }       
      188 -.duration-inputs { display: grid; grid-template-columns: 1fr 1
          -fr; gap: 0.625rem; }                                          
      189 -.duration-inputs .field label { font-size: 0.75rem; font-weigh
          -t: 600; color: var(--ink-muted); }                            
      161 +.field > label { font-size: 0.8125rem; font-weight: 600; color
          +: var(--ink-2); }                                             
      162 +.duration-inputs { display: flex; flex-wrap: wrap; gap: 0.375r
          +em 0.625rem; }                                                
      163 +.duration-inputs .field { margin: 0; }                        
      164 +.inline-row { display: flex; align-items: center; gap: 0.5rem;
          + }                                                            
      165 +.inline-row label { font-size: 0.8125rem; color: var(--muted);
          + }                                                            
      166 +#spare + label, #daily + label { font-weight: 600; color: var(
          +--ink-2); }                                                   
      167  input[type='text'], input[type='date'] {
      191 -  width: 100%; min-width: 0; height: 44px; padding: 0 0.875rem
          -;                                                             
      192 -  font: inherit; font-size: 0.9375rem; color: var(--ink); back
          -ground: var(--surface);                                       
      168 +  width: 100%; min-width: 0; height: 44px; padding: 0 0.75rem;
      169 +  font: inherit; font-size: 1rem; color: var(--ink); backgroun
          +d: var(--card);                                               
      170    border: 1px solid var(--control); border-radius: var(--radiu
           s-control);
      194 -  transition: border-color 0.15s, box-shadow 0.15s;           
      171 +  transition: border-color 0.15s;                             
      172  }
      173 +.duration-inputs input[type='text'] { width: 54px; }          
      174 +#spare, #daily { width: 72px; flex: none; }                   
      175  input[type='text'] { font-variant-numeric: tabular-nums; }
      197 -input[type='text']:hover, input[type='date']:hover { border-co
          -lor: var(--ink-soft); }                                       
      176 +input[type='text']:hover, input[type='date']:hover { border-co
          +lor: var(--ink-3); }                                          
      177  input[type='text']:focus-visible, input[type='date']:focus-vis
           ible { outline: 2px solid var(--focus); outline-offset: 1px; b
           order-color: var(--focus); }
      199 -input[aria-invalid='true'] { border-color: var(--danger-solid)
          -; box-shadow: inset 0 0 0 1px var(--danger-solid); }          
      200 -.field-error { margin: 0.4rem 0 0; color: var(--danger-solid);
          - font-size: 0.8125rem; font-weight: 600; }                    
      178 +input[aria-invalid='true'] { border-color: var(--error-icon); 
          +box-shadow: inset 0 0 0 1px var(--error-icon); }              
      179 +.field-error { margin: 0.25rem 0 0; color: var(--error-ink); f
          +ont-size: 0.8125rem; font-weight: 600; }                      
      180 
      181  /* Working days: preset buttons and day toggles (S-2 AC-1, AC-
           2) */
      203 -.presets { display: flex; flex-wrap: wrap; align-items: center
          -; gap: 0.5rem; margin-bottom: 0.75rem; }                      
      204 -.presets-label { margin-inline-end: 0.25rem; font-size: 0.75re
          -m; font-weight: 700; letter-spacing: 0.08em; text-transform: u
          -ppercase; color: var(--ink-muted); }                          
      182 +.presets { display: flex; flex-wrap: wrap; align-items: center
          +; gap: 0.375rem; margin-bottom: 0.625rem; }                   
      183 +.presets-label { margin-inline-end: 0.25rem; font-size: 0.8125
          +rem; color: var(--muted); }                                   
      184  .preset, .custom-tag {
      206 -  display: inline-flex; align-items: center; height: 32px; pad
          -ding: 0 0.875rem; border-radius: 999px;                       
      207 -  font: inherit; font-size: 0.8125rem; font-weight: 600; color
          -: var(--ink-soft);                                            
      208 -  background: var(--surface); border: 1px solid var(--control)
          -;                                                             
      185 +  display: inline-flex; align-items: center; min-height: 32px;
          + padding: 0 0.75rem; border-radius: 999px;                    
      186 +  font: inherit; font-size: 0.75rem; font-weight: 500; color: 
          +var(--ink-2); background: var(--card); border: 1px solid var(-
          +-control);                                                    
      187  }
      188  .preset { cursor: pointer; transition: background 0.15s, borde
           r-color 0.15s, color 0.15s; }
      211 -.preset:hover { border-color: var(--ink-soft); color: var(--in
          -k); }                                                         
      212 -.preset:active, .day-toggle:active .day-label { transform: sca
          -le(0.97); }                                                   
      213 -.preset[aria-pressed='true'], .custom-tag { background: var(--
          -brand-50); border-color: var(--brand-600); color: var(--brand-
          -700); }                                                       
      214 -.day-toggles { display: grid; grid-template-columns: repeat(7,
          - minmax(0, 1fr)); gap: 0.5rem; }                              
      189 +.preset:hover { border-color: var(--ink-3); }                 
      190 +.preset[aria-pressed='true'], .custom-tag { border-color: var(
          +--accent); background: var(--accent-soft); color: var(--accent
          +-ink); font-weight: 600; }                                    
      191 +.day-toggles { display: grid; grid-template-columns: repeat(7,
          + minmax(0, 1fr)); gap: 6px; }                                 
      192  .day-toggle { position: relative; }
      193  .day-label {
      217 -  display: grid; place-items: center; height: 44px; border-rad
          -ius: var(--radius-control);                                   
      218 -  font-size: 0.875rem; font-weight: 600; color: var(--ink-soft
          -); background: var(--surface); border: 1px solid var(--control
          -);                                                            
      219 -  transition: background 0.15s, border-color 0.15s, color 0.15
          -s, transform 0.1s;                                            
      194 +  display: grid; place-items: center; min-height: 44px; border
          +-radius: var(--radius-control);                               
      195 +  font-size: 0.8125rem; font-weight: 500; color: var(--ink-3);
          + background: var(--card); border: 1px solid var(--control);   
      196 +  transition: background 0.15s, color 0.15s, border-color 0.15
          +s;                                                            
      197  }
      221 -.day-toggle:hover .day-label { border-color: var(--ink-soft); 
          -color: var(--ink); }                                          
      222 -.day-input:checked + .day-label { background: var(--brand-600)
          -; border-color: var(--brand-600); color: var(--on-brand); box-
          -shadow: var(--shadow-card); }                                 
      198 +.day-toggle:hover .day-label { border-color: var(--ink-3); }  
      199 +.day-input:checked + .day-label { background: var(--accent); b
          +order-color: var(--accent); color: var(--on-accent); font-weig
          +ht: 600; }                                                    
      200  .day-input:focus-visible + .day-label { outline: 2px solid var
           (--focus); outline-offset: 2px; }
      201 +.preset:active, .day-toggle:active .day-label { transform: sca
          +le(0.97); }                                                   
      202 
      225 -/* The result: the star of the page */                        
      226 -.result {                                                     
      227 -  position: sticky; top: 88px; overflow: hidden; isolation: is
          -olate;                                                        
      228 -  color: var(--hero-ink); background: var(--hero); border: 1px
          - solid var(--hero-line);                                      
      229 -  border-radius: var(--radius-hero); box-shadow: var(--shadow-
          -hero);                                                        
      230 -}                                                             
      231 -.result::before {                                             
      232 -  content: ''; position: absolute; inset: 0; z-index: -1; poin
          -ter-events: none;                                             
      233 -  background: radial-gradient(520px 260px at 100% 0%, var(--he
          -ro-glow), transparent 70%);                                   
      234 -}                                                             
      235 -.result-body { display: flex; flex-direction: column; min-heig
          -ht: 360px; padding: 2rem 2rem 1.75rem; }                      
      236 -.result-body p, .result-body h3 { margin: 0; }                
      237 -.eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacin
          -g: 0.1em; text-transform: uppercase; color: var(--hero-muted);
          - }                                                            
      238 -.hero { margin-top: 0.75rem !important; line-height: 1; }     
      203 +/* The result card */                                         
      204 +.result { position: sticky; top: 1.5rem; }                    
      205 +.result-body { display: flex; flex-direction: column; gap: 1.2
          +5rem; min-height: 380px; padding: 1.5rem 1.625rem; }          
      206 +.result-body h3 { margin: 0; }                                
      207 +.result-head { display: flex; align-items: center; justify-con
          +tent: space-between; gap: 0.75rem; }                          
      208 +.eyebrow { font-size: 0.875rem; font-weight: 600; color: var(-
          +-muted); }                                                    
      209 +.hero { line-height: 1; }                                     
      210  .hero-number {
      240 -  display: inline-block; font-family: var(--font-display); fon
          -t-weight: 600;                                                
      241 -  font-size: clamp(4.5rem, 9vw, 6.5rem); line-height: 0.9; let
          -ter-spacing: -0.045em;                                        
      242 -  font-variant-numeric: tabular-nums lining-nums; animation: r
          -ise 0.35s var(--ease) both;                                   
      211 +  display: inline-block; font-family: var(--font-display); fon
          +t-weight: 700;                                                
      212 +  font-size: clamp(4.5rem, 8vw, 6rem); line-height: 0.85; lett
          +er-spacing: -0.04em;                                          
      213 +  font-variant-numeric: tabular-nums; animation: rise 0.3s var
          +(--ease) both;                                                
      214  }
      244 -.hero-unit { margin-inline-start: 0.35rem; font-size: 1.375rem
          -; font-weight: 600; }                                         
      245 -.hero-detail { display: block; margin-top: 0.9rem !important; 
          -font-size: 1rem; line-height: 1.45; color: var(--hero-soft); }
      215 +.hero-unit { margin-inline-start: 0.5rem; font-size: 1.5rem; f
          +ont-weight: 600; color: var(--ink-2); }                       
      216 +.hero-detail { display: block; margin-top: 0.75rem; font-size:
          + 0.9375rem; color: var(--muted); }                            
      217  .hero-date {
      247 -  margin-top: 0.6rem !important; font-family: var(--font-displ
          -ay); font-weight: 600;                                        
      248 -  font-size: clamp(1.875rem, 3.2vw, 2.375rem); line-height: 1.
          -1; letter-spacing: -0.025em; animation: rise 0.35s var(--ease)
          - both;                                                        
      218 +  font-family: var(--font-display); font-weight: 700; font-siz
          +e: clamp(2.5rem, 4.6vw, 3.5rem);                              
      219 +  line-height: 1; letter-spacing: -0.03em; animation: rise 0.3
          +s var(--ease) both;                                           
      220  }
      250 -.warning { margin-top: 1rem !important; font-weight: 600; colo
          -r: var(--hero-warning); }                                     
      221 +.warning { font-weight: 600; color: var(--tight-chip-ink); }  
      222 
      252 -.status { margin-top: 1.5rem !important; padding: 1.1rem 1.25r
          -em 1.2rem; border-radius: var(--radius-panel); color: var(--in
          -k); background: var(--tone-bg); }                             
      253 -.status-on-track { --tone-bg: var(--success-bg); --tone-ink: v
          -ar(--success-ink); --tone-solid: var(--success-solid); }      
      254 -.status-tight { --tone-bg: var(--warning-bg); --tone-ink: var(
          ---warning-ink); --tone-solid: var(--warning-solid); }         
      255 -.status-late { --tone-bg: var(--danger-bg); --tone-ink: var(--
          -danger-ink); --tone-solid: var(--danger-solid); }             
      256 -.status-head { display: flex; align-items: center; gap: 0.5rem
          -; color: var(--tone-ink); font-size: inherit; }               
      257 -.status-head .icon { width: 1.4rem; height: 1.4rem; color: var
          -(--tone-solid); }                                             
      258 -.status-word { font-size: 1.25rem; font-weight: 700; letter-sp
          -acing: -0.01em; }                                             
      259 -.status-text { margin-top: 0.4rem !important; font-size: 0.937
          -5rem; color: var(--ink); }                                    
      260 -.status-note { margin-top: 0.5rem !important; font-size: 0.812
          -5rem; color: var(--ink-soft); }                               
      261 -.finish-date {                                                
      262 -  margin-top: 0.15rem !important; font-family: var(--font-disp
          -lay); font-weight: 600;                                       
      263 -  font-size: 1.875rem; line-height: 1.15; letter-spacing: -0.0
          -2em; color: var(--ink);                                       
      223 +.chip {                                                       
      224 +  display: inline-flex; align-items: center; gap: 0.375rem; fl
          +ex: none; padding: 0.3rem 0.75rem; border-radius: 999px;      
      225 +  font-size: 0.8125rem; font-weight: 700; line-height: 1.2;   
      226  }
      265 -.finish-late { margin-top: 0.25rem !important; font-weight: 70
          -0; color: var(--tone-ink); }                                  
      266 -.hint {                                                       
      267 -  margin-top: 1.5rem !important; padding: 1rem 1.25rem; border
          --radius: var(--radius-panel);                                 
      268 -  border: 1px dashed var(--hero-muted); color: var(--hero-soft
          -);                                                            
      269 -}                                                             
      270 -.note { margin-top: auto !important; padding-top: 1.5rem; font
          --size: 0.8125rem; line-height: 1.5; color: var(--hero-muted); 
          -}                                                             
      271 -.note::before { content: ''; display: block; height: 1px; marg
          -in-bottom: 1rem; background: var(--hero-line); }              
      227 +.chip .icon { width: 14px; height: 14px; stroke-width: 3; }   
      228 +.chip-on-track { background: var(--ok-chip); color: var(--ok-c
          +hip-ink); }                                                   
      229 +.chip-tight { background: var(--tight-chip); color: var(--tigh
          +t-chip-ink); }                                                
      230 +.chip-late { background: var(--late-chip); color: var(--late-c
          +hip-ink); }                                                   
      231 
      273 -.empty { flex: 1; display: flex; flex-direction: column; align
          --items: center; justify-content: center; gap: 1rem; padding: 1
          -.5rem 1rem; text-align: center; }                             
      274 -.empty-icon { display: grid; place-items: center; width: 56px;
          - height: 56px; border-radius: 16px; background: var(--hero-til
          -e); color: var(--hero-soft); }                                
      275 -.empty-icon .icon { width: 28px; height: 28px; }              
      276 -.empty-text { max-width: 17rem; font-size: 1.0625rem; font-wei
          -ght: 500; color: var(--hero-soft); }                          
      232 +.message { padding: 0.875rem 1rem; border-radius: var(--radius
          +-box); font-size: 0.875rem; line-height: 1.5; }               
      233 +.message-neutral { background: var(--tile); color: var(--ink-2
          +); }                                                          
      234 +.message-on-track { background: var(--ok-box); color: var(--ok
          +-box-ink); }                                                  
      235 +.message-tight { background: var(--tight-box); color: var(--ti
          +ght-box-ink); }                                               
      236 +.message-late { background: var(--late-box); color: var(--late
          +-box-ink); }                                                  
      237 +.message-info { background: var(--accent-soft); color: var(--i
          +nfo-ink); }                                                   
      238 +.message-title { display: flex; align-items: center; gap: 0.5r
          +em; font-size: 0.875rem; font-weight: 700; }                  
      239 +.message-note { margin-top: 0.375rem; font-size: 0.8125rem; } 
      240 +.finish-date { margin-top: 0.25rem; font-family: var(--font-di
          +splay); font-size: 1.75rem; font-weight: 700; line-height: 1.1
          +5; letter-spacing: -0.02em; color: var(--ink); }              
      241 +.message-late .finish-date { color: var(--late-strong); }     
      242 +.finish-late { margin-top: 0.125rem; font-weight: 700; }      
      243 +                                                              
      244 +.note { margin-top: auto; font-size: 0.75rem; color: var(--mut
          +ed); }                                                        
      245 +                                                              
      246 +.empty { flex: 1; display: flex; flex-direction: column; align
          +-items: center; justify-content: center; gap: 0.875rem; text-a
          +lign: center; }                                               
      247 +.empty-icon { display: grid; place-items: center; width: 52px;
          + height: 52px; border-radius: 14px; background: var(--tile); c
          +olor: var(--ink-3); }                                         
      248 +.empty-icon .icon { width: 26px; height: 26px; }              
      249 +.empty-text { max-width: 17rem; font-size: 1rem; font-weight: 
          +500; color: var(--ink-2); }                                   
      250  .result-error {
      278 -  display: flex; align-items: flex-start; gap: 0.75rem; margin
          --block: auto !important; padding: 1rem 1.25rem;               
      279 -  border-radius: var(--radius-panel); background: var(--danger
          --bg); color: var(--danger-ink); font-weight: 600;             
      251 +  display: flex; align-items: flex-start; gap: 0.75rem; paddin
          +g: 0.875rem 1rem; border-radius: var(--radius-box);           
      252 +  background: var(--error-box); color: var(--error-ink); font-
          +size: 0.9375rem; font-weight: 600; line-height: 1.5;          
      253  }
      254  .result-error::before {
      282 -  content: '!'; display: grid; place-items: center; width: 1.4
          -rem; height: 1.4rem; flex: none; border-radius: 999px;        
      283 -  background: var(--danger-solid); color: var(--danger-bg); fo
          -nt-weight: 800; font-size: 0.85rem;                           
      255 +  content: '!'; display: grid; place-items: center; width: 1.3
          +75rem; height: 1.375rem; flex: none; border-radius: 999px;    
      256 +  background: var(--error-icon); color: var(--error-box); font
          +-weight: 800; font-size: 0.8125rem;                           
      257  }
      285 -.complete { display: flex; align-items: center; gap: 0.75rem; 
          -font-family: var(--font-display); font-size: 1.75rem; font-wei
          -ght: 600; line-height: 1.2; }                                 
      286 -.complete .icon { width: 2.25rem; height: 2.25rem; color: var(
          ---hero-success); }                                            
      258 +.complete { display: flex; align-items: center; gap: 0.625rem;
          + font-family: var(--font-display); font-size: 1.75rem; font-we
          +ight: 700; line-height: 1.2; }                                
      259 +.complete .icon { width: 2rem; height: 2rem; color: var(--ok-c
          +hip-ink); }                                                   
      260 
      288 -/* Status chips (the phone summary) */                        
      289 -.chip { display: inline-flex; align-items: center; gap: 0.4rem
          -; height: 28px; padding: 0 0.75rem 0 0.6rem; border-radius: 99
          -9px; font-size: 0.8125rem; font-weight: 700; }                
      290 -.chip::before { content: ''; width: 0.45rem; height: 0.45rem; 
          -border-radius: 999px; background: currentColor; }             
      291 -.chip-on-track { background: var(--success-chip); color: var(-
          --success-chip-ink); }                                         
      292 -.chip-tight { background: var(--warning-chip); color: var(--wa
          -rning-chip-ink); }                                            
      293 -.chip-late { background: var(--danger-chip); color: var(--dang
          -er-chip-ink); }                                               
      294 -                                                              
      261  /* Small-screen summary (S-6 AC-7): hidden on wide screens */
      262  .summary { display: none; }
      263 
      298 -@media (max-width: 960px) {                                   
      299 -  .brand-tagline { display: none; }                           
      300 -  .calculator { grid-template-columns: minmax(0, 1fr) 360px; }
      301 -  .result-body { padding: 1.75rem 1.5rem 1.5rem; }            
      302 -}                                                             
      303 -                                                              
      304 -@media (max-width: 760px) {                                   
      305 -  html { scroll-padding-top: 5.5rem; }                        
      306 -  .topbar { position: static; }                               
      307 -  .topbar-inner { height: auto; padding: 0.875rem 1rem; flex-w
          -rap: wrap; row-gap: 0.75rem; }                                
      264 +@media (max-width: 860px) {                                   
      265 +  .masthead { padding: 1.25rem 1rem 0; }                      
      266    .segmented { width: 100%; }
      267    .segments { flex: 1; }
      310 -  .app { padding: 1.5rem 1rem 3rem; }                         
      311 -  .page-header { margin-bottom: 1.25rem; }                    
      312 -  .page-subtitle { font-size: 0.9375rem; }                    
      268 +  .app { padding: 1rem 1rem 2.5rem; }                         
      269    .calculator { grid-template-columns: 1fr; gap: 1rem; }
      314 -  .step { padding: 1.25rem 1.125rem 1.375rem; }               
      315 -  .pair { grid-template-columns: 1fr; gap: 1.25rem; }         
      316 -  .day-toggles { gap: 0.35rem; }                              
      317 -  .day-label { height: 42px; font-size: 0.8125rem; }          
      270 +  .step { padding: 1.25rem 1.125rem; }                        
      271    .result { position: relative; top: auto; }
      319 -  .result-body { min-height: 0; padding: 1.75rem 1.375rem 1.5r
          -em; }                                                         
      320 -  .empty { padding: 1rem; }                                   
      272 +  .result-body { min-height: 0; padding: 1.375rem 1.25rem; }  
      273 +  .empty { padding: 0.75rem 0; }                              
      274 +  html { scroll-padding-top: 5.5rem; }                        
      275    .summary {
      276      position: sticky; top: 0.75rem; z-index: 15; display: flex
           ; align-items: center; gap: 0.5rem;
      323 -    min-height: 56px; padding: 0.6rem 0.75rem 0.6rem 1.1rem; b
          -order-radius: var(--radius-panel);                            
      324 -    color: var(--hero-ink); background: var(--hero); border: 1
          -px solid var(--hero-line); box-shadow: var(--shadow-hero);    
      325 -    font-weight: 600; animation: rise 0.3s var(--ease) both;  
      277 +    min-height: 56px; padding: 0.5rem 0.75rem 0.5rem 1rem; bor
          +der-radius: var(--radius-box);                                
      278 +    background: var(--ink); color: var(--on-ink); box-shadow: 
          +var(--shadow-float); font-weight: 600;                        
      279 +    animation: rise 0.3s var(--ease) both;                    
      280    }
      327 -  .summary-number { font-family: var(--font-display); font-siz
          -e: 1.75rem; font-weight: 600; line-height: 1; font-variant-num
          -eric: tabular-nums; }                                         
      328 -  .summary-label { color: var(--hero-muted); font-weight: 500;
          - font-size: 0.8125rem; }                                      
      281 +  .summary-number { font-family: var(--font-display); font-siz
          +e: 1.75rem; font-weight: 700; line-height: 1; font-variant-num
          +eric: tabular-nums; }                                         
      282 +  .summary-label { font-size: 0.8125rem; font-weight: 500; opa
          +city: 0.85; }                                                 
      283    .summary .chip { margin-inline-start: auto; }
      284  }
      285 
      286 +@media (max-width: 420px) {                                   
      287 +  .pair { grid-template-columns: 1fr; }                       
      288 +  .day-toggles { gap: 4px; }                                  
      289 +  .day-label { font-size: 0.75rem; }                          
      290 +}                                                             
      291 +                                                              
      292  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      293  @keyframes rise { from { opacity: 0; transform: translateY(6px
           ); } to { opacity: 1; transform: none; } }
      294 

⏺ Now the contrast script for the new tokens. I'll rewrite the whole file this
  time, rather than splicing it as I did last round.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad/drive && cat > $S/contrast.mjs <<'EOF'
      // Checks WCAG contrast for ever…)
  ⎿  (No output)

⏺ Four dark-mode failures remain: the warning colour, the light phone summary
  that washes out its pastel chips, and the green "Already complete" tick. I'm
  giving each its own token with a dark-mode value. · summary

⏺ Bash(python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 72 colour pairs pass in both themes and 349 tests pass, four fewer than
  before since the page-title checks were removed. I'm taking screenshots next
  to compare against the design. · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && rm -f $S/shots/*.png && cat > $S/drive/drive8.mjs
      <<'EOF'
      const { ch…)
  ⎿  Error: Exit code 1
     node:internal/modules/run_main:123
         triggerUncaughtException(
         ^

     locator.click: Timeout 30000ms exceeded.
     Call log:
       - waiting for getByRole('checkbox', { name: 'Mon' })
         - locator resolved to <input checked type="checkbox"
     class="day-input"/>
       - attempting click action
     … +59 lines (ctrl+o to expand)

⏺ Playwright says the visible label is covering the hidden checkbox, so I'm
  setting the real input to z-index: 1 so clicks land on it, then rerunning.
  · summary

⏺ Bash(python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Clicks now land on the real checkboxes, and the run completes. I'll compare
  the screenshots with the design.

  Read 3 files (ctrl+o to expand)

⏺ The design match is close, but the desktop result card has empty space below
  the status box that the pace meter and timeline would fill. I'm checking the
  phone, dark-mode and error shots next. · summary

  Read 3 files (ctrl+o to expand)

⏺ The layout fix is next, then the pace meter, which shows only numbers we
  already have; I'm leaving out the timeline because it would need a finish-date
  calculation you ruled out. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Now the meter component in the result card, its styles, the card-height fix,
  and a UI test.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 364 tests pass, and the sweep shows every rounded-up percentage lands in
  its status zone. Next I'll check the meter colours against the zones and look
  at the meter on screen. · summary

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && python3 - $S/drive/contrast.mjs <<'PY'
      import sys; p=sys.argv[1]; s=…)
  ⎿  (No output)
  ⎿  (timeout 3m)

  Read 3 files (ctrl+o to expand)

⏺ The meter matches the design, and each marker sits in its own status zone: 50%
  in the green, 84% in the amber, 108% in the red. I'll check the error card
  and the phone.

  Read 2 files (ctrl+o to expand)

⏺ The error card now fits its content, and the phone layout works with the
  summary bar. Last, the full verification. I'll also add S-3 AC-10 to
  docs/verification.md.
⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='docs/verification.md'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The UI now follows your canvas design and keeps our behaviour and docs text.
  The pace meter is built; the timeline isn't (reason below). All 364 tests
  pass, including both time-zone runs. Nothing is committed yet.

  Test Files  10 passed (10)
       Tests  364 passed (364)     npm test
       Tests  364 passed (364)     TZ=Pacific/Kiritimati
       Tests  364 passed (364)     TZ=America/Adak
  ✓ types   ✓ build   ✓ contrast: all 80 pairs pass   ✓ no calculation file
  changed

  Refresh http://localhost:5173 to see it.

  Taken from the design

  - Overall look: a light grey page with two white cards. The header has the
    black logo, "Khutwa" in Space Grotesk with our tagline, and the role switch
    on the right.
  - Steps and inputs: numbered steps with black circles and hairline dividers.
    Small inputs have their label after them: "[ 7 ] Hours [ 40 ] Minutes".
  - Selection colours: blue toggles for the selected days, and blue pill presets
    for Mon–Fri and Sun–Thu.
  - Result card: "You need" with the status chip (icon and word) top-right, a
    large Space Grotesk "15 min a day", and a tinted message box. When Late, the
    box shows the finish date in large red.
  - Admin: a large earliest date, with the recommended date in a blue box.
  - Pace meter: green, amber and red zones with a marker, and "15 of your 30
    spare min · 50%".

  Left out on purpose

  - The timeline. It needs a finish date for On track and Tight, which the
    engine only calculates for Late. Adding it would be a calculation change.
  - The design's own content: its weekend presets (we keep Mon–Fri and Sun–Thu),
    the Arabic toggle (S-7 isn't built), text inputs for dates (we keep native
    date pickers), the progress bar, the stat tiles and the "days to spare"
    line. All of these add new figures or text.

  Decisions to check

  - The meter's percentage is rounded up. Rounding to nearest would show a Tight
    80.2% as "80%", which reads as On track. A test checks every spare time
    from 1 to 480 and confirms the percentage always falls in its status's zone.
  - Docs. The meter is documented as S-3 AC-10, with its labels in Screen text.
    The page titles from last round are gone from both the screen and the docs.
  - Input borders are darker than in the design. The design's #CFCFC7 is only
    1.5:1 against white; ours reach the 3:1 WCAG asks for.
  - Fonts. Space Grotesk replaced Fraunces. Both Inter and Space Grotesk are
    self-hosted, with no Google Fonts call.

  Found along the way

  - Clicks on the day toggles hit the visible label instead of the hidden
    checkbox. Mouse clicks still worked through the label, but I put the
    checkbox on top so every click lands on the real control.
  - Four dark-mode colours failed contrast, including the phone summary turning
    light and hiding its chips. Each now has its own dark value.
  - The error card was a tall, mostly empty white box; it now fits its content.

  About commits: the three rounds of UI work since the last commit (d8955d7) are
  still uncommitted. Should I commit them now?

❯ make it light mode

⏺ You're probably seeing the dark theme because your Mac is set to dark mode.
  I'll make the app always light: remove the dark colour set and tell the
  browser the page is light-only, so native controls such as the date picker
  stay light too.

⏺ Bash(python3 - <<'PY'
      import re…)
  ⎿  (No output)

⏺ The dark-mode colours are removed and all 40 light-mode pairs still pass. Next
  I'll confirm a dark-mode browser gets the light page, rerun the tests, and
  update the docs. · summary

⏺ Bash(grep -n -i "dark" docs/*.md src --include=*.ts --include=*.tsx
      --include=*.md -r | grep -v "Dark chrome" ;
      S=/private/tmp/claude-501/-Users-macmini/51ab0805-957…)
  ⎿  (No output)

  Read 1 file (ctrl+o to expand)

⏺ With the browser set to dark mode, the page is now light and the date picker
  is too. I'll update the docs that mention dark mode and rerun everything.

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && grep -rn -i "dark" docs/ src/
      | grep -v "^src/styles.css" ; python3 - <<'PY'
      p='docs/verification.md'; s=open(p).read…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The app is now light mode only, even when your Mac is set to dark mode. I
  tested it with the browser in dark mode: the page and the native date picker
  both stay light. Refresh http://localhost:5173 to see it.

  All 364 tests pass, including both time-zone runs, and the build works.

  - What changed: I removed the dark-mode colours from src/styles.css and set
    color-scheme: light, which keeps the browser's own controls (the date
    picker, the calendar popup) light as well.
  - Contrast: all 40 colour pairs still pass WCAG AA.
  - Docs: docs/verification.md now says the app is light only and has been
    checked with the device in dark mode.

  Nothing is committed yet. That includes this change and the three earlier
  rounds of UI work since d8955d7. Should I commit them?

❯ dont use the html default date picker make a date picker that suits the
  design

⏺ I'll replace the browser's date field with a calendar picker styled like the
  rest of the app, built on the standard accessible date-picker pattern
  (WAI-ARIA):
  - The field is a button showing the chosen date ("Thu 31 Dec 2026") with a
    calendar icon. It keeps the "Due date" / "Start date" label and its error
    linking.
  - The calendar opens below as a month grid, Monday first like the day toggles.
    It marks the selected day and today, and shows non-working days in lighter
    text. They stay selectable, since a due date may fall on a weekend (S-2
    AC-5).
  - Keyboard: arrow keys move by day and week, Home/End go to the start or end
    of the week, Page Up/Down change month (with Shift, year), Enter picks, and
    Escape closes and returns focus to the field.

  The month-grid maths goes in a small, tested module that uses our existing
  date functions; the engine doesn't change. Calendar helpers first.

⏺ Write(src/lib/calendar.ts)
  ⎿  Wrote 66 lines to src/lib/calendar.ts
       1 /**
       2  * Month grids for the date picker (S-6 AC-8). Built on dates.ts
         , so like the engine
       3  * it uses whole day numbers and never reads the clock. Weeks st
         art on Monday, as the
       4  * working-day toggles do.
       5  */
       6 import { addDays, fromDayNumber, toDayNumber, weekdayOf, type Is
         oDate, type Weekday } from './dates';
       7
     … +59 lines (ctrl+o to expand)

⏺ Write(src/lib/calendar.test.ts)
  ⎿  Wrote 61 lines to src/lib/calendar.test.ts
       1 import { describe, expect, it } from 'vitest';
       2 import { addMonths, endOfWeek, monthGrid, monthTitle, startOfWee
         k } from './calendar';
       3 import { addDays, weekdayOf } from './dates';
       4 import { iso } from './test-helpers';
       5
       6 describe('date picker month grid (S-6 AC-8)', () => {
       7   it('S-6 AC-8: December 2026 starts on a Tuesday, Monday first,
          in 5 weeks', () => {
       8     const weeks = monthGrid(iso('2026-12-15'));
     … +53 lines (ctrl+o to expand)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npx vitest run src/lib/calendar.test.ts
      src/lib/noClock.test.t…)
  ⎿  (No output)

⏺ The calendar helpers pass, including an 84-month sweep, and the clock guard
  now scans calendar.ts as well. Next: the picker component, its labels and
  icons.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Write(src/components/DatePicker.tsx)
  ⎿  Wrote 232 lines to src/components/DatePicker.tsx
       1 import { useEffect, useRef, useState, type KeyboardEvent } from
         'react';
       2 import {
       3   WEEK_ORDER,
       4   WEEKDAY_FULL_NAMES,
       5   addMonths,
       6   endOfWeek,
       7   monthGrid,
       8   monthTitle,
       9   startOfWeek,
     … +223 lines (ctrl+o to expand)

⏺ Now I'll swap the date fields in both forms for the picker.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Now the picker's styles, using only the existing tokens: the field looks like
  the other inputs, and the calendar is a white popover card.

⏺ Bash(python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)

⏺ Now the UI tests. The old setDate helper typed straight into the native field.
  The new pickDate helper opens the calendar, moves to the right month and
  clicks the day, the way a person would.

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

⏺ Bash(python3 - <<'PY'
      p='src/App.test.tsx'; s=open(p).read()…)
  ⎿  (No output)

⏺ Comparing months with new Date in that helper is fragile; it relies on the
  browser parsing "1 December 2026". I'll compare against the first day shown in
  the grid instead.

⏺ Bash(python3 - <<'PY'
      p='src/App.test.tsx'; s=open(p).read()…)  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run src/App.test.tsx -t "realistic example" 2>&1 | grep -A12 -E
      "^(TestingLibrary|Error|…)
  ⎿  (No output)

⏺ The picked date is lost because onChange and onTouch both rebuild the form
  from the same stale snapshot, so the second call overwrites the date. I'm
  removing the redundant onTouch call from that path. · summary

⏺ Update(src/components/DatePicker.tsx)
  ⎿  Added 4 lines, removed 1 line
      60      if (returnFocus) triggerRef.current?.focus();
      61    };
      62    const pick = (date: IsoDate) => {
      63 +    // onChange also marks the field touched. Calling onTouch a
         +s well would update the form                                   
      64 +    // from the same stale snapshot and undo the new date.     
      65      onChange(date);
      64 -    close(true);                                               
      66 +    setOpen(false);                                            
      67 +    triggerRef.current?.focus();                               
      68    };
      69 
      70    // Move focus to the active day after opening or a keyboard m
          ove (not after Previous/Next clicks).

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run src/App.test.tsx 2>&1 | grep -E "×|Tests ")
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 32 UI tests pass. Now tests for the picker itself: the full keyboard path,
  Escape, clicking outside, focus returning to the field, and the marked days.

⏺ Bash(python3 - <<'PY'
      p='src/App.test.tsx'; s=open(p).read()…)
  ⎿  (No output)
  ⎿  (timeout 3m)

⏺ All 38 UI tests pass. Next the docs: S-6 AC-8, decision D-15, and the picker's
  text in Screen text. The word-for-word test will fail until the three new
  labels are documented.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ The docs are in order. I'll run the full suite, then screenshot the open
  calendar on desktop and phone.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx tsc
      --noEmit && echo "types OK"; npm test 2>&1 | grep -E "×|Test Files|Tests
      "; S=/private/tmp/…)
  ⎿  (No output)
  ⎿  (timeout 4m)

⏺ All 387 tests pass, and the calendar run landed on Sun 17 Jan 2027 because my
  script missed 31 Dec; the phone layout fits without sideways scrolling. Taking
  the screenshots next. · summary

  Read 3 files (ctrl+o to expand)

⏺ The phone calendar looks right. My desktop crop cut off the left side, so I'll
  capture the field and calendar together, plus the admin start date.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && cd $S/drive && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$P…)
  ⎿  (No output)

  Read 2 files (ctrl+o to expand)

⏺ Both renders match the design, with the Space Grotesk month title, blue
  selected day and lighter weekends. I'm running the full verification and
  recording the test count in docs/verification.md next. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && sed -i '' 's/| pass (all 364
      tests, twice) |/| pass (all 387 tests, twice) |/' docs/verification.md &&
      grep -c "387 t…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The browser's date field is gone. Due date and start date now open a calendar
  that matches the design. All 387 tests pass, including both time-zone runs,
  and the build works. Refresh http://localhost:5173 to try it.

  Test Files  11 passed (11)
       Tests  387 passed (387)     npm test
       Tests  387 passed (387)     TZ=Pacific/Kiritimati
       Tests  387 passed (387)     TZ=America/Adak
  ✓ types   ✓ build   ✓ contrast: 40 pairs   ✓ engine files unchanged

  How it looks and works

  - The field: it looks like the other inputs and shows "Thu 31 Dec 2026", or
    "Pick a date" when empty, with a calendar icon.
  - The calendar: a white popover with the month title in Space Grotesk, ‹ ›
    buttons, and weeks starting on Monday like the day toggles.
  - Marked days: the picked day is filled blue and today has a blue ring.
    Non-working days are lighter but can still be picked, since a due date may
    fall on a weekend (S-2 AC-5).
  - Working days follow your selection. Switch to Sun–Thu and Friday and
    Saturday become the lighter days.
  - Keyboard: Enter or ↓ opens it, the arrows move by day or week, Home/End go
    to the start or end of the week, Page Up/Down change month (with Shift,
    year), and Enter picks. Escape, Tab out or a click outside closes it, and
    focus returns to the field.
  - Screen readers: it follows the WAI-ARIA date-picker pattern. The field is a
    combobox labelled "Due date", the calendar is a dialog with a grid, and each
    day is read as its full date ("Thu 31 Dec 2026"). Error messages are linked
    to the field as before.

  A bug found during testing

  The first version threw away the picked date. Picking a day updated the form
  twice from the same out-of-date copy of its state, so the second update put
  the empty date back. The tests caught it, and it's fixed: picking now makes a
  single update.

  Tests and docs

  - UI tests: they now pick dates by opening the calendar and clicking the day,
    the way a person would. Six new tests cover the keyboard path, Escape,
    clicking outside, focus returning to the field, and the marked days.
  - Calendar helpers: the month-grid maths has its own tests, including a sweep
    over every month from 2026 to 2032. It reuses our date functions, never
    reads the clock (the clock guard covers it), and doesn't touch the engine.
  - Docs: the picker is S-6 AC-8, with decision D-15 and its text in Screen
    text.

  A trade-off to know about: you can no longer type a date. It's picked from the
  calendar, by mouse or keyboard. That's recorded under "Known limits" in
  docs/verification.md.

  Nothing is committed yet. That covers four rounds of UI work since d8955d7.
  Should I commit them?

❯ i tested it in the browser and found these:
  1 with 15 out of 18 minutes it says 84 but it's really 83 and a bit, round it
  normally, the status stays the same
  2 when the time is huge, like 999 hours due tomorrow, the number on the pace
  line gets crazy big, just say "way over" and hide the pace bar when the daily
  need is more than a full working day
  3 the on track message sounds like a rule, make it talk to the person,
  something like "comfortable, you're using half of your spare time"
  4 you can click past dates in the picker and then you get an error, grey them
  out but keep the error just in case
  5 the timeline isn't built, that's fine, just mark it not implemented in the
  docs

  fix them with a test for each, update the docs and the screen text, run all
  the tests and show me they pass, then commit

⏺ I'll take the five in order, each with its own test.

  1. 83%, not 84%: round the percentage normally.
  2. Huge needs: when the daily need is more than a full working day (480 min),
     the pace line says "way over" and the bar is hidden.
  3. On track message: "Comfortable: you're using 50% of your spare time.",
     built from the same percentage the meter shows.
  4. Past dates: greyed out in the calendar and can't be picked. The "in the
     past" errors stay, since they still occur if the page is left open past
     midnight, and that's the case the tests will use.
  5. Timeline: listed as not implemented in the docs.

  On item 1: normal rounding means a pace just over 80% (say 401 of 500 minutes,
  80.2%) will read "80%" next to a Tight chip. The status itself is unaffected,
  since it comes from the exact numbers. I'll record that under "Known limits"
  rather than work around your decision.

⏺ Bash(grep -n "STATUS_DETAIL\|pacePercent\|84%\|2026-11-25" src/App.test.tsx
      src/components/*.tsx src/lib/messages.ts | cut -c1-150; sed -n
      '/describe(.the pace meter…)
  ⎿  (No output)

⏺ One extra detail for item 1: the meter's marker will use the exact share, not
  the rounded one, so it always sits in the right zone even when the label reads
  "80%". Making the changes:

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  Error: Exit code 2
     src/App.test.tsx(225,40): error TS7053: Element implicitly has an 'any'
     type because expression of type '"on-track"' can't be used to index type
     'Readonly<Record<"tight", string>>'.
       Property 'on-track' does not exist on type 'Readonly<Record<"tight",
     string>>'.
     src/components/LearnerForm.tsx(58,12): error TS2339: Property 'finish' does
     not exist on type 'Pace'.
       Property 'finish' does not exist on type '{ status: "on-track" | "tight";
     }'.
     src/components/LearnerForm.tsx(59,61): error TS2339: Property 'finish' does
     not exist on type 'Pace'.
       Property 'finish' does not exist on type '{ status: "on-track" | "tight";
     }'.
     src/components/LearnerForm.tsx(59,79): error TS2339: Property 'finish' does
     not exist on type 'Pace'.
       Property 'finish' does not exist on type '{ status: "on-track" | "tight";
     }'.

⏺ Two TypeScript type errors need fixing: the status narrowing goes back into
  one branch, and an old "On track" test gets updated, along with a stray
  comment in the picker's props. · summary

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Now the tests. Here are the two error tests that used to pick a past date,
  which the picker no longer allows:

⏺ Bash(sed -n 147,157p src/App.test.tsx; echo ----; sed -n 294,305p
      src/App.test.tsx; echo ----; sed -n 12,20p src/App.test.tsx)
  ⎿  (No output)
⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Now the docs. Here are the sections I'm changing:

⏺ Bash(grep -n "AC-9\*\*\|On track: \"You need\|AC-10\*\*\|80%. The bar\|pace
      sits\|so it is hidden\|## Not implemented\|S-10\*\*\|Today and the picked
      day\|still be p…)
  ⎿  (No output)

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)
  ⎿  (timeout 4m)

⏺ All 395 tests pass. Before committing, I'll confirm each new test actually
  guards its fix: undo each fix on its own and check that a test fails.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut6 && mk…)
  ⎿  (No output)
  ⎿  (timeout 6m 40s)

⏺ Each fix is guarded: undoing any one of them makes 1 to 4 tests fail. Now a
  quick look in the browser at the three visible changes.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && cd $S/drive && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$P…)
  ⎿  Error: Exit code 1
     15 of 18 reads: 15 of your 18 spare min · 83%
     node:internal/modules/run_main:123
         triggerUncaughtException(
         ^

     locator.click: Timeout 30000ms exceeded.
     Call log:
       - waiting for getByRole('button', { name: 'Fri 27 Nov 2026' })

     … +9 lines (ctrl+o to expand)

⏺ That failure is in my script. The calendar correctly opened on December, the
  month of the date already picked, so 27 Nov wasn't on screen. I'll go back a
  month first.

⏺ Bash(S=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5
      d1f9/scratchpad && cd $S/drive && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$P…)
  ⎿  (No output)
  ⎿  (timeout 1m 30s)

  Read 3 files (ctrl+o to expand)

⏺ All three checks look right: the On track message is personal, overdue items
  show "way over" without a bar, and past days are greyed out. I'm running the
  full verification and then committing. · summary

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && sed -i '' 's/| pass (all 387
      tests, twice) |/| pass (all 395 tests, twice) |/' docs/verification.md &&
      export PATH="$…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ Two folders I didn't create have appeared: docs/design/ and transcripts/. I'll
  check what's in them before deciding what goes into the commit.

⏺ Bash(find docs/design transcripts -type f | head -20 | while read f; do printf
      "%-60s %8s bytes\n" "$f" "$(wc -c < "$f" | tr -d ' ')"; done; echo "---";
      for f in $(f…)
  ⎿  (No output)

⏺ I've left your five design screenshots and the design chat excerpt out of this
  commit since I haven't reviewed them, so I'm committing only my own changes.
  I'll ask you about those files separately. · summary

⏺ Bash(git add docs/user-stories.md docs/verification.md package.json
      package-lock.json src && git status --short && git commit -q -F - <<'EOF'
      Redesign the UI after t…)
  ⎿  (No output)

⏺ All five fixes are in, each with a test, and committed as 561d65b. All 395
  tests pass, including both time-zone runs.

  561d65b Redesign the UI after the design preview, add a date picker, fix five
  review findings

  Test Files  11 passed (11)
       Tests  395 passed (395)     npm test
       Tests  395 passed (395)     TZ=Pacific/Kiritimati
       Tests  395 passed (395)     TZ=America/Adak
  ✓ types   ✓ build   ✓ contrast: 40 pairs   ✓ no engine file changed

  ┌─────┬────────────────────────────────────────┬──────────┬──────────────┐
  │     │                                        │          │ When I undid │
  │  #  │                  Fix                   │   Docs   │   the fix,   │
  │     │                                        │          │ tests failed │
  ├─────┼────────────────────────────────────────┼──────────┼──────────────┤
  │     │ 15 of 18 now reads 83%: the percentage │ S-3      │              │
  │ 1   │  is rounded normally                   │ AC-10,   │ 4            │
  │     │                                        │ new D-16 │              │
  ├─────┼────────────────────────────────────────┼──────────┼──────────────┤
  │ 2   │ Above 480 min a day the pace line says │ new S-3  │ 2            │
  │     │  "way over" and the bar is hidden      │ AC-11    │              │
  ├─────┼────────────────────────────────────────┼──────────┼──────────────┤
  │ 3   │ On track says "Comfortable: you're     │ S-3 AC-9 │ 2            │
  │     │ using 50% of your spare time."         │          │              │
  ├─────┼────────────────────────────────────────┼──────────┼──────────────┤
  │     │ Past days are greyed out in the        │          │              │
  │ 4   │ calendar and can't be picked, by mouse │ S-6 AC-8 │ 2            │
  │     │  or keyboard                           │          │              │
  ├─────┼────────────────────────────────────────┼──────────┼──────────────┤
  │     │ Timeline listed as not implemented: it │          │              │
  │ 5   │  needs a finish date for On track and  │ new S-11 │ 1            │
  │     │ Tight, which the engine only           │          │              │
  │     │ calculates for Late                    │          │              │
  └─────┴────────────────────────────────────────┴──────────┴──────────────┘

  The commit also includes the four earlier rounds of UI work (the redesign,
  light mode and the date picker). No engine file changed.

  About fix 1: with normal rounding, 401 of 500 minutes (80.2%) reads "80%" next
  to a Tight chip. The status and the meter's marker use the exact numbers, so
  the marker still sits in the Tight zone; only the label rounds. I recorded
  this under "Known limits" in docs/verification.md.

  About fix 4: the "in the past" errors can still happen if the page is left
  open past midnight with yesterday's date, so I kept them. The tests now cover
  exactly that case: they move "today" forward on an open page.

  Not committed: docs/design/ (five screenshots from the design preview) and
  transcripts/design-session-excerpt.md appeared in the project folder. I take
  it you added them for the submission. I haven't reviewed them, so I left them
  out of this commit. Do you want me to read them and commit them separately?

❯ yes i added them, docs/design has the screenshots of the design i made in the
  other session and transcripts/design-session-excerpt.md is the design part
  of that chat, commit them as they are, don't change the excerpt

  then do the final audit: compare the docs with what the app really does, list
  every mismatch and every criterion without a test, don't fix yet show me the
  list

⏺ I'll commit both as they are, without opening or changing the files.

⏺ Bash(shasum -a 256 transcripts/design-session-excerpt.md >
      /private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d1f
      9/scratchpad/excerpt.sha && git…)
  ⎿  (No output)

⏺ I've committed the work as 2a4afdd and confirmed the excerpt is unchanged;
  next I'm auditing the docs against the code and tests, starting with the user
  stories. · summary

  Read 1 file (ctrl+o to expand)

⏺ I'll start by mapping which criteria have a test at all. A script lists every
  acceptance criterion and decision in the docs and searches the test names for
  each ID.

⏺ Bash(python3 - <<'PY'
      import re, glob…)
  ⎿  (No output)

⏺ The first pass is flawed: a substring match counts "S-3 AC-10" as a match for
  "S-3 AC-1", and IDs in the it.each table rows go unseen. I'm rerunning with
  exact-ID matching that covers table rows and combined forms. · summary

⏺ Bash(python3 - <<'PY'
      import re, glob…)
  ⎿  (No output)

⏺ Two criteria have no test citing them. A citation doesn't mean the whole
  criterion is covered, though, so I'll read every test name and check each
  criterion's parts against them.
⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run --reporter=verbose 2>&1 | grep -E "^\s+✓" | sed -E 's/ [0-9]+ms$//;
      s/^ +✓ src\/(lib…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npx vitest
      run --reporter=json
      --outputFile=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-40…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ Every criterion except two is cited by at least one test. Now the content
  check: does what each doc says match what the code does? The two remaining
  docs, app-roles.md and plan.md, are next.

⏺ Bash(cat docs/app-roles.md | sed -n 1,60p; echo "=== plan.md: layout / tech /
      stories lines ==="; grep -n
      "Node\|README\|transcripts\|session-01\|Fri-Sat\|S-2\|S-6\|…)
  ⎿  (No output)

⏺ The other docs check out. I'll confirm three suspected mismatches directly in
  the code before listing them.

  Searched for 1 pattern · 1 failed (ctrl+o to expand)

⏺ Bash(echo "--- (f) 'AC-11' in any test file ---"; grep -rln "AC-11" src | grep
      test || echo "(none)"; echo "--- (g) a UI test for time done > total
      ---"; grep -n "do…)
  ⎿  Error: Exit code 1
     --- (f) 'AC-11' in any test file ---
     (none)
     --- (g) a UI test for time done > total ---
     (none in App.test.tsx)
     --- (h) UI tests for 'way over' summary / Down key / Shift+Page / Tab out /
     Home ---
     ArrowDown} 1
     {Shift     0
     {Tab}      0
     {Home}     0
     … +10 lines (ctrl+o to expand)

⏺ I've finished the audit and haven't changed anything. Before it, I committed
  your design screenshots and the excerpt unchanged as 2a4afdd; a checksum
  confirms the excerpt is byte-for-byte the same.

  Method: I read all five docs in full and checked each claim against the code.
  A script matched every acceptance criterion (45) and every decision (16) to
  the tests that name it. I then looked inside the cited tests to see which
  parts of each criterion they actually check.

  A. Where the docs and the app disagree

  The app does something different from what the docs say:

  1. Hours on the pace line. S-1 AC-5 says times of 60 minutes or more are also
     shown in hours and minutes. The pace line always shows raw minutes, for
     example "400 of your 480 spare min · 83%". Everywhere else follows the
     rule.
  2. S-7 says all visible text lives in messages.ts and format.ts. It doesn't.
     "a day" and "over" are typed directly into LearnerForm.tsx:129-130
     (src/components/LearnerForm.tsx#L129-L130) and its summary bar. Month names
     live in calendar.ts, weekday names in dates.ts, and "Mon–Fri", "Sun–Thu"
     and "every day" in workingDays.ts, partly duplicated in messages.ts. So
     translating the two files S-7 names wouldn't translate the page, and the
     word-for-word test only covers messages.ts.
  3. The working-days error doesn't mark its controls invalid. S-6 AC-4 says a
     field with an error has aria-invalid="true". "Select at least one working
     day." is linked through aria-describedby, but neither the group nor its
     checkboxes get aria-invalid.
  4. Escape shows the empty-date error straight away. S-5 AC-6 says an error
     shows only after the field is changed or left. Opening the calendar and
     pressing Escape shows "Enter a valid date." while focus is back on the
     field. Arguably focus did leave the field while the calendar was open, so
     this one is debatable.
  5. D-6 says 0 daily minutes is "Late". For the admin there's no Late status;
     it shows a no-time message in a red box. That's right for the learner only.
  6. D-7 says "The earliest date puts learners in Tight". It only sometimes
     does. For example, 61 min at 60 a day gives 2 days at 31 min, which is On
     track.

  The docs disagree with each other or with the tests:

  7. S-2 AC-1 calls the days "toggle buttons". S-6 AC-5 and the code have
     checkboxes, which screen readers announce as checkboxes.
  8. The intro says "Test names start with that ID". Not all do. Some start with
     a story ID only ("S-5: time done more than the total is an error", "S-4:
     one working day is singular"), and some have no ID at all ("S-5 attack
     pass", "screen text: …", "result text …").
  9. A stale test title. The App test "S-3 AC-10: the pace meter shows needed
     against spare, rounded up" now checks normal rounding (83%).
  10. An unwrapped paragraph. One long line in S-6 AC-8 (line 192 of
      user-stories.md) isn't wrapped. Cosmetic only.

  verification.md (docs/verification.md) claims checks that have gone stale:

  11. Keyboard check. "S-6 AC-2: keyboard path by script … pass" and the status
      line's "keyboard" come from a run before the canvas redesign and the date
      picker. The date picker changed the Tab order, and that run wasn't
      repeated.
  12. Planted-bug table. It stops at the first UI build. The design rounds and
      the date picker weren't checked this way. The five review fixes were, but
      those results are only in commit 561d65b, not in the table.

  plan.md (docs/plan.md) against the repo:

  13. README.md doesn't exist. The plan puts product decisions with reasons and
      the method line there. That line also says "all documents and code were
      produced in the attached session", but the design came from a separate
      chat (your excerpt), so it needs rewording.
  14. transcripts/session-01.md doesn't exist. This session hasn't been exported
      yet.
  15. Node 20+ vs 22.12. The plan says Node 20+; the project needs 22.12 or
      newer (engines, .nvmrc). Node 20 is end-of-life and the test libraries
      need 22.
  16. Preset names. The plan has "Fri-Sat or Sat-Sun weekend presets"; the app
      has Mon–Fri and Sun–Thu (the same choices, named by working days).
  17. Not started: GitHub Actions and Pages, which the plan marks optional.

  B. Criteria with no test

  ┌─────────────────────────────┬───────────────────────────────────────────┐
  │          Criterion          │                  Status                   │
  ├─────────────────────────────┼───────────────────────────────────────────┤
  │ S-3 AC-11 ("way over", no   │ The behaviour is tested, but both tests   │
  │ bar)                        │ are labelled S-3 AC-10, so nothing cites  │
  │                             │ AC-11.                                    │
  ├─────────────────────────────┼───────────────────────────────────────────┤
  │ S-6 AC-2 (whole app by      │ No automated test. The by-hand check      │
  │ keyboard, focus always      │ isn't done, and the scripted check is     │
  │ visible)                    │ stale (item 11).                          │
  └─────────────────────────────┴───────────────────────────────────────────┘

  Decisions no test names: D-2, D-6, D-7, D-10, D-12, D-14, D-15. Most are
  covered under story IDs (D-2 by the S-3 status tests, D-15 by the S-6 AC-8
  tests), but nothing cites the decision itself.

  C. Criteria tested only in part

  Criterion: S-5 AC-1 (every message shows)
  Not tested: In the UI: "Must be 999 hours or less.", "Must be 480 minutes (8
    hours) or less.", "Total time must be more than 0.", "Pick a date within 5
    years of today." and "Enter a number.". These are tested in the parser
    only.
  ────────────────────────────────────────
  Criterion: S-6 AC-6 (engine error at its field and in the result)
  Not tested: "Time done can't be more than the total time." has no UI test.
  ────────────────────────────────────────
  Criterion: S-6 AC-7 (phone summary)
  Not tested: Tested for a learner result only, not the admin or "Already
    complete" summaries.
  ────────────────────────────────────────
  Criterion: S-6 AC-8 (date picker)
  Not tested: Opening with ↓, Home in the UI (only the calendar maths is
    tested), Shift+Page Up/Down, and closing with Tab.
  ────────────────────────────────────────
  Criterion: S-6 AC-4 (aria-invalid)
  Not tested: Not tested on the date picker or the working-days group (item
    3).
  ────────────────────────────────────────
  Criterion: S-2 AC-6 (custom days in the result)
  Not tested: "every day" is tested in format but never shown in a UI test.

  Done well: every message, label and status word in messages.ts matches the
  docs word for word, and app-roles.md and jobs-to-be-done.md match the app. The
  engine criteria (S-1 to S-4, S-5 AC-3 and AC-5) are tested at boundaries and
  in sweeps.

  My suggestion: fix 1 to 4 and the two missing tests in B, correct the wording
  in 5 to 12, then write the README and export the transcript (13 and 14). Tell
  me which ones you want.

❯ good audit

  code fixes: 1 hours on the pace line, 3 aria-invalid on the working days
  group, 4 no error on escape
  docs only: 2 (arabic isn't built, just describe where the text lives today),
  5 to 10, and plan.md (node 22.12, preset names, method line)
  tests: label the "way over" tests s-3 ac-11, add ui tests for the messages in
  C, list the rest under known limits
  keyboard: mark it not checked, i'll test it by hand
  skip actions and pages

  run all tests, commit, then write the readme

⏺ I'll go in your order: the three code fixes with their tests, then the docs,
  the test labels, the new UI tests for the messages, and known limits. Then
  I'll run everything, commit, and write the README.

  Fix 1 needs a wording choice. With hours, the pace line becomes "15 min of
  your 30 min spare · 50%", which reads "400 min (6 h 40 min) of your 480 min (8
  h) spare · 83%" for larger numbers. It uses the same minutes format as
  everywhere else.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ The three code fixes type-check. I'm adding red borders to the invalid
  working-day toggles, then writing the relabel, pace-line, and per-fix tests
  along with UI tests for the untested messages. · summary

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)
  ⎿  (timeout 4m)

⏺ All 406 tests pass. As before, I'll undo each code fix on its own to confirm a
  test catches it.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut7 && mk…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ The third check didn't run: my pattern matched two places, so nothing changed
  and the passing result means nothing. I'll redo it with a pattern unique to
  the Escape path.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" &&
      B=/private/tmp/claude-501/-Users-macmini/51ab0805-957b-403d-874e-f3e689e5d
      1f9/scratchpad/mut7 && py…)
  ⎿  (No output)
  ⎿  (timeout 3m 20s)

⏺ All three fixes are guarded now (each undo fails 1 to 4 tests). Next the docs:
  wording fixes 2 and 5 to 10, the keyboard check marked as not checked, the
  known limits, and plan.md.

⏺ Bash(python3 - <<'PY'
      def edit(p, pairs):…)
  ⎿  (No output)

⏺ Docs updated. Now the full run, plus a browser check that the longer pace line
  still lays out properly on desktop and phone.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && echo "===
      typecheck ===" && npx tsc --noEmit && echo "types OK"; echo "=== npm test
      ===" && npm tes…)
  ⎿  (No output)
  ⎿  (timeout 6m 40s)

  Read 1 file (ctrl+o to expand)

⏺ On the phone, the percentage wraps onto a line of its own ("81%" alone), which
  reads badly. I'll balance the wrapped lines with CSS (text-wrap: balance)
  rather than change the text.

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && python3 - <<'PY'
      p='src/styles.css'; s=open(p).read()…)
  ⎿  (No output)

  Read 1 file (ctrl+o to expand)

⏺ The two lines are balanced now. CSS changes can't affect the tests, but I'll
  rerun the suite anyway before committing.

⏺ Bash(cd /Users/macmini/iheb-sebai-calculator && export
      PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npm test 2>&1 | grep
      -E "×|Test Files|Tests " && npm run…)
  ⎿  (No output)
  ⎿  (timeout 5m)

⏺ Commit 8e712bb is in with 406 tests passing, the time-zone runs and build
  green, and no engine files changed. I'm checking the README's numbers against
  the repo next. · summary
⏺ Bash(node -p "const p=require('./package.json');
      JSON.stringify({engines:p.engines, scripts:Object.keys(p.scripts),
      deps:Object.keys(p.dependencies), dev:Object.keys…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ Write(README.md)
  ⎿  Wrote 119 lines to README.md
      1 # Khutwa (خطوة, "step")
      2
      3 A training-deadline calculator for two kinds of users:
      4
      5 - **Learners** with an assigned course and a due date see how man
        y minutes they need each working day, and
      6   whether they will finish on time at the pace they can manage. I
        f they will be late, they see when they would
      7   finish and by how many working days.
      8 - **L&D admins** who assign training see the earliest due date em
     … +112 lines (~7 KB) (ctrl+o to expand)

⏺ Before showing the README, I'm checking it for overclaims: test names don't
  fully carry the criteria, the drift test covers only messages.ts, and the
  later UI rounds got their tests alongside the change rather than first.
  · summary

⏺ Bash(python3 - <<'PY'
      p='README.md'; s=open(p).read()…)
  ⎿  (No output)

⏺ The first replacement didn't match, because the line breaks in the file differ
  from what I typed. I'll read that section.

  Searched for 1 pattern (ctrl+o to expand)

⏺ Update(README.md)
  ⎿  Added 6 lines, removed 4 lines
      59  ## How it was built and checked
      60 
      61  - **Docs first.** [Jobs](docs/jobs-to-be-done.md), [roles](docs
          /app-roles.md) and [user stories with numbered
      62 -  acceptance criteria](docs/user-stories.md) came before any co
         -de. Every message and label on screen is written               
      63 -  out in the docs, and a test fails if the app's text and the d
         -ocs drift apart.                                               
      64 -- **Tests first.** Each module was committed with failing tests
         - before the code that makes them pass; the git                 
      65 -  history shows each red and green step. Test names carry the c
         -riterion they check (`S-3 AC-2`).                              
      62 +  acceptance criteria](docs/user-stories.md) came before any co
         +de. Every message and label in                                 
      63 +  `src/lib/messages.ts` is checked word for word against the do
         +cs, so the two can't drift apart.                              
      64 +- **Tests first.** The engine, the form parser and the first UI
         + were each committed with failing tests before                 
      65 +  the code that makes them pass; the git history shows each red
         + and green step. Later visual rounds (the redesign,            
      66 +  the date picker) added their tests alongside the change. Most
         + test names carry the criterion they check                     
      67 +  (`S-3 AC-2`).                                                
      68  - **Promises checked by sweeps, not only examples.** A learner
          is never shown On track or Tight when the numbers
      69    say Late (checked across due dates, amounts and spare times).
           An admin date is never unachievable: for all 127
      70    working-day choices, every start weekday and a range of cours
          es, the earliest date is not Late, the day before

⏺ I've made all the fixes you asked for and committed them as 8e712bb; 406 tests
  pass, including both time-zone runs. The README is written; following your
  order I haven't committed it, so you can read it first.

  8e712bb Fix the audit findings: hours on the pace line, invalid day toggles,
  Escape
  2a4afdd Add the design preview screenshots and the design-session excerpt

  Test Files  11 passed (11)
       Tests  406 passed (406)     npm test, and again in UTC+14 and UTC−10
  ✓ build   ✓ contrast: 40 pairs   ✓ no engine file changed

  Code fixes

  Each has a test. I undid each fix on its own and confirmed a test then fails
  (1 to 4 tests each).

  ┌─────┬────────────────────────────────────────────────────────────────────┐
  │  #  │                                Fix                                 │
  ├─────┼────────────────────────────────────────────────────────────────────┤
  │     │ The pace line shows hours: "195 min (3 h 15 min) of your 240 min   │
  │ 1   │ (4 h) spare · 81%". On a phone the percentage was wrapping onto a  │
  │     │ line by itself, so I balanced the two lines with CSS.              │
  ├─────┼────────────────────────────────────────────────────────────────────┤
  │ 3   │ With no working day selected, every day toggle is marked invalid,  │
  │     │ gets a red border, and is linked to the message.                   │
  ├─────┼────────────────────────────────────────────────────────────────────┤
  │ 4   │ Pressing Escape on an empty date field no longer shows "Enter a    │
  │     │ valid date." The error now appears only once you leave the field.  │
  └─────┴────────────────────────────────────────────────────────────────────┘

  Tests

  - Relabelled: the "way over" tests are now labelled S-3 AC-11.
  - New UI tests for every message in section C: empty field, over 999 hours,
    minutes over 59, over 480 a day, a total of 0, a date more than 5 years
    ahead, and time done over the total.
  - Under "Known limits" in verification.md (docs/verification.md): the parts
    still without a UI test. These are the admin and "Already complete" phone
    summaries, opening the calendar with ↓, Home and closing with Tab,
    aria-invalid on the date field, "every day" on screen, and the decisions no
    test names.

  Docs

  - Fixes 2 and 5 to 10: all done. S-7 now lists the six places where the
    visible text lives today.
  - Keyboard check: marked "not checked, to be done by hand", including the
    status line.
  - plan.md (docs/plan.md): Node 22.12, the Mon–Fri / Sun–Thu presets, and a
    method line that names the separate design chat.

  README

  README.md is written for the reviewers and covers:
  - how to run it and the four commands;
  - a "try it" table with the docs' example numbers;
  - the product decisions that shape the answers, each with its reason;
  - how the work was built and checked;
  - accessibility, including what hasn't been checked by hand yet;
  - what's not implemented, the project layout, and your method line.

  I corrected three overclaims in my own first draft. Not every test name
  carries a criterion ID. The word-for-word check covers only messages.ts. Not
  every round was tests-first: the redesign and the date picker got their tests
  alongside the change. The README now says exactly that.

  Still needed from you:
  - Export this session to transcripts/session-01.md. The README and plan both
    refer to it, and it doesn't exist yet.
  - Read the README. Then tell me to commit it, or what to change.
  - Do the keyboard and VoiceOver checks by hand, and I'll record the results in
    verification.md (docs/verification.md).

❯ i did the keyboard check by hand: [what worked / what didn't], record it in
  verification.md
  voiceover not checked, leave it marked like that

⏺ I can't record the keyboard check yet: your message still has the placeholder
  "[what worked / what didn't]" where the results should be. I'd rather not
  guess, because a "pass" in verification.md has to be something you actually
  saw.

  Send me what you found, in whatever form is easiest. If it helps, these are
  the things the check covers:

  1. Role switch: Tab reaches it, and the arrow keys switch between learner and
     admin.
  2. Tab order: runs top to bottom through hours, minutes, due date, presets,
     day toggles and spare time, with nothing skipped or out of order.
  3. Focus is always visible, including on the day toggles, the presets and the
     role switch.
  4. Day toggles and presets: Space toggles a day, and Enter or Space presses a
     preset.
  5. Date picker: Enter or ↓ opens it, the arrows, Home/End and Page Up/Down
     move, Enter picks, Escape closes, and focus returns to the field. Tab out
     closes it.
  6. Result: it updates as you type, and nothing traps focus or needs a mouse.

  For anything that didn't work, tell me what you pressed and what happened.
  I'll then record it in docs/verification.md: S-6 AC-2 as pass, or as a failure
  with the problem listed under "Known limits". VoiceOver stays marked "not
  run". I'll fix nothing unless you ask.

❯ commit everything

⏺ Bash(git status --short && grep -n "S-6 AC-2" docs/verification.md | cut
      -c1-160)
  ⎿  (No output)

⏺ Only the README is left to commit. The keyboard row stays "not checked", since
  I don't have your results yet.

⏺ Bash(export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH" && npm test
      2>&1 | grep -E "×|Tests " && git add README.md && git commit -q -F -
      <<'EOF'
      Add the READM…)
  ⎿  (No output)
  ⎿  (timeout 2m)

⏺ Everything is committed and nothing is left uncommitted. The last commit is
  2ee590a (the README), and all 406 tests still pass.

  Two things are still open, and neither can be committed yet:

  - Keyboard check: docs/verification.md still says "not checked", because your
    message didn't include the results. When you send what worked and what
    didn't, I'll record it and commit that change.
  - Session transcript: transcripts/session-01.md doesn't exist yet, but the
    README and plan.md both point to it. Once you export this session into that
    file, I can commit it.

  VoiceOver stays marked "not run", as you asked. The repository has no remote,
  so nothing has been pushed; say if you want to add one.