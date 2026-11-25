import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { srOnly } from '../../ui/srOnly';
import { useReportExport } from '../../report/useReportExport';
import { RecordList } from './RecordList';
import { RecordPeriodForm } from './RecordPeriodForm';
import {
  createRecord,
  listRecords,
  loadRecordContents,
  recordVerifyUrl,
  type RecordContents,
  type RemediationRecord,
} from '../../../services/remediationRecord.service';
import type { MonitorResult } from '../../../services/monitor.service';

export interface RemediationRecordCardProps {
  siteId: string;
}

type Records = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; records: RemediationRecord[] };

/** Create a record for a period, and print or check saved ones. */
export function RemediationRecordCard({ siteId }: RemediationRecordCardProps) {
  const [records, setRecords] = useState<Records>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status: exportStatus, message: exportMessage, exportReport } = useReportExport();
  const latestSite = useRef(siteId);
  latestSite.current = siteId;

  const refresh = useCallback(async () => {
    const result = await listRecords(siteId);
    if (latestSite.current !== siteId) return;
    setRecords(result.ok ? { status: 'ready', records: result.value } : { status: 'error', message: result.message });
  }, [siteId]);

  useEffect(() => {
    setRecords({ status: 'loading' });
    void refresh();
  }, [refresh]);

  const print = async (load: () => Promise<MonitorResult<RecordContents>>) => {
    setBusy(true);
    setError(null);
    const result = await load();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    void refresh();
    await exportReport({
      kind: 'record',
      contents: result.value,
      options: { verifyUrl: recordVerifyUrl(result.value.record.id) },
    });
  };

  return (
    <BezelCard component="section" aria-labelledby="record-title">
      <SectionHeader id="record-title" title="Accessibility Remediation Record" dense />
      <Box sx={{ display: 'grid', gap: 3 }}>
        <RecordPeriodForm busy={busy || exportStatus === 'preparing'} onSubmit={(start, end) => void print(() => createRecord(siteId, start, end))} />
        <Box role="status" aria-live="polite" sx={exportMessage || error ? undefined : srOnly}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {!error && exportMessage && <Alert severity={exportStatus === 'error' ? 'error' : 'info'}>{exportMessage}</Alert>}
        </Box>
        {records.status === 'loading' && <Skeleton variant="rounded" height={96} />}
        {records.status === 'error' && <Alert severity="error">{records.message}</Alert>}
        {records.status === 'ready' && records.records.length > 0 && (
          <RecordList records={records.records} busy={busy || exportStatus === 'preparing'} onDownload={(id) => void print(() => loadRecordContents(id))} />
        )}
      </Box>
    </BezelCard>
  );
}

export default RemediationRecordCard;
