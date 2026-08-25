import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey ? 'present' : 'missing',
  });
  throw new Error('Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file and restart the dev server.');
}

export { supabasePublishableKey };
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
