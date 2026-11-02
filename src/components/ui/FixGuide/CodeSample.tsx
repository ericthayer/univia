import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { CodeExample } from '../../../config/fixGuides';
import { codeBlockSx } from './codeBlockSx';

interface CodeSampleProps {
  example: CodeExample;
}

function Sample({ label, code }: { label: string; code: string }) {
  return (
    <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
      <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
        {label}
      </Typography>
      <Box component="pre" sx={codeBlockSx}>
        <code>{code}</code>
      </Box>
    </Box>
  );
}

/** Before / after code pair. Side by side when the card is wide enough. */
export function CodeSample({ example }: CodeSampleProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: 'minmax(0, 1fr)',
          '@container (min-width: 44rem)': example.before ? { gridTemplateColumns: '1fr 1fr' } : {},
        }}
      >
        {example.before && <Sample label="Before" code={example.before} />}
        <Sample label={example.before ? 'After' : 'Example'} code={example.after} />
      </Box>
      {example.note && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {example.note}
        </Typography>
      )}
    </Box>
  );
}
