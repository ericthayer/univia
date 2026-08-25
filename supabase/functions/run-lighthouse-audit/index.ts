import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createSupabaseContext } from 'npm:@supabase/server';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { resolvesToPublicIps, validateAuditRequest } from '../_shared/audit-validation.ts';
import {
  createRequestId,
  getAllowedOrigins,
  getCorsHeaders,
  isAllowedOrigin,
  jsonResponse,
} from '../_shared/http.ts';
import {
  getAuditErrorCode,
  getAuditErrorStatus,
  toDeviceResult,
  type AuditDeviceResult,
  type AuditRunSuccess,
} from './audit-result.ts';
import { parseLighthouseResult } from './lighthouse-result.ts';

const UPSTREAM_TIMEOUT_MS = 90_000;
const MAX_PAGESPEED_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_PROVIDER_ERROR_BYTES = 16 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAuthRequest(req: Request): Request {
  const authorization = req.headers.get('Authorization');
  const publishableKey = req.headers.get('apikey');
  const bearerToken = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];

  // The Supabase dashboard's anon test can send the apikey again as a bearer
  // value. Treat that duplicate as publishable-key auth; never downgrade a
  // different bearer token because it may be an invalid or expired user JWT.
  if (bearerToken && publishableKey && bearerToken === publishableKey) {
    const headers = new Headers(req.headers);
    headers.delete('Authorization');
    return new Request(req, { headers });
  }

  return req;
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error('pagespeed_response_too_large');
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error('pagespeed_response_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

async function readBoundedJson(response: Response): Promise<unknown> {
  return JSON.parse(await readBoundedText(response, MAX_PAGESPEED_RESPONSE_BYTES));
}

function sanitizeProviderMessage(value: string): string {
  return value
    .replace(/([?&](?:key|api_key)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/https?:\/\/[^\s]+/gi, '[URL]')
    .slice(0, 500);
}

function getProviderErrorSummary(payload: string): string {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (isRecord(parsed)) {
      const providerError = isRecord(parsed.error) ? parsed.error : parsed;
      const code = typeof providerError.code === 'string' ? providerError.code : undefined;
      const message = typeof providerError.message === 'string' ? providerError.message : undefined;
      if (code || message) {
        return sanitizeProviderMessage(
          [code && `code=${code}`, message && `message=${message}`].filter(Boolean).join('; '),
        );
      }
    }
  } catch {
    // Keep provider failures bounded and generic when the response is not JSON.
  }

  return 'non_json_provider_error';
}

async function runSingleAudit(
  url: string,
  deviceType: 'mobile' | 'desktop',
  sessionId: string,
  requestId: string,
  supabase: SupabaseClient,
  userId?: string,
  businessId?: string
): Promise<AuditRunSuccess> {
  const strategy = deviceType === 'mobile' ? 'MOBILE' : 'DESKTOP';
  const apiKey = Deno.env.get('PAGESPEED_API_KEY')?.trim();
  const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=ACCESSIBILITY&category=PERFORMANCE&category=BEST_PRACTICES&category=SEO&strategy=${strategy}&key=${encodeURIComponent(apiKey || '')}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(pagespeedUrl, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error({ event: 'pagespeed_request_failed', requestId, deviceType, errorCode: 'pagespeed_timeout' });
      throw new Error('pagespeed_timeout');
    }
    console.error({
      event: 'pagespeed_request_failed',
      requestId,
      deviceType,
      errorCode: 'pagespeed_upstream_error',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    throw new Error('pagespeed_upstream_error');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let providerError = 'provider_error_unreadable';
    try {
      providerError = getProviderErrorSummary(await readBoundedText(response, MAX_PROVIDER_ERROR_BYTES));
    } catch {
      // The status and stable classification are enough when the provider body cannot be read.
    }
    const errorCode = response.status === 429 ? 'pagespeed_rate_limited' : 'pagespeed_upstream_error';
    console.error({
      event: 'pagespeed_provider_error',
      requestId,
      deviceType,
      errorCode,
      upstreamStatus: response.status,
      providerError,
    });
    throw new Error(errorCode);
  }

  let data: unknown;
  try {
    data = await readBoundedJson(response);
  } catch (error) {
    const errorCode = error instanceof Error && error.message === 'pagespeed_response_too_large'
      ? error.message
      : 'invalid_pagespeed_response';
    console.error({ event: 'pagespeed_response_invalid', requestId, deviceType, errorCode });
    throw new Error(errorCode);
  }
  const lighthouseResult = isRecord(data)
    ? parseLighthouseResult(data.lighthouseResult)
    : null;
  if (!lighthouseResult) {
    console.error({ event: 'pagespeed_response_invalid', requestId, deviceType, errorCode: 'invalid_pagespeed_response' });
    throw new Error('invalid_pagespeed_response');
  }

  const runtimeError = isRecord(data) && isRecord(data.lighthouseResult) && isRecord(data.lighthouseResult.runtimeError)
    ? data.lighthouseResult.runtimeError
    : null;
  if (runtimeError) {
    console.error({ event: 'pagespeed_runtime_error', requestId, deviceType });
    throw new Error('pagespeed_runtime_error');
  }

  const accessibilityScore = Math.round((lighthouseResult.categories.accessibility?.score || 0) * 100);
  const performanceScore = Math.round((lighthouseResult.categories.performance?.score || 0) * 100);
  const bestPracticesScore = Math.round((lighthouseResult.categories['best-practices']?.score || 0) * 100);
  const seoScore = Math.round((lighthouseResult.categories.seo?.score || 0) * 100);

  const screenshotItems = lighthouseResult.audits['screenshot-thumbnails']?.details?.items;
  const screenshotCandidate = lighthouseResult.audits['final-screenshot']?.details?.data ||
    (Array.isArray(screenshotItems) && isRecord(screenshotItems[0])
      ? screenshotItems[0].data
      : undefined);
  const screenshotData = typeof screenshotCandidate === 'string' && screenshotCandidate.length <= MAX_PAGESPEED_RESPONSE_BYTES
    ? screenshotCandidate
    : null;

  const { data: auditData, error: auditError } = await supabase
    .from('accessibility_audits')
    .insert({
      business_id: businessId || null,
      user_id: userId || null,
      url_scanned: url,
      lighthouse_score: accessibilityScore,
      performance_score: performanceScore,
      accessibility_score: accessibilityScore,
      best_practices_score: bestPracticesScore,
      seo_score: seoScore,
      device_type: deviceType,
      audit_session_id: sessionId,
      screenshot_url: screenshotData || null,
      audit_data: lighthouseResult,
    })
    .select()
    .single();

  if (auditError) {
    throw auditError;
  }

  const a11yAudits = lighthouseResult.audits;
  const violations = [];

  for (const [key, audit] of Object.entries(a11yAudits)) {
    if (audit.score !== null && audit.score < 1 && audit.score !== undefined) {
      const severity = audit.score === 0 ? 'critical' : audit.score < 0.5 ? 'serious' : audit.score < 0.9 ? 'moderate' : 'minor';

      let remediationSteps = [];
      if (audit.details?.items && Array.isArray(audit.details.items)) {
        remediationSteps = audit.details.items.slice(0, 5).map((item, index) => {
          if (typeof item === 'string') {
            return item.slice(0, 2_000);
          } else if (isRecord(item)) {
            const node = isRecord(item.node) ? item.node : undefined;
            if (node && typeof node.snippet === 'string') {
              return `Element: ${node.snippet.slice(0, 1_900)}`;
            } else if (typeof item.description === 'string') {
              return item.description.slice(0, 2_000);
            } else if (typeof item.url === 'string') {
              return `Resource: ${item.url.slice(0, 1_980)}`;
            } else {
              return JSON.stringify(item).slice(0, 2_000);
            }
          }
          return `Issue ${index + 1}`;
        });
      }

      violations.push({
        audit_id: auditData.id,
        wcag_guideline: key,
        severity: severity,
        title: audit.title,
        description: audit.description,
        remediation_steps: remediationSteps,
        impact: audit.displayValue || 'Impact varies',
      });
    }
  }

  if (violations.length > 0) {
    const { error: violationsError } = await supabase
      .from('violations')
      .insert(violations);

    if (violationsError) {
      console.error('Error inserting violations:', violationsError);
    }
  }

  return {
    audit_id: auditData.id,
    device_type: deviceType,
    scores: {
      accessibility: accessibilityScore,
      performance: performanceScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
    },
    violations_count: violations.length,
  };
}

Deno.serve(async (req: Request) => {
  const requestId = createRequestId();
  const allowedOrigins = getAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const responseHeaders = {
    ...getCorsHeaders(req, allowedOrigins, requestId),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (!isAllowedOrigin(req, allowedOrigins)) {
    console.warn({ event: 'audit_request_rejected', requestId, reason: 'origin_not_allowed', status: 403 });
    return jsonResponse(req, { error: 'Origin not allowed' }, 403, allowedOrigins, requestId);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req, allowedOrigins, requestId),
    });
  }

  if (req.method !== 'POST') {
    console.warn({ event: 'audit_request_rejected', requestId, reason: 'method_not_allowed', status: 405 });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    const { data: authContext, error: authError } = await createSupabaseContext(getAuthRequest(req), {
      auth: ['user', 'publishable'],
    });
    if (authError || !authContext) {
      console.warn({ event: 'audit_request_rejected', requestId, reason: 'authentication_failed', status: 401 });
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: responseHeaders,
      });
    }
    const userId = authContext.user?.id;

    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      console.warn({ event: 'audit_request_rejected', requestId, reason: 'invalid_request_body', status: 400 });
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const validation = validateAuditRequest(requestBody);
    if (validation.ok === false) {
      console.warn({ event: 'audit_request_rejected', requestId, reason: 'validation_failed', status: validation.status });
      return new Response(JSON.stringify({ error: validation.error }), {
        status: validation.status,
        headers: responseHeaders,
      });
    }

    const { url, business_id } = validation.value;
    if (!await resolvesToPublicIps(new URL(url).hostname)) {
      console.warn({ event: 'audit_request_rejected', requestId, reason: 'target_not_public', status: 422 });
      return new Response(JSON.stringify({ error: 'URL could not be verified as public' }), {
        status: 422,
        headers: responseHeaders,
      });
    }

    if (!Deno.env.get('PAGESPEED_API_KEY')?.trim()) {
      console.error({ event: 'audit_configuration_error', requestId, missing: 'pagespeed_api_key' });
      return new Response(JSON.stringify({ error: 'Audit service unavailable', errorType: 'CONFIGURATION_ERROR' }), {
        status: 503,
        headers: responseHeaders,
      });
    }
    const supabase = authContext.supabaseAdmin;

    if (business_id) {
      if (!userId) {
        console.warn({ event: 'audit_request_rejected', requestId, reason: 'business_access_denied', status: 403 });
        return new Response(JSON.stringify({ error: 'Business access denied' }), {
          status: 403,
          headers: responseHeaders,
        });
      }

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', business_id)
        .eq('owner_id', userId)
        .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!business) {
        console.warn({ event: 'audit_request_rejected', requestId, reason: 'business_access_denied', status: 403 });
        return new Response(JSON.stringify({ error: 'Business access denied' }), {
          status: 403,
          headers: responseHeaders,
        });
      }
    }

    const sessionId = crypto.randomUUID();

    const settledResults = await Promise.allSettled([
      runSingleAudit(url, 'mobile', sessionId, requestId, supabase, userId, business_id),
      runSingleAudit(url, 'desktop', sessionId, requestId, supabase, userId, business_id),
    ]);
    const mobileResult: AuditDeviceResult = toDeviceResult('mobile', settledResults[0]);
    const desktopResult: AuditDeviceResult = toDeviceResult('desktop', settledResults[1]);

    for (const [deviceType, result] of [['mobile', mobileResult], ['desktop', desktopResult]] as const) {
      if (result.status === 'failed') {
        console.error({
          event: 'audit_device_failed',
          requestId,
          deviceType,
          errorCode: result.error_type,
        });
      }
    }

    if (mobileResult.status === 'failed' && desktopResult.status === 'failed') {
      const rejectedResults = settledResults.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      const errorCode = rejectedResults
        .map((result) => getAuditErrorCode(result.reason))
        .find((code) => code !== 'internal_error') || 'internal_error';
      throw new Error(errorCode);
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        mobile: mobileResult,
        desktop: desktopResult,
      }),
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    const errorCode = getAuditErrorCode(error);
    const status = getAuditErrorStatus(errorCode);
    console.error({
      event: 'audit_request_failed',
      requestId,
      errorCode,
      status,
    });
    return new Response(
      JSON.stringify({
        error: status === 504
          ? 'Audit provider timed out'
          : status === 429
            ? 'Audit provider is busy'
            : 'Unable to complete audit',
        errorType: status === 500 ? 'INTERNAL_ERROR' : errorCode.toUpperCase(),
      }),
      {
        status,
        headers: responseHeaders,
      }
    );
  }
});