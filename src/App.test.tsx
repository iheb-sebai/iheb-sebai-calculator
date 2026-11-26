// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { CALC_ERROR_TEXT, FIELD_ERROR_TEXT, LABELS, STATUS_DETAIL, TEXT } from './lib/messages';
import { formatDisplayDate } from './lib/dates';
import { iso } from './lib/test-helpers';

afterEach(cleanup);

const THU = iso('2026-11-26');

function setup(today = THU) {
  const user = userEvent.setup();
  render(<App today={today} />);
  return user;
}

/** Like setup, but the test can move "today" on later, as when the page stays open past midnight. */
function setupWithClock(today = THU) {
  const user = userEvent.setup();
  const { rerender } = render(<App today={today} />);
  return { user, setToday: (next: string) => rerender(<App today={iso(next)} />) };
}

const result = () => screen.getByRole('status');
const group = (name: string) => screen.getByRole('group', { name });
const spareField = () => screen.getByLabelText(/Minutes you can spare/);
const dailyField = () => screen.getByLabelText(/Daily learning time/);

async function typeInto(user: UserEvent, input: HTMLElement, text: string) {
  await user.clear(input);
  if (text !== '') await user.type(input, text);
}

async function setDuration(user: UserEvent, groupName: string, hours: string, minutes: string) {
  await typeInto(user, within(group(groupName)).getByLabelText('Hours'), hours);
  await typeInto(user, within(group(groupName)).getByLabelText('Minutes'), minutes);
}

/** Picks a date the way a person does: open the calendar, go to the month, click the day. */
async function pickDate(user: UserEvent, label: string, value: string) {
  await user.click(screen.getByLabelText(label));
  const calendar = screen.getByRole('dialog');
  const name = formatDisplayDate(iso(value));
  for (let i = 0; i < 24 && within(calendar).queryByRole('button', { name }) === null; i++) {
    const firstShown = calendar.querySelector('[data-date]')?.getAttribute('data-date') ?? '';
    const goBack = value < firstShown; // ISO dates compare as strings
    await user.click(within(calendar).getByRole('button', { name: goBack ? LABELS.previousMonth : LABELS.nextMonth }));
  }
  await user.click(within(calendar).getByRole('button', { name }));
}

/** S-1 AC-6: 7 h 40 min total, 1 h 10 min done, due Thu 31 Dec 2026. */
async function fillRealisticExample(user: UserEvent) {
  await setDuration(user, 'Total course time', '7', '40');
  await setDuration(user, 'Time already done', '1', '10');
  await pickDate(user, 'Due date', '2026-12-31');
}

async function switchToAdmin(user: UserEvent) {
  await user.click(screen.getByRole('radio', { name: 'an L&D admin' }));
}

