import type { SxProps, Theme } from '@mui/material/styles';

/** Same monospace well as the Selector block in `ViolationCard`. */
export const codeBlockSx: SxProps<Theme> = {
  display: 'block',
  m: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  bgcolor: 'action.hover',
  px: 1.5,
  py: 1,
  borderRadius: '10px',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};
