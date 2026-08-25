import { getSupabaseFunctionHeaders, getSupabaseFunctionUrl } from './supabaseFunctions';

const AUDIT_FUNCTION = 'run-lighthouse-audit';

export interface LighthouseAuditResponse {
  success: true;
  session_id: string;
  mobile: unknown;
  desktop: unknown;
}

interface ErrorPayload {
  error?: unknown;
  errorType?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class LighthouseAuditError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly code: string | null;

  constructor(message: string, status: number, requestId: string | null, code: string | null) {
    super(message);
    this.name = 'LighthouseAuditError';
    this.status = status;
    this.requestId = requestId;
    this.code = code;
  }
}

function normalizeAuditUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname) {
      throw new Error('invalid_url');
    }
    return url.toString();
  } catch {
    throw new LighthouseAuditError('Please enter a valid public HTTPS website address.', 422, null, 'INVALID_URL');
  }
}

async function readErrorPayload(response: Response): Promise<ErrorPayload> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
      return payload as ErrorPayload;
    }
  } catch {
    // Use the status-based message when the server did not return JSON.
  }
  return {};
}

function getErrorMessage(status: number, payload: ErrorPayload): string {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'This audit request is not allowed.';
  if (status === 422 && payload.error === 'URL could not be verified as public') {
    return 'That website could not be verified as publicly reachable.';
  }
  if (status === 429) return 'Audit service is busy. Please try again shortly.';
  if (status === 503) return 'Audit service is temporarily unavailable. Please try again shortly.';
  if (status >= 500) return 'The website audit could not be completed. Please try again.';
  return typeof payload.error === 'string' ? payload.error : 'Unable to run the website audit.';
}

export async function requestLighthouseAudit(
  rawUrl: string,
  accessToken: string | null | undefined,
  signal?: AbortSignal,
): Promise<LighthouseAuditResponse> {
  if (!accessToken) {
    throw new LighthouseAuditError('Authentication required.', 401, null, 'AUTHENTICATION_REQUIRED');
  }

  const url = normalizeAuditUrl(rawUrl);
  const response = await fetch(getSupabaseFunctionUrl(AUDIT_FUNCTION), {
    method: 'POST',
    headers: getSupabaseFunctionHeaders(accessToken),
    body: JSON.stringify({ url }),
    signal,
  });

  const requestId = response.headers.get('X-Request-ID');
  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new LighthouseAuditError(getErrorMessage(response.status, payload), response.status, requestId, typeof payload.errorType === 'string' ? payload.errorType : null);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new LighthouseAuditError('The audit service returned an invalid response.', 502, requestId, 'INVALID_RESPONSE');
  }

  if (
    !isRecord(result) ||
    result.success !== true ||
    typeof result.session_id !== 'string' ||
    !result.session_id
  ) {
    throw new LighthouseAuditError('The audit service returned an incomplete response.', 502, requestId, 'INVALID_RESPONSE');
  }

  return result as unknown as LighthouseAuditResponse;
}