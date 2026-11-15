import { FormEvent, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import { createSite } from '../../../services/monitor.service';
import { MONITOR_PAGE_LIMIT, normalizeSiteOrigin, parsePageList } from '../../../utils/monitorUrls';
import { monitorFieldSx } from '../monitorFieldSx';

export interface AddSiteFormProps {
  onCreated: (siteId: string) => void;
}

interface FieldErrors {
  name?: string;
  address?: string;
  pages?: string;
}


/**
 * Adds the caller's site with up to 25 pages. The home page is always
 * included, so an empty page list still gives one page to scan.
 */
export function AddSiteForm({ onCreated }: AddSiteFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pages, setPages] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Give the site a name.';
    const origin = normalizeSiteOrigin(address);
    if (!origin.ok) next.address = origin.message;
    const list = origin.ok ? parsePageList(origin.origin, `/\n${pages}`) : { urls: [], errors: [] };
    if (list.errors.length) next.pages = list.errors.join(' ');

    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.address) return addressRef.current?.focus();
    if (next.pages || !origin.ok) return pagesRef.current?.focus();

    setSaving(true);
    const result = await createSite(name.trim(), origin.origin, list.urls);
    setSaving(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    onCreated(result.value);
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }} aria-describedby="add-site-help">
      <Typography id="add-site-help" variant="body2" color="text.secondary">
        We scan your home page plus any pages you list here, once a week. You can add or remove pages later.
      </Typography>
      {submitError && (
        <Alert severity="error" role="alert">
          {submitError}
        </Alert>
      )}
      <TextField
        label="Site name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        inputRef={nameRef}
        error={Boolean(errors.name)}
        helperText={errors.name}
        autoComplete="organization"
        required
        disabled={saving}
        slotProps={{ htmlInput: { maxLength: 120 } }}
        sx={monitorFieldSx}
      />
      <TextField
        label="Website address"
        placeholder="example.com"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        inputRef={addressRef}
        error={Boolean(errors.address)}
        helperText={errors.address ?? 'Use the secure (https) address.'}
        autoComplete="url"
        required
        disabled={saving}
        slotProps={{ htmlInput: { inputMode: 'url', maxLength: 261 } }}
        sx={monitorFieldSx}
      />
      <TextField
        label="More pages (optional)"
        placeholder={'/pricing\n/contact'}
        value={pages}
        onChange={(event) => setPages(event.target.value)}
        inputRef={pagesRef}
        error={Boolean(errors.pages)}
        helperText={errors.pages ?? `One per line, as a path or full address. Up to ${MONITOR_PAGE_LIMIT} pages including the home page.`}
        multiline
        minRows={4}
        disabled={saving}
        sx={monitorFieldSx}
      />
      <Box>
        <ArrowButton type="submit" disabled={saving}>
          {saving ? 'Adding site…' : 'Add site and start first scan'}
        </ArrowButton>
      </Box>
    </Box>
  );
}

export default AddSiteForm;
