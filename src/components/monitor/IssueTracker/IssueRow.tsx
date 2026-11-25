import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { TonePill } from '../../ui/TonePill/TonePill';
import { severityTone } from '../../ui/violationSeverity';
import { formatMonitorDate } from '../formatMonitorDate';
import { IssueTimeline } from './IssueTimeline';
import { MarkFixedForm } from './MarkFixedForm';
import { STATUS, type IssueStatus } from './issueStatus';
import { pagePath } from '../../../utils/monitorUrls';
import type { IssueEvent, IssueSeverity, MonitorIssue } from '../../../services/monitor.service';

export interface IssueRowProps {
  issue: MonitorIssue;
  pageUrl: string | undefined;
  status: IssueStatus;
  history: readonly IssueEvent[];
  busy: boolean;
  /** False while any scan of the site is queued or running. */
  canRecheck: boolean;
  onMarkFixed: (issueId: string, note: string) => void;
  onUndo: (issueId: string) => void;
  onRecheck: (pageId: string) => void;
}

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};
const COLUMNS = 6;
const buttonSx = { minHeight: 44, whiteSpace: 'nowrap' } as const;

type Panel = 'none' | 'history' | 'mark';

/** One issue, its state actions, and a details row for history or marking fixed. */
export function IssueRow({ issue, pageUrl, status, history, busy, canRecheck, onMarkFixed, onUndo, onRecheck }: IssueRowProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const markRef = useRef<HTMLButtonElement>(null);
  const previous = useRef<Panel>('none');
  const path = pageUrl ? pagePath(pageUrl) : 'Removed page';
  const panelId = `issue-${issue.id}-details`;

  // Closing the mark form returns focus to the button that opened it.
  useEffect(() => {
    if (previous.current === 'mark' && panel === 'none') markRef.current?.focus();
    previous.current = panel;
  }, [panel]);

  return (
    <>
      <tr>
        <th scope="row">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {issue.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="code">
            {issue.rule_id}
          </Typography>
        </th>
        <td>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere', minWidth: '6rem' }}>
            {path}
          </Typography>
        </td>
        <td>
          <TonePill tone={severityTone(issue.severity)}>{SEVERITY_LABEL[issue.severity]}</TonePill>
        </td>
        <td>
          <Typography variant="body2" className="MonitorTable-num">
            {issue.element_count}
          </Typography>
        </td>
        <td>
          <TonePill tone={STATUS[status].tone} dot>
            {STATUS[status].label}
          </TonePill>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} className="MonitorTable-num">
            Since <time dateTime={issue.first_seen_at}>{formatMonitorDate(issue.first_seen_at)}</time>
          </Typography>
        </td>
        <Box component="td" sx={{ textAlign: 'right' }}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
            {issue.state === 'open' && (
              <Button
                ref={markRef}
                onClick={() => setPanel(panel === 'mark' ? 'none' : 'mark')}
                disabled={busy}
                aria-expanded={panel === 'mark'}
                aria-controls={panelId}
                aria-label={`Mark fixed: ${issue.title} on ${path}`}
                sx={buttonSx}
              >
                Mark fixed
              </Button>
            )}
            {issue.state === 'marked_fixed' && (
              <>
                <Button
                  onClick={() => onRecheck(issue.page_id)}
                  disabled={busy || !canRecheck}
                  aria-label={`Re-check ${path} now`}
                  sx={buttonSx}
                >
                  Re-check page
                </Button>
                <Button onClick={() => onUndo(issue.id)} disabled={busy} aria-label={`Undo fixed mark: ${issue.title} on ${path}`} sx={buttonSx}>
                  Undo
                </Button>
              </>
            )}
            <Button
              onClick={() => setPanel(panel === 'history' ? 'none' : 'history')}
              aria-expanded={panel === 'history'}
              aria-controls={panelId}
              aria-label={`History: ${issue.title} on ${path}`}
              sx={buttonSx}
            >
              History
            </Button>
          </Box>
        </Box>
      </tr>
      {panel !== 'none' && (
        <tr>
          <Box component="td" colSpan={COLUMNS} id={panelId} sx={{ bgcolor: 'action.hover' }}>
            {panel === 'history' ? (
              <IssueTimeline id={`${panelId}-history`} events={history} />
            ) : (
              <MarkFixedForm
                issueTitle={issue.title}
                busy={busy}
                onCancel={() => setPanel('none')}
                onSubmit={(note) => onMarkFixed(issue.id, note)}
              />
            )}
          </Box>
        </tr>
      )}
    </>
  );
}

export default IssueRow;
