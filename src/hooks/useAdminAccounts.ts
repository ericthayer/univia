import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export interface AdminAccount {
  id: string;
  email: string;
  full_name: string;
}

export type AdminActionResult =
  | { kind: 'success'; message: string }
  | { kind: 'info'; message: string }
  | { kind: 'error'; message: string };

export interface UseAdminAccounts {
  admins: AdminAccount[];
  loading: boolean;
  loadError: string | null;
  grant: (email: string) => Promise<AdminActionResult>;
  revoke: (account: AdminAccount) => Promise<AdminActionResult>;
}

const COLUMNS = 'id, email, full_name';

/**
 * Lists administrators and grants or revokes `user_profiles.is_admin`.
 * RLS allows admins to update any profile; the privilege-escalation trigger
 * rejects the same write from anyone else.
 */
export function useAdminAccounts(enabled: boolean): UseAdminAccounts {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(COLUMNS)
      .eq('is_admin', true)
      .order('full_name', { ascending: true });

    if (error) {
      setLoadError(error.message);
    } else {
      setLoadError(null);
      setAdmins((data ?? []) as AdminAccount[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const grant = useCallback(
    async (rawEmail: string): Promise<AdminActionResult> => {
      const email = rawEmail.trim();

      const { data: matches, error: findError } = await supabase
        .from('user_profiles')
        .select(`${COLUMNS}, is_admin`)
        .ilike('email', email.replace(/[%_\\]/g, '\\$&'))
        .limit(1);

      if (findError) return { kind: 'error', message: findError.message };

      const match = matches?.[0] as (AdminAccount & { is_admin: boolean }) | undefined;
      if (!match) {
        return { kind: 'error', message: 'No account uses that email. They need to sign up first.' };
      }
      if (match.is_admin) {
        return { kind: 'info', message: `${match.email} is already an administrator.` };
      }

      const { error } = await supabase.from('user_profiles').update({ is_admin: true }).eq('id', match.id);
      if (error) return { kind: 'error', message: error.message };

      await load();
      return { kind: 'success', message: `${match.email} is now an administrator.` };
    },
    [load]
  );

  const revoke = useCallback(
    async (account: AdminAccount): Promise<AdminActionResult> => {
      const { error } = await supabase.from('user_profiles').update({ is_admin: false }).eq('id', account.id);
      if (error) return { kind: 'error', message: error.message };

      await load();
      return { kind: 'success', message: `Removed admin access for ${account.email}.` };
    },
    [load]
  );

  return { admins, loading, loadError, grant, revoke };
}
