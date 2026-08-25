import { describe, expect, it } from 'vitest';
import {
  getAuditErrorCode,
  getAuditErrorStatus,
  toDeviceResult,
  type AuditRunSuccess,
} from './audit-result';

describe('toDeviceResult', () => {
  it('keeps a completed device result when the audit fulfills', () => {
    const value: AuditRunSuccess = {
      audit_id: 'audit-id',
      device_type: 'desktop',
      scores: {
        accessibility: 95,
        performance: 88,
        bestPractices: 91,
        seo: 90,
      },
      violations_count: 2,
    };

    expect(toDeviceResult('desktop', { status: 'fulfilled', value })).toEqual({
      status: 'completed',
      ...value,
    });
  });

  it('turns a known rejected provider error into a safe device result', () => {
    expect(toDeviceResult('mobile', {
      status: 'rejected',
      reason: new Error('pagespeed_timeout'),
    })).toEqual({
      status: 'failed',
      error_type: 'PAGESPEED_TIMEOUT',
    });
  });

  it('does not expose unknown rejection messages to callers', () => {
    expect(toDeviceResult('desktop', {
      status: 'rejected',
      reason: new Error('database connection details'),
    })).toEqual({
      status: 'failed',
      error_type: 'INTERNAL_ERROR',
    });
  });
});

describe('audit error mapping', () => {
  it('maps provider errors to HTTP statuses', () => {
    expect(getAuditErrorCode(new Error('pagespeed_rate_limited'))).toBe('pagespeed_rate_limited');
    expect(getAuditErrorStatus('pagespeed_rate_limited')).toBe(429);
    expect(getAuditErrorStatus('pagespeed_timeout')).toBe(504);
    expect(getAuditErrorStatus('pagespeed_upstream_error')).toBe(502);
  });

  it('maps unknown errors to an internal error', () => {
    expect(getAuditErrorCode(new Error('unexpected'))).toBe('internal_error');
    expect(getAuditErrorStatus('internal_error')).toBe(500);
  });
});
