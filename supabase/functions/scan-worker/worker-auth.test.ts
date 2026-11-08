import { describe, expect, it } from 'vitest';
import { isAuthorizedWorkerCall } from './worker-auth';

const secret = 'a'.repeat(40);

describe('isAuthorizedWorkerCall', () => {
  it('accepts the configured secret', () => {
    expect(isAuthorizedWorkerCall(secret, secret)).toBe(true);
  });

  it('rejects a wrong, partial, longer or missing secret', () => {
    expect(isAuthorizedWorkerCall(secret, 'b'.repeat(40))).toBe(false);
    expect(isAuthorizedWorkerCall(secret, secret.slice(0, 39))).toBe(false);
    expect(isAuthorizedWorkerCall(secret, `${secret}a`)).toBe(false);
    expect(isAuthorizedWorkerCall(secret, '')).toBe(false);
    expect(isAuthorizedWorkerCall(secret, null)).toBe(false);
  });

  it('refuses every call when the secret is unset or too short', () => {
    expect(isAuthorizedWorkerCall(undefined, '')).toBe(false);
    expect(isAuthorizedWorkerCall('', '')).toBe(false);
    expect(isAuthorizedWorkerCall('short', 'short')).toBe(false);
  });
});
