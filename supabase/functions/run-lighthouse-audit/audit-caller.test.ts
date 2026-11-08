import { describe, expect, it } from 'vitest';
import { resolveAuditCaller } from './audit-caller';

describe('resolveAuditCaller', () => {
  it('accepts a verified user, including an anonymous guest session', () => {
    expect(resolveAuditCaller({ hasAuthorizationHeader: true, verifiedUserId: 'user-1' })).toEqual({
      ok: true,
      userId: 'user-1',
    });
  });

  it('rejects a request with no bearer token instead of falling back to the publishable key', () => {
    expect(resolveAuditCaller({ hasAuthorizationHeader: false, verifiedUserId: null })).toEqual({
      ok: false,
      reason: 'missing_token',
    });
  });

  it('rejects a bearer token that does not verify to a user', () => {
    expect(resolveAuditCaller({ hasAuthorizationHeader: true, verifiedUserId: null })).toEqual({
      ok: false,
      reason: 'authentication_failed',
    });
    expect(resolveAuditCaller({ hasAuthorizationHeader: true, verifiedUserId: undefined })).toEqual({
      ok: false,
      reason: 'authentication_failed',
    });
    expect(resolveAuditCaller({ hasAuthorizationHeader: true, verifiedUserId: '  ' })).toEqual({
      ok: false,
      reason: 'authentication_failed',
    });
  });
});
