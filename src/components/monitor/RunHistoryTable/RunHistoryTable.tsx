import Typography from '@mui/material/Typography';
import { TonePill } from '../../ui/TonePill/TonePill';
import type { Tone } from '../../ui/tone';
import { MonitorTable } from '../MonitorTable/MonitorTable';
import { formatMonitorDate } from '../formatMonitorDate';
import type { ScanRun, ScanRunStatus, ScanTrigger } from '../../../services/monitor.service';

export interface RunHistoryTableProps {
  runs: readonly ScanRun[];
}

const TRIGGER_LABEL: Record<ScanTrigger, string> = {
  initial: 'First scan',
  scheduled: 'Weekly',
  manual: 'On request',
};
const STATUS: Record<ScanRunStatus, { label: string; tone: Tone }> = {
  queued: { label: 'Queued', tone: 'info' },
  running: { label: 'Scanning', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'error' },
};

/** Recent scans, newest first, with the issue movement each one recorded. */
export function RunHistoryTable({ runs }: RunHistoryTableProps) {
  return (
    <MonitorTable caption="Recent scans, newest first">
      <thead>
        <tr>
          <th scope="col">Started</th>
          <th scope="col">Type</th>
          <th scope="col">Status</th>
          <th scope="col">Pages</th>
          <th scope="col">New</th>
          <th scope="col">Resolved</th>
          <th scope="col">Open</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => {
          const finished = run.status === 'completed' || run.status === 'failed';
          return (
            <tr key={run.id}>
              <th scope="row">
                <Typography variant="body2" className="MonitorTable-num">
                  <time dateTime={run.created_at}>{formatMonitorDate(run.created_at)}</time>
                </Typography>
              </th>
              <td>
                <Typography variant="body2">{TRIGGER_LABEL[run.trigger]}</Typography>
              </td>
              <td>
                <TonePill tone={STATUS[run.status].tone} dot>
                  {STATUS[run.status].label}
                </TonePill>
              </td>
              <td>
                <Typography variant="body2" className="MonitorTable-num">
                  {run.pages_succeeded}/{run.pages_total}
                </Typography>
              </td>
              {[run.new_issues, run.resolved_issues, run.open_issues].map((value, index) => (
                <td key={index}>
                  <Typography variant="body2" className="MonitorTable-num">
                    {finished ? value : '–'}
                  </Typography>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </MonitorTable>
  );
}

export default RunHistoryTable;
