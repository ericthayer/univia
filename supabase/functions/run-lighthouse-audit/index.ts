import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AuditRequest {
  url: string;
  business_id?: string;
  user_id?: string | null;
}

async function runSingleAudit(
  url: string,
  deviceType: 'mobile' | 'desktop',
  sessionId: string,
  supabase: any,
  businessId?: string,
  userId?: string | null
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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url, business_id, user_id }: AuditRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sessionId = crypto.randomUUID();

    const [mobileResult, desktopResult] = await Promise.all([
      runSingleAudit(url, 'mobile', sessionId, supabase, business_id, user_id),
      runSingleAudit(url, 'desktop', sessionId, supabase, business_id, user_id),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        mobile: mobileResult,
        desktop: desktopResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Audit error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});