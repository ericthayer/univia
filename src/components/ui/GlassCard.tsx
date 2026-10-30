import { Card, CardProps } from '@mui/material';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<CardProps, 'children'> {
  children: ReactNode;
  blur?: number;
}

/**
 * Frosted card for overlays and demos. Uses theme tokens so it holds up in both
 * color schemes; there is no outer drop shadow (see docs/specs/ui-refresh/SPEC.md §3.1).
 */
export default function GlassCard({ children, blur = 20, sx, ...props }: GlassCardProps) {
  return (
    <Card
      sx={{
        backgroundColor: 'color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent)',
        backdropFilter: `blur(${blur}px)`,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
