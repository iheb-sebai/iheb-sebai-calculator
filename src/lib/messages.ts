/**
 * Every fixed piece of text the user reads, in one place (and the one file to
 * translate for S-7). The wording is the contract in docs/user-stories.md;
 * messages.test.ts checks each message appears there word for word.
 *
 * RED PHASE: the shapes are real, the text is not filled in.
 */
import type { AdminError } from './admin';
import type { LearnerError, PaceStatus } from './learner';
import type { FieldErrorCode, FieldId } from './parse';

export type CalcError = LearnerError | AdminError;

export const FIELD_ERROR_TEXT = {} as Readonly<Record<FieldErrorCode, string>>;

export const CALC_ERROR_TEXT = {} as Readonly<Record<CalcError, string>>;

/** Where each engine error is shown (S-5 messages table). It is also repeated in the result area (S-6 AC-6). */
export const CALC_ERROR_PLACE = {} as Readonly<Record<CalcError, FieldId | 'result'>>;

export const STATUS_LABEL = {} as Readonly<Record<PaceStatus, string>>;

export const TEXT = {
  learnerEmpty: '',
  adminEmpty: '',
  alreadyComplete: '',
  moreThanAWorkingDay: '',
  noSpareTime: '',
  adminNoTime: '',
  noRecommended: '',
  recommendedExplainer: '',
};
