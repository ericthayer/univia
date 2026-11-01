import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { useLocation } from 'react-router-dom';
import InlineAnalysisResults from '../components/documents/InlineAnalysisResults';
import { formatShareDate } from '../components/documents/ShareLetterDialog/formatShareDate';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { usePrivatePageMeta } from '../hooks/usePrivatePageMeta';
import {
  SharedLetterPayload,
  fetchSharedLetter,
  readShareToken,
  toDocumentAnalysis,
} from '../services/letterShare.service';

type SharedLetterState =
  | { status: 'loading' }
  | { status: 'ready'; payload: SharedLetterPayload }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

/**
 * Public, read-only view of a shared demand-letter analysis (`/shared/letter#<token>`).
 * See docs/specs/letter-sharing/SPEC.md.
 */
export default function SharedLetter() {
  const { hash } = useLocation();
  const [state, setState] = useState<SharedLetterState>({ status: 'loading' });
  usePrivatePageMeta();

  useEffect(() => {
    const token = readShareToken(hash);
    if (!token) {
      setState({ status: 'unavailable' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetchSharedLetter(token).then((result) => {
      if (cancelled) return;
      if (!result.ok) setState({ status: 'error', message: result.message });
      else if (!result.value) setState({ status: 'unavailable' });
      else setState({ status: 'ready', payload: result.value });
    });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="Shared analysis"
        title={state.status === 'ready' ? state.payload.file_name : 'Shared demand letter analysis'}
        titleId="shared-letter-title"
        description={
          state.status === 'ready'
            ? `Shared privately with you. This link expires ${formatShareDate(state.payload.expires_at)}.`
            : undefined
        }
      />

      <BezelCard component="section" aria-labelledby="shared-letter-title" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && <Skeleton variant="rounded" height={320} />}
        {state.status === 'error' && (
          <Alert severity="error" role="alert" sx={{ borderRadius: 3 }}>
            {state.message}
          </Alert>
        )}
        {state.status === 'unavailable' && (
          <EmptyState
            compact
            icon="link"
            title="This link is not available"
            description="It may have expired, been revoked by its owner, or been copied incorrectly. Ask the person who shared it for a new link."
          />
        )}
        {state.status === 'ready' && (
          <InlineAnalysisResults analysis={toDocumentAnalysis(state.payload)} readOnly />
        )}
      </BezelCard>
    </PageCanvas>
  );
}
