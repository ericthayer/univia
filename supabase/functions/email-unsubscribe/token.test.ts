import { describe, expect, it } from 'vitest';
import { readToken } from './token';

const token = '0b7c6f2e-9a1d-4c3b-8e5f-1a2b3c4d5e6f';

describe('readToken', () => {
  it('reads a one-click POST token from the query string', async () => {
    const req = new Request(`https://x/functions/v1/email-unsubscribe?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    });
    expect(await readToken(req)).toBe(token);
  });

  it('reads a JSON body token from the app', async () => {
    const req = new Request('https://x/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token.toUpperCase() }) });
    expect(await readToken(req)).toBe(token);
  });

  it('rejects anything that is not a UUID', async () => {
    expect(await readToken(new Request('https://x/?token=abc', { method: 'POST' }))).toBeNull();
    expect(await readToken(new Request('https://x/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"token":1}' }))).toBeNull();
  });
});
