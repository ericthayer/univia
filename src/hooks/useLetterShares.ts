import { useCallback, useEffect, useState } from 'react';
import {
  ActiveShareLink,
  CreatedShareLink,
  ShareExpiryDays,
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from '../services/letterShare.service';

export interface UseLetterSharesResult {
  links: ActiveShareLink[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  created: CreatedShareLink | null;
  create: (days: ShareExpiryDays) => Promise<void>;
  revoke: (linkId: string) => Promise<void>;
}

/** Owner-side state for one letter's share links. Loads only while `enabled`. */
export function useLetterShares(letterId: string | undefined, enabled: boolean): UseLetterSharesResult {
  const [links, setLinks] = useState<ActiveShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedShareLink | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!letterId) return;
    const result = await listShareLinks(letterId);
    if (result.ok) setLinks(result.value);
    else setError(result.message);
  }, [letterId]);

  useEffect(() => {
    if (!enabled || !letterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCreated(null);
    listShareLinks(letterId).then((result) => {
      if (cancelled) return;
      if (result.ok) setLinks(result.value);
      else setError(result.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, letterId]);

  const create = useCallback(
    async (days: ShareExpiryDays): Promise<void> => {
      if (!letterId) return;
      setBusy(true);
      setError(null);
      const result = await createShareLink(letterId, days);
      if (result.ok) {
        setCreated(result.value);
        await refresh();
      } else {
        setError(result.message);
      }
      setBusy(false);
    },
    [letterId, refresh],
  );

  const revoke = useCallback(
    async (linkId: string): Promise<void> => {
      setBusy(true);
      setError(null);
      const result = await revokeShareLink(linkId);
      if (!result.ok) setError(result.message);
      if (created?.id === linkId) setCreated(null);
      await refresh();
      setBusy(false);
    },
    [created, refresh],
  );

  return { links, loading, busy, error, created, create, revoke };
}
