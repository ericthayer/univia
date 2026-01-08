import { Box, Typography, useTheme } from '@mui/material';
import { CircularProgress } from '@mui/material';

interface ComplianceGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ComplianceGauge({ score, size = 200, label = 'Compliance Score' }: ComplianceGaugeProps) {
  const theme = useTheme();

  const getColor = (score: number) => {
    if (score >= 90) return theme.palette.success.light;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.light;
  };

  const color = getColor(score);

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
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.25)',
            position: 'absolute',
          }}
        />
        <CircularProgress
          title="Audit score value circle"
          variant="determinate"
          value={score}
          size={size}
          thickness={4}
          sx={{
            color: color,
            transition: 'all 0.5s ease-in-out',
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h2" component="div" sx={{ fontWeight: 700, color: color }}>
            {score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
