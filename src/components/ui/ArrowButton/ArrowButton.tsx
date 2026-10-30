import { forwardRef } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Icon from '../Icon';

export type ArrowButtonProps = Omit<ButtonProps, 'endIcon'>;

const Root = styled(Button)(({ theme }) => {
  const slow = `${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}`;
  return {
    borderRadius: 999,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    gap: theme.spacing(1.5),
    minHeight: 48,
    transition: `transform ${slow}, background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
    '&:active': {
      transform: 'scale(0.98)',
    },
    '& .ArrowButton-arrow': {
      width: 32,
      height: 32,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      fontSize: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      transition: `transform ${slow}`,
      ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
      }),
    },
    '&.MuiButton-outlined .ArrowButton-arrow, &.MuiButton-text .ArrowButton-arrow': {
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }),
    },
    '&:hover .ArrowButton-arrow': {
      transform: 'translate(2px, -1px) scale(1.05)',
    },
    '&.MuiButton-text': {
      textDecoration: 'none !important',
    },
  };
});

/**
 * Primary CTA pill with the trailing arrow seated in its own circle. The arrow
 * nudges diagonally on hover; the button settles on press.
 */
export const ArrowButton = forwardRef<HTMLButtonElement, ArrowButtonProps>(function ArrowButton(
  { children, variant = 'contained', ...props },
  ref
) {
  return (
    <Root ref={ref} variant={variant} {...props}>
      {children}
      <span className="ArrowButton-arrow" aria-hidden="true">
        <Icon name="north_east" />
      </span>
    </Root>
  );
});

export default ArrowButton;
