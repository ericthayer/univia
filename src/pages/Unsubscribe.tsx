import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { usePrivatePageMeta } from '../hooks/usePrivatePageMeta';
import { isUnsubscribeToken, unsubscribeWithToken } from '../services/notifications.service';
import { controlRadius } from '../theme/tokens';

type Status = 'idle' | 'working' | 'done' | 'error';

/**
 * Landing page for the "Turn off alerts" link in Monitor emails. Asks before
 * changing anything, so link scanners in mail clients cannot unsubscribe.
 */
export default function Unsubscribe() {
  usePrivatePageMeta();
  const [params] = useSearchParams();
  const token = params.get('token');
  const valid = isUnsubscribeToken(token);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const confirm = async () => {
    if (!valid) return;
    setStatus('working');
    const result = await unsubscribeWithToken(token);
    if (result.ok) {
      setStatus('done');
      setMessage('Scan alerts are off. You can turn them back on in Account Settings.');
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <PageCanvas>
      <PageHeader eyebrow="Monitor" title="Scan alert emails" />
      <Box sx={{ maxWidth: 560 }}>
        <BezelCard component="section" aria-labelledby="unsubscribe-title">
          <Typography id="unsubscribe-title" variant="h6" component="h2" sx={{ mb: 1 }}>
            {valid ? 'Turn off scan alerts?' : 'This link is not valid'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {valid
              ? 'You will stop getting emails when a Monitor scan finds new issues. Weekly scans keep running, and results stay on your Monitor page.'
              : 'Open the link from your most recent alert email, or turn alerts off in Account Settings.'}
          </Typography>
          {valid && status !== 'done' && (
            <Button
              variant="contained"
              onClick={() => void confirm()}
              disabled={status === 'working'}
              sx={{ borderRadius: controlRadius }}
            >
              {status === 'working' ? 'Turning off…' : 'Turn off alerts'}
            </Button>
          )}
          <Typography role="status" aria-live="polite" variant="body2" sx={{ mt: 2, minHeight: '1.5em' }}>
            {message}
          </Typography>
        </BezelCard>
      </Box>
    </PageCanvas>
  );
}
