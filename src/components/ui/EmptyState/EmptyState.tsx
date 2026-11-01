import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Icon from '../Icon';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Shrinks padding and the icon for in-card use. */
  compact?: boolean;
}

/**
 * Centered empty state: icon in a nested circle, title, description, action.
 * Replaces four hand-rolled variants across the refreshed pages.
 */
export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  const theme = useTheme();
  const circle = compact ? 56 : 72;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        py: compact ? 5 : 8,
        px: 3,
        gap: 1,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: circle,
          height: circle,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          mb: 1.5,
          color: 'text.secondary',
          bgcolor: 'action.hover',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          fontSize: compact ? '1.5rem' : '2rem',
          ...theme.applyStyles('dark', {
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }),
        }}
      >
        <Icon name={icon} />
      </Box>
      <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" component="div" sx={{ maxWidth: '44ch' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

export default EmptyState;
