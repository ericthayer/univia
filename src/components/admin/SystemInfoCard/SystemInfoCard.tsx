import { Fragment, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';

export interface SystemInfoItem {
  label: string;
  value: ReactNode;
}

export interface SystemInfoCardProps {
  id: string;
  title: string;
  description?: string;
  items: SystemInfoItem[];
  reveal?: number;
}

/**
 * Read-only key/value card rendered as a definition list.
 */
export function SystemInfoCard({ id, title, description, items, reveal }: SystemInfoCardProps) {
  const headingId = `${id}-heading`;

  return (
    <BezelCard component="section" aria-labelledby={headingId} reveal={reveal}>
      <SectionHeader id={headingId} title={title} dense />
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2.5 }}>
          {description}
        </Typography>
      )}
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
          columnGap: 0,
          rowGap: 0,
        }}
      >
        {items.map((item, index) => {
          const rowSx = {
            py: 1.5,
            borderTop: index === 0 ? 0 : 1,
            borderColor: 'divider',
            m: 0,
          } as const;
          return (
            <Fragment key={item.label}>
              <Box component="dt" sx={{ ...rowSx, typography: 'body2', color: 'text.secondary' }}>
                {item.label}
              </Box>
              <Box
                component="dd"
                sx={{
                  ...rowSx,
                  typography: 'body2',
                  fontWeight: 600,
                  textAlign: 'right',
                  pl: 2,
                  overflowWrap: 'anywhere',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </Box>
            </Fragment>
          );
        })}
      </Box>
    </BezelCard>
  );
}

export default SystemInfoCard;
