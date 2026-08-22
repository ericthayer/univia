import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { authenticateRequest } from '../_shared/auth.ts';
import {
  createRequestId,
  getAllowedOrigins,
  getCorsHeaders,
  isAllowedOrigin,
  jsonResponse,
} from '../_shared/http.ts';

type SupabaseClient = ReturnType<typeof createClient>;

interface AuditRequest {
  url: string;
  business_id?: string;
}

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

  const response = await fetch(pagespeedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch PageSpeed Insights data for ${deviceType}`);
  }

  const data = await response.json();
  const lighthouseResult = data.lighthouseResult;

  const accessibilityScore = Math.round((lighthouseResult.categories.accessibility?.score || 0) * 100);
  const performanceScore = Math.round((lighthouseResult.categories.performance?.score || 0) * 100);
  const bestPracticesScore = Math.round((lighthouseResult.categories['best-practices']?.score || 0) * 100);
  const seoScore = Math.round((lighthouseResult.categories.seo?.score || 0) * 100);

  const screenshotData = lighthouseResult.audits['final-screenshot']?.details?.data ||
                         lighthouseResult.audits['screenshot-thumbnails']?.details?.items?.[0]?.data;

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
            return item;
          } else if (typeof item === 'object' && item !== null) {
            if (item.node && item.node.snippet) {
              return `Element: ${item.node.snippet}`;
            } else if (item.description) {
              return item.description;
            } else if (item.url) {
              return `Resource: ${item.url}`;
            } else {
              return JSON.stringify(item);
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url, business_id }: AuditRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
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