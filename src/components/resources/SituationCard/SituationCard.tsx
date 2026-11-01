import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SituationPath } from '../../../config/resourceLinks';
import Icon from '../../ui/Icon';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { TonePill } from '../../ui/TonePill/TonePill';
import { CONTROL_RADIUS, iconCircleSx } from '../resourceStyles';

export interface SituationCardProps {
  path: SituationPath;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/** Maps a situation to the Univia tool for step one and the professional for step two. */
export function SituationCard({ path, reveal }: SituationCardProps) {
  const titleId = `situation-${path.id}-title`;

  return (
    <BezelCard component="article" aria-labelledby={titleId} reveal={reveal} sx={{ height: '100%', gap: 2 }}>
      <Box aria-hidden="true" sx={iconCircleSx(44)}>
        <Icon name={path.icon} />
      </Box>
      <Box>
        <Typography id={titleId} variant="h6" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3, mb: 0.75 }}>
          {path.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {path.description}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" component="span">
          Then bring in
        </Typography>
        <TonePill variant="outline">{path.professional}</TonePill>
      </Box>
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <ArrowButton
          variant="outlined"
          component={RouterLink}
          to={path.action.to}
          fullWidth
          sx={{ borderRadius: CONTROL_RADIUS }}
        >
          {path.action.label}
        </ArrowButton>
      </Box>
    </BezelCard>
  );
}
