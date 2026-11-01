import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  titleComponent?: 'h1' | 'h2';
  /** DOM id for the title so sections can reference it with aria-labelledby. */
  titleId?: string;
}

/**
 * Consistent page header: eyebrow, title, description, and an actions slot that
 * sits on the right at wide widths and wraps below the copy on narrow ones.
 */
export function PageHeader({ eyebrow, title, description, actions, titleComponent = 'h1', titleId }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 3,
        mb: { xs: 4, md: 6 },
      }}
    >
      <Stack gap={1} sx={{ flex: '1 1 28rem', minWidth: 0, maxWidth: '64ch' }}>
        {eyebrow && <Typography variant="eyebrow">{eyebrow}</Typography>}
        <Typography
          id={titleId}
          variant="h2"
          component={titleComponent}
          sx={{ fontSize: 'clamp(1.75rem, 2.4cqw + 1rem, 2.375rem)', letterSpacing: '-0.025em', lineHeight: 1.15 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" component="div">
            {description}
          </Typography>
        )}
      </Stack>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>{actions}</Box>
      )}
    </Box>
  );
}

export default PageHeader;
