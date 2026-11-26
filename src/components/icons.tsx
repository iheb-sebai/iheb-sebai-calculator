/** Small line icons. All decorative: the text next to them carries the meaning. */
import type { ReactNode } from 'react';
import type { PaceStatus } from '../lib/learner';

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ?? 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Icon>
);

export const AlertIcon = () => (
  <Icon>
    <path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);

export const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const CalendarIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" />
  </Icon>
);

export const DateIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </Icon>
);

export const ChevronLeftIcon = () => (
  <Icon>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const StepsIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M4 18h5v-5h5V8h6" />
  </Icon>
);

export function StatusIcon({ status }: { status: PaceStatus }) {
  if (status === 'on-track') return <CheckIcon />;
  if (status === 'tight') return <AlertIcon />;
  return <ClockIcon />;
}
