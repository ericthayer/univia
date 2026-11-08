/**
 * Reads the allowance answers returned by the plan-limit database functions
 * (claim_audit_run, letter_quota; see 20261108050610_enforce_plan_limits) and
 * words the message a caller sees when an allowance is used up.
 */

export type QuotaPeriod = 'month' | 'total' | 'none';

export interface QuotaResult {
  allowed: boolean;
  /** -1 means no cap. */
  limit: number;
  used: number;
  period: QuotaPeriod;
  anonymous: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPeriod(value: unknown): value is QuotaPeriod {
  return value === 'month' || value === 'total' || value === 'none';
}

/** Returns null for anything that is not a well-formed quota answer, so callers fail closed. */
export function parseQuota(value: unknown): QuotaResult | null {
  if (!isRecord(value)) return null;
  const { allowed, limit, used, period, anonymous } = value;
  if (
    typeof allowed !== 'boolean' ||
    typeof limit !== 'number' || !Number.isInteger(limit) || limit < -1 ||
    typeof used !== 'number' || !Number.isInteger(used) || used < 0 ||
    !isPeriod(period)
  ) {
    return null;
  }
  return { allowed, limit, used, period, anonymous: anonymous === true };
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function auditLimitMessage(quota: Pick<QuotaResult, 'limit'>): string {
  return `You've used your ${plural(quota.limit, 'audit')} for this month. ` +
    'Your allowance resets on the 1st (UTC).';
}

export function letterLimitMessage(quota: Pick<QuotaResult, 'limit' | 'period'>): string {
  if (quota.period === 'month') {
    return `You've used your ${plural(quota.limit, 'demand letter analysis', 'demand letter analyses')} for this month. ` +
      'Your allowance resets on the 1st (UTC).';
  }
  return `You've used the ${plural(quota.limit, 'demand letter analysis', 'demand letter analyses')} included without a paid plan. ` +
    'Monitor includes 5 a month.';
}

export function isLetterLimitError(error: unknown): boolean {
  const message = isRecord(error) && typeof error.message === 'string'
    ? error.message
    : error instanceof Error ? error.message : '';
  return message.includes('LETTER_LIMIT');
}
