import { Button } from '@mui/material';

export default function SkipToMain() {
  const handleSkipToMain = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Button
      href="#main-content"
      onClick={handleSkipToMain}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSkipToMain(e);
        }
      }}
      sx={{
        position: 'fixed',
        top: -100,
        left: 16,
        zIndex: 9999,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 600,
        px: 3,
        py: 1.5,
        '&:focus': {
          top: 16,
          outline: '3px solid',
          outlineColor: 'primary.dark',
          outlineOffset: 2,
        },
        '&:hover': {
          bgcolor: 'primary.dark',
        },
      }}
    >
      Skip to main content
    </Button>
  );
}
