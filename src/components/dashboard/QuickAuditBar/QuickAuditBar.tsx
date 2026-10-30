import { FormEvent, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';
import Icon from '../../ui/Icon';
import { srOnly } from '../../ui/srOnly';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { ensureSession } from '../../../services/session';
import {
  hasFailedDevice,
  LighthouseAuditError,
  requestLighthouseAudit,
} from '../../../services/lighthouseAudit.service';

export interface QuickAuditBarProps {
  /** Opens the document analysis drawer. */
  onAnalyzeDocs: () => void;
}

const GENERIC_ERROR = 'Failed to run audit. Please try again.';

/**
 * Header actions for the signed-in dashboard: a pill URL field whose submit
 * button is seated inside the field, plus the "Analyze Docs" entry point.
 */
export function QuickAuditBar({ onAnalyzeDocs }: QuickAuditBarProps) {
  const navigate = useNavigate();
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const urlField = getFieldState('url');
  const showFieldError = Boolean(urlField.error) && (urlField.isDirty || urlField.isTouched);
  const canSubmit = Boolean(urlField.value.trim()) && !urlField.error && !loading;

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    // Lock the control before any await so a second submit cannot start a
    // second audit, and keep the session lookup inside the guarded block.
    setLoading(true);
    setError(null);

    try {
      const currentSession = await ensureSession();
      abortControllerRef.current = new AbortController();
      const result = await requestLighthouseAudit(
        urlField.value,
        currentSession?.access_token,
        abortControllerRef.current.signal
      );
      navigate(`/audit/${result.session_id}`, {
        state: { partialAudit: hasFailedDevice(result) },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Audit error:', err);
      setError(err instanceof LighthouseAuditError ? err.message : GENERIC_ERROR);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start', width: { xs: '100%', md: 'auto' } }}
    >
      <TextField
        size="small"
        placeholder="yoursite.com"
        value={urlField.value}
        autoComplete="url"
        inputMode="url"
        onChange={(e) => {
          if (error) setError(null);
          setFieldValue('url', e.target.value);
          validateFieldDebounced('url', e.target.value, 'url');
        }}
        onBlur={() => validateFieldDebounced('url', urlField.value, 'url')}
        disabled={loading}
        error={showFieldError}
        helperText={showFieldError ? urlField.error?.message : undefined}
        slotProps={{
          htmlInput: { 'aria-label': 'Website address to audit' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="language" style={{ fontSize: 18 }} aria-hidden />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  size="small"
                  aria-label="Run audit"
                  aria-busy={loading}
                  disabled={!canSubmit}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    transition: (theme) =>
                      `transform ${theme.transitions.duration.slow}ms ${theme.transitions.easing.spring}, background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
                    '&:hover': { bgcolor: 'primary.light', transform: 'translate(1px, -1px)' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon name="north_east" style={{ fontSize: 16 }} aria-hidden />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          flex: '1 1 16rem',
          minWidth: { xs: '100%', sm: 260 },
          bgcolor: 'transparent',
          '& .MuiOutlinedInput-root': {
            borderRadius: 999,
            bgcolor: 'background.default',
            pr: 0.75,
            minHeight: 44,
          },
        }}
      />
      <Button
        variant="outlined"
        onClick={onAnalyzeDocs}
        startIcon={<Icon name="upload_file" />}
        sx={{ borderRadius: 999, minHeight: 44, px: 2.5, flexShrink: 0 }}
      >
        Analyze Docs
      </Button>
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ flexBasis: '100%', borderRadius: 3, py: 0, alignItems: 'center' }}
        >
          {error}
        </Alert>
      )}
      <Box role="status" aria-live="polite" sx={srOnly}>
        {loading ? `Running audit for ${urlField.value}` : ''}
      </Box>
    </Box>
  );
}

export default QuickAuditBar;
