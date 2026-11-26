import type { ReactNode } from 'react';
import { LABELS } from '../lib/messages';
import type { DurationText, FieldId } from '../lib/parse';
import { StepsIcon } from './icons';

export const errorId = (id: string) => `${id}-error`;

const joinIds = (...ids: (string | null)[]) => ids.filter(Boolean).join(' ') || undefined;

export function FieldMessage({ id, message }: { id: string; message: string | null }) {
  return message === null ? null : (
    <p id={errorId(id)} className="field-error">
      {message}
    </p>
  );
}

/** A numbered step of the form: "1 Your training". */
export function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  const headingId = `step-${step}`;
  return (
    <section className="step" aria-labelledby={headingId}>
      <h2 id={headingId} className="step-title">
        <span className="step-number">{step}</span> {title}
      </h2>
      {children}
    </section>
  );
}

interface InputProps {
  id: FieldId;
  label: ReactNode;
  value: string;
  error: string | null;
  /** Error id of the surrounding group, so the input also announces it. */
  groupErrorId?: string | null;
  /** 'inline': a small input with its label after it, as in "[ 7 ] Hours". */
  layout?: 'stacked' | 'inline';
  onChange: (value: string) => void;
  onTouch: () => void;
}

/**
 * A text field with a numeric keyboard, not type="number" (D-14): the app gets
 * exactly what was typed, so it can say what is wrong with it.
 */
export function NumberField({
  id,
  label,
  value,
  error,
  groupErrorId = null,
  layout = 'stacked',
  onChange,
  onTouch,
}: InputProps) {
  const input = (
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
  );
  return layout === 'inline' ? (
    <div className="field field-inline">
      <div className="inline-row">
        {input}
        <label htmlFor={id}>{label}</label>
      </div>
      <FieldMessage id={id} message={error} />
    </div>
  ) : (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {input}
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
    <fieldset className="group" aria-describedby={groupErrorId ?? undefined}>
      <legend>{legend}</legend>
      <div className="duration-inputs">
        <NumberField
          id={hoursId}
          layout="inline"
          label={LABELS.hours}
          value={value.hours}
          error={messageFor(hoursId)}
          groupErrorId={groupErrorId}
          onChange={(hours) => onChange({ ...value, hours }, hoursId)}
          onTouch={() => onTouch([hoursId, group])}
        />
        <NumberField
          id={minutesId}
          layout="inline"
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
      <h2 id="result-heading" className="sr-only">
        {LABELS.result}
      </h2>
      <div className="result-body" role="status" aria-live="polite" aria-atomic="true">
        {children}
      </div>
    </section>
  );
}

/**
 * S-6 AC-7: on small screens, a short copy of the result stays at the top while scrolling.
 * Hidden from screen readers, which hear the result once, from the live region.
 */
export function ResultSummary({ children }: { children: ReactNode }) {
  return children === null ? null : (
    <div className="summary" aria-hidden="true">
      {children}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <StepsIcon className="icon" />
      </span>
      <p className="empty-text">{text}</p>
    </div>
  );
}

export function ResultError({ text }: { text: string }) {
  return <p className="result-error">{text}</p>;
}
