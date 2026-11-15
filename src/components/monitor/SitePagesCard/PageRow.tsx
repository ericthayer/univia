import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { TonePill } from '../../ui/TonePill/TonePill';
import type { Tone } from '../../ui/tone';
import { pagePath } from '../../../utils/monitorUrls';
import type { MonitorPage, PageResult, PageResultStatus } from '../../../services/monitor.service';

export interface PageRowProps {
  page: MonitorPage;
  result: PageResult | undefined;
  openIssues: number;
  /** Removing the last page is refused; the site needs one page to scan. */
  canRemove: boolean;
  disabled: boolean;
  onRemove: (pageId: string) => void;
}

const RESULT: Record<PageResultStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Waiting', tone: 'neutral' },
  running: { label: 'Scanning', tone: 'info' },
  succeeded: { label: 'Scanned', tone: 'success' },
  failed: { label: 'Could not scan', tone: 'error' },
};

/**
 * One monitored page. Removal is two-step and moves focus to the confirm
 * button, then back to Remove on cancel, like share-link revoke.
 */
export function PageRow({ page, result, openIssues, canRemove, disabled, onRemove }: PageRowProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const path = pagePath(page.url);

  // If this became the last page while confirming, drop the confirmation.
  useEffect(() => {
    if (!canRemove) setConfirming(false);
  }, [canRemove]);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current) removeRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  return (
    <tr>
      <th scope="row">
        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
          {path}
        </Typography>
        {confirming && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Stop scanning this page? Its issue history is kept.
          </Typography>
        )}
      </th>
      <td>
        {result ? <TonePill tone={RESULT[result.status].tone}>{RESULT[result.status].label}</TonePill> : <TonePill variant="outline">Not scanned</TonePill>}
      </td>
      <td>
        <Typography variant="body2" className="MonitorTable-num">
          {result?.accessibility_score ?? '–'}
        </Typography>
      </td>
      <td>
        <Typography variant="body2" className="MonitorTable-num">
          {openIssues}
        </Typography>
      </td>
      <Box component="td" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {confirming ? (
          <>
            <Button onClick={() => setConfirming(false)} disabled={disabled} sx={{ minHeight: 44 }}>
              Keep
            </Button>
            <Button
              ref={confirmRef}
              variant="contained"
              color="error"
              onClick={() => onRemove(page.id)}
              disabled={disabled || !canRemove}
              aria-label={`Confirm remove ${path}`}
              sx={{ minHeight: 44, ml: 1 }}
            >
              Remove
            </Button>
          </>
        ) : (
          <Button
            ref={removeRef}
            color="error"
            onClick={() => setConfirming(true)}
            disabled={disabled || !canRemove}
            aria-label={`Remove ${path}`}
            sx={{ minHeight: 44 }}
          >
            Remove
          </Button>
        )}
      </Box>
    </tr>
  );
}

export default PageRow;
