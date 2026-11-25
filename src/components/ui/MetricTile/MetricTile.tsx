import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { BezelCard } from '../BezelCard/BezelCard';
import { Tone, toneColor, toneTextColor } from '../tone';
import { TonePill } from '../TonePill/TonePill';

export interface MetricTileProps {
  label: string;
  value: string | number;
  support?: string;
  icon?: ReactNode;
  tone?: Tone;
  /**
   * Short state label (e.g. "Good", "Needs work") shown as a tonal pill beside
   * the value. Pair with `tone` so state is not conveyed by color alone.
   */
  status?: string;
  loading?: boolean;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/**
 * KPI tile: eyebrow label, tabular numeral, support line, and an optional icon
 * in a tone-tinted circle. Built on BezelCard with no edge accent: state reads
 * from the tinted icon badge plus an optional `status` pill with a text label.
 */
export function MetricTile({ label, value, support, icon, tone = 'neutral', status, loading = false, reveal }: MetricTileProps) {
  const theme = useTheme();
  const neutral = tone === 'neutral';
  const color = neutral ? toneColor(theme, tone) : toneTextColor(theme, tone);
  const tint = toneColor(theme, tone);

  return (
    <BezelCard reveal={reveal} sx={{ containerType: 'inline-size', height: '100%' }}>
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
              fontSize: '1.125rem',
              ...(neutral
                ? {
                    bgcolor: 'action.hover',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    ...theme.applyStyles('dark', {
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    }),
                  }
                : {
                    // Tone badge: same tint recipe as TonePill.
                    bgcolor: `color-mix(in srgb, ${tint} 14%, transparent)`,
                    border: '1px solid',
                    borderColor: `color-mix(in srgb, ${tint} 30%, transparent)`,
                  }),
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" sx={{ fontSize: 'clamp(2.75rem, 12cqw, 4.25rem)', transform: 'none' }} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5, mb: support ? 2 : 0 }}>
          {/* Hero numeral: one step up from the `metric` variant, scaled to the tile width. */}
          <Typography variant="metric" component="p" sx={{ fontSize: 'clamp(2.75rem, 12cqw, 4.25rem)' }}>
            {value}
          </Typography>
          {status && (
            <TonePill tone={tone} dot>
              {status}
            </TonePill>
          )}
        </Box>
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
