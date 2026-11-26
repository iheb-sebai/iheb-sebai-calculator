import { CALC_ERROR_PLACE, CALC_ERROR_TEXT, FIELD_ERROR_TEXT, type CalcError } from '../lib/messages';
import type { FieldError, FieldId } from '../lib/parse';

/** What the person typed, and which fields they have changed or left (S-5 AC-6). */
export interface FormState<T> {
  text: T;
  touched: ReadonlySet<FieldId>;
}

export function withTouched<T>(state: FormState<T>, fields: FieldId[]): ReadonlySet<FieldId> {
  return new Set([...state.touched, ...fields]);
}

/**
 * The message to show at a field, or null.
 * - An engine error placed at this field is always shown (S-5 messages table).
 * - A field error is shown once the field has been touched (S-5 AC-6).
 */
export function messageFinder(
  fieldErrors: readonly FieldError[],
  calcError: CalcError | null,
  touched: ReadonlySet<FieldId>,
) {
  return (field: FieldId): string | null => {
    if (calcError !== null && CALC_ERROR_PLACE[calcError] === field) return CALC_ERROR_TEXT[calcError];
    const found = fieldErrors.find((error) => error.field === field);
    return found && touched.has(field) ? FIELD_ERROR_TEXT[found.code] : null;
  };
}
