import { FormEvent, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { monitorFieldSx } from '../monitorFieldSx';
import { controlRadius } from '../../../theme/tokens';

export interface MarkFixedFormProps {
  issueTitle: string;
  busy: boolean;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}

const NOTE_LIMIT = 1000;

/**
 * Inline form under an issue row. The note is optional and lands in the
 * issue's history, so the owner can say what changed.
 */
export function MarkFixedForm({ issueTitle, busy, onSubmit, onCancel }: MarkFixedFormProps) {
  const [note, setNote] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(note);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      aria-label={`Mark fixed: ${issueTitle}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      sx={{ display: 'grid', gap: 1.5, maxWidth: 560 }}
    >
      <TextField
        label="What did you change? (optional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        inputRef={fieldRef}
        helperText={`Saved in this issue's history. ${NOTE_LIMIT - note.length} characters left.`}
        multiline
        minRows={2}
        disabled={busy}
        slotProps={{ htmlInput: { maxLength: NOTE_LIMIT } }}
        sx={monitorFieldSx}
      />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button type="submit" variant="contained" disabled={busy} sx={{ borderRadius: controlRadius, minHeight: 44 }}>
          Mark fixed
        </Button>
        <Button onClick={onCancel} disabled={busy} sx={{ borderRadius: controlRadius, minHeight: 44 }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

export default MarkFixedForm;
