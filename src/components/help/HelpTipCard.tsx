import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { HelpTip } from '../../config/helpContent';
import { BezelCard } from '../ui/BezelCard/BezelCard';
import Icon from '../ui/Icon';

interface HelpTipCardProps {
  tip: HelpTip;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

export default function HelpTipCard({ tip, reveal }: HelpTipCardProps) {
  return (
    <BezelCard component="article" reveal={reveal} sx={{ height: '100%', gap: 2 }}>
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
        <Icon name={tip.icon} />
      </Box>
      <Box>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
          {tip.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tip.description}
        </Typography>
      </Box>
      {tip.keyboardShortcut && (
        <Box
          component="kbd"
          sx={{
            alignSelf: 'flex-start',
            mt: 'auto',
            px: 1,
            py: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {tip.keyboardShortcut}
        </Box>
      )}
    </BezelCard>
  );
}
