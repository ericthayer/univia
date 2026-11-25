import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { TonePill } from '../components/ui/TonePill/TonePill';
import { srOnly } from '../components/ui/srOnly';
import { RECORD_DISCLAIMER, RECORD_NAME } from '../components/report/buildRemediationRecord';
import { usePrivatePageMeta } from '../hooks/usePrivatePageMeta';
import { isRecordId, verifyRecord, type RecordVerification } from '../services/remediationRecord.service';

type State =
  | { status: 'loading' }
  | { status: 'ready'; result: RecordVerification }
  | { status: 'unknown' }
  | { status: 'error'; message: string };

const ANNOUNCE: Record<State['status'], string> = {
  loading: 'Checking the record…',
  ready: 'Check complete.',
  unknown: 'No record has this link.',
  error: 'The record could not be checked.',
};

const day = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Public check for a printed record (`/verify/record/:id`). Recomputes the
 * fingerprint on the server and says whether the history still matches.
 */
export default function VerifyRecord() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  usePrivatePageMeta();

  useEffect(() => {
    if (!isRecordId(id)) {
      setState({ status: 'unknown' });
      return undefined;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    void verifyRecord(id).then((result) => {
      if (cancelled) return;
      if (!result.ok) setState({ status: 'error', message: result.message });
      else setState(result.value ? { status: 'ready', result: result.value } : { status: 'unknown' });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader eyebrow={RECORD_NAME} title="Check a record" titleId="verify-title" titleComponent="h1" />
      <Box role="status" aria-live="polite" sx={srOnly}>
        {ANNOUNCE[state.status]}
      </Box>
      <BezelCard component="section" aria-labelledby="verify-title" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && <Skeleton variant="rounded" height={200} />}
        {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
        {state.status === 'unknown' && (
          <EmptyState icon="search_off" title="No record has this link" description="Check the address printed on the record." compact />
        )}
        {state.status === 'ready' && <VerifyResult result={state.result} />}
      </BezelCard>
    </PageCanvas>
  );
}

function VerifyResult({ result }: { result: RecordVerification }) {
  const facts: Array<[string, string]> = [
    ['Site', `${result.site_name} (${result.site_origin})`],
    ['Period', `${day(result.period_start)} to ${day(result.period_end)}`],
    ['Created', day(result.created_at)],
  ];
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Box>
          <TonePill tone={result.matches ? 'success' : 'error'} dot>
            {result.matches ? 'Unchanged' : 'Changed'}
          </TonePill>
        </Box>
        <Typography variant="h5" component="h2">
          {result.matches
            ? 'The history this record covers has not changed since it was created.'
            : 'The history this record covers has changed since it was created.'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {result.matches
            ? 'Univia recomputed the fingerprint of the scans and fixes up to the end of the period, and it matches the one saved with the record.'
            : 'The recomputed fingerprint does not match the one saved with the record. Ask the site owner for a new record.'}
        </Typography>
      </Box>
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '10rem minmax(0, 1fr)' }, '& dd': { m: 0, overflowWrap: 'anywhere' } }}>
        {facts.map(([label, value]) => (
          <Box key={label} sx={{ display: 'contents' }}>
            <Typography component="dt" variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography component="dd" variant="body2">
              {value}
            </Typography>
          </Box>
        ))}
        <Typography component="dt" variant="body2" color="text.secondary">
          SHA-256 fingerprint
        </Typography>
        <Typography component="dd" variant="body2" sx={{ fontFamily: 'monospace' }}>
          {result.fingerprint}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Compare this fingerprint with the one printed on the record. {RECORD_DISCLAIMER}
      </Typography>
    </Box>
  );
}
