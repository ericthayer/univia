import { FormEvent, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { TonePill } from '../../ui/TonePill/TonePill';
import type { AdminAccount, AdminActionResult } from '../../../hooks/useAdminAccounts';

const fieldSx = {
  bgcolor: 'transparent',
  '& .MuiOutlinedInput-root': { minHeight: 56, bgcolor: 'background.default' },
  '& .MuiFormHelperText-root': { mx: 2, mt: 1 },
} as const;

const buttonSx = { minHeight: 56, px: 3, flexShrink: 0 } as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminAccessCardProps {
  admins: AdminAccount[];
  currentUserId: string | undefined;
  loading: boolean;
  loadError: string | null;
  onGrant: (email: string) => Promise<AdminActionResult>;
  onRevoke: (account: AdminAccount) => Promise<AdminActionResult>;
  reveal?: number;
}

/**
 * Lists administrators, grants access by email, and revokes with confirmation.
 * The signed-in admin cannot revoke themselves, which also protects the last admin.
 */
export function AdminAccessCard({
  admins,
  currentUserId,
  loading,
  loadError,
  onGrant,
  onRevoke,
  reveal,
}: AdminAccessCardProps) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<AdminAccount | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const submitGrant = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy) return;

    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setFieldError(null);
    setBusy(true);
    const outcome = await onGrant(email);
    setResult(outcome);
    if (outcome.kind === 'success') setEmail('');
    setBusy(false);
  };

  const confirmRevoke = async (): Promise<void> => {
    if (!pendingRevoke) return;
    setBusy(true);
    setResult(await onRevoke(pendingRevoke));
    setPendingRevoke(null);
    setBusy(false);
  };

  return (
    <BezelCard component="section" aria-labelledby="admins-heading" reveal={reveal}>
      <SectionHeader id="admins-heading" title="Administrators" meta={loading ? undefined : admins.length} dense />
      <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2.5, maxWidth: '60ch' }}>
        Administrators can manage users, plans, and these settings.
      </Typography>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
          Couldn't load administrators: {loadError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'grid', gap: 1 }} aria-hidden="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {admins.map((admin) => {
            const isSelf = admin.id === currentUserId;
            return (
              <Box
                component="li"
                key={admin.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  minHeight: 64,
                  '& + &': { borderTop: 1, borderColor: 'divider' },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {admin.full_name || admin.email}
                    </Typography>
                    {isSelf && <TonePill variant="outline">You</TonePill>}
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {admin.email}
                  </Typography>
                </Box>
                {!isSelf && (
                  <Button
                    variant="text"
                    color="error"
                    disabled={busy}
                    onClick={() => setPendingRevoke(admin)}
                    aria-label={`Revoke admin access for ${admin.email}`}
                    sx={{ minHeight: 44, px: 2 }}
                  >
                    Revoke
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <Box
        component="form"
        onSubmit={submitGrant}
        noValidate
        aria-labelledby="grant-heading"
        sx={{ mt: 3 }}
      >
        <Typography id="grant-heading" variant="eyebrow" component="h3" sx={{ display: 'block', mb: 1.5 }}>
          Grant access
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 }}>
          <TextField
            inputRef={emailRef}
            label="Email address"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            error={Boolean(fieldError)}
            helperText={fieldError ?? 'The person must already have a Univia account.'}
            sx={{ ...fieldSx, flex: '1 1 16rem' }}
          />
          <Button type="submit" variant="contained" disabled={busy || !email.trim()} sx={buttonSx}>
            {busy && !pendingRevoke ? 'Granting…' : 'Grant access'}
          </Button>
        </Box>
      </Box>

      <Box role={result?.kind === 'error' ? 'alert' : 'status'} sx={{ mt: result ? 2 : 0 }}>
        {result && (
          <Alert severity={result.kind} onClose={() => setResult(null)} sx={{ borderRadius: 3 }}>
            {result.message}
          </Alert>
        )}
      </Box>

      <Dialog
        open={Boolean(pendingRevoke)}
        onClose={() => !busy && setPendingRevoke(null)}
        aria-labelledby="revoke-title"
        aria-describedby="revoke-description"
      >
        <DialogTitle id="revoke-title">Revoke admin access?</DialogTitle>
        <DialogContent>
          <DialogContentText id="revoke-description">
            {pendingRevoke?.email} will lose access to user management, billing, and admin settings. You can grant it
            again later.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPendingRevoke(null)} disabled={busy} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void confirmRevoke()}
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {busy ? 'Revoking…' : 'Revoke access'}
          </Button>
        </DialogActions>
      </Dialog>
    </BezelCard>
  );
}

export default AdminAccessCard;
