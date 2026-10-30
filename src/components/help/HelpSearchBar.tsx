import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Icon from '../ui/Icon';

interface HelpSearchBarProps {
  onSearch?: (query: string) => void;
}

export default function HelpSearchBar({ onSearch }: HelpSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} role="search" style={{ display: 'flex', width: '100%' }}>
      <TextField
        fullWidth
        type="search"
        placeholder="Ask anything"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          htmlInput: { 'aria-label': 'Search help center', enterKeyHint: 'search' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="search" style={{ fontSize: 20 }} aria-hidden />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  aria-label="Search"
                  disabled={!query.trim()}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    transition: (theme) =>
                      `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}, background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                    '&:hover': { bgcolor: 'primary.light', transform: 'translate(1px, -1px)' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
                  }}
                >
                  <Icon name="north_east" style={{ fontSize: 18 }} aria-hidden />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          maxWidth: 640,
          // The theme paints the field root with a square background; round it to match the pill outline.
          borderRadius: 999,
          '& .MuiOutlinedInput-root': {
            borderRadius: 999,
            minHeight: 56,
            pl: 2,
            pr: 1,
            fontSize: '1.0625rem',
          },
        }}
      />
    </form>
  );
}
