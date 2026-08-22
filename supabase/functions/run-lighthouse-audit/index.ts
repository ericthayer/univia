import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { authenticateRequest } from '../_shared/auth.ts';
import { resolvesToPublicIps, validateAuditRequest } from '../_shared/audit-validation.ts';
import {
  createRequestId,
  getAllowedOrigins,
  getCorsHeaders,
  isAllowedOrigin,
  jsonResponse,
} from '../_shared/http.ts';

const UPSTREAM_TIMEOUT_MS = 90_000;
const MAX_PAGESPEED_RESPONSE_BYTES = 5 * 1024 * 1024;

interface LighthouseAudit {
  score?: number | null;
  title: string;
  description: string;
  displayValue?: string;
  details?: {
    data?: unknown;
    items?: unknown[];
  };
}

interface LighthouseResult {
  categories: Record<string, { score?: number | null }>;
  audits: Record<string, LighthouseAudit>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteScore(value: unknown): value is number | null | undefined {
  return value === null || value === undefined || (
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
  );
}

function parseLighthouseResult(value: unknown): LighthouseResult | null {
  if (!isRecord(value) || !isRecord(value.categories) || !isRecord(value.audits)) {
    return null;
  }

  const categories: LighthouseResult['categories'] = {};
  for (const [name, category] of Object.entries(value.categories)) {
    if (!isRecord(category) || !isFiniteScore(category.score)) return null;
    categories[name] = { score: category.score };
  }

  const audits: LighthouseResult['audits'] = {};
  for (const [name, audit] of Object.entries(value.audits)) {
    if (!isRecord(audit) || !isFiniteScore(audit.score)) return null;

    const details = audit.details === undefined || audit.details === null
      ? undefined
      : audit.details;
    if (details !== undefined && !isRecord(details)) return null;
    if (details && details.items !== undefined && !Array.isArray(details.items)) return null;

    audits[name] = {
      score: audit.score,
      title: typeof audit.title === 'string' ? audit.title.slice(0, 1_000) : name,
      description: typeof audit.description === 'string' ? audit.description.slice(0, 2_000) : '',
      displayValue: typeof audit.displayValue === 'string' ? audit.displayValue.slice(0, 1_000) : undefined,
      details: details ? {
        data: details.data,
        items: details.items as unknown[] | undefined,
      } : undefined,
    };
  }

  return { categories, audits };
}

async function readBoundedJson(response: Response): Promise<unknown> {
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PAGESPEED_RESPONSE_BYTES) {
      throw new Error('pagespeed_response_too_large');
    }
    return JSON.parse(text);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PAGESPEED_RESPONSE_BYTES) {
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

  return JSON.parse(new TextDecoder().decode(bytes));
}

type SupabaseClient = ReturnType<typeof createClient>;

async function runSingleAudit(
  url: string,
  deviceType: 'mobile' | 'desktop',
  sessionId: string,
  supabase: SupabaseClient,
  businessId?: string,
  userId: string
) {
  const strategy = deviceType === 'mobile' ? 'MOBILE' : 'DESKTOP';
  const apiKey = Deno.env.get('PAGESPEED_API_KEY');
  const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=ACCESSIBILITY&category=PERFORMANCE&category=BEST_PRACTICES&category=SEO&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(pagespeedUrl, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('pagespeed_timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch PageSpeed Insights data for ${deviceType}`);
  }

  const data = await readBoundedJson(response);
  const lighthouseResult = isRecord(data)
    ? parseLighthouseResult(data.lighthouseResult)
    : null;
  if (!lighthouseResult) throw new Error('invalid_pagespeed_response');

  const accessibilityScore = Math.round((lighthouseResult.categories.accessibility?.score || 0) * 100);
  const performanceScore = Math.round((lighthouseResult.categories.performance?.score || 0) * 100);
  const bestPracticesScore = Math.round((lighthouseResult.categories['best-practices']?.score || 0) * 100);
  const seoScore = Math.round((lighthouseResult.categories.seo?.score || 0) * 100);

  const screenshotCandidate = lighthouseResult.audits['final-screenshot']?.details?.data ||
    (isRecord(lighthouseResult.audits['screenshot-thumbnails']?.details?.items?.[0])
      ? lighthouseResult.audits['screenshot-thumbnails']?.details?.items?.[0].data
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
    return jsonResponse(req, { error: 'Origin not allowed' }, 403, allowedOrigins, requestId);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req, allowedOrigins, requestId),
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const validation = validateAuditRequest(requestBody);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: validation.status,
        headers: responseHeaders,
      });
    }

    const { url, business_id } = validation.value;
    if (!await resolvesToPublicIps(new URL(url).hostname)) {
      return new Response(JSON.stringify({ error: 'URL could not be verified as public' }), {
        status: 422,
        headers: responseHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (business_id) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', business_id)
        .eq('owner_id', auth.user.id)
        .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!business) {
        return new Response(JSON.stringify({ error: 'Business access denied' }), {
          status: 403,
          headers: responseHeaders,
        });
      }
    }

    const sessionId = crypto.randomUUID();

    const [mobileResult, desktopResult] = await Promise.all([
      runSingleAudit(url, 'mobile', sessionId, supabase, business_id, auth.user.id),
      runSingleAudit(url, 'desktop', sessionId, supabase, business_id, auth.user.id),
    ]);

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
    console.error('Audit request failed', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return new Response(
      JSON.stringify({ error: 'Unable to complete audit', errorType: 'INTERNAL_ERROR' }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
});