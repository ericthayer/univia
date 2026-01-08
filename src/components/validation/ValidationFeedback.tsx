import { Box, FormHelperText, Typography, LinearProgress } from '@mui/material';
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

  return (
    <Box sx={{ mt: 1 }}>
      {shouldShowError && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Icon
            name="error"
            style={{
              fontSize: 18,
              color: '#EF4444',
              marginTop: '2px',
              flexShrink: 0,
            }}
          />
          <FormHelperText
            error
            sx={{
              fontSize: '0.75rem',
              lineHeight: 1.4,
              m: 0,
            }}
          >
            {error.message}
          </FormHelperText>
        </Box>
      )}

      {!shouldShowError && alwaysShowHelper && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Icon
            name="info"
            style={{
              fontSize: 18,
              color: '#3B82F6',
              marginTop: '2px',
              flexShrink: 0,
            }}
          />
          <FormHelperText
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.4,
              color: 'text.secondary',
              m: 0,
            }}
          >
            {alwaysShowHelper}
          </FormHelperText>
        </Box>
      )}

      {shouldShowSuccess && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon
            name="check_circle"
            style={{
              fontSize: 18,
              color: '#22C55E',
            }}
          />
          <FormHelperText
            sx={{
              color: '#22C55E',
              fontSize: '0.75rem',
              m: 0,
            }}
          >
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
                color:
                  percentageUsed > 90
                    ? '#EF4444'
                    : percentageUsed > 75
                      ? '#F97316'
                      : '#6B7280',
                fontWeight: 600,
              }}
            >
              {characterCount} / {maxLength}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentageUsed, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  percentageUsed > 90
                    ? '#EF4444'
                    : percentageUsed > 75
                      ? '#F97316'
                      : '#22C55E',
                borderRadius: 3,
              },
            }}
          />
        </>
      )}
    </Box>
  );
}
