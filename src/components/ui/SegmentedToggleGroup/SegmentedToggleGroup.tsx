import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import { surfaceTokens } from '../../../theme/tokens';

const TRACK_PADDING = 4;

/**
 * Segmented control on the shared 16px control radius. A recessed track holds the buttons; the
 * selected one sits as a raised segment outlined by a hairline ring (no drop
 * shadow). Use with `exclusive` and `ToggleButton` children.
 */
export const SegmentedToggleGroup = styled(ToggleButtonGroup)(({ theme }) => {
  const standard = `${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`;

  return {
    backgroundColor: (theme.vars ?? theme).palette.action.hover,
    borderRadius: surfaceTokens.controlRadius,
    padding: TRACK_PADDING,
    gap: TRACK_PADDING,
    '& .MuiToggleButton-root': {
      border: 0,
      // Inner radius = track radius minus padding, so the curves stay concentric.
      borderRadius: `${surfaceTokens.controlRadius - TRACK_PADDING}px !important`,
      padding: '0 14px',
      minHeight: 36,
      gap: 6,
      fontSize: '0.8125rem',
      fontWeight: 600,
      textTransform: 'none',
      color: (theme.vars ?? theme).palette.text.secondary,
      transition: `background-color ${standard}, color ${standard}`,
      '&:hover': {
        color: (theme.vars ?? theme).palette.text.primary,
      },
      '&.Mui-selected, &.Mui-selected:hover': {
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
        color: (theme.vars ?? theme).palette.text.primary,
        boxShadow: `inset 0 0 0 1px ${(theme.vars ?? theme).palette.divider}`,
      },
      '&.Mui-disabled': {
        border: 0,
        opacity: 0.45,
      },
    },
  };
});

export default SegmentedToggleGroup;
