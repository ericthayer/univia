import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface SectionHeaderProps {
  title: string;
  /** Count or short descriptor rendered beside the title. */
  meta?: ReactNode;
  /** Trailing control, usually a text link. */
  action?: ReactNode;
  component?: 'h2' | 'h3';
  id?: string;
  /** Tighten spacing when the header sits inside a card. */
  dense?: boolean;
}

/**
 * Section title row with optional meta and trailing action.
 */
export function SectionHeader({ title, meta, action, component = 'h2', id, dense = false }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: dense ? 2 : 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
        <Typography id={id} variant="h5" component={component} sx={{ letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        {meta !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {meta}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{action}</Box>}
    </Box>
  );
}

export default SectionHeader;
