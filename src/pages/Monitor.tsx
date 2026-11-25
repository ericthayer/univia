import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useSearchParams } from 'react-router-dom';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { MetricTile } from '../components/ui/MetricTile/MetricTile';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { AddSiteForm } from '../components/monitor/AddSiteForm/AddSiteForm';
import { IssueTracker } from '../components/monitor/IssueTracker/IssueTracker';
import { parseIssueFilter, type IssueFilter } from '../components/monitor/IssueTracker/issueStatus';
import { RunHistoryTable } from '../components/monitor/RunHistoryTable/RunHistoryTable';
import { ScanStatusCard } from '../components/monitor/ScanStatusCard/ScanStatusCard';
import { SitePagesCard } from '../components/monitor/SitePagesCard/SitePagesCard';
import { useMonitorSite } from '../hooks/useMonitorSite';
import { controlRadius } from '../theme/tokens';

const DESCRIPTION =
  'Weekly automated accessibility checks of the pages you choose. Automated checks find some issues, not all of them, and are not a legal or compliance determination.';

/**
 * Monitor: the caller's site, its latest scan, the fix tracker, pages and scan
 * history. Access is decided server-side (my_monitor_access).
 */
export default function Monitor() {
  const [params, setParams] = useSearchParams();
  const { state, refresh } = useMonitorSite(params.get('site'));

  const selectSite = useCallback(
    (siteId: string) => setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('site', siteId);
      return next;
    }),
    [setParams],
  );

  const issueFilter = parseIssueFilter(params.get('issues'));
  const selectIssueFilter = useCallback(
    (filter: IssueFilter) => setParams((current) => {
      const next = new URLSearchParams(current);
      if (filter === 'open') next.delete('issues');
      else next.set('issues', filter);
      return next;
    }, { replace: true }),
    [setParams],
  );

  const header = (actions?: React.ReactNode) => (
    <PageHeader eyebrow="Monitor" title="Site Monitor" description={DESCRIPTION} titleComponent="h1" actions={actions} />
  );

  if (state.status === 'loading') {
    return (
      <PageCanvas maxWidth="xl">
        {header()}
        <Box role="status" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading Monitor" />
        </Box>
      </PageCanvas>
    );
  }

  if (state.status === 'error') {
    return (
      <PageCanvas maxWidth="xl">
        {header()}
        <BezelCard>
          <EmptyState
            icon="error"
            title="Monitor could not be loaded"
            description={state.message}
            action={<Button variant="outlined" onClick={() => void refresh()}>Retry</Button>}
            compact
          />
        </BezelCard>
      </PageCanvas>
    );
  }

  if (state.status === 'no-access') {
    return (
      <PageCanvas maxWidth="xl">
        {header()}
        <BezelCard>
          <EmptyState
            icon="monitor_heart"
            title="Monitor is not on for this account yet"
            description="Monitor is in early access. We will let you know when it is available for your account."
            compact
          />
        </BezelCard>
      </PageCanvas>
    );
  }

  const { sites, site, detail } = state;

  if (!site || !detail) {
    return (
      <PageCanvas maxWidth="xl">
        {header()}
        <Box sx={{ maxWidth: 640 }}>
          <BezelCard component="section" aria-labelledby="add-site-title">
            <SectionHeader id="add-site-title" title="Add your site" dense />
            <AddSiteForm onCreated={selectSite} />
          </BezelCard>
        </Box>
      </PageCanvas>
    );
  }

  const openIssues = detail.issues.filter((issue) => issue.state === 'open');
  const urgent = openIssues.filter((issue) => issue.severity === 'critical' || issue.severity === 'serious').length;
  const scores = detail.latestResults
    .map((result) => result.accessibility_score)
    .filter((score): score is number => score !== null);
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

  const siteSelect = sites.length > 1 && (
    <TextField
      select
      label="Site"
      size="small"
      value={site.id}
      onChange={(event) => selectSite(event.target.value)}
      sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: controlRadius } }}
    >
      {sites.map((entry) => (
        <MenuItem key={entry.id} value={entry.id}>
          {entry.name}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <PageCanvas maxWidth="xl">
      {header(siteSelect || undefined)}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <ScanStatusCard site={site} latestRun={detail.runs[0]} onChanged={() => void refresh()} />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' } }}>
          <MetricTile label="Open issues" value={openIssues.length} support={site.origin} tone={openIssues.length ? 'warning' : 'success'} reveal={0} />
          <MetricTile label="Critical and serious" value={urgent} support="Fix these first" tone={urgent ? 'error' : 'success'} reveal={1} />
          <MetricTile
            label="Average score"
            value={averageScore ?? '–'}
            support={`Across ${scores.length} scanned ${scores.length === 1 ? 'page' : 'pages'}`}
            tone="info"
            reveal={2}
          />
        </Box>

        <IssueTracker detail={detail} filter={issueFilter} onFilterChange={selectIssueFilter} onChanged={() => void refresh()} />

        <SitePagesCard site={site} detail={detail} onChanged={() => void refresh()} />

        {detail.runs.length > 0 && (
          <BezelCard component="section" aria-labelledby="scan-history-title">
            <SectionHeader id="scan-history-title" title="Scan history" dense />
            <RunHistoryTable runs={detail.runs} />
          </BezelCard>
        )}
      </Box>
    </PageCanvas>
  );
}
