import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderColor: 'divider',
        borderLeftWidth: 3,
        borderLeftColor: color || 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderLeftColor: color || 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" component="h2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: color || 'text.secondary', fontSize: '1.5rem' }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h2" component="p" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: 'clamp(2.875rem, 10cqw, 4.5rem)' }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: trend.isPositive ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
