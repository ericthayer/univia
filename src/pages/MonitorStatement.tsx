import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { StatementGenerator } from '../components/monitor/StatementGenerator/StatementGenerator';
import { ROUTE_PATHS } from '../config/navigation';
import { useMonitorSite } from '../hooks/useMonitorSite';
import { controlRadius } from '../theme/tokens';

const DESCRIPTION =
  'Draft a public accessibility statement from your Monitor results. Review it, then publish it on your own site.';

/**
 * Accessibility statement generator for the selected Monitor site.
 * Access is decided server-side, as on /monitor.
 */
export default function MonitorStatement() {
  const [params] = useSearchParams();
  const siteId = params.get('site');
  const { state, refresh } = useMonitorSite(siteId);
  const backTo = siteId ? `${ROUTE_PATHS.MONITOR}?site=${encodeURIComponent(siteId)}` : ROUTE_PATHS.MONITOR;

  const header = (
    <PageHeader
      eyebrow="Monitor"
      title="Accessibility statement"
      description={DESCRIPTION}
      actions={
        <Button component={RouterLink} to={backTo} variant="outlined" sx={{ borderRadius: controlRadius }}>
          Back to Monitor
        </Button>
      }
    />
  );

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = (
      <Box role="status" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading your site" />
      </Box>
    );
  } else if (state.status === 'error') {
    body = (
      <BezelCard>
        <EmptyState
          icon="error"
          title="Your site could not be loaded"
          description={state.message}
          action={<Button variant="outlined" onClick={() => void refresh()}>Retry</Button>}
          compact
        />
      </BezelCard>
    );
  } else if (state.status === 'no-access') {
    body = (
      <BezelCard>
        <EmptyState
          icon="monitor_heart"
          title="Monitor is not on for this account yet"
          description="Monitor is in early access. We will let you know when it is available for your account."
          compact
        />
      </BezelCard>
    );
  } else if (!state.site || !state.detail) {
    body = (
      <BezelCard>
        <EmptyState
          icon="add_link"
          title="Add your site first"
          description="The statement is drafted from your site's pages and scan results."
          action={<Button component={RouterLink} to={ROUTE_PATHS.MONITOR} variant="outlined">Go to Monitor</Button>}
          compact
        />
      </BezelCard>
    );
  } else {
    body = <StatementGenerator key={state.site.id} site={state.site} detail={state.detail} />;
  }

  return (
    <PageCanvas maxWidth="xl">
      {header}
      {body}
    </PageCanvas>
  );
}
