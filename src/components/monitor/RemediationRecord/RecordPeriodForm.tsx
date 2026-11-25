import { FormEvent, useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { monitorFieldSx } from '../monitorFieldSx';
import { defaultPeriod, parsePeriod } from './recordPeriod';

export interface RecordPeriodFormProps {
  busy: boolean;
  onSubmit: (start: Date, end: Date) => void;
}

/** Picks whole days for a record. Validation mirrors the server's rules. */
export function RecordPeriodForm({ busy, onSubmit }: RecordPeriodFormProps) {
  const initial = defaultPeriod();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [error, setError] = useState<string | null>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const errorId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const period = parsePeriod(from, to);
    if (!period.ok) {
      setError(period.message);
      fromRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit(period.start, period.end);
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} aria-describedby={helpId} sx={{ display: 'grid', gap: 2.5 }}>
      <Typography id={helpId} variant="body2" color="text.secondary">
        The record lists the scans that finished in this period, the issues they found, and the fixes you marked and scans
        confirmed. It saves a fingerprint of that history so anyone with the record can check it later.
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' } }}>
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          inputRef={fromRef}
          required
          error={!!error}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-describedby': error ? errorId : undefined } }}
          sx={monitorFieldSx}
        />
        <TextField
          label="To"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          required
          error={!!error}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-describedby': error ? errorId : undefined } }}
          sx={monitorFieldSx}
        />
      </Box>
      {error && (
        <Typography id={errorId} role="alert" variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Box>
        <ArrowButton type="submit" disabled={busy}>
          {busy ? 'Creating record…' : 'Create record (PDF)'}
        </ArrowButton>
      </Box>
    </Box>
  );
}

export default RecordPeriodForm;
