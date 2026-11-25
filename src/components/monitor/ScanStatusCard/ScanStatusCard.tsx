import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { TonePill } from '../../ui/TonePill/TonePill';
import type { Tone } from '../../ui/tone';
import {
  isRunActive,
  requestSiteScan,
  setSitePaused,
  type MonitorSite,
  type ScanRun,
} from '../../../services/monitor.service';
import { controlRadius } from '../../../theme/tokens';
import { formatMonitorDate } from '../formatMonitorDate';

export interface ScanStatusCardProps {
  site: MonitorSite;
  latestRun: ScanRun | undefined;
  onChanged: () => void;
}

const STATUS: Record<ScanRun['status'], { label: string; tone: Tone }> = {
  queued: { label: 'Queued', tone: 'info' },
  running: { label: 'Scanning', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'error' },
};

function runSummary(run: ScanRun): string {
  if (isRunActive(run)) {
    return `Scanning ${run.pages_total} ${run.pages_total === 1 ? 'page' : 'pages'}. Results appear here when it finishes.`;
  }
  const failed = run.pages_failed ? ` ${run.pages_failed} could not be scanned.` : '';
  return `${run.pages_succeeded} of ${run.pages_total} pages scanned.${failed} ${run.new_issues} new, ${run.resolved_issues} resolved, ${run.open_issues} open.`;
}

/**
 * Latest scan at a glance, with the two owner actions: an extra scan (once a
 * day) and pausing weekly scans. Status changes are announced politely.
 */
export function ScanStatusCard({ site, latestRun, onChanged }: ScanStatusCardProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const active = isRunActive(latestRun);
  const status = latestRun ? STATUS[latestRun.status] : null;

  const act = async (action: () => Promise<{ ok: boolean; message?: string }>, success: string) => {
    setBusy(true);
    setMessage(null);
    const result = await action();
    setBusy(false);
    setMessage(result.ok ? { tone: 'success', text: success } : { tone: 'error', text: result.message ?? '' });
    if (result.ok) onChanged();
  };

  return (
    <BezelCard component="section" aria-labelledby="scan-status-title">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0, flex: '1 1 18rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Typography id="scan-status-title" variant="h6" component="h2">
              Latest scan
            </Typography>
            {status && <TonePill tone={status.tone} dot>{status.label}</TonePill>}
            {site.paused && <TonePill variant="outline">Weekly scans paused</TonePill>}
          </Box>
          <Box aria-live="polite">
            <Typography variant="body2" color="text.secondary">
              {latestRun ? runSummary(latestRun) : 'No scans yet.'}
            </Typography>
            {latestRun && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {latestRun.completed_at ? `Finished ${formatMonitorDate(latestRun.completed_at)}` : `Started ${formatMonitorDate(latestRun.created_at)}`}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            disabled={busy || active}
            onClick={() => act(() => requestSiteScan(site.id), 'Scan queued. It usually finishes within a few minutes.')}
            sx={{ borderRadius: controlRadius, minHeight: 44 }}
          >
            Scan now
          </Button>
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => act(
              () => setSitePaused(site.id, !site.paused),
              site.paused ? 'Weekly scans resumed.' : 'Weekly scans paused.',
            )}
            sx={{ borderRadius: controlRadius, minHeight: 44 }}
          >
            {site.paused ? 'Resume weekly scans' : 'Pause weekly scans'}
          </Button>
        </Box>
      </Box>
      <Box aria-live="polite">
        {message && (
          <Alert severity={message.tone} sx={{ mt: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </Box>
    </BezelCard>
  );
}

export default ScanStatusCard;
