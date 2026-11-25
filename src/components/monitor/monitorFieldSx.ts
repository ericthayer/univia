import { controlRadius } from '../../theme/tokens';

/**
 * The theme paints the whole TextField root, which leaves a pale block behind
 * helper text. Paint only the input so helper text sits on the card.
 */
export const monitorFieldSx = {
  background: 'transparent',
  '& .MuiOutlinedInput-root': { borderRadius: controlRadius, bgcolor: 'background.default' },
} as const;
