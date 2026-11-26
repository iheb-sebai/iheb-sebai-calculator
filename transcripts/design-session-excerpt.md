# Excerpt: separate Claude chat (UI design), 25 Nov 2026, 18:36–18:49 CET

Excerpt from a separate Claude session, copied word for word from the session log.
Messages and tool activity unrelated to the design were removed and marked [omitted].
Tool activity is shown in [square brackets]. Nothing else was changed.

[omitted]

**Me:** show me how it will look. Work on it and make it on the artifact page.

[created a design canvas]

[published design screen: canvas layout]

[published design screen: Late]

**Claude:** The On track and Late screens are on the canvas. Next I'm drawing the error, Admin and Arabic screens.

[published design screen: Error]

[published design screen: Admin]

[published design screen: Arabic]

**Claude:** I've put a preview of how Khutwa will look on a design canvas: https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu

It has 5 screens:

1. **[Learner · On track](https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu#artboard-Main):** 7h 40m of training with 1h 10m done, due Thu 31 Dec. The answer is **15 min per working day**, 26 working days left, shown in **green: On track** (you need 15 of your 30 spare minutes).
2. **[Learner · Late](https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu#artboard-Late):** the same training due Fri 4 Dec. You'd need **56 min a day** but have 30, so it shows in **red: Late by 6 working days**. At your real pace you'd finish **Mon 14 Dec**, and it tells you what to do about it.
3. **[Error: no working days](https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu#artboard-Error):** this app's "division by zero". It shows a clear message, keeps your other answers, and never shows NaN.
4. **[L&D Admin · Earliest due date](https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu#artboard-Admin):** the reverse calculation. With 2h 30m of training at 15 min a day and a Fri–Sat weekend, the earliest fair due date is **Sun 13 Dec 2026**, with the reason explained.
5. **[Arabic (right-to-left, stretch)](https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu#artboard-Arabic):** the On track screen in Arabic, laid out right to left.

All the example numbers are calculated correctly, assuming today is Thu 26 Nov 2026. You can use the same numbers as test cases tomorrow.

Two notes:
- **This is a picture, not the app.** You still build the real app tomorrow in your own Claude Code session. You can tell Claude Code "make it look like this: two columns, inputs left, result right, coloured status box".
- **Update the README line** to: *"I chose the product idea, drafted docs/plan.md and a UI preview with Claude chat before starting; all documents and code were produced in the attached session."*

**Me:** can we enhance more the ui....

**Claude:** I'll improve all 5 screens:
- a **pace meter** showing your minutes against the On track / Tight / Late zones;
- a **timeline** marking today, the due date and when you'd finish;
- a **progress bar** for the training you've already done;
- **numbered input steps**, and a calendar strip on the Admin screen.

[published design screen: canvas layout]

[published design screen: Late]

**Claude:** The On track and Late screens are updated. Next I'm redoing the error, Admin and Arabic screens to match.

[published design screen: Error]

[published design screen: Admin]

[published design screen: Arabic]

**Claude:** I redesigned all 5 screens in the preview: https://claude.ai/artifact/Xar5QX9GYLdogfcb24VDQu

**What changed:**
1. **Pace meter:** a bar with green, amber and red zones (On track up to 80%, Tight 80–100%, Late above 100%) and a marker showing where you are. You see the status at a glance instead of reading a sentence.
2. **Timeline:** today, the day you'd finish and the due date on one line.
   - **On track:** you finish **Mon 14 Dec** and the due date is **Thu 31 Dec**, so you have **13 working days spare**.
   - **Late:** the line turns red after the due date (Fri 4 Dec) until you'd finish (Mon 14 Dec), **6 working days late**.
3. **Numbered input steps:** 1 Your training, 2 Deadline and working days, 3 Your time. The form reads in a clear order.
4. **Progress bar:** "1 h 10 min done of 7 h 40 min · 15%".
5. **Status chip** in the result card: ✓ On track, ! Late, or "Needs one fix".
6. **Admin calendar:** a two-week calendar from 30 Nov to 13 Dec. The blue days are 15-minute learning days, the Fridays and Saturdays are off, and **Sun 13 Dec** is marked as the due date.
7. **Error screen:** the working-days area is outlined in red with a message underneath, and every other error message is listed. "Already complete" is shown in green as a valid result.
8. **Arabic:** fully mirrored right to left, including the meter and the timeline.

All the numbers are consistent with each other and calculated correctly, so you can reuse them as test cases tomorrow:
- 15 min a day × 26 working days = 390 min, which is exactly what remains.
- At 30 min a day you'd finish on Mon 14 Dec.

[omitted]
