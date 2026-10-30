import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { BezelCard } from '../BezelCard/BezelCard';
import { Tone, toneColor } from '../tone';

export interface MetricTileProps {
  label: string;
  value: string | number;
  support?: string;
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/**
 * KPI tile: eyebrow label, tabular numeral, support line, and an optional icon
 * seated in a nested circle. Built on BezelCard; tone drives the accent line
 * and icon color only.
 */
export function MetricTile({ label, value, support, icon, tone = 'neutral', loading = false, reveal }: MetricTileProps) {
  const theme = useTheme();
  const color = toneColor(theme, tone);

  return (
    <BezelCard accent={tone} reveal={reveal} sx={{ containerType: 'inline-size', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="eyebrow" component="p">
          {label}
        </Typography>
        {icon && (
          <Box
            aria-hidden="true"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              color,
              bgcolor: 'action.hover',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              fontSize: '1.125rem',
              ...theme.applyStyles('dark', {
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }),
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" sx={{ fontSize: '2.75rem', transform: 'none' }} />
      ) : (
        <Typography variant="metric" component="p" sx={{ mb: support ? 1 : 0 }}>
          {value}
        </Typography>
      )}
      {support && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
          {support}
        </Typography>
      )}
    </BezelCard>
  );
}

export default MetricTile;
