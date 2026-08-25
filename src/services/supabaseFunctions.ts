import { supabasePublishableKey } from './supabaseClient';

export function getSupabaseFunctionUrl(functionName: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
}

export function getSupabaseFunctionHeaders(accessToken?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    apikey: supabasePublishableKey,
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}