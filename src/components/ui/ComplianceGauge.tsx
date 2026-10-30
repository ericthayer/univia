import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { toneColor } from './tone';
import { clampScore, scoreTone } from './ScoreBar/scoreTone';

interface ComplianceGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ComplianceGauge({ score, size = 200, label = 'Compliance Score' }: ComplianceGaugeProps) {
  const theme = useTheme();
  const value = clampScore(score);
  const color = toneColor(theme, scoreTone(value));
  const numeralSize = Math.max(1.5, size / 56);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          title="Audit score 100%"
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{
            position: 'absolute',
            color: 'action.hover',
            '& .MuiCircularProgress-circle': { stroke: 'rgba(0, 0, 0, 0.1)' },
            ...theme.applyStyles('dark', {
              '& .MuiCircularProgress-circle': { stroke: 'rgba(255, 255, 255, 0.1)' },
            }),
          }}
        />
        <CircularProgress
          title="Audit score value circle"
          variant="determinate"
          value={value}
          size={size}
          thickness={4}
          sx={{
            color,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              transition: `stroke-dashoffset ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`,
            },
          }}
        />
        <Box
          sx={{
            inset: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography
            variant="h2"
            component="div"
            sx={{
              fontWeight: 700,
              color,
              fontSize: `${numeralSize}rem`,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            /100
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography variant="h6" component="p" sx={{ mt: 2, textAlign: 'center' }}>
          {label}
        </Typography>
      )}
    </Box>
  );
}
