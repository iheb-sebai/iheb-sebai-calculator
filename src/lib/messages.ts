/**
 * Every fixed piece of text the user reads, in one place (and the one file to
 * translate for S-7, with the sentences in format.ts). The wording is the
 * contract in docs/user-stories.md; messages.test.ts checks each message
 * appears there word for word.
 */
import type { AdminError } from './admin';
import type { LearnerError, PaceStatus } from './learner';
import type { FieldErrorCode, FieldId } from './parse';

export type CalcError = LearnerError | AdminError;

export const FIELD_ERROR_TEXT: Readonly<Record<FieldErrorCode, string>> = {
  required: 'Enter a number.',
  negative: "Can't be negative.",
  'not-whole': 'Use whole numbers only.',
  'minutes-over-59': 'Minutes must be 0–59.',
  'hours-over-max': 'Must be 999 hours or less.',
  'per-day-over-max': 'Must be 480 minutes (8 hours) or less.',
  'total-zero': 'Total time must be more than 0.',
  'date-invalid': 'Enter a valid date.',
  'date-too-far': 'Pick a date within 5 years of today.',
};

export const CALC_ERROR_TEXT: Readonly<Record<CalcError, string>> = {
  'invalid-input': "Something in the form isn't valid. Check the fields above.",
  'done-over-total': "Time done can't be more than the total time.",
  'no-working-days-selected': 'Select at least one working day.',
  'due-date-in-past': 'The due date is in the past. Pick today or a later date.',
  'no-working-days-left':
    'There are no working days between today and the due date. Pick a later date or add working days.',
  'start-date-in-past': "The start date can't be before today.",
};

/** Where each engine error is shown (S-5 messages table). It is also repeated in the result area (S-6 AC-6). */
export const CALC_ERROR_PLACE: Readonly<Record<CalcError, FieldId | 'result'>> = {
  'invalid-input': 'result',
  'done-over-total': 'done',
  'no-working-days-selected': 'workingDays',
  'due-date-in-past': 'dueDate',
  'no-working-days-left': 'result',
  'start-date-in-past': 'startDate',
};

/** S-3 AC-8: the status is always a word. */
export const STATUS_LABEL: Readonly<Record<PaceStatus, string>> = {
  'on-track': 'On track',
  tight: 'Tight',
  late: 'Late',
};

/** On track is a sentence with the person's own percentage: onTrackSentence in format.ts. */
export const STATUS_DETAIL: Readonly<Record<'tight', string>> = {
  tight: 'You need more than 80% of your spare time, so one bad day could make you late.',
};

export const TEXT = {
  learnerEmpty: 'Enter your training to see your daily pace.',
  adminEmpty: 'Enter your course to see the earliest due date.',
  alreadyComplete: 'Already complete: nothing left to do.',
  moreThanAWorkingDay: "That's more than a full working day.",
  noSpareTime: "At 0 minutes a day you won't finish. Ask for learning time or a new due date.",
  adminNoTime: "At 0 minutes a day employees can't finish. Give them learning time to get a due date.",
  noRecommended: 'Not available at 1 minute a day. Raise the daily time to get a date with a margin.',
  recommendedExplainer: 'Keeps the daily pace to 80% or less of the time you give.',
  addSpareHint: "Add the minutes you can spare to see if you're on track.",
};

/** Labels and headings on the page. Each one is listed in "Screen text" in docs/user-stories.md. */
export const LABELS = {
  appTitle: 'Khutwa',
  appTitleArabic: 'خطوة',
  appTagline: 'Training deadlines you can actually meet',
  roleQuestion: 'I am',
  roleLearner: 'a learner',
  roleAdmin: 'an L&D admin',
  sectionTraining: 'Your training',
  sectionDeadline: 'Deadline and working days',
  sectionTime: 'Your time',
  sectionCourse: 'The course',
  sectionStart: 'Start date and working days',
  sectionLearningTime: 'Learning time',
  totalTime: 'Total course time',
  doneTime: 'Time already done',
  courseTime: 'Course time',
  hours: 'Hours',
  minutes: 'Minutes',
  dueDate: 'Due date',
  startDate: 'Start date',
  pickDate: 'Pick a date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  spare: 'Minutes you can spare per working day (optional)',
  daily: 'Daily learning time employees get (minutes per working day)',
  workingDays: 'Working days',
  presets: 'Presets',
  presetMonFri: 'Mon–Fri',
  presetSunThu: 'Sun–Thu',
  presetCustom: 'Custom',
  result: 'Result',
  youNeed: 'You need',
  yourPace: 'Your pace',
  meterStart: '0%',
  meterTight: '80%',
  meterLate: '100%',
  meterOver: 'over',
  wayOver: 'way over',
  earliest: 'Earliest due date',
  recommended: 'Recommended due date',
  left: 'left.',
  noHolidays: 'Public holidays are not counted: remove them from your plan yourself.',
};
