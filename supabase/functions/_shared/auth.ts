import { createClient, type User } from 'npm:@supabase/supabase-js@2';
import { extractBearerToken } from './auth-utils.ts';
import { getSupabaseKey } from './supabase-keys.ts';

export interface AuthenticatedRequest {
  token: string;
  user: User;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedRequest | null> {
  const token = extractBearerToken(req.headers.get('Authorization'));
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabasePublishableKey = getSupabaseKey('SUPABASE_PUBLISHABLE_KEYS');

  if (!token || !supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return { token, user: data.user };
}
