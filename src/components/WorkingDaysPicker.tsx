import { WEEKDAY_SHORT_NAMES, type Weekday } from '../lib/dates';
import { LABELS } from '../lib/messages';
import { PRESETS, presetFor, type PresetId, type WorkingDays } from '../lib/workingDays';
import { FieldMessage, errorId } from './fields';

/** Week order from Monday, as in the result labels (S-2 AC-6). */
const DAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const PRESET_BUTTONS: readonly { id: PresetId; label: string }[] = [
  { id: 'monFri', label: LABELS.presetMonFri },
  { id: 'sunThu', label: LABELS.presetSunThu },
];

interface Props {
  value: WorkingDays;
  error: string | null;
  onChange: (value: WorkingDays) => void;
}

/**
 * S-2 AC-1, AC-2: two preset buttons plus a toggle for each day.
 * The toggles are real checkboxes and the presets real buttons (S-6 AC-5).
 */
export function WorkingDaysPicker({ value, error, onChange }: Props) {
  const preset = presetFor(value);
  const toggle = (day: Weekday) => {
    const next = new Set(value);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(next);
  };

  return (
    <fieldset className="group" aria-describedby={error === null ? undefined : errorId('workingDays')}>
      <legend>{LABELS.workingDays}</legend>
      <div className="presets" role="group" aria-labelledby="presets-label">
        <span id="presets-label" className="presets-label">
          {LABELS.presets}
        </span>
        {PRESET_BUTTONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="preset"
            aria-pressed={preset === id}
            onClick={() => onChange(PRESETS[id])}
          >
            {label}
          </button>
        ))}
        {preset === 'custom' && <span className="custom-tag">{LABELS.presetCustom}</span>}
      </div>
      <div className="day-toggles">
        {DAY_ORDER.map((day) => (
          <label key={day} className="day-toggle">
            <input type="checkbox" className="day-input" checked={value.has(day)} onChange={() => toggle(day)} />
            <span className="day-label">{WEEKDAY_SHORT_NAMES[day]}</span>
          </label>
        ))}
      </div>
      <FieldMessage id="workingDays" message={error} />
    </fieldset>
  );
}
