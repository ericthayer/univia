import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getMonitorAccess,
  isRunActive,
  listSites,
  loadSiteDetail,
  type MonitorSite,
  type SiteDetail,
} from '../services/monitor.service';

const POLL_MS = 15_000;

export type MonitorState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-access' }
  | { status: 'ready'; sites: MonitorSite[]; site: MonitorSite | null; detail: SiteDetail | null };

/**
 * Loads Monitor access, the caller's sites and the selected site's detail.
 * Polls while a scan is queued or running so progress appears without a reload.
 */
export function useMonitorSite(selectedSiteId: string | null) {
  const [state, setState] = useState<MonitorState>({ status: 'loading' });
  const requestId = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const id = ++requestId.current;
    if (!quiet) setState({ status: 'loading' });

    const access = await getMonitorAccess();
    if (id !== requestId.current) return;
    if (!access.ok) return setState({ status: 'error', message: access.message });
    if (!access.value) return setState({ status: 'no-access' });

    const sites = await listSites();
    if (id !== requestId.current) return;
    if (!sites.ok) return setState({ status: 'error', message: sites.message });

    const site = sites.value.find((entry) => entry.id === selectedSiteId) ?? sites.value[0] ?? null;
    if (!site) return setState({ status: 'ready', sites: sites.value, site: null, detail: null });

    const detail = await loadSiteDetail(site.id);
    if (id !== requestId.current) return;
    if (!detail.ok) return setState({ status: 'error', message: detail.message });
    setState({ status: 'ready', sites: sites.value, site, detail: detail.value });
  }, [selectedSiteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeRun = state.status === 'ready' && isRunActive(state.detail?.runs[0]);
  useEffect(() => {
    if (!activeRun) return undefined;
    const timer = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [activeRun, load]);

  const refresh = useCallback(() => load(true), [load]);
  return { state, refresh };
}
