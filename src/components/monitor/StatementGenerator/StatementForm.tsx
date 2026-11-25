import { forwardRef, useImperativeHandle, useRef } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { ResponseDays, StatementStandard } from './buildStatement';
import type { StatementErrors, StatementFields } from './statementFields';
import { monitorFieldSx } from '../monitorFieldSx';

export interface StatementFormHandle {
  /** Focuses the first field that has an error. */
  focusFirstError: (errors: StatementErrors) => void;
}

export interface StatementFormProps {
  fields: StatementFields;
  errors: StatementErrors;
  onChange: (next: StatementFields) => void;
  /** False when no scan has completed, so there is nothing to list yet. */
  limitationsAvailable: boolean;
}

/**
 * The owner's answers for the statement. Controlled, so the preview updates
 * as they type; validation runs when they copy or download.
 */
export const StatementForm = forwardRef<StatementFormHandle, StatementFormProps>(function StatementForm(
  { fields, errors, onChange, limitationsAvailable },
  ref,
) {
  const organizationRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusFirstError: (next) => {
      if (next.organization) organizationRef.current?.focus();
      else if (next.contactEmail) emailRef.current?.focus();
    },
  }));

  const set = <K extends keyof StatementFields>(key: K, value: StatementFields[K]) => onChange({ ...fields, [key]: value });

  return (
    <Box component="form" noValidate onSubmit={(event) => event.preventDefault()} sx={{ display: 'grid', gap: 2.5 }}>
      <TextField
        label="Organization name"
        value={fields.organization}
        onChange={(event) => set('organization', event.target.value)}
        inputRef={organizationRef}
        error={Boolean(errors.organization)}
        helperText={errors.organization ?? 'As it should appear in the statement.'}
        autoComplete="organization"
        required
        fullWidth
        sx={monitorFieldSx}
      />
      <TextField
        label="Contact email"
        type="email"
        value={fields.contactEmail}
        onChange={(event) => set('contactEmail', event.target.value)}
        inputRef={emailRef}
        error={Boolean(errors.contactEmail)}
        helperText={errors.contactEmail ?? 'Where people report problems. This is published.'}
        autoComplete="email"
        inputMode="email"
        required
        fullWidth
        sx={monitorFieldSx}
      />
      <TextField
        label="Contact phone (optional)"
        type="tel"
        value={fields.contactPhone}
        onChange={(event) => set('contactPhone', event.target.value)}
        autoComplete="tel"
        fullWidth
        sx={monitorFieldSx}
      />
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' } }}>
        <TextField
          select
          label="Reply time"
          value={fields.responseDays}
          onChange={(event) => set('responseDays', Number(event.target.value) as ResponseDays)}
          fullWidth
          sx={monitorFieldSx}
        >
          <MenuItem value={2}>2 business days</MenuItem>
          <MenuItem value={5}>5 business days</MenuItem>
          <MenuItem value={10}>10 business days</MenuItem>
        </TextField>
        <TextField
          select
          label="Standard you aim for"
          value={fields.standard}
          onChange={(event) => set('standard', event.target.value as StatementStandard)}
          fullWidth
          sx={monitorFieldSx}
        >
          <MenuItem value="2.2">WCAG 2.2 Level AA</MenuItem>
          <MenuItem value="2.1">WCAG 2.1 Level AA</MenuItem>
        </TextField>
      </Box>
      <TextField
        label="Other things you do (optional)"
        value={fields.measures}
        onChange={(event) => set('measures', event.target.value)}
        helperText="For example: we test new pages with a keyboard and a screen reader before they go live."
        multiline
        minRows={3}
        fullWidth
        sx={monitorFieldSx}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={fields.includeLimitations && limitationsAvailable}
            onChange={(event) => set('includeLimitations', event.target.checked)}
            disabled={!limitationsAvailable}
          />
        }
        label={limitationsAvailable ? 'List known issues from the latest scan' : 'Known issues appear after the first scan completes'}
      />
    </Box>
  );
});
