import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  WEEK_ORDER,
  WEEKDAY_FULL_NAMES,
  addMonths,
  endOfWeek,
  monthGrid,
  monthTitle,
  startOfWeek,
} from '../lib/calendar';
import { WEEKDAY_SHORT_NAMES, addDays, formatDisplayDate, parseIsoDate, weekdayOf, type IsoDate } from '../lib/dates';
import { LABELS } from '../lib/messages';
import type { FieldId } from '../lib/parse';
import type { WorkingDays } from '../lib/workingDays';
import { FieldMessage, errorId } from './fields';
import { ChevronLeftIcon, ChevronRightIcon, DateIcon } from './icons';

interface Props {
  id: FieldId;
  label: string;
  /** 'YYYY-MM-DD', or '' when no date is picked yet. */
  value: string;
  error: string | null;
  today: IsoDate;
  /** Non-working days are shown lighter. They can still be picked (S-2 AC-5). */
  workingDays: WorkingDays;
  onChange: (value: string) => void;
  onTouch: () => void;
}

/**
 * S-6 AC-8: a date field that opens a calendar, after the WAI-ARIA date picker pattern.
 * The field is a combobox button with the field's label; the calendar is a dialog with a
 * grid of day buttons and one roving tab stop. Keys: arrows (day, week), Home/End (week),
 * Page Up/Down (month; with Shift, year), Enter or Space (pick), Escape (close).
 */
export function DatePicker({ id, label, value, error, today, workingDays, onChange, onTouch }: Props) {
  const selected = parseIsoDate(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<IsoDate>(selected ?? today);
  const focusDay = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  // Effects below run after later renders; they must call the latest onTouch, not a stale one.
  const onTouchRef = useRef(onTouch);
  onTouchRef.current = onTouch;

  const dialogId = `${id}-calendar`;
  const titleId = `${id}-calendar-title`;

  const openCalendar = () => {
    setActive(selected ?? today);
    focusDay.current = true;
    setOpen(true);
  };
  /** Escape: focus goes back to the field, so it is not "left" yet and shows no error (S-5 AC-6). */
  const closeToField = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const pick = (date: IsoDate) => {
    // onChange also marks the field touched. Calling onTouch as well would update the form
    // from the same stale snapshot and undo the new date.
    onChange(date);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Move focus to the active day after opening or a keyboard move (not after Previous/Next clicks).
  useEffect(() => {
    if (!open || !focusDay.current) return;
    focusDay.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)?.focus();
  }, [open, active]);

  // A click outside the field or the calendar closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!dialogRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
        onTouchRef.current();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const onGridKey = (event: KeyboardEvent) => {
    const moves: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(active, -1),
      ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7),
      ArrowDown: () => addDays(active, 7),
      Home: () => startOfWeek(active),
      End: () => endOfWeek(active),
      PageUp: () => addMonths(active, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(active, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    focusDay.current = true;
    setActive(move());
  };

  const describedBy = error === null ? undefined : errorId(id);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="datepicker">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          className="date-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-invalid={error !== null}
          aria-describedby={describedBy}
          onClick={() => {
            if (!open) return openCalendar();
            // Clicking the field again closes the calendar; focus stays on the field.
            setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && !open) {
              event.preventDefault();
              openCalendar();
            }
          }}
          onBlur={() => {
            if (!open) onTouch();
          }}
        >
          <span className={selected === null ? 'date-placeholder' : 'date-value'}>
            {selected === null ? LABELS.pickDate : formatDisplayDate(selected)}
          </span>
          <DateIcon />
        </button>

        {open && (
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            className="calendar"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeToField();
              }
            }}
            onBlur={(event) => {
              // Tabbing out closes it. A null target is a day button re-rendering, not a real exit.
              const next = event.relatedTarget as Node | null;
              if (next !== null && !dialogRef.current?.contains(next) && next !== triggerRef.current) {
                setOpen(false);
                onTouchRef.current();
              }
            }}
          >
            <div className="calendar-head">
              <button
                type="button"
                className="calendar-nav"
                aria-label={LABELS.previousMonth}
                onClick={() => setActive(addMonths(active, -1))}
              >
                <ChevronLeftIcon />
              </button>
              <h3 id={titleId} className="calendar-title" aria-live="polite">
                {monthTitle(active)}
              </h3>
              <button
                type="button"
                className="calendar-nav"
                aria-label={LABELS.nextMonth}
                onClick={() => setActive(addMonths(active, 1))}
              >
                <ChevronRightIcon />
              </button>
            </div>
            <table ref={gridRef} role="grid" aria-labelledby={titleId} className="calendar-grid">
              <thead>
                <tr>
                  {WEEK_ORDER.map((day) => (
                    <th key={day} scope="col" abbr={WEEKDAY_FULL_NAMES[day]}>
                      {WEEKDAY_SHORT_NAMES[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(active).map((week, row) => (
                  <tr key={row}>
                    {week.map((date, column) => {
                      if (date === null) return <td key={`blank-${column}`} />;
                      // ISO dates compare as strings. Past days stay focusable (arrow keys pass
                      // over them, as in the WAI-ARIA pattern) but can't be picked.
                      const past = date < today;
                      return (
                        <td key={date} aria-selected={date === selected}>
                          <button
                            type="button"
                            data-date={date}
                            tabIndex={date === active ? 0 : -1}
                            aria-label={formatDisplayDate(date)}
                            aria-current={date === today ? 'date' : undefined}
                            aria-disabled={past || undefined}
                            className={[
                              'day',
                              date === selected ? 'day-selected' : '',
                              date === today ? 'day-today' : '',
                              workingDays.has(weekdayOf(date)) ? '' : 'day-off',
                              past ? 'day-past' : '',
                            ].join(' ')}
                            onClick={() => {
                              if (!past) pick(date);
                            }}
                            onKeyDown={onGridKey}
                          >
                            {Number(date.slice(8, 10))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <FieldMessage id={id} message={error} />
    </div>
  );
}
