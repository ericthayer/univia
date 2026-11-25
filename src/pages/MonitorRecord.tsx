import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { RemediationRecordCard } from '../components/monitor/RemediationRecord/RemediationRecordCard';
import { getMonitorAccess, listSites, type MonitorSite } from '../services/monitor.service';
import { ROUTE_PATHS } from '../config/navigation';
import { controlRadius } from '../theme/tokens';

const DESCRIPTION =
  'A dated, printable account of your scans and fixes for a period. It reports what automated scans found and what you did, not whether the site meets any law or standard.';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-access' }
  | { status: 'ready'; sites: MonitorSite[] };

/** `/monitor/record`: create, print and check Accessibility Remediation Records. */
export default function MonitorRecord() {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const access = await getMonitorAccess();
    if (!access.ok) return setState({ status: 'error', message: access.message });
    if (!access.value) return setState({ status: 'no-access' });
    const sites = await listSites();
    if (!sites.ok) return setState({ status: 'error', message: sites.message });
    setState({ status: 'ready', sites: sites.value });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const site = state.status === 'ready' ? (state.sites.find((entry) => entry.id === params.get('site')) ?? state.sites[0]) : undefined;
  const backTo = site ? `${ROUTE_PATHS.MONITOR}?site=${site.id}` : ROUTE_PATHS.MONITOR;

  const actions = (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {state.status === 'ready' && state.sites.length > 1 && site && (
        <TextField
          select
          label="Site"
          size="small"
          value={site.id}
          onChange={(event) => setParams({ site: event.target.value })}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: controlRadius } }}
        >
          {state.sites.map((entry) => (
            <MenuItem key={entry.id} value={entry.id}>
              {entry.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Button component={RouterLink} to={backTo} variant="outlined" sx={{ borderRadius: controlRadius, minHeight: 44 }}>
        Back to Monitor
      </Button>
    </Box>
  );

  return (
    <PageCanvas maxWidth="xl">
      <PageHeader eyebrow="Monitor" title="Remediation Record" description={DESCRIPTION} titleComponent="h1" actions={actions} />
      {state.status === 'loading' && (
        <Box role="status" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading records" />
        </Box>
      )}
      {state.status === 'error' && (
        <BezelCard>
          <EmptyState
            icon="error"
            title="Records could not be loaded"
            description={state.message}
            action={<Button variant="outlined" onClick={() => void load()}>Retry</Button>}
            compact
          />
        </BezelCard>
      )}
      {state.status === 'no-access' && (
        <BezelCard>
          <EmptyState icon="monitor_heart" title="Monitor is not on for this account yet" description="Records are part of Monitor, which is in early access." compact />
        </BezelCard>
      )}
      {state.status === 'ready' && !site && (
        <BezelCard>
          <EmptyState icon="description" title="Add a site first" description="Records cover a monitored site's scans and fixes." compact />
        </BezelCard>
      )}
      {site && <RemediationRecordCard key={site.id} siteId={site.id} />}
    </PageCanvas>
  );
}
