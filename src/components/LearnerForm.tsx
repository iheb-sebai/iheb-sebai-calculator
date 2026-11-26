import type { IsoDate } from '../lib/dates';
import {
  formatMinutes,
  formatMinutesUnit,
  lateParts,
  markerPosition,
  meterIsOffScale,
  meterPosition,
  METER_ZONES,
  onTrackSentence,
  paceMeterText,
  pacePercent,
  workingDaysPhrase,
} from '../lib/format';
import { calculateLearner, type LearnerResult, type PaceStatus } from '../lib/learner';
import { CALC_ERROR_TEXT, LABELS, STATUS_DETAIL, STATUS_LABEL, TEXT } from '../lib/messages';
import { parseLearnerForm, type FieldId, type LearnerFormText } from '../lib/parse';
import type { WorkingDays } from '../lib/workingDays';
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
import { CheckIcon, StatusIcon } from './icons';
import { WorkingDaysPicker } from './WorkingDaysPicker';

type Plan = Extract<LearnerResult, { kind: 'plan' }>;

interface Props {
  state: FormState<LearnerFormText>;
  today: IsoDate;
  onChange: (state: FormState<LearnerFormText>) => void;
}

function StatusChip({ status }: { status: PaceStatus }) {
  return (
    <span className={`chip chip-${status}`}>
      <StatusIcon status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** S-3: the explanation under the number, in the status's tone. */
function PaceMessage({ plan, spare }: { plan: Plan; spare: number | null }) {
  const { pace } = plan;
  if (pace === null) return <p className="message message-neutral">{TEXT.addSpareHint}</p>;
  if (pace.status !== 'late') {
    return pace.status === 'on-track' ? (
      // On track needs spare time above 0, so the share is always defined here.
      <p className="message message-on-track">{onTrackSentence(pacePercent(plan.neededPerDay, spare ?? 1))}</p>
    ) : (
      <p className="message message-tight">{STATUS_DETAIL.tight}</p>
    );
  }
  if (pace.finish === null) return <p className="message message-late">{TEXT.noSpareTime}</p>;
  const { lead, date, lateBy } = lateParts(spare ?? 0, pace.finish.date, pace.finish.workingDaysLate);
  return (
    <div className="message message-late">
      <p>{lead}</p>
      <p className="finish-date">{date}</p>
      <p className="finish-late">{lateBy}</p>
    </div>
  );
}

/**
 * S-3 AC-10: needed as a share of spare time, on a bar with the On track / Tight / Late zones.
 * The bar repeats the status, so only the text line is read out.
 */
function PaceMeter({ needed, spare, status }: { needed: number; spare: number; status: PaceStatus }) {
  const zone = (width: number) => ({ width: `${width}%` });
  const at = (percent: number) => ({ insetInlineStart: `${meterPosition(percent)}%` });
  if (meterIsOffScale(needed)) {
    return (
      <div className="meter">
        <p className="meter-head">
          <span className="meter-title">{LABELS.yourPace}</span>
          <span className="meter-value meter-way-over">{LABELS.wayOver}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="meter">
      <p className="meter-head">
        <span className="meter-title">{LABELS.yourPace}</span>
        <span className="meter-value">{paceMeterText(needed, spare)}</span>
      </p>
      <div className="meter-bar" aria-hidden="true">
        <div className="meter-zones">
          <span className="zone zone-on-track" style={zone(METER_ZONES.onTrack)} />
          <span className="zone zone-tight" style={zone(METER_ZONES.tight)} />
          <span className="zone zone-late" style={zone(METER_ZONES.late)} />
        </div>
        <span
          className={`meter-marker marker-${status}`}
          style={{ insetInlineStart: `${markerPosition(needed, spare)}%` }}
        />
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span style={at(0)}>{LABELS.meterStart}</span>
        <span style={at(80)}>{LABELS.meterTight}</span>
        <span style={at(100)}>{LABELS.meterLate}</span>
        <span className="meter-scale-end">{LABELS.meterOver}</span>
      </div>
    </div>
  );
}

/** S-1: the daily pace is the star of the page; S-3: the status chip sits beside it. */
function PlanView({ plan, workingDays, spare }: { plan: Plan; workingDays: WorkingDays; spare: number | null }) {
  return (
    <>
      <div className="result-head">
        <p className="eyebrow">{LABELS.youNeed}</p>
        {plan.pace !== null && <StatusChip status={plan.pace.status} />}
      </div>
      <p className="hero">
        <span className="hero-number" key={plan.neededPerDay}>
          {plan.neededPerDay}
        </span>{' '}
        <span className="hero-unit">{formatMinutesUnit(plan.neededPerDay)} a day</span>{' '}
        <span className="hero-detail">over {workingDaysPhrase(plan.workingDaysLeft, workingDays)}</span>
      </p>
      {plan.moreThanAWorkingDay && <p className="warning">{TEXT.moreThanAWorkingDay}</p>}
      {plan.pace !== null && spare !== null && spare > 0 && (
        <PaceMeter needed={plan.neededPerDay} spare={spare} status={plan.pace.status} />
      )}
      <PaceMessage plan={plan} spare={spare} />
      <p className="note">
        {formatMinutes(plan.remainingMinutes)} {LABELS.left} {LABELS.noHolidays}
      </p>
    </>
  );
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
  const spare = parsed.ok ? parsed.value.spareMinutesPerDay : null;
  const value = calc !== null && calc.ok ? calc.value : null;

  return (
    <div className="calculator">
      <ResultSummary>
        {value?.kind === 'plan' ? (
          <>
            <span className="summary-number">{value.neededPerDay}</span>{' '}
            <span>{formatMinutesUnit(value.neededPerDay)} a day</span>{' '}
            {value.pace !== null && <StatusChip status={value.pace.status} />}
          </>
        ) : value?.kind === 'complete' ? (
          <span>{TEXT.alreadyComplete}</span>
        ) : null}
      </ResultSummary>

      <div className="inputs">
        <Section step={1} title={LABELS.sectionTraining}>
          <div className="pair">
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
          </div>
        </Section>
        <Section step={2} title={LABELS.sectionDeadline}>
          <DatePicker
            id="dueDate"
            label={LABELS.dueDate}
            value={text.dueDate}
            today={today}
            workingDays={text.workingDays}
            error={messageFor('dueDate')}
            onChange={(dueDate) => edit({ dueDate }, ['dueDate'])}
            onTouch={() => touch(['dueDate'])}
          />
          <WorkingDaysPicker
            value={text.workingDays}
            error={messageFor('workingDays')}
            onChange={(workingDays) => edit({ workingDays }, ['workingDays'])}
          />
        </Section>
        <Section step={3} title={LABELS.sectionTime}>
          <NumberField
            id="spare"
            layout="inline"
            label={LABELS.spare}
            value={text.spare}
            error={messageFor('spare')}
            onChange={(spare) => edit({ spare }, ['spare'])}
            onTouch={() => touch(['spare'])}
          />
        </Section>
      </div>

      <ResultArea>
        {calc === null ? (
          <EmptyState text={TEXT.learnerEmpty} />
        ) : !calc.ok ? (
          <ResultError text={CALC_ERROR_TEXT[calc.error]} />
        ) : calc.value.kind === 'complete' ? (
          <p className="complete">
            <CheckIcon />
            <span>{TEXT.alreadyComplete}</span>
          </p>
        ) : (
          <PlanView plan={calc.value} workingDays={text.workingDays} spare={spare} />
        )}
      </ResultArea>
    </div>
  );
}
