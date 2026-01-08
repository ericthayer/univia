import { Box } from '@mui/material';
import { useState, useCallback, memo, KeyboardEvent, useMemo } from 'react';

interface InteractiveAbbrProps {
  short: string;
  long: string;
  title?: string;
  variant?: 'inline' | 'block';
}

const InteractiveAbbr = memo(function InteractiveAbbr({
  short,
  long,
  title = long,
  variant = 'inline',
}: InteractiveAbbrProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(prev => !prev);
    }
  }, []);

  const sxStyles = useMemo(() => ({
    display: variant === 'block' ? 'inline-block' : 'inline',
    cursor: 'pointer',
    userSelect: 'none' as const,
    position: 'relative' as const,
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
      borderRadius: '2px',
    },
  }), [variant]);

  return (
    <Box
      component="abbr"
      title={title}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${short}: ${title}`}
      aria-expanded={isExpanded}
      sx={sxStyles}
    >
      {isExpanded ? long : short}
    </Box>
  );
});

export default InteractiveAbbr;