describe('learner', () => {
  it('S-5 AC-7: a fresh form shows the friendly empty state and no errors', () => {
    setup();
    expect(result()).toHaveTextContent(TEXT.learnerEmpty);
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0);
  });

  it('S-1 AC-6, S-2 AC-6: the realistic example reads "15 min a day over 26 working days (Mon–Fri)"', async () => {
    const user = setup();
    await fillRealisticExample(user);
    expect(result()).toHaveTextContent('15 min a day over 26 working days (Mon–Fri)');
  });

  it('S-1 AC-4: more than 480 min a day is shown with the note', async () => {
    const user = setup();
    await setDuration(user, 'Total course time', '9', '0');
    await setDuration(user, 'Time already done', '0', '0');
    await pickDate(user, 'Due date', '2026-11-26');
    expect(result()).toHaveTextContent('540 min (9 h) a day over 1 working day (Mon–Fri)');
    expect(result()).toHaveTextContent(TEXT.moreThanAWorkingDay);
  });

  it.each([
    ['S-3 AC-1', '30', 'On track'],
    ['S-3 AC-2', '18', 'Tight'],
    ['S-3 AC-2', '15', 'Tight'],
  ])('%s: %s spare minutes is %s', async (_id, spare, status) => {
    const user = setup();
    await fillRealisticExample(user);
    await typeInto(user, spareField(), spare);
    expect(result()).toHaveTextContent(status);
  });

  it('S-3 AC-5: 14 spare minutes is Late, finishing Mon 4 Jan 2027, 2 working days late', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await typeInto(user, spareField(), '14');
    expect(result()).toHaveTextContent('Late');
    expect(result()).toHaveTextContent("At 14 min a day you'll finish on");
    expect(within(result()).getByText('Mon 4 Jan 2027')).toHaveClass('finish-date');
    expect(result()).toHaveTextContent('2 working days late');
  });

  it('S-3 AC-6, S-5 AC-1: 0 spare minutes is Late with the no-time message, and no NaN or Infinity', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await typeInto(user, spareField(), '0');
    expect(result()).toHaveTextContent('Late');
    expect(result()).toHaveTextContent(TEXT.noSpareTime);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|undefined/);
  });

  it('S-5: time done equal to the total is Already complete', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await setDuration(user, 'Time already done', '7', '40');
    expect(result()).toHaveTextContent(TEXT.alreadyComplete);
  });

  it('S-5 AC-4, AC-6, S-6 AC-4: a field error is linked to its input and clears when fixed', async () => {
    const user = setup();
    await fillRealisticExample(user);
    const hours = within(group('Total course time')).getByLabelText('Hours');

    await typeInto(user, hours, 'abc');
    expect(hours).toHaveAttribute('aria-invalid', 'true');
    expect(hours).toHaveAccessibleDescription(FIELD_ERROR_TEXT['not-whole']);
    expect(result()).toHaveTextContent(TEXT.learnerEmpty);

    await typeInto(user, hours, '7');
    expect(hours).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(FIELD_ERROR_TEXT['not-whole'])).not.toBeInTheDocument();
    expect(result()).toHaveTextContent('15 min a day over 26 working days (Mon–Fri)');
  });

  it('S-5 AC-6: an untouched empty field shows no error while another is edited', async () => {
    const user = setup();
    await setDuration(user, 'Total course time', '7', '40');
    expect(screen.queryByText(FIELD_ERROR_TEXT['date-invalid'])).not.toBeInTheDocument();
  });

  it('S-5 AC-2: several field errors show at the same time', async () => {
    const user = setup();
    await typeInto(user, within(group('Total course time')).getByLabelText('Minutes'), '75');
    await typeInto(user, within(group('Time already done')).getByLabelText('Hours'), '-1');
    expect(screen.getByText(FIELD_ERROR_TEXT['minutes-over-59'])).toBeInTheDocument();
    expect(screen.getByText(FIELD_ERROR_TEXT.negative)).toBeInTheDocument();
  });

  it('S-6 AC-6, S-6 AC-8: a due date that becomes past (page open past midnight) still shows its error', async () => {
    const { user, setToday } = setupWithClock();
    await fillRealisticExample(user);
    await pickDate(user, 'Due date', '2026-11-26'); // today
    setToday('2026-11-27'); // the next morning, same page
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['due-date-in-past']);
    expect(screen.getByLabelText('Due date')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Due date')).toHaveAccessibleDescription(CALC_ERROR_TEXT['due-date-in-past']);
  });

  it('S-5 AC-5: no working days left (today Fri, Sun–Thu, due Sat) is reported in the result', async () => {
    const user = setup(iso('2026-11-27'));
    await fillRealisticExample(user);
    await user.click(screen.getByRole('button', { name: 'Sun–Thu' }));
    await pickDate(user, 'Due date', '2026-11-28');
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['no-working-days-left']);
  });

  it('S-2 AC-1, AC-2, AC-6: Sun–Thu ticks Sun to Thu; unticking Mon shows Custom; the result names the days', async () => {
    const user = setup();
    await fillRealisticExample(user);
    const monFri = screen.getByRole('button', { name: 'Mon–Fri' });
    const sunThu = screen.getByRole('button', { name: 'Sun–Thu' });
    expect(monFri).toHaveAttribute('aria-pressed', 'true');

    await user.click(sunThu);
    expect(sunThu).toHaveAttribute('aria-pressed', 'true');
    expect(monFri).toHaveAttribute('aria-pressed', 'false');
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']) expect(screen.getByRole('checkbox', { name: day })).toBeChecked();
    for (const day of ['Fri', 'Sat']) expect(screen.getByRole('checkbox', { name: day })).not.toBeChecked();
    expect(result()).toHaveTextContent('(Sun–Thu)');

    await user.click(screen.getByRole('checkbox', { name: 'Mon' }));
    expect(sunThu).toHaveAttribute('aria-pressed', 'false');
    expect(within(group('Working days')).getByText('Custom')).toBeInTheDocument();
    expect(result()).toHaveTextContent('(Tue, Wed, Thu, Sun)');
  });

  it('S-6 AC-5: day toggles and presets work from the keyboard', async () => {
    const user = setup();
    screen.getByRole('checkbox', { name: 'Sat' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Sat' })).toBeChecked();
    screen.getByRole('button', { name: 'Mon–Fri' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('checkbox', { name: 'Sat' })).not.toBeChecked();
  });

  it('S-3 AC-7: with no spare time, the hint asks for it', async () => {
    const user = setup();
    await fillRealisticExample(user);
    expect(result()).toHaveTextContent(TEXT.addSpareHint);
  });

  it('S-1 AC-7: the time left and the public holidays note are under the plan', async () => {
    const user = setup();
    await fillRealisticExample(user);
    expect(result()).toHaveTextContent(`390 min (6 h 30 min) left. ${LABELS.noHolidays}`);
  });

  it('S-3 AC-10: the pace meter shows needed against spare, rounded up', async () => {
    const user = setup();
    await fillRealisticExample(user);
    expect(screen.queryByText(LABELS.yourPace)).not.toBeInTheDocument(); // no spare time yet
    await typeInto(user, spareField(), '30');
    expect(result()).toHaveTextContent('15 of your 30 spare min · 50%');
    await typeInto(user, spareField(), '18');
    expect(result()).toHaveTextContent('15 of your 18 spare min · 83%'); // 83.3%, rounded normally
    await typeInto(user, spareField(), '0');
    expect(screen.queryByText(LABELS.yourPace)).not.toBeInTheDocument(); // no meter at 0 spare
    expect(document.querySelector('.meter-bar')).toBeNull();
  });

  it('S-3 AC-10: a daily need over a full working day reads "way over", with no bar', async () => {
    const user = setup();
    await setDuration(user, 'Total course time', '999', '0');
    await setDuration(user, 'Time already done', '0', '0');
    await pickDate(user, 'Due date', '2026-11-27'); // tomorrow: 2 working days for 999 hours
    await typeInto(user, spareField(), '30');
    expect(result()).toHaveTextContent(LABELS.yourPace);
    expect(result()).toHaveTextContent(LABELS.wayOver);
    expect(result()).not.toHaveTextContent('of your 30 spare min');
    expect(document.querySelector('.meter-bar')).toBeNull();
    expect(result()).toHaveTextContent('Late');
  });

  it('S-3 AC-9: On track and Tight come with their explanations', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await typeInto(user, spareField(), '30');
    expect(result()).toHaveTextContent("Comfortable: you're using 50% of your spare time.");
    await typeInto(user, spareField(), '18');
    expect(result()).toHaveTextContent(STATUS_DETAIL.tight);
  });

  it('S-6 AC-7: the small-screen summary repeats the result but is hidden from screen readers', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await typeInto(user, spareField(), '14');
    const summary = document.querySelector('.summary');
    expect(summary).toHaveAttribute('aria-hidden', 'true');
    expect(summary).toHaveTextContent('15 min a day');
    expect(summary).toHaveTextContent('Late');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('S-5: unticking every working day shows its error', async () => {
    const user = setup();
    await fillRealisticExample(user);
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) await user.click(screen.getByRole('checkbox', { name: day }));
    expect(within(group('Working days')).getByText(CALC_ERROR_TEXT['no-working-days-selected'])).toBeInTheDocument();
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['no-working-days-selected']);
  });
});

