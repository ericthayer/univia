import { Card, CardProps } from '@mui/material';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<CardProps, 'children'> {
  children: ReactNode;
  blur?: number;
}

export default function GlassCard({ children, blur = 20, sx, ...props }: GlassCardProps) {
  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: `blur(${blur}px)`,
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid divider',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
