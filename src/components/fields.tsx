import type { ReactNode } from 'react';
import { LABELS } from '../lib/messages';
import type { DurationText, FieldId } from '../lib/parse';

export const errorId = (id: string) => `${id}-error`;

const joinIds = (...ids: (string | null)[]) => ids.filter(Boolean).join(' ') || undefined;

export function FieldMessage({ id, message }: { id: string; message: string | null }) {
  return message === null ? null : (
    <p id={errorId(id)} className="field-error">
      {message}
    </p>
  );
}

interface InputProps {
  id: FieldId;
  label: ReactNode;
  value: string;
  error: string | null;
  /** Error id of the surrounding group, so the input also announces it. */
  groupErrorId?: string | null;
  onChange: (value: string) => void;
  onTouch: () => void;
}

/**
 * A text field with a numeric keyboard, not type="number" (D-14): the app gets
 * exactly what was typed, so it can say what is wrong with it.
 */
export function NumberField({ id, label, value, error, groupErrorId = null, onChange, onTouch }: InputProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-invalid={error !== null || groupErrorId !== null}
        aria-describedby={joinIds(error === null ? null : errorId(id), groupErrorId)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={onTouch}
      />
      <FieldMessage id={id} message={error} />
    </div>
  );
}

export function DateField({ id, label, value, error, onChange, onTouch }: InputProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId(id)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onTouch}
      />
      <FieldMessage id={id} message={error} />
    </div>
  );
}

interface DurationProps {
  group: 'total' | 'done' | 'course';
  legend: string;
  value: DurationText;
  messageFor: (field: FieldId) => string | null;
  onChange: (value: DurationText, field: FieldId) => void;
  onTouch: (fields: FieldId[]) => void;
}

/** Hours + minutes, grouped so a screen reader says "Total course time, Hours". */
export function DurationField({ group, legend, value, messageFor, onChange, onTouch }: DurationProps) {
  const hoursId = `${group}Hours` as FieldId;
  const minutesId = `${group}Minutes` as FieldId;
  const groupError = messageFor(group);
  const groupErrorId = groupError === null ? null : errorId(group);

  return (
    <fieldset className="duration" aria-describedby={groupErrorId ?? undefined}>
      <legend>{legend}</legend>
      <div className="duration-inputs">
        <NumberField
          id={hoursId}
          label={LABELS.hours}
          value={value.hours}
          error={messageFor(hoursId)}
          groupErrorId={groupErrorId}
          onChange={(hours) => onChange({ ...value, hours }, hoursId)}
          onTouch={() => onTouch([hoursId, group])}
        />
        <NumberField
          id={minutesId}
          label={LABELS.minutes}
          value={value.minutes}
          error={messageFor(minutesId)}
          groupErrorId={groupErrorId}
          onChange={(minutes) => onChange({ ...value, minutes }, minutesId)}
          onTouch={() => onTouch([minutesId, group])}
        />
      </div>
      <FieldMessage id={group} message={groupError} />
    </fieldset>
  );
}

/** S-6 AC-3: the result is a polite live region, so screen readers announce every change. */
export function ResultArea({ children }: { children: ReactNode }) {
  return (
    <section className="result" aria-labelledby="result-heading">
      <h2 id="result-heading">{LABELS.result}</h2>
      <div role="status" aria-live="polite" aria-atomic="true">
        {children}
      </div>
    </section>
  );
}