describe('admin', () => {
  it('S-5 AC-7: a fresh admin form shows its empty state', async () => {
    const user = setup();
    await switchToAdmin(user);
    expect(result()).toHaveTextContent(TEXT.adminEmpty);
  });

  it('S-4 AC-1, S-6 AC-5: the role switch works with arrow keys, and the start date is today', async () => {
    const user = setup();
    const learner = screen.getByRole('radio', { name: 'a learner' });
    expect(learner).toBeChecked();
    learner.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'an L&D admin' })).toBeChecked();
    expect(screen.getByLabelText('Start date')).toHaveTextContent('Thu 26 Nov 2026');
  });

  it('S-4 AC-2, AC-3: 5 h at 60 min a day: earliest Wed 2 Dec, recommended Fri 4 Dec', async () => {
    const user = setup();
    await switchToAdmin(user);
    await setDuration(user, 'Course time', '5', '0');
    await typeInto(user, dailyField(), '60');
    expect(result()).toHaveTextContent('Wed 2 Dec 2026');
    expect(result()).toHaveTextContent('5 working days (Mon–Fri) at 60 min (1 h) a day');
    expect(result()).toHaveTextContent('Fri 4 Dec 2026');
    expect(result()).toHaveTextContent('7 working days (Mon–Fri) at 43 min a day');
    expect(result()).toHaveTextContent(TEXT.recommendedExplainer);
  });

  it('S-4 AC-4: at 1 minute a day there is no recommended date', async () => {
    const user = setup();
    await switchToAdmin(user);
    await setDuration(user, 'Course time', '0', '3');
    await typeInto(user, dailyField(), '1');
    expect(result()).toHaveTextContent('Mon 30 Nov 2026');
    expect(result()).toHaveTextContent(TEXT.noRecommended);
  });

  it('S-4 AC-5: 0 minutes a day gives the no-time message', async () => {
    const user = setup();
    await switchToAdmin(user);
    await setDuration(user, 'Course time', '5', '0');
    await typeInto(user, dailyField(), '0');
    expect(result()).toHaveTextContent(TEXT.adminNoTime);
  });

  it('S-5, S-6 AC-8: a start date that becomes past (page open past midnight) still shows its error', async () => {
    const { user, setToday } = setupWithClock();
    await switchToAdmin(user);
    await setDuration(user, 'Course time', '5', '0');
    await typeInto(user, dailyField(), '60');
    setToday('2026-11-27'); // the start date is still Thu 26 Nov from yesterday
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['start-date-in-past']);
    expect(screen.getByLabelText('Start date')).toHaveAccessibleDescription(CALC_ERROR_TEXT['start-date-in-past']);
  });

  it('S-5 attack pass: switching role and back keeps what was typed', async () => {
    const user = setup();
    await fillRealisticExample(user);
    await switchToAdmin(user);
    await user.click(screen.getByRole('radio', { name: 'a learner' }));
    expect(within(group('Total course time')).getByLabelText('Hours')).toHaveValue('7');
    expect(result()).toHaveTextContent('15 min a day over 26 working days (Mon–Fri)');
  });
});

