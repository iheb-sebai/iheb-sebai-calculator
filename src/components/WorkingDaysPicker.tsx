import { WEEKDAY_SHORT_NAMES, type Weekday } from '../lib/dates';
import { LABELS } from '../lib/messages';
import { PRESETS, presetFor, type WorkingDays } from '../lib/workingDays';
import { FieldMessage, errorId } from './fields';

/** Week order from Monday, as in the result labels (S-2 AC-6). */
const DAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  value: WorkingDays;
  error: string | null;
  onChange: (value: WorkingDays) => void;
}

/** S-2 AC-1, AC-2: two presets plus one checkbox per day; the preset always matches the boxes. */
export function WorkingDaysPicker({ value, error, onChange }: Props) {
  const toggle = (day: Weekday) => {
    const next = new Set(value);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(next);
  };

  return (
    <fieldset className="working-days" aria-describedby={error === null ? undefined : errorId('workingDays')}>
      <legend>{LABELS.workingDays}</legend>
      <div className="field">
        <label htmlFor="preset">{LABELS.preset}</label>
        <select
          id="preset"
          value={presetFor(value)}
          onChange={(event) => {
            const choice = event.target.value;
            if (choice === 'monFri' || choice === 'sunThu') onChange(PRESETS[choice]);
          }}
        >
          <option value="monFri">{LABELS.presetMonFri}</option>
          <option value="sunThu">{LABELS.presetSunThu}</option>
          <option value="custom">{LABELS.presetCustom}</option>
        </select>
      </div>
      <div className="days">
        {DAY_ORDER.map((day) => (
          <label key={day} className="day">
            <input type="checkbox" checked={value.has(day)} onChange={() => toggle(day)} />
            {WEEKDAY_SHORT_NAMES[day]}
          </label>
        ))}
      </div>
      <FieldMessage id="workingDays" message={error} />
    </fieldset>
  );
}
