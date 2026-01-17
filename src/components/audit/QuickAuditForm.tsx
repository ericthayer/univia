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
import { useAuth } from '../../contexts/AuthContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import ValidationFeedback from '../validation/ValidationFeedback';
import Icon from '../ui/Icon';

export default function QuickAuditForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;

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

      const fullUrl = urlField.value.startsWith('http') ? urlField.value : `https://${urlField.value}`;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-lighthouse-audit`;

      abortControllerRef.current = new AbortController();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl, user_id: user?.id || null }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to run audit');
      }

      const result = await response.json();

      if (result.session_id) {
        navigate(`/audit/${result.session_id}`);
      }
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        console.error('Audit error:', err);
        setApiError('Failed to run audit. Please try again.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} autoComplete="on">
      <Stack gap={3}>
        <Box>
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
                'aria-label': 'Website URL to audit',
                'aria-describedby': urlField.error ? 'url-error-text' : 'url-helper-text',
              },
            }}
          />
          {(urlField.error || urlField.success) && (
            <ValidationFeedback
              error={urlField.error}
              success={urlField.success}
              fieldId="url"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {!loading && (
            <>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !!urlField.error}
                startIcon={<Icon name="search" />}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Run Audit
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="large"
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
              size="large"
              onClick={handleCancel}
              startIcon={<CircularProgress size={20} />}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Cancel
            </Button>
          )}
        </Box>
        
        {apiError && (
          <Alert severity="error" onClose={() => setApiError('')}>
            {apiError}
          </Alert>
        )}
        
      </Stack>
    </Box>
  );
}
