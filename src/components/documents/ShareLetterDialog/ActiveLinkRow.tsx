import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { ActiveShareLink } from '../../../services/letterShare.service';
import { formatShareDate } from './formatShareDate';

export interface ActiveLinkRowProps {
  link: ActiveShareLink;
  disabled: boolean;
  onRevoke: (linkId: string) => void;
}

/**
 * One active share link with a two-step revoke: the first press asks, the
 * second confirms. Revoking cannot be undone, so it is never one click.
 */
export function ActiveLinkRow({ link, disabled, onRevoke }: ActiveLinkRowProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const revokeRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const created = formatShareDate(link.createdAt);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current) revokeRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        py: 1.25,
        '& + &': { borderTop: '1px solid', borderColor: 'divider' },
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 14rem' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {confirming ? 'Revoke this link? Anyone using it loses access.' : `Created ${created}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          Expires {formatShareDate(link.expiresAt)} · {link.accessCount} {link.accessCount === 1 ? 'view' : 'views'}
        </Typography>
      </Box>
      {confirming ? (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button onClick={() => setConfirming(false)} disabled={disabled} sx={{ minHeight: 44 }}>
            Keep
          </Button>
          <Button
            ref={confirmRef}
            variant="contained"
            color="error"
            onClick={() => onRevoke(link.id)}
            disabled={disabled}
            aria-label={`Confirm revoke link created ${created}`}
            sx={{ minHeight: 44 }}
          >
            Revoke
          </Button>
        </Box>
      ) : (
        <Button
          ref={revokeRef}
          color="error"
          onClick={() => setConfirming(true)}
          disabled={disabled}
          aria-label={`Revoke link created ${created}`}
          sx={{ minHeight: 44, flexShrink: 0 }}
        >
          Revoke
        </Button>
      )}
    </Box>
  );
}

export default ActiveLinkRow;
