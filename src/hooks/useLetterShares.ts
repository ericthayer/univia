import { useCallback, useEffect, useRef, useState } from 'react';
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
  /** Failure of the last create or revoke. */
  error: string | null;
  /** Failure of the last list load; `links` is not trustworthy while set. */
  listError: string | null;
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
  const [listError, setListError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedShareLink | null>(null);
  // Only the newest list request may write state, so a slow earlier response
  // can never overwrite a refresh that followed a create or revoke.
  const listRequest = useRef(0);

  const loadLinks = useCallback(async (): Promise<void> => {
    if (!letterId) return;
    const requestId = ++listRequest.current;
    const result = await listShareLinks(letterId);
    if (requestId !== listRequest.current) return;
    if (result.ok) {
      setLinks(result.value);
      setListError(null);
    } else {
      setListError(result.message);
    }
  }, [letterId]);

  useEffect(() => {
    if (!enabled || !letterId) return;
    setError(null);
    setListError(null);
    setCreated(null);
    setLoading(true);
    void loadLinks().finally(() => setLoading(false));
    return () => {
      listRequest.current += 1;
    };
  }, [enabled, letterId, loadLinks]);

  const create = useCallback(
    async (days: ShareExpiryDays): Promise<void> => {
      if (!letterId) return;
      setBusy(true);
      setError(null);
      const result = await createShareLink(letterId, days);
      if (result.ok) {
        setCreated(result.value);
        await loadLinks();
      } else {
        setError(result.message);
      }
      setBusy(false);
    },
    [letterId, loadLinks],
  );

  const revoke = useCallback(
    async (linkId: string): Promise<void> => {
      setBusy(true);
      setError(null);
      const result = await revokeShareLink(linkId);
      if (result.ok && result.value) {
        // Keep the only copy of a fresh URL unless its link is really gone.
        setCreated((current) => (current?.id === linkId ? null : current));
      } else {
        setError(result.ok ? 'This link was already revoked or has expired.' : result.message);
      }
      await loadLinks();
      setBusy(false);
    },
    [loadLinks],
  );

  return { links, loading, busy, error, listError, created, create, revoke };
}
