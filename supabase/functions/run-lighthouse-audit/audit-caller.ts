export type AuditCallerRejection = 'missing_token' | 'authentication_failed';

export type AuditCaller =
  | { ok: true; userId: string }
  | { ok: false; reason: AuditCallerRejection };

interface AuditCallerInput {
  hasAuthorizationHeader: boolean;
  /** The verified user id from a user-scoped Supabase context, if verification succeeded. */
  verifiedUserId?: string | null;
}

/**
 * Audits are stored against their owner, so every caller must present a
 * verified user token. Supabase anonymous (guest) sessions count: they carry a
 * real user id. A publishable key alone does not.
 */
export function resolveAuditCaller({ hasAuthorizationHeader, verifiedUserId }: AuditCallerInput): AuditCaller {
  if (!hasAuthorizationHeader) {
    return { ok: false, reason: 'missing_token' };
  }

  if (typeof verifiedUserId !== 'string' || verifiedUserId.trim().length === 0) {
    return { ok: false, reason: 'authentication_failed' };
  }

  return { ok: true, userId: verifiedUserId };
}