describe('date picker (S-6 AC-8)', () => {
  it('S-6 AC-8: a fresh due date reads "Pick a date" and opens a calendar on today\'s month', async () => {
    const user = setup();
    const field = screen.getByLabelText('Due date');
    expect(field).toHaveTextContent(LABELS.pickDate);
    expect(field).toHaveAttribute('aria-expanded', 'false');
    await user.click(field);
    expect(field).toHaveAttribute('aria-expanded', 'true');
    const calendar = screen.getByRole('dialog', { name: 'November 2026' });
    expect(within(calendar).getByRole('grid')).toBeInTheDocument();
    expect(within(calendar).getByRole('button', { name: 'Thu 26 Nov 2026' })).toHaveFocus();
    expect(within(calendar).getByRole('button', { name: 'Thu 26 Nov 2026' })).toHaveAttribute('aria-current', 'date');
  });

  it('S-6 AC-8: the keyboard alone picks a date: arrows, Page Down, End, Enter', async () => {
    const user = setup();
    screen.getByLabelText('Due date').focus();
    await user.keyboard('{Enter}'); // opens on Thu 26 Nov
    await user.keyboard('{ArrowRight}'); // Fri 27 Nov
    await user.keyboard('{ArrowDown}'); // Fri 4 Dec
    await user.keyboard('{PageDown}'); // Mon 4 Jan 2027
    await user.keyboard('{PageUp}'); // back to Fri 4 Dec
    await user.keyboard('{End}'); // Sun 6 Dec
    expect(screen.getByRole('button', { name: 'Sun 6 Dec 2026' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toHaveFocus();
    expect(screen.getByLabelText('Due date')).toHaveTextContent('Sun 6 Dec 2026');
  });

  it('S-6 AC-8: Escape closes without changing the date and returns focus to the field', async () => {
    const user = setup();
    await pickDate(user, 'Due date', '2026-12-31');
    await user.click(screen.getByLabelText('Due date'));
    expect(screen.getByRole('button', { name: 'Thu 31 Dec 2026' })).toHaveFocus(); // opens on the picked date
    await user.keyboard('{ArrowLeft}{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toHaveFocus();
    expect(screen.getByLabelText('Due date')).toHaveTextContent('Thu 31 Dec 2026');
  });

  it('S-6 AC-8: a click outside closes the calendar', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Due date'));
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('S-6 AC-8, S-2 AC-5: non-working days are lighter but can still be picked', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Due date'));
    const saturday = screen.getByRole('button', { name: 'Sat 28 Nov 2026' });
    expect(saturday).toHaveClass('day-off');
    expect(screen.getByRole('button', { name: 'Fri 27 Nov 2026' })).not.toHaveClass('day-off');
    await user.click(saturday);
    expect(screen.getByLabelText('Due date')).toHaveTextContent('Sat 28 Nov 2026');
  });

  it('S-6 AC-8: days before today are greyed out and clicking one changes nothing', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Due date'));
    const yesterday = screen.getByRole('button', { name: 'Wed 25 Nov 2026' });
    expect(yesterday).toHaveAttribute('aria-disabled', 'true');
    expect(yesterday).toHaveClass('day-past');
    expect(screen.getByRole('button', { name: 'Thu 26 Nov 2026' })).not.toHaveAttribute('aria-disabled');
    await user.click(yesterday);
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // still open
    expect(screen.getByLabelText('Due date')).toHaveTextContent(LABELS.pickDate);
  });

  it('S-6 AC-8: the keyboard passes over past days but Enter does not pick them', async () => {
    const user = setup();
    screen.getByLabelText('Due date').focus();
    await user.keyboard('{Enter}{ArrowLeft}'); // Wed 25 Nov, in the past
    expect(screen.getByRole('button', { name: 'Wed 25 Nov 2026' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toHaveTextContent(LABELS.pickDate);
  });

  it('S-6 AC-8: the picked day is marked selected in the grid', async () => {
    const user = setup();
    await pickDate(user, 'Due date', '2026-12-31');
    await user.click(screen.getByLabelText('Due date'));
    const cell = screen.getByRole('button', { name: 'Thu 31 Dec 2026' }).closest('td');
    expect(cell).toHaveAttribute('aria-selected', 'true');
  });
});

describe('accessibility', () => {
  it('S-6 AC-3: the result area is a polite live region', () => {
    setup();
    expect(result()).toHaveAttribute('aria-live', 'polite');
  });

  it.each(['learner', 'admin'])('S-6 AC-1: every control on the %s form has a label', async (role) => {
    const user = setup();
    if (role === 'admin') await switchToAdmin(user);
    const controls = document.querySelectorAll('input, select, button');
    expect(controls.length).toBeGreaterThan(5);
    for (const control of controls) expect(control).toHaveAccessibleName();
  });
});
