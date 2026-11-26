import { useState } from 'react';
import { AdminForm } from './components/AdminForm';
import type { FormState } from './components/formState';
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
    <main className="app">
      <header>
        <h1>{LABELS.appTitle}</h1>
        <p className="tagline">{LABELS.appTagline}</p>
      </header>

      <fieldset className="role-switch">
        <legend>{LABELS.roleQuestion}</legend>
        {ROLES.map(({ role: value, label }) => (
          <label key={value}>
            <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />
            {label}
          </label>
        ))}
      </fieldset>

      {role === 'learner' ? (
        <LearnerForm state={learner} today={today} onChange={setLearner} />
      ) : (
        <AdminForm state={admin} today={today} onChange={setAdmin} />
      )}
    </main>
  );
}
