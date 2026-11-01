import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReferenceLink } from '../../../config/resourceLinks';
import Icon from '../../ui/Icon';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { srOnly } from '../../ui/srOnly';
import { iconCircleSx } from '../resourceStyles';

export interface ReferenceLinkCardProps {
  link: ReferenceLink;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/** A whole-card external link to a trusted public reference. Opens in a new tab. */
export function ReferenceLinkCard({ link, reveal }: ReferenceLinkCardProps) {
  return (
    <BezelCard interactive padding="none" reveal={reveal} sx={{ height: '100%' }}>
      <Box
        component="a"
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          height: '100%',
          p: { xs: 2, sm: 2.5 },
          color: 'text.primary',
          textDecoration: 'none',
          borderRadius: `${theme.surfaces.coreRadius}px`,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
          '&:hover .ReferenceLinkCard-arrow': { transform: 'translate(2px, -1px)', color: 'text.primary' },
        })}
      >
        <Box aria-hidden="true" sx={iconCircleSx(40)}>
          <Icon name={link.icon} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="eyebrow" component="span" sx={{ display: 'block', mb: 0.5 }}>
            {link.publisher}
          </Typography>
          <Typography component="span" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.35, mb: 0.5 }}>
            {link.title}
            <Box component="span" sx={srOnly}>
              {' (opens in a new tab)'}
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
            {link.description}
          </Typography>
        </Box>
        <Box
          className="ReferenceLinkCard-arrow"
          aria-hidden="true"
          sx={(theme) => ({
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            color: 'text.secondary',
            fontSize: '1.125rem',
            transition: `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}, color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          })}
        >
          <Icon name="north_east" />
        </Box>
      </Box>
    </BezelCard>
  );
}
