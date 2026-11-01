import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { HelpCategory } from '../../config/helpContent';
import { BezelCard } from '../ui/BezelCard/BezelCard';
import Icon from '../ui/Icon';

interface HelpCategoryCardProps {
  category: HelpCategory;
  onClick?: () => void;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

export default function HelpCategoryCard({ category, onClick, reveal }: HelpCategoryCardProps) {
  return (
    <BezelCard interactive padding="none" reveal={reveal} sx={{ height: '100%' }}>
      <ButtonBase
        onClick={onClick}
        aria-label={`View ${category.title} help articles`}
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          gap: 2,
          width: '100%',
          height: '100%',
          p: { xs: 2, sm: 3 },
          borderRadius: `${theme.surfaces.coreRadius}px`,
          '&.Mui-focusVisible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
        })}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: 'action.hover',
            color: 'text.primary',
            fontSize: '1.25rem',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            ...theme.applyStyles('dark', {
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }),
          })}
        >
          <Icon name={category.icon} />
        </Box>
        <Box>
          <Typography variant="h6" component="span" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
            {category.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
            {category.description}
          </Typography>
        </Box>
      </ButtonBase>
    </BezelCard>
  );
}
