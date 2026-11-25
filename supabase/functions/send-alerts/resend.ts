// Minimal Resend client: one call, no SDK. The outbox id is the idempotency
// key, so a retry after a timeout cannot send the same email twice.

export interface OutgoingEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  idempotencyKey: string;
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; code: string; retry: boolean };

export async function sendWithResend(
  email: OutgoingEmail,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 15_000,
): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': email.idempotencyKey,
      },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: email.headers,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, code: 'network_error', retry: true };
  }

  if (response.ok) {
    const body = await response.json().catch(() => null) as { id?: unknown } | null;
    return { ok: true, id: typeof body?.id === 'string' ? body.id : '' };
  }
  // 429 and 5xx are worth retrying; other 4xx mean the request itself is wrong.
  return { ok: false, code: `resend_${response.status}`, retry: response.status === 429 || response.status >= 500 };
}
