import { calculateAdmin } from '../lib/admin';
import { formatDisplayDate, type IsoDate } from '../lib/dates';
import { adminOptionSentence } from '../lib/format';
import { CALC_ERROR_TEXT, LABELS, TEXT } from '../lib/messages';
import { parseAdminForm, type AdminFormText, type FieldId } from '../lib/parse';
import { DatePicker } from './DatePicker';
import {
  DurationField,
  EmptyState,
  NumberField,
  ResultArea,
  ResultError,
  ResultSummary,
  Section,
} from './fields';
import { messageFinder, withTouched, type FormState } from './formState';
import { CalendarIcon } from './icons';
import { WorkingDaysPicker } from './WorkingDaysPicker';

interface Props {
  state: FormState<AdminFormText>;
  today: IsoDate;
  onChange: (state: FormState<AdminFormText>) => void;
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
  const value = calc !== null && calc.ok ? calc.value : null;

  return (
    <div className="calculator">
      <ResultSummary>
        {value?.kind === 'dates' ? (
          <>
            <span className="summary-label">{LABELS.earliest}</span>{' '}
            <strong>{formatDisplayDate(value.earliest.date)}</strong>
          </>
        ) : null}
      </ResultSummary>

      <div className="inputs">
        <Section step={1} title={LABELS.sectionCourse}>
          <DurationField
            group="course"
            legend={LABELS.courseTime}
            value={text.course}
            messageFor={messageFor}
            onChange={(course, field) => edit({ course }, [field, 'course'])}
            onTouch={touch}
          />
        </Section>
        <Section step={2} title={LABELS.sectionStart}>
          <DatePicker
            id="startDate"
            label={LABELS.startDate}
            value={text.startDate}
            today={today}
            workingDays={text.workingDays}
            error={messageFor('startDate')}
            onChange={(startDate) => edit({ startDate }, ['startDate'])}
            onTouch={() => touch(['startDate'])}
          />
          <WorkingDaysPicker
            value={text.workingDays}
            error={messageFor('workingDays')}
            onChange={(workingDays) => edit({ workingDays }, ['workingDays'])}
          />
        </Section>
        <Section step={3} title={LABELS.sectionLearningTime}>
          <NumberField
            id="daily"
            layout="inline"
            label={LABELS.daily}
            value={text.daily}
            error={messageFor('daily')}
            onChange={(daily) => edit({ daily }, ['daily'])}
            onTouch={() => touch(['daily'])}
          />
        </Section>
      </div>

      <ResultArea>
        {calc === null ? (
          <EmptyState text={TEXT.adminEmpty} />
        ) : !calc.ok ? (
          <ResultError text={CALC_ERROR_TEXT[calc.error]} />
        ) : calc.value.kind === 'no-time' ? (
          <p className="message message-late">{TEXT.adminNoTime}</p>
        ) : (
          <>
            <h3 className="eyebrow">{LABELS.earliest}</h3>
            <p className="hero-date" key={calc.value.earliest.date}>
              {formatDisplayDate(calc.value.earliest.date)}
            </p>
            <p className="hero-detail">{adminOptionSentence(calc.value.earliest, text.workingDays)}</p>
            <div className="message message-info">
              <h3 className="message-title">
                <CalendarIcon />
                {LABELS.recommended}
              </h3>
              {calc.value.recommended === null ? (
                <p>{TEXT.noRecommended}</p>
              ) : (
                <>
                  <p className="finish-date">{formatDisplayDate(calc.value.recommended.date)}</p>
                  <p>{adminOptionSentence(calc.value.recommended, text.workingDays)}</p>
                  <p className="message-note">{TEXT.recommendedExplainer}</p>
                </>
              )}
            </div>
            <p className="note">{LABELS.noHolidays}</p>
          </>
        )}
      </ResultArea>
    </div>
  );
}
