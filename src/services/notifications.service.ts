import { supabase } from './supabaseClient';
import { getSupabaseFunctionHeaders, getSupabaseFunctionUrl } from './supabaseFunctions';

export type NotificationResult<T> = { ok: true; value: T } | { ok: false; message: string };

const LOAD_ERROR = 'Your alert setting could not be loaded. Try again.';
const SAVE_ERROR = 'Your alert setting could not be saved. Try again.';

/** Scan alerts are on unless the account has turned them off. */
export async function getScanAlerts(): Promise<NotificationResult<boolean>> {
  const { data, error } = await supabase.from('notification_settings').select('scan_alerts').maybeSingle();
  if (error) return { ok: false, message: LOAD_ERROR };
  return { ok: true, value: data?.scan_alerts ?? true };
}

export async function setScanAlerts(enabled: boolean): Promise<NotificationResult<boolean>> {
  const { data, error } = await supabase.rpc('set_scan_alerts', { p_enabled: enabled });
  if (error) return { ok: false, message: SAVE_ERROR };
  return { ok: true, value: data === true };
}

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUnsubscribeToken(value: string | null): value is string {
  return Boolean(value && TOKEN.test(value));
}

/** Turns off scan alerts with the token from an alert email. No sign-in needed. */
export async function unsubscribeWithToken(token: string): Promise<NotificationResult<null>> {
  try {
    const response = await fetch(getSupabaseFunctionUrl('email-unsubscribe'), {
      method: 'POST',
      headers: getSupabaseFunctionHeaders(),
      body: JSON.stringify({ token }),
    });
    if (response.status === 400) return { ok: false, message: 'This unsubscribe link is not valid.' };
    if (!response.ok) return { ok: false, message: 'We could not update your alerts. Try again in a minute.' };
    return { ok: true, value: null };
  } catch {
    return { ok: false, message: 'We could not reach Univia. Check your connection and try again.' };
  }
}
