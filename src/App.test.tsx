// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { CALC_ERROR_TEXT, FIELD_ERROR_TEXT, TEXT } from './lib/messages';
import { iso } from './lib/test-helpers';

afterEach(cleanup);

const THU = iso('2026-11-26');

function setup(today = THU) {
  const user = userEvent.setup();
  render(<App today={today} />);
  return user;
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

/** Date inputs are set the way a date picker sets them: the whole value at once. */
function setDate(label: string, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

/** S-1 AC-6: 7 h 40 min total, 1 h 10 min done, due Thu 31 Dec 2026. */
async function fillRealisticExample(user: UserEvent) {
  await setDuration(user, 'Total course time', '7', '40');
  await setDuration(user, 'Time already done', '1', '10');
  setDate('Due date', '2026-12-31');
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
    setDate('Due date', '2026-11-26');
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
    expect(result()).toHaveTextContent("At 14 min a day you'll finish on Mon 4 Jan 2027, 2 working days late.");
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

  it('S-6 AC-6: a past due date is shown at the field and in the result area', async () => {
    const user = setup();
    await fillRealisticExample(user);
    setDate('Due date', '2026-11-25');
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['due-date-in-past']);
    expect(screen.getByLabelText('Due date')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Due date')).toHaveAccessibleDescription(CALC_ERROR_TEXT['due-date-in-past']);
  });

  it('S-5 AC-5: no working days left (today Fri, Sun–Thu, due Sat) is reported in the result', async () => {
    const user = setup(iso('2026-11-27'));
    await fillRealisticExample(user);
    await user.selectOptions(screen.getByLabelText('Preset'), 'Sun–Thu');
    setDate('Due date', '2026-11-28');
    expect(result()).toHaveTextContent(CALC_ERROR_TEXT['no-working-days-left']);
  });

  it('S-2 AC-1, AC-2, AC-6: Sun–Thu ticks Sun to Thu; unticking Mon shows Custom; the result names the days', async () => {
    const user = setup();
    await fillRealisticExample(user);
    const preset = screen.getByLabelText('Preset');

    await user.selectOptions(preset, 'Sun–Thu');
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']) expect(screen.getByRole('checkbox', { name: day })).toBeChecked();
    for (const day of ['Fri', 'Sat']) expect(screen.getByRole('checkbox', { name: day })).not.toBeChecked();
    expect(result()).toHaveTextContent('(Sun–Thu)');

    await user.click(screen.getByRole('checkbox', { name: 'Mon' }));
    expect(preset).toHaveDisplayValue('Custom');
    expect(result()).toHaveTextContent('(Tue, Wed, Thu, Sun)');
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
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-11-26');
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

  it('S-5: a start date before today is shown at the field and in the result', async () => {
    const user = setup();
    await switchToAdmin(user);
    await setDuration(user, 'Course time', '5', '0');
    await typeInto(user, dailyField(), '60');
    setDate('Start date', '2026-11-25');
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

describe('accessibility', () => {
  it('S-6 AC-3: the result area is a polite live region', () => {
    setup();
    expect(result()).toHaveAttribute('aria-live', 'polite');
  });

  it.each(['learner', 'admin'])('S-6 AC-1: every control on the %s form has a label', async (role) => {
    const user = setup();
    if (role === 'admin') await switchToAdmin(user);
    const controls = document.querySelectorAll('input, select');
    expect(controls.length).toBeGreaterThan(5);
    for (const control of controls) expect(control).toHaveAccessibleName();
  });
});
