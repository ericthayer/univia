import { describe, expect, it } from 'vitest';
import { defaultPeriod, fromDateInput, parsePeriod } from './recordPeriod';

const NOW = new Date(2026, 10, 25, 15, 0);

describe('record period', () => {
  it('defaults to the last 90 days', () => {
    expect(defaultPeriod(NOW)).toEqual({ from: '2026-08-27', to: '2026-11-25' });
  });

  it('covers whole local days, ending after the last day', () => {
    const result = parsePeriod('2026-11-01', '2026-11-25', NOW);
    expect(result).toEqual({ ok: true, start: new Date(2026, 10, 1), end: new Date(2026, 10, 26) });
  });

  it('rejects bad input the way the server would', () => {
    expect(parsePeriod('', '2026-11-25', NOW).ok).toBe(false);
    expect(parsePeriod('2026-11-26', '2026-11-25', NOW).ok).toBe(false);
    expect(parsePeriod('2026-11-27', '2026-11-28', NOW).ok).toBe(false);
    expect(parsePeriod('2025-11-01', '2026-11-25', NOW).ok).toBe(false);
    expect(fromDateInput('2026-02-30')).toBeNull();
  });
});
