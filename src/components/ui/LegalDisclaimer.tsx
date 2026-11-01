import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import Icon from './Icon';

interface LegalDisclaimerProps {
  variant?: 'default' | 'compact' | 'banner';
  sx?: object;
}

interface DisclaimerBlockProps {
  title: string;
  /** Larger padding and icon for the long-form variants. */
  roomy?: boolean;
  sx?: object;
  children: ReactNode;
}

/**
 * Quiet, hairline-bordered block. The icon sits in a tinted nested circle;
 * the tint is the only color, so the block informs without shouting.
 */
function DisclaimerBlock({ title, roomy = false, sx, children }: DisclaimerBlockProps) {
  return (
    <Box
      role="note"
      sx={{
        p: roomy ? 3 : 2,
        borderRadius: (theme: Theme) => `${theme.surfaces?.coreRadius ?? 14}px`,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            fontSize: '1rem',
            color: 'text.primary',
            bgcolor: 'color-mix(in srgb, var(--mui-palette-warning-main) 16%, transparent)',
          }}
        >
          <Icon name="gavel" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" component="p" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default function LegalDisclaimer({ variant = 'default', sx }: LegalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <DisclaimerBlock title="Legal Disclaimer" sx={sx}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Univia is not a law firm and does not provide legal advice. This analysis is
          for informational purposes only and may contain errors. Results are AI-generated and
          should not be relied upon without consulting a licensed attorney.
        </Typography>
      </DisclaimerBlock>
    );
  }

  const longForm = (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
        <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Univia is not a law firm
        </Box>{' '}
        and does not provide legal advice. This
        analysis is for informational purposes only and may contain errors. The results are
        AI-generated and should not be relied upon without consulting a licensed attorney.
        Univia makes no warranties about the accuracy or completeness of this analysis.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        By using this service, you acknowledge that you understand these limitations and will
        seek professional legal counsel for any legal matters.
      </Typography>
    </>
  );

  if (variant === 'banner') {
    return (
      <DisclaimerBlock title="Important Legal Disclaimer" roomy sx={{ mb: 3, ...sx }}>
        {longForm}
      </DisclaimerBlock>
    );
  }

  return (
    <DisclaimerBlock title="Important Legal Disclaimer" roomy sx={sx}>
      {longForm}
    </DisclaimerBlock>
  );
}
