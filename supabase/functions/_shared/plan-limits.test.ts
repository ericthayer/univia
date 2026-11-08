import { describe, expect, it } from 'vitest';
import { auditLimitMessage, isLetterLimitError, letterLimitMessage, parseQuota } from './plan-limits';

describe('parseQuota', () => {
  it('reads a well-formed answer', () => {
    expect(parseQuota({ allowed: false, limit: 1, used: 1, period: 'month' })).toEqual({
      allowed: false,
      limit: 1,
      used: 1,
      period: 'month',
      anonymous: false,
    });
    expect(parseQuota({ allowed: true, limit: -1, used: 0, period: 'none', anonymous: false })?.limit).toBe(-1);
    expect(parseQuota({ allowed: false, limit: 1, used: 1, period: 'total', anonymous: true })?.anonymous).toBe(true);
  });

  it('rejects anything malformed so callers fail closed', () => {
    expect(parseQuota(null)).toBeNull();
    expect(parseQuota([])).toBeNull();
    expect(parseQuota({ allowed: 'yes', limit: 1, used: 0, period: 'month' })).toBeNull();
    expect(parseQuota({ allowed: true, limit: 1.5, used: 0, period: 'month' })).toBeNull();
    expect(parseQuota({ allowed: true, limit: -2, used: 0, period: 'month' })).toBeNull();
    expect(parseQuota({ allowed: true, limit: 1, used: -1, period: 'month' })).toBeNull();
    expect(parseQuota({ allowed: true, limit: 1, used: 0, period: 'week' })).toBeNull();
  });
});

describe('limit messages', () => {
  it('words the monthly audit allowance', () => {
    expect(auditLimitMessage({ limit: 1 })).toBe(
      "You've used your 1 audit for this month. Your allowance resets on the 1st (UTC).",
    );
    expect(auditLimitMessage({ limit: 30 })).toContain('30 audits');
  });

  it('words the letter allowance by period', () => {
    expect(letterLimitMessage({ limit: 1, period: 'total' })).toBe(
      "You've used the 1 demand letter analysis included without a paid plan. Monitor includes 5 a month.",
    );
    expect(letterLimitMessage({ limit: 5, period: 'month' })).toBe(
      "You've used your 5 demand letter analyses for this month. Your allowance resets on the 1st (UTC).",
    );
  });
});

describe('isLetterLimitError', () => {
  it('matches both database limit errors', () => {
    expect(isLetterLimitError({ message: 'ANONYMOUS_LETTER_LIMIT' })).toBe(true);
    expect(isLetterLimitError({ message: 'LETTER_LIMIT' })).toBe(true);
    expect(isLetterLimitError(new Error('LETTER_LIMIT'))).toBe(true);
    expect(isLetterLimitError({ message: 'duplicate key' })).toBe(false);
    expect(isLetterLimitError(null)).toBe(false);
  });
});
