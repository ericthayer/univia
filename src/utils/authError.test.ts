import { describe, expect, it } from 'vitest';
import type { AuthError } from '@supabase/supabase-js';
import { getAuthErrorMessage } from './authError';

function authError(message: string): AuthError {
  return { message } as AuthError;
}

describe('getAuthErrorMessage', () => {
  it('replaces the raw manual-linking configuration error with guidance', () => {
    expect(getAuthErrorMessage(authError('Manual linking is disabled'), 'Fallback')).toBe(
      'Account linking is unavailable right now. Create your account with email and password to continue.',
    );
  });

  it('replaces the raw anonymous-sign-in configuration error with guidance', () => {
    expect(getAuthErrorMessage(authError('Anonymous sign-ins are disabled'), 'Fallback')).toBe(
      'Guest access is temporarily unavailable. Please try again after signing in.',
    );
  });

  it('preserves provider errors', () => {
    expect(getAuthErrorMessage(authError('Provider denied access'), 'Fallback')).toBe('Provider denied access');
  });
});