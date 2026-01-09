import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import Icon from './Icon';

interface LegalDisclaimerProps {
  variant?: 'default' | 'compact' | 'banner';
  sx?: object;
}

export default function LegalDisclaimer({ variant = 'default', sx }: LegalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: 'warning.lighter',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'warning.light',
          ...sx,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Icon name="gavel" style={{ fontSize: 40, height: '1em', width: '2.5em', color: 'warning.main' }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Legal Disclaimer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Univia is not a law firm and does not provide legal advice. This analysis is
              for informational purposes only and may contain errors. Results are AI-generated and
              should not be relied upon without consulting a licensed attorney.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (variant === 'banner') {
    return (
      <Alert
        severity="warning"
        icon={<Icon name="gavel" style={{ fontSize: 22 }} />}
        sx={{
          mb: 3,
          border: '2px solid',
          borderColor: 'warning.main',
          '& .MuiAlert-message': { width: '100%' },
          ...sx,
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, mb: 1 }}>
          Important Legal Disclaimer
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
          <strong>Univia is not a law firm</strong> and does not provide legal advice. This
          analysis is for informational purposes only and may contain errors. The results are
          AI-generated and should not be relied upon without consulting a licensed attorney.
          Univia makes no warranties about the accuracy or completeness of this analysis.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          By using this service, you acknowledge that you understand these limitations and will
          seek professional legal counsel for any legal matters.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'warning.lighter',
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'warning.main',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="gavel" style={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Important Legal Disclaimer
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
            <strong>Univia is not a law firm</strong> and does not provide legal advice. This
            analysis is for informational purposes only and may contain errors. The results are
            AI-generated and should not be relied upon without consulting a licensed attorney.
            Univia makes no warranties about the accuracy or completeness of this analysis.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            By using this service, you acknowledge that you understand these limitations and will
            seek professional legal counsel for any legal matters.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
