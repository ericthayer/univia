import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';

/**
 * Pill-shaped segmented control. A recessed track holds the buttons; the
 * selected one sits as a raised segment outlined by a hairline ring (no drop
 * shadow). Use with `exclusive` and `ToggleButton` children.
 */
export const SegmentedToggleGroup = styled(ToggleButtonGroup)(({ theme }) => {
  const standard = `${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`;

  return {
    backgroundColor: (theme.vars ?? theme).palette.action.hover,
    borderRadius: 999,
    padding: 4,
    gap: 4,
    '& .MuiToggleButton-root': {
      border: 0,
      borderRadius: '999px !important',
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
