import { supabasePublishableKey } from './supabaseClient';

export function getSupabaseFunctionUrl(functionName: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
}

export function getSupabaseFunctionHeaders(accessToken: string): HeadersInit {
  return {
    apikey: supabasePublishableKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}