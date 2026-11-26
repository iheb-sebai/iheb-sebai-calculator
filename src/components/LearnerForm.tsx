import type { IsoDate } from '../lib/dates';
import { formatMinutes, lateSentence, learnerPlanSentence } from '../lib/format';
import { calculateLearner } from '../lib/learner';
import { CALC_ERROR_TEXT, LABELS, STATUS_DETAIL, STATUS_LABEL, TEXT } from '../lib/messages';
import { parseLearnerForm, type FieldId, type LearnerFormText } from '../lib/parse';
import { DateField, DurationField, NumberField, ResultArea } from './fields';
import { messageFinder, withTouched, type FormState } from './formState';
import { WorkingDaysPicker } from './WorkingDaysPicker';

interface Props {
  state: FormState<LearnerFormText>;
  today: IsoDate;
  onChange: (state: FormState<LearnerFormText>) => void;
}

export function LearnerForm({ state, today, onChange }: Props) {
  const { text } = state;
  const edit = (patch: Partial<LearnerFormText>, fields: FieldId[]) =>
    onChange({ text: { ...text, ...patch }, touched: withTouched(state, fields) });
  const touch = (fields: FieldId[]) => onChange({ text, touched: withTouched(state, fields) });

  // Recalculated from the raw text on every render, so fixing an error always recovers (S-5 AC-4).
  const parsed = parseLearnerForm(text, today);
  const calc = parsed.ok ? calculateLearner(parsed.value) : null;
  const calcError = calc !== null && !calc.ok ? calc.error : null;
  const messageFor = messageFinder(parsed.ok ? [] : parsed.error, calcError, state.touched);

  return (
    <div className="calculator">
      <div className="inputs">
        <DurationField
          group="total"
          legend={LABELS.totalTime}
          value={text.total}
          messageFor={messageFor}
          onChange={(total, field) => edit({ total }, [field, 'total'])}
          onTouch={touch}
        />
        <DurationField
          group="done"
          legend={LABELS.doneTime}
          value={text.done}
          messageFor={messageFor}
          onChange={(done, field) => edit({ done }, [field, 'done'])}
          onTouch={touch}
        />
        <DateField
          id="dueDate"
          label={LABELS.dueDate}
          value={text.dueDate}
          error={messageFor('dueDate')}
          onChange={(dueDate) => edit({ dueDate }, ['dueDate'])}
          onTouch={() => touch(['dueDate'])}
        />
        <NumberField
          id="spare"
          label={LABELS.spare}
          value={text.spare}
          error={messageFor('spare')}
          onChange={(spare) => edit({ spare }, ['spare'])}
          onTouch={() => touch(['spare'])}
        />
        <WorkingDaysPicker
          value={text.workingDays}
          error={messageFor('workingDays')}
          onChange={(workingDays) => edit({ workingDays }, ['workingDays'])}
        />
      </div>

      <ResultArea>
        {!parsed.ok || calc === null ? (
          <p>{TEXT.learnerEmpty}</p>
        ) : !calc.ok ? (
          <p className="result-error">{CALC_ERROR_TEXT[calc.error]}</p>
        ) : calc.value.kind === 'complete' ? (
          <p className="headline">{TEXT.alreadyComplete}</p>
        ) : (
          <>
            <p className="headline">
              {learnerPlanSentence(calc.value.neededPerDay, calc.value.workingDaysLeft, text.workingDays)}
            </p>
            {calc.value.moreThanAWorkingDay && <p>{TEXT.moreThanAWorkingDay}</p>}
            {calc.value.pace !== null && (
              <p>
                <strong className={`status status-${calc.value.pace.status}`}>
                  {STATUS_LABEL[calc.value.pace.status]}
                </strong>{' '}
                {calc.value.pace.status !== 'late'
                  ? STATUS_DETAIL[calc.value.pace.status]
                  : calc.value.pace.finish === null
                    ? TEXT.noSpareTime
                    : lateSentence(
                        parsed.value.spareMinutesPerDay ?? 0,
                        calc.value.pace.finish.date,
                        calc.value.pace.finish.workingDaysLate,
                      )}
              </p>
            )}
            <p className="note">
              {formatMinutes(calc.value.remainingMinutes)} left. {LABELS.noHolidays}
            </p>
          </>
        )}
      </ResultArea>
    </div>
  );
}
