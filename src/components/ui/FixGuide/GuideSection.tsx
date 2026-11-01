import { ReactNode, useId } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface GuideSectionProps {
  title: string;
  children: ReactNode;
}

/** One labeled block of the fix guide: eyebrow heading (h4) + content. */
export function GuideSection({ title, children }: GuideSectionProps) {
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ '& + &': { mt: 2.5 } }}>
      <Typography id={headingId} variant="eyebrow" component="h4" sx={{ display: 'block', mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
