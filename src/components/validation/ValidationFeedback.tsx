import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { ValidationError } from '../../utils/validation';
import Icon from '../ui/Icon';

interface ValidationFeedbackProps {
  error: ValidationError | null;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  characterCount?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  label?: string;
  alwaysShowHelper?: string;
}

type UsageTone = 'success' | 'warning' | 'error';

function usageTone(percentageUsed: number): UsageTone {
  if (percentageUsed > 90) return 'error';
  if (percentageUsed > 75) return 'warning';
  return 'success';
}

/**
 * Inline field feedback: error, helper, success, and an optional length meter.
 * Every state pairs an icon with text, so color is never the only signal.
 */
export default function ValidationFeedback({
  error,
  isValid,
  isDirty,
  isTouched,
  characterCount = 0,
  maxLength,
  showCharacterCount = true,
  label,
  alwaysShowHelper,
}: ValidationFeedbackProps) {
  const shouldShowError = error && (isDirty || isTouched);
  const shouldShowSuccess = isValid && isDirty && isTouched && !error;
  const percentageUsed = maxLength ? (characterCount / maxLength) * 100 : 0;
  const tone = usageTone(percentageUsed);

  return (
    <Box sx={{ mt: 1 }} aria-live="polite">
      {shouldShowError && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Icon
            name="error"
            aria-hidden
            style={{ fontSize: 18, marginTop: '2px', flexShrink: 0, color: 'var(--mui-palette-error-main)' }}
          />
          <FormHelperText error sx={{ fontSize: '0.75rem', lineHeight: 1.4, m: 0 }}>
            {error.message}
          </FormHelperText>
        </Box>
      )}

      {!shouldShowError && alwaysShowHelper && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Icon
            name="info"
            aria-hidden
            style={{ fontSize: 18, marginTop: '2px', flexShrink: 0, color: 'var(--mui-palette-text-secondary)' }}
          />
          <FormHelperText sx={{ fontSize: '0.875rem', lineHeight: 1.4, color: 'text.secondary', m: 0 }}>
            {alwaysShowHelper}
          </FormHelperText>
        </Box>
      )}

      {shouldShowSuccess && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon
            name="check_circle"
            aria-hidden
            style={{ fontSize: 18, flexShrink: 0, color: 'var(--mui-palette-success-main)' }}
          />
          <FormHelperText sx={{ color: 'success.main', fontSize: '0.75rem', m: 0 }}>
            {label} is valid
          </FormHelperText>
        </Box>
      )}

      {showCharacterCount && maxLength && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {label || 'Input'} length
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: `${tone}.main`,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {characterCount} / {maxLength}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentageUsed, 100)}
            aria-label={`${label || 'Input'} length used`}
            sx={{
              height: 6,
              borderRadius: 999,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                backgroundColor: (theme: Theme) => (theme.vars ?? theme).palette[tone].main,
                transition: (theme: Theme) =>
                  `transform ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
              },
            }}
          />
        </>
      )}
    </Box>
  );
}
