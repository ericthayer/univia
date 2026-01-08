import { Box, Typography, CardActionArea, IconButton, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccessibilityAudit } from '../../types';
import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../ui/Icon';

interface AuditHistoryCardProps {
  audit: AccessibilityAudit;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

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

  return (
    <Box
      sx={{
        border: 1,
        borderColor: isPinned ? 'primary.main' : 'divider',
        borderRadius: 2,
        display: 'flex',
        flex: 1,
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/audit/${audit.audit_session_id || audit.id}`)}
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
              {audit.url_scanned}
            </Typography>
            {isPinned && (
              <Chip
                label="Pinned"
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {new Date(audit.created_at).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {audit.performance_score || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Perf
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              {audit.accessibility_score || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              A11y
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {audit.best_practices_score || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              BP
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
              {audit.seo_score || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SEO
            </Typography>
          </Box>
        </Box>
      </CardActionArea>

      {user && (
        <IconButton
          onClick={handlePinToggle}
          disabled={pinning}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          size="small"
        >
          <Icon name="push_pin" style={{ fontSize: 18, color: isPinned ? '#1976d2' : undefined }} />
        </IconButton>
      )}
    </Box>
  );
}
