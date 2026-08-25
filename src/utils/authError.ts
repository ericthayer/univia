import type { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError, fallback: string): string {
  if (error.message.toLowerCase().includes('manual linking is disabled')) {
    return 'Account linking is unavailable right now. Create your account with email and password to continue.';
  }

  if (error.message.toLowerCase().includes('anonymous sign-ins are disabled')) {
    return 'Guest access is temporarily unavailable. Please try again after signing in.';
  }

  return error.message || fallback;
}