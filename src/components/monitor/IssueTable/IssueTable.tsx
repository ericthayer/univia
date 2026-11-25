import Typography from '@mui/material/Typography';
import { TonePill } from '../../ui/TonePill/TonePill';
import { severityTone } from '../../ui/violationSeverity';
import { MonitorTable } from '../MonitorTable/MonitorTable';
import { formatMonitorDate } from '../formatMonitorDate';
import { pagePath } from '../../../utils/monitorUrls';
import { sortIssues } from './sortIssues';
import type { IssueSeverity, IssueState, MonitorIssue, MonitorPage } from '../../../services/monitor.service';

export interface IssueTableProps {
  issues: readonly MonitorIssue[];
  pages: readonly MonitorPage[];
}

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};
const STATE_LABEL: Record<IssueState, string> = {
  open: 'Open',
  marked_fixed: 'Marked fixed',
  resolved: 'Resolved',
};

/**
 * Open issues: one row per accessibility check per page. Element counts come
 * from the latest scan that saw the issue.
 */
export function IssueTable({ issues, pages }: IssueTableProps) {
  const pageUrl = new Map(pages.map((page) => [page.id, page.url]));

  return (
    <MonitorTable caption="Open accessibility issues, most severe first" minWidth={640}>
      <thead>
        <tr>
          <th scope="col">Issue</th>
          <th scope="col">Page</th>
          <th scope="col">Severity</th>
          <th scope="col">Elements</th>
          <th scope="col">First seen</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {sortIssues(issues).map((issue) => {
          const url = pageUrl.get(issue.page_id);
          return (
            <tr key={issue.id}>
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
                  {url ? pagePath(url) : 'Removed page'}
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
                <Typography variant="body2" color="text.secondary" className="MonitorTable-num">
                  <time dateTime={issue.first_seen_at}>{formatMonitorDate(issue.first_seen_at)}</time>
                </Typography>
              </td>
              <td>
                <TonePill variant="outline">{STATE_LABEL[issue.state]}</TonePill>
              </td>
            </tr>
          );
        })}
      </tbody>
    </MonitorTable>
  );
}

export default IssueTable;
