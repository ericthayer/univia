import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { controlRadius } from '../../../theme/tokens';

export interface StatementActionsProps {
  /** Validates the form; returns false (and focuses the error) when invalid. */
  validate: () => boolean;
  getHtmlFragment: () => string;
  getHtmlDocument: () => string;
  getText: () => string;
  fileName: string;
  /** Changes whenever the draft changes, so a stale result message clears. */
  draftKey: string;
}

const buttonSx = { borderRadius: controlRadius } as const;

/**
 * Copy and download. Each action validates first, and its result is
 * announced politely.
 */
export function StatementActions({ validate, getHtmlFragment, getHtmlDocument, getText, fileName, draftKey }: StatementActionsProps) {
  const [status, setStatus] = useState('');
  const [statusKey, setStatusKey] = useState(draftKey);
  if (statusKey !== draftKey) {
    setStatusKey(draftKey);
    setStatus('');
  }

  const copy = async (value: () => string, what: string) => {
    if (!validate()) return setStatus('Fix the highlighted fields first.');
    try {
      await navigator.clipboard.writeText(value());
      setStatus(`${what} copied to the clipboard.`);
    } catch {
      setStatus('The browser blocked copying. Download the HTML file instead.');
    }
  };

  const download = () => {
    if (!validate()) return setStatus('Fix the highlighted fields first.');
    const url = URL.createObjectURL(new Blob([getHtmlDocument()], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${fileName}.`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button variant="contained" onClick={() => void copy(getHtmlFragment, 'HTML')} sx={buttonSx}>
          Copy HTML
        </Button>
        <Button variant="outlined" onClick={() => void copy(getText, 'Text')} sx={buttonSx}>
          Copy text
        </Button>
        <Button variant="outlined" onClick={download} sx={buttonSx}>
          Download HTML file
        </Button>
      </Box>
      <Typography role="status" aria-live="polite" variant="body2" color="text.secondary" sx={{ mt: 1.5, minHeight: '1.5em' }}>
        {status}
      </Typography>
    </Box>
  );
}
