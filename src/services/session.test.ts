import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth: authMocks },
}));

import { ensureSession } from './session';

const guestSession = { access_token: 'guest-token', user: { id: 'guest-id', is_anonymous: true } } as Session;

describe('ensureSession', () => {
  beforeEach(() => {
    authMocks.getSession.mockReset();
    authMocks.signInAnonymously.mockReset();
  });

  it('reuses an existing registered or anonymous session', async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: guestSession }, error: null });

    await expect(ensureSession()).resolves.toBe(guestSession);
    expect(authMocks.signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates only one anonymous session for concurrent callers', async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    authMocks.signInAnonymously.mockResolvedValue({ data: { session: guestSession }, error: null });

    await expect(Promise.all([ensureSession(), ensureSession()])).resolves.toEqual([
      guestSession,
      guestSession,
    ]);
    expect(authMocks.signInAnonymously).toHaveBeenCalledOnce();
  });

  it('does not create a guest session when anonymous access is disabled', async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(ensureSession({ allowAnonymous: false })).resolves.toBeNull();
    expect(authMocks.signInAnonymously).not.toHaveBeenCalled();
  });
});