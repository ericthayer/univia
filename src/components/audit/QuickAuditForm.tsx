import { useState, useRef } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';
import { ensureSession } from '../../services/session';
import { hasFailedDevice, LighthouseAuditError, requestLighthouseAudit } from '../../services/lighthouseAudit.service';
import { useFormValidation } from '../../hooks/useFormValidation';
import ValidationFeedback from '../validation/ValidationFeedback';
import { ArrowButton } from '../ui/ArrowButton/ArrowButton';
import { srOnly } from '../ui/srOnly';

export default function QuickAuditForm() {
  const navigate = useNavigate();
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;
  const urlIsValid = urlField.value.trim().length > 0 && !urlField.error;

  const handleReset = () => {
    setFieldValue('url', '');
    setApiError('');
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setApiError('Audit cancelled');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setLoading(true);

    try {
      if (urlField.error) {
        setApiError('Please fix validation errors before submitting');
        setLoading(false);
        return;
      }

      if (!urlField.value.trim()) {
        setApiError('Please enter a URL');
        setLoading(false);
        return;
      }

      const currentSession = await ensureSession();
      abortControllerRef.current = new AbortController();
      const result = await requestLighthouseAudit(urlField.value, currentSession?.access_token, abortControllerRef.current.signal);
      navigate(`/audit/${result.session_id}`, {
        state: { partialAudit: hasFailedDevice(result) },
      });
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        console.error('Audit error:', err);
        setApiError(err instanceof LighthouseAuditError ? err.message : 'Failed to run audit. Please try again.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} autoComplete="on" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {apiError && (
        <Alert severity={apiError.includes('cancelled') ? 'info' : 'error'} onClose={() => setApiError('')}>
          {apiError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 18rem', minWidth: 0 }}>
          <TextField
            fullWidth
            label="Website Address"
            placeholder="yoursite.com"
            value={urlField.value}
            autoComplete="url"
            onChange={(e) => {
              setFieldValue('url', e.target.value);
              validateFieldDebounced('url', e.target.value, 'url');
            }}
            onBlur={() => {
              validateFieldDebounced('url', urlField.value, 'url');
            }}
            disabled={loading}
            error={!!urlField.error}
            slotProps={{
              htmlInput: {
                maxLength: MAX_URL_LENGTH,
                inputMode: 'url',
                'aria-describedby': urlField.error ? 'url-error-text' : 'url-helper-text',
              },
            }}
            sx={{
              // The theme paints the field root with a square background; round it to match the pill outline.
              borderRadius: 999,
              '& .MuiOutlinedInput-root': { borderRadius: 999, minHeight: 44, pl: 2 },
            }}
          />
          {(urlField.error || (urlField.isDirty && urlField.isTouched && urlIsValid)) && (
            <ValidationFeedback
              error={urlField.error}
              isValid={urlIsValid}
              isDirty={urlField.isDirty}
              isTouched={urlField.isTouched}
              showCharacterCount={false}
              label="URL"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
          {loading ? (
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CircularProgress size={18} color="inherit" />}
              sx={{ borderRadius: 999, minHeight: 48, flexGrow: { xs: 1, sm: 0 } }}
            >
              Cancel
            </Button>
          ) : (
            <>
              <ArrowButton type="submit" disabled={!!urlField.error} sx={{ flexGrow: { xs: 1, sm: 0 } }}>
                Run Audit
              </ArrowButton>
              <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
                sx={{ borderRadius: 999, minHeight: 48, px: 3, flexGrow: { xs: 1, sm: 0 } }}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Box role="status" aria-live="polite" sx={srOnly}>
        {loading ? `Running audit for ${urlField.value}` : ''}
      </Box>
    </Box>
  );
}
