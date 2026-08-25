import { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ensureSession } from '../../services/session';
import { hasFailedDevice, LighthouseAuditError, requestLighthouseAudit } from '../../services/lighthouseAudit.service';
import { useFormValidation } from '../../hooks/useFormValidation';
import ValidationFeedback from '../validation/ValidationFeedback';
import Icon from '../ui/Icon';

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
    <Box component="form" onSubmit={handleSubmit} autoComplete="on">
      <Stack gap={3}>
        
        {apiError && (
          <Alert severity="error" onClose={() => setApiError('')}>
            {apiError}
          </Alert>
        )}

        <Stack direction="row" gap={3}>
          <Box sx={{ display: 'flex', flex: 1 }}>
            <TextField
              fullWidth
              label="Website Address"
              placeholder="yoursite.com"
              value={urlField.value}
              size="small"
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
                  'aria-label': 'Website URL to audit',
                  'aria-describedby': urlField.error ? 'url-error-text' : 'url-helper-text',
                },
              }}
              sx={{
                flex: 1,
                '.MuiInputBase-root': {
                  flex: 1
                }
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
  
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {!loading && (
              <>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !!urlField.error}
                  startIcon={<Icon name="search" />}
                  sx={{ flexGrow: { xs: 1, sm: 0 } }}
                >
                  Run Audit
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  disabled={loading}
                  sx={{ flexGrow: { xs: 1, sm: 0 } }}
                >
                  Clear
                </Button>
              </>
            )}
            {loading && (
              <Button
                type="button"
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CircularProgress size={20} />}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Stack>
        
      </Stack>
    </Box>
  );
}
