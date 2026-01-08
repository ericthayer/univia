import { TextField, InputAdornment } from '@mui/material';
import { useState } from 'react';
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
    <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
      <TextField
        fullWidth
        placeholder="Ask anything"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search help center"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="search" style={{ color: 'inherit' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            fontSize: '1.1rem',
            '& fieldset': {
              borderColor: 'transparent',
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
        }}
      />
    </form>
  );
}
