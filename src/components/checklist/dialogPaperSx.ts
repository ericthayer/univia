import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Dialog surface for the refreshed pages: shell-radius corners, hairline
 * border, no drop shadow (the backdrop already separates the layer).
 */
export const dialogPaperSx: SxProps<Theme> = {
  borderRadius: (theme) => `${theme.surfaces.shellRadius}px`,
  boxShadow: 'none',
  border: '1px solid',
  borderColor: 'divider',
  backgroundImage: 'none',
};
