import { useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { SegmentedToggleGroup } from '../../ui/SegmentedToggleGroup/SegmentedToggleGroup';
import { srOnly } from '../../ui/srOnly';
import { MonitorTable } from '../MonitorTable/MonitorTable';
import { IssueRow } from './IssueRow';
import { sortIssues } from './sortIssues';
import { eventsByIssue, FILTER_LABEL, ISSUE_FILTERS, issueStatus, matchesFilter, type IssueFilter } from './issueStatus';
import { isRunActive, markIssueFixed, requestPageRecheck, undoMarkFixed, type MonitorResult, type SiteDetail } from '../../../services/monitor.service';

export interface IssueTrackerProps {
  detail: SiteDetail;
  filter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
  onChanged: () => void;
}

const EMPTY: Record<IssueFilter, string> = {
  open: 'No open issues',
  marked_fixed: 'Nothing is waiting for a re-check',
  reopened: 'No reopened issues',
  fixed: 'No fixed issues yet',
};

/**
 * Fix tracker: filter issues by where they stand, mark them fixed, undo, and
 * re-check a page so a scan confirms the fix. Every step lands in the issue's
 * history, which is what the Remediation Record reports.
 */
export function IssueTracker({ detail, filter, onFilterChange, onChanged }: IssueTrackerProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'error' | 'success';
    text: string;
  } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const history = useMemo(() => eventsByIssue(detail.events), [detail.events]);
  const pageUrl = useMemo(() => new Map(detail.pages.map((page) => [page.id, page.url])), [detail.pages]);
  const rows = useMemo(
    () =>
      sortIssues(detail.issues)
        .map((issue) => ({
          issue,
          status: issueStatus(issue, history.get(issue.id)),
        }))
        .filter((row) => matchesFilter(row.status, filter)),
    [detail.issues, history, filter],
  );
  const counts = useMemo(() => {
    const result: Record<IssueFilter, number> = {
      open: 0,
      marked_fixed: 0,
      reopened: 0,
      fixed: 0,
    };
    for (const issue of detail.issues) {
      const status = issueStatus(issue, history.get(issue.id));
      for (const key of ISSUE_FILTERS) if (matchesFilter(status, key)) result[key] += 1;
    }
    return result;
  }, [detail.issues, history]);
  const scanIdle = !isRunActive(detail.runs[0]);

  const act = async (action: () => Promise<MonitorResult<unknown>>, success: string) => {
    setBusy(true);
    setMessage(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setMessage({ tone: 'success', text: success });
    // The row may leave this filter, or the list may empty; the wrapper below
    // stays mounted either way, so keyboard users keep their place.
    tableRef.current?.focus();
    onChanged();
  };

  return (
    <BezelCard component="section" aria-labelledby="issue-tracker-title">
      <SectionHeader
        id="issue-tracker-title"
        title="Issues"
        meta={counts.open ? `${counts.open} open` : undefined}
        dense
        action={
          <SegmentedToggleGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, next: IssueFilter | null) => next && onFilterChange(next)}
            aria-label="Show issues"
            sx={{
              maxWidth: '100%',
              overflowX: 'auto',
              '& .MuiToggleButton-root': {
                whiteSpace: 'nowrap',
                flexShrink: 0,
              },
            }}
          >
            {ISSUE_FILTERS.map((key) => (
              <ToggleButton key={key} value={key} aria-label={`${FILTER_LABEL[key]} (${counts[key]})`}>
                {FILTER_LABEL[key]}
                <Box component="span" aria-hidden sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                  {counts[key]}
                </Box>
              </ToggleButton>
            ))}
          </SegmentedToggleGroup>
        }
      />
      <Box aria-live="polite" sx={{ mb: message ? 2 : 0 }}>
        {message && (
          <Alert severity={message.tone} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </Box>
      {!scanIdle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A scan is running. Marking fixes and re-checks are available again when it finishes.
        </Typography>
      )}
      <Box
        ref={tableRef}
        tabIndex={-1}
        role="group"
        aria-label="Issue list"
        sx={{
          outline: 'none',
          borderRadius: '12px',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        {rows.length ? (
          <MonitorTable caption={`${FILTER_LABEL[filter]} issues, most severe first`} minWidth={880}>
            <thead>
              <tr>
                <th scope="col">Issue</th>
                <th scope="col">Page</th>
                <th scope="col">Severity</th>
                <th scope="col">Elements</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <Box component="span" sx={srOnly}>
                    Actions
                  </Box>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ issue, status }) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  pageUrl={pageUrl.get(issue.page_id)}
                  status={status}
                  history={history.get(issue.id) ?? []}
                  busy={busy}
                  scanIdle={scanIdle}
                  onMarkFixed={(id, note) =>
                    void act(() => markIssueFixed(id, note), 'Marked fixed. Re-check the page, or the next weekly scan will confirm it.')
                  }
                  onUndo={(id) => void act(() => undoMarkFixed(id), 'Fixed mark removed. The issue is open again.')}
                  onRecheck={(pageId) => void act(() => requestPageRecheck(pageId), 'Re-check queued. It usually finishes within a few minutes.')}
                />
              ))}
            </tbody>
          </MonitorTable>
        ) : (
          <EmptyState
            icon="task_alt"
            title={detail.runs.some((run) => run.status === 'completed') ? EMPTY[filter] : 'Waiting for the first scan'}
            description="Automated checks cannot catch everything, so keep testing with a keyboard and a screen reader."
            compact
          />
        )}
      </Box>
    </BezelCard>
  );
}

export default IssueTracker;
