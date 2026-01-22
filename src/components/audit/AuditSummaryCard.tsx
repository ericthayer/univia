import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import Icon from '../ui/Icon';

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

/**
 * A summary card displaying high-level accessibility audit metrics.
 * Follows MUI v7.3+, Univia design tokens (src/theme), and GEMINI.md standards.
 */
export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  auditId,
  score,
  status,
  issueCount,
  timestamp,
  'aria-label': ariaLabel,
}) => {
  const getScoreColor = (value: number) => {
    if (value >= 90) return 'success.main';
    if (value >= 70) return 'warning.main';
    return 'error.main';
  };

  const statusConfig = {
    completed: { color: 'success' as const, label: 'Completed', icon: 'check_circle' },
    'in-progress': { color: 'warning' as const, label: 'In Progress', icon: 'schedule' },
    failed: { color: 'error' as const, label: 'Failed', icon: 'error' },
  };

  const config = statusConfig[status];

  return (
    <Card
      component="article"
      sx={{
        borderRadius: 'var(--mui-shape-borderRadius)',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.2s var(--mui-transitions-easing-easeInOut)',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 'var(--mui-shadows-2)',
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              AUDIT ID: {auditId.toUpperCase()}
            </Typography>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
              Audit Results Summary
            </Typography>
          </Box>
          <Chip
            icon={<Icon name={config.icon} style={{ fontSize: 16 }} />}
            label={config.label}
            size="small"
            color={config.color}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          />
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mt: 3 }} role="region" aria-label={ariaLabel || "Audit Metrics"}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Accessibility Score
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: getScoreColor(score),
                letterSpacing: '-0.02em'
              }}
            >
              {score}%
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Issues
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {issueCount}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {timestamp}
          </Typography>
          <Icon name="arrow_forward" style={{ fontSize: 20, color: 'var(--mui-palette-action-active)' }} />
        </Box>
      </CardContent>
    </Card>
  );
};
