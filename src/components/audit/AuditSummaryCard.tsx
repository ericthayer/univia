import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Icon from '../ui/Icon';
import { BezelCard } from '../ui/BezelCard/BezelCard';
import { TonePill } from '../ui/TonePill/TonePill';
import { toneColor, Tone } from '../ui/tone';
import { clampScore, scoreTone } from '../ui/ScoreBar/scoreTone';

/**
 * Props for the AuditSummaryCard component.
 */
export interface AuditSummaryCardProps {
  /** Unique identifier for the audit */
  auditId: string;
  /** Accessibility score (0-100) */
  score: number;
  /** Current status of the audit */
  status: 'completed' | 'in-progress' | 'failed';
  /** Total number of accessibility issues found */
  issueCount: number;
  /** When the audit was performed */
  timestamp: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

const STATUS_CONFIG: Record<AuditSummaryCardProps['status'], { tone: Tone; label: string; icon: string }> = {
  completed: { tone: 'success', label: 'Completed', icon: 'check_circle' },
  'in-progress': { tone: 'warning', label: 'In Progress', icon: 'schedule' },
  failed: { tone: 'error', label: 'Failed', icon: 'error' },
};

/**
 * A summary card displaying high-level accessibility audit metrics.
 * Built on BezelCard; the score takes its tone from its value.
 */
export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  auditId,
  score,
  status,
  issueCount,
  timestamp,
  'aria-label': ariaLabel,
}) => {
  const theme = useTheme();
  const config = STATUS_CONFIG[status];

  return (
    <BezelCard component="article">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="eyebrow" component="p" sx={{ mb: 0.5, overflowWrap: 'anywhere' }}>
            Audit ID {auditId.toUpperCase()}
          </Typography>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
            Audit Results Summary
          </Typography>
        </Box>
        <TonePill tone={config.tone} dot>
          {config.label}
        </TonePill>
      </Box>

      <Box
        component="dl"
        role="region"
        aria-label={ariaLabel || 'Audit Metrics'}
        sx={{ display: 'flex', gap: 3, m: 0 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography component="dt" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Accessibility Score
          </Typography>
          <Typography
            component="dd"
            variant="metric"
            sx={{ m: 0, color: toneColor(theme, scoreTone(clampScore(score))) }}
          >
            {score}%
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography component="dt" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Total Issues
          </Typography>
          <Typography component="dd" variant="metric" sx={{ m: 0 }}>
            {issueCount}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          Last updated: {timestamp}
        </Typography>
        <Box
          aria-hidden="true"
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          <Icon name="arrow_forward" />
        </Box>
      </Box>
    </BezelCard>
  );
};
