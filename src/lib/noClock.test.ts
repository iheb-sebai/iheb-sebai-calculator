import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * D-4: the calculation engine never reads the clock. "Today" is always passed in,
 * so every result is the same on any machine, on any day, in any time zone.
 * This reads the source of every engine file and fails on anything that reads the time.
 */
const libDir = new URL('./', import.meta.url);
const engineFiles = readdirSync(libDir).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'));

const CLOCK_READS: [string, RegExp][] = [
  ['Date.now()', /\bDate\s*\.\s*now\b/],
  ['new Date', /\bnew\s+Date\b/],
  ['Date()', /\bDate\s*\(/],
  ['performance.now()', /\bperformance\s*\.\s*now\b/],
  ['Temporal.Now', /\bTemporal\s*\.\s*Now\b/],
];

describe('the engine never reads the clock', () => {
  it('D-4: the guard really scans the engine files', () => {
    expect(engineFiles).toEqual(
      expect.arrayContaining(['dates.ts', 'workingDays.ts', 'learner.ts', 'admin.ts', 'parse.ts', 'format.ts']),
    );
  });

  it.each(engineFiles)('D-4: %s does not read the clock', (name) => {
    const source = readFileSync(new URL(name, libDir), 'utf8');
    const found = CLOCK_READS.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
    expect(found).toEqual([]);
  });
});
