import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

let pendingAnonymousSession: Promise<Session | null> | null = null;

interface EnsureSessionOptions {
  allowAnonymous?: boolean;
}

/**
 * Reuses the current Auth session and creates an invisible guest session only
 * when the caller explicitly allows public-tool access.
 */
export async function ensureSession(
  { allowAnonymous = true }: EnsureSessionOptions = {},
): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  if (data.session) {
    return data.session;
  }

  if (!allowAnonymous) {
    return null;
  }

  if (!pendingAnonymousSession) {
    pendingAnonymousSession = supabase.auth.signInAnonymously()
      .then(({ data: anonymousData, error: anonymousError }) => {
        if (anonymousError) {
          throw anonymousError;
        }
        return anonymousData.session;
      })
      .finally(() => {
        pendingAnonymousSession = null;
      });
  }

  return pendingAnonymousSession;
}