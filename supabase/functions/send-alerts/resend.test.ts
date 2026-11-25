import { describe, expect, it, vi } from 'vitest';
import { sendWithResend, type OutgoingEmail } from './resend';

const email: OutgoingEmail = {
  from: 'Univia <alerts@mail.univia.help>',
  to: 'owner@example.com',
  replyTo: 'hello@univia.help',
  subject: 'S',
  html: '<p>H</p>',
  text: 'T',
  headers: { 'List-Unsubscribe': '<u>' },
  idempotencyKey: 'scan-alert-1',
};

const respond = (status: number, body: unknown = {}) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('sendWithResend', () => {
  it('posts the email with the idempotency key and returns the id', async () => {
    const fetchImpl = respond(200, { id: 're_1' });
    expect(await sendWithResend(email, 'key', fetchImpl)).toEqual({ ok: true, id: 're_1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer key', 'Idempotency-Key': 'scan-alert-1' });
    expect(JSON.parse(init.body)).toMatchObject({ to: ['owner@example.com'], reply_to: 'hello@univia.help', text: 'T' });
  });

  it('retries rate limits, server errors and network failures, but not bad requests', async () => {
    expect(await sendWithResend(email, 'key', respond(429))).toEqual({ ok: false, code: 'resend_429', retry: true });
    expect(await sendWithResend(email, 'key', respond(503))).toEqual({ ok: false, code: 'resend_503', retry: true });
    expect(await sendWithResend(email, 'key', respond(422))).toEqual({ ok: false, code: 'resend_422', retry: false });
    expect(await sendWithResend(email, 'key', vi.fn().mockRejectedValue(new Error('down')))).toEqual({ ok: false, code: 'network_error', retry: true });
  });
});
