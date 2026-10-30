import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Tone, toneColor, toneTextColor } from '../tone';
import { clampScore, scoreTone } from './scoreTone';

export interface ScoreBarProps {
  label: string;
  /** 0–100. Values outside the range are clamped. */
  value: number;
  /** Override the value-derived tone. */
  tone?: Tone;
  size?: 'sm' | 'md';
}

/**
 * Label + tabular value + pill progress bar. Replaces the hand-rolled
 * LinearProgress blocks that were duplicated across the dashboard and audit pages.
 */
export function ScoreBar({ label, value, tone, size = 'md' }: ScoreBarProps) {
  const theme = useTheme();
  const score = clampScore(value);
  const resolvedTone = tone ?? scoreTone(score);
  const color = toneColor(theme, resolvedTone);
  const textColor = toneTextColor(theme, resolvedTone);
  const height = size === 'sm' ? 4 : 6;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 0.75 }}>
        <Typography variant={size === 'sm' ? 'caption' : 'body2'} sx={{ fontWeight: 600 }} noWrap>
          {label}
        </Typography>
        <Typography
          variant={size === 'sm' ? 'caption' : 'body2'}
          sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: textColor }}
        >
          {score}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        aria-label={`${label} score`}
        sx={{
          height,
          borderRadius: 999,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: color,
            transition: `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`,
          },
        }}
      />
    </Box>
  );
}

export default ScoreBar;
