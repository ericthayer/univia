import { useState } from 'react';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { AccessibilityAudit } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../ui/Icon';
import { ScoreStrip } from '../ui/ScoreStrip/ScoreStrip';

interface AuditHistoryCardProps {
  audit: AccessibilityAudit;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

/**
 * One audit as a flush list row. Render inside a `<ul>` (list-style none) that
 * lives in a `BezelCard padding="none"`; rows separate themselves with a
 * hairline and pinned rows carry a 2px accent on the leading edge.
 */
export default function AuditHistoryCard({ audit, isPinned = false, onPinToggle }: AuditHistoryCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pinning, setPinning] = useState(false);

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user || pinning) return;

    setPinning(true);

    try {
      if (isPinned) {
        const { error } = await supabase
          .from('pinned_audits')
          .delete()
          .eq('user_id', user.id)
          .eq('audit_id', audit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pinned_audits')
          .insert({
            user_id: user.id,
            audit_id: audit.id,
          });

        if (error) throw error;
      }

      onPinToggle?.();
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setPinning(false);
    }
  };

  const scannedAt = new Date(audit.created_at);

  return (
    <Box
      component="li"
      sx={{
        position: 'relative',
        listStyle: 'none',
        '& + &': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
        ...(isPinned && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 14,
            bottom: 14,
            width: 2,
            borderRadius: 1,
            bgcolor: 'primary.main',
            pointerEvents: 'none',
          },
        }),
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/audit/${audit.audit_session_id || audit.id}`)}
        sx={{
          py: 2,
          pl: 3,
          pr: user ? 8 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          borderRadius: 0,
          transition: (theme) =>
            `background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ flex: '1 1 16rem', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
              {audit.url_scanned}
            </Typography>
            {isPinned && (
              <Chip
                label="Pinned"
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6875rem', letterSpacing: '0.04em', flexShrink: 0 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            <time dateTime={scannedAt.toISOString()}>{scannedAt.toLocaleString()}</time>
          </Typography>
        </Box>

        <ScoreStrip
          size="sm"
          scores={{
            performance: audit.performance_score,
            accessibility: audit.accessibility_score,
            bestPractices: audit.best_practices_score,
            seo: audit.seo_score,
          }}
        />
      </CardActionArea>

      {user && (
        <IconButton
          onClick={handlePinToggle}
          disabled={pinning}
          aria-label={isPinned ? `Unpin ${audit.url_scanned}` : `Pin ${audit.url_scanned}`}
          aria-pressed={isPinned}
          size="small"
          sx={{
            position: 'absolute',
            top: '50%',
            right: 12,
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            color: isPinned ? 'primary.main' : 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary',
            },
          }}
        >
          <Icon name="push_pin" style={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  );
}
