import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createRequestId } from '../_shared/http.ts';
import { getSupabaseKey } from '../_shared/supabase-keys.ts';
import { isAuthorizedWorkerCall } from '../scan-worker/worker-auth.ts';
import { buildAlertEmail, parseAlertPayload } from './alert-email.ts';
import { sendWithResend } from './resend.ts';

// Called every minute by pg_cron (public.kick_email_worker) while alert
// emails wait in public.email_outbox. Uses the scan worker's shared secret.
// Without RESEND_API_KEY it claims nothing, so mail waits until it is set.

const BATCH = 5;

function json(body: Record<string, unknown>, status: number, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Request-ID': requestId },
  });
}

Deno.serve(async (req: Request) => {
  const requestId = createRequestId();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, requestId);

  if (!isAuthorizedWorkerCall(Deno.env.get('SCAN_WORKER_SECRET'), req.headers.get('x-scan-worker-secret'))) {
    console.warn({ event: 'send_alerts_rejected', requestId, reason: 'bad_secret' });
    return json({ error: 'Unauthorized' }, 401, requestId);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = getSupabaseKey('SUPABASE_SECRET_KEYS');
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error({ event: 'send_alerts_configuration_error', requestId, resend: Boolean(resendKey) });
    return json({ error: 'Email unavailable' }, 503, requestId);
  }

  const from = Deno.env.get('ALERTS_FROM')?.trim() || 'Univia <alerts@mail.univia.help>';
  const replyTo = Deno.env.get('ALERTS_REPLY_TO')?.trim() || 'hello@univia.help';
  const appUrl = (Deno.env.get('APP_URL')?.trim() || 'https://univia.help').replace(/\/$/, '');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.rpc('claim_email_outbox', { p_limit: BATCH });
  if (error) {
    console.error({ event: 'send_alerts_claim_failed', requestId });
    return json({ error: 'Queue unavailable' }, 503, requestId);
  }

  const rows = (Array.isArray(data) ? data : []) as Array<{ outbox_id: string; to_email: string; payload: unknown }>;
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const payload = parseAlertPayload(row.payload);
    if (!payload) {
      failed += 1;
      await supabase.rpc('fail_email_outbox', { p_outbox_id: row.outbox_id, p_error: 'bad_payload', p_retry: false });
      continue;
    }

    const token = encodeURIComponent(payload.unsubscribe_token);
    const email = buildAlertEmail(payload, {
      appUrl,
      unsubscribePageUrl: `${appUrl}/unsubscribe?token=${token}`,
      oneClickUrl: `${supabaseUrl}/functions/v1/email-unsubscribe?token=${token}`,
    });

    const result = await sendWithResend(
      { from, to: row.to_email, replyTo, ...email, idempotencyKey: `scan-alert-${row.outbox_id}` },
      resendKey,
    );

    if (result.ok) {
      sent += 1;
      await supabase.rpc('complete_email_outbox', { p_outbox_id: row.outbox_id, p_provider_id: result.id });
    } else {
      failed += 1;
      console.warn({ event: 'send_alert_failed', requestId, outboxId: row.outbox_id, code: result.code, retry: result.retry });
      await supabase.rpc('fail_email_outbox', { p_outbox_id: row.outbox_id, p_error: result.code, p_retry: result.retry });
    }
  }

  console.info({ event: 'send_alerts_done', requestId, sent, failed });
  return json({ sent, failed }, 200, requestId);
});
