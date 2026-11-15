import { forwardRef, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { srOnly } from '../../ui/srOnly';

export interface MonitorTableProps {
  /** Read by screen readers only; the visible heading sits outside the table. */
  caption: string;
  minWidth?: number;
  children: ReactNode;
}

const eyebrowSx = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  textAlign: 'left',
} as const;

/**
 * Native table shell matching the admin tables: hairline frame, eyebrow
 * headers, horizontal scroll on narrow screens. Callers supply thead/tbody.
 */
export const MonitorTable = forwardRef<HTMLDivElement, MonitorTableProps>(function MonitorTable(
  { caption, minWidth = 560, children },
  ref,
) {
  // Focusable, named scroll region so keyboard users can scroll the table on
  // narrow screens even when it has no controls (PlanLimitsCard pattern).
  return (
    <Box
      ref={ref}
      role="region"
      aria-label={caption}
      tabIndex={0}
      sx={{
        overflowX: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Box
        component="table"
        sx={{
          width: '100%',
          minWidth,
          borderCollapse: 'collapse',
          '& th, & td': { px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', verticalAlign: 'middle' },
          '& thead th': { ...eyebrowSx, bgcolor: 'action.hover', py: 1.25 },
          '& tbody th': { textAlign: 'left', fontWeight: 'inherit', minWidth: '12rem' },
          '& tbody tr:last-of-type > *': { borderBottom: 0 },
          '& .MonitorTable-num': { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
        }}
      >
        <Box component="caption" sx={srOnly}>
          {caption}
        </Box>
        {children}
      </Box>
    </Box>
  );
});

export default MonitorTable;
