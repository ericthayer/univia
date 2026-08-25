export type AuditDeviceType = 'mobile' | 'desktop';

export interface AuditRunSuccess {
  audit_id: string;
  device_type: AuditDeviceType;
  scores: {
    accessibility: number;
    performance: number;
    bestPractices: number;
    seo: number;
  };
  violations_count: number;
}

export type AuditDeviceResult =
  | ({ status: 'completed' } & AuditRunSuccess)
  | { status: 'failed'; error_type: string };

const KNOWN_AUDIT_ERROR_CODES = new Set([
  'pagespeed_timeout',
  'pagespeed_rate_limited',
  'pagespeed_upstream_error',
  'invalid_pagespeed_response',
  'pagespeed_runtime_error',
  'pagespeed_response_too_large',
]);

export function getAuditErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return KNOWN_AUDIT_ERROR_CODES.has(message) ? message : 'internal_error';
}

export function getAuditErrorStatus(errorCode: string): number {
  if (errorCode === 'pagespeed_timeout') return 504;
  if (errorCode === 'pagespeed_rate_limited') return 429;
  if (errorCode.startsWith('pagespeed_') || errorCode === 'invalid_pagespeed_response') return 502;
  return 500;
}

export function toDeviceResult(
  deviceType: AuditDeviceType,
  settled: PromiseSettledResult<AuditRunSuccess>,
): AuditDeviceResult {
  if (settled.status === 'fulfilled') {
    return {
      status: 'completed',
      ...settled.value,
      device_type: deviceType,
    };
  }

  return {
    status: 'failed',
    error_type: getAuditErrorCode(settled.reason).toUpperCase(),
  };
}
