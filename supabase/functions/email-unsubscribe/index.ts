import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createRequestId, getAllowedOrigins, getCorsHeaders, jsonResponse } from '../_shared/http.ts';
import { getSupabaseKey } from '../_shared/supabase-keys.ts';
import { readToken } from './token.ts';

// Turns off scan alerts for the account that owns the token. POST only:
// mail clients send RFC 8058 one-click POSTs straight here, and the app's
// /unsubscribe page posts the token after the person confirms. GET does
// nothing, so link scanners cannot unsubscribe anyone. Answers the same for
// known and unknown tokens.

Deno.serve(async (req: Request) => {
  const requestId = createRequestId();
  const allowedOrigins = getAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: getCorsHeaders(req, allowedOrigins, requestId) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405, allowedOrigins, requestId);

  const token = await readToken(req);
  if (!token) return jsonResponse(req, { error: 'Invalid link' }, 400, allowedOrigins, requestId);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = getSupabaseKey('SUPABASE_SECRET_KEYS');
  if (!supabaseUrl || !serviceKey) {
    console.error({ event: 'unsubscribe_configuration_error', requestId });
    return jsonResponse(req, { error: 'Unavailable' }, 503, allowedOrigins, requestId);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { error } = await supabase.rpc('unsubscribe_scan_alerts', { p_token: token });
  if (error) {
    console.error({ event: 'unsubscribe_failed', requestId });
    return jsonResponse(req, { error: 'Unavailable' }, 503, allowedOrigins, requestId);
  }

  console.info({ event: 'unsubscribed', requestId });
  return jsonResponse(req, { unsubscribed: true }, 200, allowedOrigins, requestId);
});
