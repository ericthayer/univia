import { createClient, type User } from 'npm:@supabase/supabase-js@2';
import { extractBearerToken } from './auth-utils.ts';

export interface AuthenticatedRequest {
  token: string;
  user: User;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedRequest | null> {
  const token = extractBearerToken(req.headers.get('Authorization'));
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
