// Runs the whole test suite in two extreme time zones (D-4).
// UTC+14 and UTC-10 are 24 hours apart, so if any code mixed up "today" across
// time zones, one of these runs would land on a different calendar day.
import { spawnSync } from 'node:child_process';

const zones = ['Pacific/Kiritimati', 'America/Adak'];

for (const tz of zones) {
  console.log(`\n=== TZ=${tz} ===`);
  const run = spawnSync('npx', ['vitest', 'run'], {
    stdio: 'inherit',
    env: { ...process.env, TZ: tz },
    shell: process.platform === 'win32',
  });
  if (run.status !== 0) process.exit(run.status ?? 1);
}
