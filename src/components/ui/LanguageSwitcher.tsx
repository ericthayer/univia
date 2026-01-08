import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

interface LanguageSwitcherProps {
  size?: 'small' | 'medium';
}

export default function LanguageSwitcher({ size = 'medium' }: LanguageSwitcherProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese'];

  return (
    <>
      <Button
        onClick={handleLanguageClick}
        size={size}
        sx={{
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: 1,
          px: size === 'small' ? 1.5 : 2,
          py: size === 'small' ? 0.5 : 1,
          textTransform: 'none',
          color: 'text.primary',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <svg
          width={size === 'small' ? 16 : 18}
          height={size === 'small' ? 16 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {selectedLanguage}
        <svg
          width={size === 'small' ? 14 : 16}
          height={size === 'small' ? 14 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 150,
            },
          },
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language}
            selected={language === selectedLanguage}
            onClick={() => handleLanguageSelect(language)}
            sx={{
              py: 1,
              px: 2,
              fontSize: '0.875rem',
            }}
          >
            {language}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
