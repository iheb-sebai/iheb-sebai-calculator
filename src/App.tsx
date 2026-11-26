import { useState } from 'react';
import { AdminForm } from './components/AdminForm';
import type { FormState } from './components/formState';
import { StepsIcon } from './components/icons';
import { LearnerForm } from './components/LearnerForm';
import type { IsoDate } from './lib/dates';
import { LABELS } from './lib/messages';
import type { AdminFormText, LearnerFormText } from './lib/parse';
import { PRESETS } from './lib/workingDays';
import { todayIso } from './today';

type Role = 'learner' | 'admin';

const ROLES: readonly { role: Role; label: string }[] = [
  { role: 'learner', label: LABELS.roleLearner },
  { role: 'admin', label: LABELS.roleAdmin },
];

const zero = () => ({ hours: '0', minutes: '0' });

/**
 * `today` is fixed in tests. In the browser it is read on every render, so a page
 * left open past midnight uses the new day.
 */
export function App({ today: fixedToday }: { today?: IsoDate }) {
  const today = fixedToday ?? todayIso();
  const [role, setRole] = useState<Role>('learner');

  // Both forms' state lives here, so switching role and back keeps what was typed.
  const [learner, setLearner] = useState<FormState<LearnerFormText>>(() => ({
    text: { total: zero(), done: zero(), dueDate: '', spare: '', workingDays: PRESETS.monFri },
    touched: new Set(),
  }));
  const [admin, setAdmin] = useState<FormState<AdminFormText>>(() => ({
    text: { course: zero(), startDate: today, daily: '', workingDays: PRESETS.monFri },
    touched: new Set(),
  }));

  return (
    <div className="page">
      <header className="masthead">
        <div className="brand">
          <span className="logo">
            <StepsIcon className="logo-icon" />
          </span>
          <div className="brand-text">
            <h1 className="brand-name">
              {LABELS.appTitle}{' '}
              <span className="brand-ar" lang="ar" dir="rtl">
                {LABELS.appTitleArabic}
              </span>
            </h1>
            <p className="brand-tagline">{LABELS.appTagline}</p>
          </div>
        </div>

        {/* S-6 AC-5: a segmented control built on real radio buttons, so arrow keys work. */}
        <fieldset className="segmented">
          <legend className="sr-only">{LABELS.roleQuestion}</legend>
          <span className="segmented-label" aria-hidden="true">
            {LABELS.roleQuestion}
          </span>
          <div className="segments">
            {ROLES.map(({ role: value, label }) => (
              <label key={value} className="segment">
                <input
                  type="radio"
                  className="segment-input"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                />
                <span className="segment-label">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </header>

      <main className="app">
        {role === 'learner' ? (
          <LearnerForm state={learner} today={today} onChange={setLearner} />
        ) : (
          <AdminForm state={admin} today={today} onChange={setAdmin} />
        )}
      </main>
    </div>
  );
}
