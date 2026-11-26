import { calculateAdmin, type DueDateOption } from '../lib/admin';
import { formatDisplayDate, type IsoDate } from '../lib/dates';
import { adminOptionSentence } from '../lib/format';
import { CALC_ERROR_TEXT, LABELS, TEXT } from '../lib/messages';
import { parseAdminForm, type AdminFormText, type FieldId } from '../lib/parse';
import type { WorkingDays } from '../lib/workingDays';
import { DateField, DurationField, NumberField, ResultArea } from './fields';
import { messageFinder, withTouched, type FormState } from './formState';
import { WorkingDaysPicker } from './WorkingDaysPicker';

interface Props {
  state: FormState<AdminFormText>;
  today: IsoDate;
  onChange: (state: FormState<AdminFormText>) => void;
}

function DueDate({ option, workingDays }: { option: DueDateOption; workingDays: WorkingDays }) {
  return (
    <>
      <p className="headline">{formatDisplayDate(option.date)}</p>
      <p>{adminOptionSentence(option, workingDays)}</p>
    </>
  );
}

export function AdminForm({ state, today, onChange }: Props) {
  const { text } = state;
  const edit = (patch: Partial<AdminFormText>, fields: FieldId[]) =>
    onChange({ text: { ...text, ...patch }, touched: withTouched(state, fields) });
  const touch = (fields: FieldId[]) => onChange({ text, touched: withTouched(state, fields) });

  // Recalculated from the raw text on every render, so fixing an error always recovers (S-5 AC-4).
  const parsed = parseAdminForm(text, today);
  const calc = parsed.ok ? calculateAdmin(parsed.value) : null;
  const calcError = calc !== null && !calc.ok ? calc.error : null;
  const messageFor = messageFinder(parsed.ok ? [] : parsed.error, calcError, state.touched);

  return (
    <div className="calculator">
      <div className="inputs">
        <DurationField
          group="course"
          legend={LABELS.courseTime}
          value={text.course}
          messageFor={messageFor}
          onChange={(course, field) => edit({ course }, [field, 'course'])}
          onTouch={touch}
        />
        <NumberField
          id="daily"
          label={LABELS.daily}
          value={text.daily}
          error={messageFor('daily')}
          onChange={(daily) => edit({ daily }, ['daily'])}
          onTouch={() => touch(['daily'])}
        />
        <DateField
          id="startDate"
          label={LABELS.startDate}
          value={text.startDate}
          error={messageFor('startDate')}
          onChange={(startDate) => edit({ startDate }, ['startDate'])}
          onTouch={() => touch(['startDate'])}
        />
        <WorkingDaysPicker
          value={text.workingDays}
          error={messageFor('workingDays')}
          onChange={(workingDays) => edit({ workingDays }, ['workingDays'])}
        />
      </div>

      <ResultArea>
        {!parsed.ok || calc === null ? (
          <p>{TEXT.adminEmpty}</p>
        ) : !calc.ok ? (
          <p className="result-error">{CALC_ERROR_TEXT[calc.error]}</p>
        ) : calc.value.kind === 'no-time' ? (
          <p className="headline">{TEXT.adminNoTime}</p>
        ) : (
          <>
            <h3>{LABELS.earliest}</h3>
            <DueDate option={calc.value.earliest} workingDays={text.workingDays} />
            <h3>{LABELS.recommended}</h3>
            {calc.value.recommended === null ? (
              <p>{TEXT.noRecommended}</p>
            ) : (
              <>
                <DueDate option={calc.value.recommended} workingDays={text.workingDays} />
                <p className="note">{TEXT.recommendedExplainer}</p>
              </>
            )}
            <p className="note">{LABELS.noHolidays}</p>
          </>
        )}
      </ResultArea>
    </div>
  );
}
