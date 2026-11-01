import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { BillingAccount, normalizeTier } from '../utils/billing';

export interface UseBillingAccountsResult {
  accounts: BillingAccount[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads every account's plan and status for the admin billing page. Runs only
 * when `enabled` (the caller passes the admin flag), so RLS never sees a
 * non-admin request for all profiles.
 */
export function useBillingAccounts(enabled: boolean): UseBillingAccountsResult {
  const [accounts, setAccounts] = useState<BillingAccount[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('user_profiles')
      .select('id, email, full_name, tier, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          console.error('Error loading billing accounts:', queryError);
          setError('Accounts could not be loaded.');
        } else {
          setAccounts(
            (data ?? []).map((row) => ({
              id: row.id,
              email: row.email,
              full_name: row.full_name || 'Unknown',
              tier: normalizeTier(row.tier),
              status: row.status || 'active',
              created_at: row.created_at,
            }))
          );
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  return { accounts, loading, error, reload };
}
