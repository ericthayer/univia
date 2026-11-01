import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

/** Tinted icon well shared by the resources cards (matches HelpCategoryCard). */
export const iconCircleSx =
  (size: number) =>
  (theme: Theme): SystemStyleObject<Theme> => ({
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    bgcolor: 'action.hover',
    color: 'text.primary',
    fontSize: '1.25rem',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    ...theme.applyStyles('dark', { boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' }),
  });

export const autoGridSx = (min: string) =>
  ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))`,
    gap: 3,
    listStyle: 'none',
    m: 0,
    p: 0,
  }) as const;
