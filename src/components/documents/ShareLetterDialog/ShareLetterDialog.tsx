import { useEffect, useId, useRef, useState } from 'react';
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
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useLetterShares } from '../../../hooks/useLetterShares';
import { SHARE_EXPIRY_OPTIONS, ShareExpiryDays } from '../../../services/letterShare.service';
import { SegmentedToggleGroup } from '../../ui/SegmentedToggleGroup/SegmentedToggleGroup';
import Icon from '../../ui/Icon';
import { ActiveLinkRow } from './ActiveLinkRow';
import { formatShareDate } from './formatShareDate';

export interface ShareLetterDialogProps {
  open: boolean;
  onClose: () => void;
  /** Saved letter id. Without it the analysis was not saved and cannot be shared. */
  letterId?: string;
  /** Shown in the dialog so the owner knows what they are sharing. */
  letterName?: string;
}

/**
 * Creates and manages private, expiring share links for one demand-letter
 * analysis. The full link is only available right after creation: the database
 * stores a fingerprint, not the link. See docs/specs/letter-sharing/SPEC.md.
 */
export function ShareLetterDialog({ open, onClose, letterId, letterName }: ShareLetterDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const uid = useId();
  const [days, setDays] = useState<ShareExpiryDays>(7);
  const [copyStatus, setCopyStatus] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const { links, loading, busy, error, listError, created, create, revoke } = useLetterShares(letterId, open);

  useEffect(() => {
    if (!open) setCopyStatus('');
  }, [open]);

  useEffect(() => {
    if (created) linkInputRef.current?.select();
  }, [created]);

  const copyLink = async (): Promise<void> => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopyStatus('Link copied to clipboard.');
    } catch {
      linkInputRef.current?.select();
      setCopyStatus('Copy blocked by the browser. The link is selected; press Ctrl+C or Cmd+C.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-intro`}
    >
      <DialogTitle id={`${uid}-title`}>Share analysis</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${uid}-intro`} sx={{ mb: 3 }}>
          {letterName ? <strong>{letterName}</strong> : 'This analysis'} will be visible to anyone with the link until
          it expires or you revoke it. They see the AI analysis only, never your original document.
        </DialogContentText>

        {!letterId ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            This analysis was not saved to your account, so it cannot be shared. Upload the letter again while signed
            in.
          </Alert>
        ) : (
          <>
            <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, mb: 2.5 }}>
              <Typography component="legend" variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Link expires after
              </Typography>
              <SegmentedToggleGroup
                exclusive
                value={days}
                onChange={(_, value: ShareExpiryDays | null) => value && setDays(value)}
                aria-label="Link expires after"
                sx={{ '& .MuiToggleButton-root': { minHeight: 44 } }}
              >
                {SHARE_EXPIRY_OPTIONS.map((option) => (
                  <ToggleButton key={option.days} value={option.days}>
                    {option.label}
                  </ToggleButton>
                ))}
              </SegmentedToggleGroup>
            </Box>

            <Button
              variant="contained"
              startIcon={<Icon name="link" />}
              onClick={() => void create(days)}
              disabled={busy || loading}
              sx={{ minHeight: 44 }}
            >
              {busy && !created ? 'Creating link…' : created ? 'Create another link' : 'Create link'}
            </Button>

            {created && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    inputRef={linkInputRef}
                    label="Share link"
                    value={created.url}
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { readOnly: true, spellCheck: false } }}
                    helperText={`Expires ${formatShareDate(created.expiresAt)}. Copy it now: for security we only keep a fingerprint of this link.`}
                    onFocus={(event) => event.target.select()}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Icon name="content_copy" />}
                    onClick={() => void copyLink()}
                    sx={{ minHeight: 40, flexShrink: 0 }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}

            <Box role="status" aria-live="polite" sx={{ mt: copyStatus ? 1 : 0 }}>
              {copyStatus && (
                <Typography variant="body2" color="text.secondary">
                  {copyStatus}
                </Typography>
              )}
            </Box>

            <Box role="alert" sx={{ mt: error ? 2 : 0 }}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}
            </Box>

            <Box component="section" aria-labelledby={`${uid}-active`} sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography id={`${uid}-active`} variant="eyebrow" component="h3" sx={{ display: 'block', mb: 1.5 }}>
                Active links
              </Typography>
              {loading ? (
                <Skeleton variant="rounded" height={44} />
              ) : listError ? (
                <Typography variant="body2" color="error">
                  We could not load your active links. {listError}
                </Typography>
              ) : links.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No active links. Nobody else can see this analysis.
                </Typography>
              ) : (
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {links.map((link) => (
                    <ActiveLinkRow key={link.id} link={link} disabled={busy} onRevoke={(id) => void revoke(id)} />
                  ))}
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShareLetterDialog;
