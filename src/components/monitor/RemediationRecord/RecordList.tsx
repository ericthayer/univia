import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { srOnly } from '../../ui/srOnly';
import { ROUTE_PATHS } from '../../../config/navigation';
import { MonitorTable } from '../MonitorTable/MonitorTable';
import { formatMonitorDate } from '../formatMonitorDate';
import type { RemediationRecord } from '../../../services/remediationRecord.service';

export interface RecordListProps {
  records: readonly RemediationRecord[];
  busy: boolean;
  onDownload: (recordId: string) => void;
}

const day = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/** Saved records, newest first. Each can be printed again or checked. */
export function RecordList({ records, busy, onDownload }: RecordListProps) {
  return (
    <MonitorTable caption="Saved records, newest first" minWidth={720}>
      <thead>
        <tr>
          <th scope="col">Period</th>
          <th scope="col">Created</th>
          <th scope="col">History covered</th>
          <th scope="col">Fingerprint</th>
          <th scope="col">
            <Box component="span" sx={srOnly}>
              Actions
            </Box>
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const period = `${day(record.period_start)} to ${day(record.period_end)}`;
          return (
            <tr key={record.id}>
              <th scope="row">
                <Typography variant="body2" sx={{ fontWeight: 600 }} className="MonitorTable-num">
                  {period}
                </Typography>
              </th>
              <td>
                <Typography variant="body2" color="text.secondary" className="MonitorTable-num">
                  <time dateTime={record.created_at}>{formatMonitorDate(record.created_at)}</time>
                </Typography>
              </td>
              <td>
                <Typography variant="body2" className="MonitorTable-num">
                  {record.run_count} scans, {record.event_count} events
                </Typography>
              </td>
              <td>
                <Typography variant="caption" component="code" color="text.secondary" title={record.fingerprint}>
                  {record.fingerprint.slice(0, 12)}…
                </Typography>
              </td>
              <Box component="td" sx={{ textAlign: 'right' }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                  <Button onClick={() => onDownload(record.id)} disabled={busy} aria-label={`Download PDF: record for ${period}`} sx={{ minHeight: 44, whiteSpace: 'nowrap' }}>
                    Download PDF
                  </Button>
                  <Link
                    component={RouterLink}
                    to={ROUTE_PATHS.VERIFY_RECORD.replace(':id', record.id)}
                    aria-label={`Check record for ${period}`}
                    sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, px: 1, whiteSpace: 'nowrap' }}
                  >
                    Check
                  </Link>
                </Box>
              </Box>
            </tr>
          );
        })}
      </tbody>
    </MonitorTable>
  );
}

export default RecordList;
