import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';
import { BezelCard } from './BezelCard/BezelCard';
import type { Tone } from './tone';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  /** Palette path such as `success.main`; its family picks the accent tone. */
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const TONES: Record<string, Tone> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

function toneFromColor(color?: string): Tone {
  const family = color?.split('.')[0];
  return (family && TONES[family]) || 'neutral';
}

/**
 * KPI card with an optional trend. Built on BezelCard: the tone accent is a
 * decorative line on the top edge, not a colored side border. Prefer
 * `MetricTile` for new work; this keeps the older prop shape working.
 */
export default function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <BezelCard accent={toneFromColor(color)} sx={{ height: '100%', containerType: 'inline-size' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="eyebrow" component="h2">
          {title}
        </Typography>
        {icon && (
          <Box aria-hidden="true" sx={{ color: color || 'text.secondary', fontSize: '1.5rem', display: 'flex' }}>
            {icon}
          </Box>
        )}
      </Box>
      <Typography variant="metric" component="p" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: trend.isPositive ? 'success.main' : 'error.main',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            vs last month
          </Typography>
        </Box>
      )}
    </BezelCard>
  );
}
