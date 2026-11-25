/**
 * Visually hidden but available to assistive technology. Use for live regions
 * and supplementary labels; never for focusable content that must be seen.
 */
export const srOnly = {
  position: 'absolute',
  // Explicit px strings: in MUI `sx`, width/height of 1 mean 100% and a bare
  // margin number is a spacing multiple, which made "hidden" nodes full width.
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
