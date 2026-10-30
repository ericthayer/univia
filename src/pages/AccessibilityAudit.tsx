import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AccessibilityAudit as AuditType } from '../types';
import ComplianceGauge from '../components/ui/ComplianceGauge';
import AuditHistoryCard from '../components/audit/AuditHistoryCard';
import { useAuth } from '../contexts/AuthContext';
import { ensureSession } from '../services/session';
import { hasFailedDevice, LighthouseAuditError, requestLighthouseAudit } from '../services/lighthouseAudit.service';
import Icon from '../components/ui/Icon';
import { useFormValidation } from '../hooks/useFormValidation';
import ValidationFeedback from '../components/validation/ValidationFeedback';
import { PageCanvas } from '../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader/SectionHeader';
import { BezelCard } from '../components/ui/BezelCard/BezelCard';
import { ArrowButton } from '../components/ui/ArrowButton/ArrowButton';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { ScoreBar } from '../components/ui/ScoreBar/ScoreBar';

type AuditTab = 'history' | 'metrics' | 'checks';

const TABS: ReadonlyArray<{ value: AuditTab; label: string }> = [
  { value: 'history', label: 'Audit History' },
  { value: 'metrics', label: 'Performance Metrics' },
  { value: 'checks', label: 'What We Check' },
];

const CHECKS = [
  { icon: 'contrast', title: 'Color Contrast', description: 'Ensures text is readable for users with visual impairments' },
  { icon: 'keyboard', title: 'Keyboard Navigation', description: 'Verifies all interactive elements are keyboard accessible' },
  { icon: 'image', title: 'Alternative Text', description: 'Checks images have descriptive alt text for screen readers' },
  { icon: 'language', title: 'ARIA Labels', description: 'Validates proper semantic markup and ARIA attributes' },
  { icon: 'text_fields', title: 'Form Labels', description: 'Ensures form inputs have associated labels' },
  { icon: 'article', title: 'Document Structure', description: 'Reviews heading hierarchy and page structure' },
] as const;

const LATEST_SCORE_CATEGORIES = [
  { key: 'performance_score', title: 'Performance', subtitle: 'Speed & optimization' },
  { key: 'accessibility_score', title: 'Accessibility', subtitle: 'WCAG compliance' },
  { key: 'best_practices_score', title: 'Best Practices', subtitle: 'Code quality' },
  { key: 'seo_score', title: 'SEO', subtitle: 'Search optimization' },
] as const;

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

function parseTab(value: string | null): AuditTab {
  return TABS.some((tab) => tab.value === value) ? (value as AuditTab) : 'history';
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default function AccessibilityAudit() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [audits, setAudits] = useState<AuditType[]>([]);
  const [allAuditsForAverage, setAllAuditsForAverage] = useState<AuditType[]>([]);
  const [pinnedAuditIds, setPinnedAuditIds] = useState<Set<string>>(new Set());
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tabsSurfaceRef = useRef<HTMLDivElement | null>(null);

  const AUDITS_PER_PAGE = 6;
  const MAX_AUDITS_TO_LOAD = 30;

  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;

  const activeTab = parseTab(searchParams.get('tab'));
  const currentPage = parsePage(searchParams.get('page'));

  const updateParams = useCallback(
    (mutate: (next: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams]
  );

  const handleTabChange = (_: React.SyntheticEvent, value: AuditTab) => {
    updateParams((next) => {
      if (value === 'history') {
        next.delete('tab');
      } else {
        next.set('tab', value);
      }
      next.delete('page');
    });
  };

  const loadMetrics = useCallback(async () => {
    try {
      let query = supabase
        .from('accessibility_audits')
        .select('id, business_id, url_scanned, accessibility_score, performance_score, best_practices_score, seo_score, device_type, audit_session_id, created_at, user_id')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);

        query = query.limit(MAX_AUDITS_TO_LOAD * 2);

        const { data: pinnedData } = await supabase
          .from('pinned_audits')
          .select('audit_id')
          .eq('user_id', user.id);

        if (pinnedData) {
          setPinnedAuditIds(new Set(pinnedData.map(p => p.audit_id)));
        }
      } else {
        setAudits([]);
        setAllAuditsForAverage([]);
        return;
      }

      const { data: allAudits } = await query;

      const sessionMap = new Map<string, AuditType[]>();
      (allAudits || []).forEach(audit => {
        const sessionId = audit.audit_session_id || audit.id;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)!.push(audit);
      });

      const groupedAudits: AuditType[] = [];
      sessionMap.forEach(audits => {
        const desktopAudit = audits.find(a => a.device_type === 'desktop');
        if (desktopAudit) {
          groupedAudits.push(desktopAudit);
        } else if (audits.length > 0) {
          groupedAudits.push(audits[0]);
        }
      });

      const limitedAudits = groupedAudits.slice(0, MAX_AUDITS_TO_LOAD);
      setAudits(limitedAudits);
      setAllAuditsForAverage(allAudits || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setMetricsLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadMetrics();
    }
  }, [loadMetrics]);

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
        inputRef.current?.focus();
        return;
      }

      if (!urlField.value.trim()) {
        setApiError('Please enter a URL');
        setLoading(false);
        inputRef.current?.focus();
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

  const filteredAudits = audits.filter(audit =>
    audit.url_scanned.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAudits.length / AUDITS_PER_PAGE);
  const startIndex = (currentPage - 1) * AUDITS_PER_PAGE;
  const endIndex = startIndex + AUDITS_PER_PAGE;
  const paginatedAudits = filteredAudits.slice(startIndex, endIndex);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    updateParams((next) => {
      if (value <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(value));
      }
    }, true);
    tabsSurfaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchParams.has('page')) {
      updateParams((next) => next.delete('page'), true);
    }
  };

  const latestAudit = audits[0];
  const averageScores = useMemo(() => {
    if (allAuditsForAverage.length === 0) {
      return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    }
    const count = allAuditsForAverage.length;
    return {
      performance: Math.round(
        allAuditsForAverage.reduce((sum, a) => sum + (a.performance_score || 0), 0) / count
      ),
      accessibility: Math.round(
        allAuditsForAverage.reduce((sum, a) => sum + (a.accessibility_score || 0), 0) / count
      ),
      bestPractices: Math.round(
        allAuditsForAverage.reduce((sum, a) => sum + (a.best_practices_score || 0), 0) / count
      ),
      seo: Math.round(
        allAuditsForAverage.reduce((sum, a) => sum + (a.seo_score || 0), 0) / count
      ),
    };
  }, [allAuditsForAverage]);

  const iconCircleSx = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    color: 'text.primary',
    bgcolor: 'action.hover',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    fontSize: '1.25rem',
    ...theme.applyStyles('dark', {
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    }),
  } as const;

  const tabPanelId = (tab: AuditTab) => `audit-tabpanel-${tab}`;
  const tabId = (tab: AuditTab) => `audit-tab-${tab}`;

  return (
    <PageCanvas maxWidth="lg">
      <PageHeader
        eyebrow="Lighthouse"
        title="Web Accessibility Audit"
        titleComponent="h1"
        titleId="audit-page-title"
        description="Run audits, track performance metrics, and monitor WCAG compliance over time."
      />

      {/* Run Audit */}
      <BezelCard component="section" aria-labelledby="run-audit-title" sx={{ containerType: 'inline-size' }}>
        <SectionHeader id="run-audit-title" title="Run Audit" component="h2" dense />
        <Box component="form" onSubmit={handleSubmit} autoComplete="on" noValidate>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              inputRef={inputRef}
              label="Website Address"
              placeholder="yoursite.com"
              value={urlField.value}
              autoComplete="url"
              type="url"
              inputMode="url"
              onChange={(e) => {
                setFieldValue('url', e.target.value);
                validateFieldDebounced('url', e.target.value, 'url');
              }}
              onBlur={() => {
                validateFieldDebounced('url', urlField.value, 'url');
              }}
              disabled={loading}
              error={Boolean(urlField.error) && (urlField.isDirty || urlField.isTouched)}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 999, pl: 2 },
                '& .MuiInputLabel-root': { ml: 1 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="language" style={{ color: 'var(--mui-palette-text-secondary)' }} />
                  </InputAdornment>
                ),
                endAdornment: urlField.value && !loading ? (
                  <InputAdornment position="end">
                    <Button
                      onClick={handleReset}
                      sx={{
                        minWidth: 'auto',
                        width: 40,
                        height: 40,
                        p: 0,
                        borderRadius: '50%',
                        color: 'text.secondary',
                        textDecoration: 'none !important',
                        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                      }}
                      aria-label="Clear input"
                    >
                      <Icon name="close" style={{ fontSize: 20 }} />
                    </Button>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <ValidationFeedback
              error={urlField.error}
              isValid={!urlField.error}
              isDirty={urlField.isDirty}
              isTouched={urlField.isTouched}
              characterCount={urlField.value.length}
              maxLength={MAX_URL_LENGTH}
              showCharacterCount={false}
              label="URL"
              alwaysShowHelper={
                !urlField.value.trim()
                  ? 'Enter a website URL (e.g., example.com or https://example.com)'
                  : 'URL format: must be a valid website address'
              }
            />
          </Box>

          {apiError && (
            <Alert severity={apiError.includes('cancelled') ? 'info' : 'error'} sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Box component="span" role="status" aria-live="polite" sx={srOnly}>
            {loading ? `Running audit for ${urlField.value}` : ''}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {loading ? (
              <>
                <ArrowButton
                  disabled
                  aria-busy="true"
                  startIcon={<CircularProgress size={18} color="inherit" />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Running Audits...
                </ArrowButton>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleCancel}
                  startIcon={<Icon name="close" />}
                  sx={{ minWidth: 120, borderRadius: 999, width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <ArrowButton type="submit" startIcon={<Icon name="search" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                Run Audit
              </ArrowButton>
            )}
          </Box>
        </Box>
      </BezelCard>

      {/* Tabs surface */}
      <BezelCard
        ref={tabsSurfaceRef}
        component="section"
        aria-labelledby="audit-page-title"
        padding="none"
        reveal={1}
        sx={{ mt: { xs: 4, md: 6 }, overflow: 'hidden', scrollMarginTop: 88 }}
      >
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            aria-label="Audit sections"
            onChange={handleTabChange}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                id={tabId(tab.value)}
                aria-controls={tabPanelId(tab.value)}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'history' && (
            <Box
              role="tabpanel"
              id={tabPanelId('history')}
              aria-labelledby={tabId('history')}
              sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {metricsLoading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress aria-label="Loading audit history" />
                </Box>
              ) : audits.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="No Audit History"
                  description="Run your first accessibility audit to start building your audit history"
                />
              ) : (
                <>
                  <SectionHeader component="h3" dense title="Audit History" meta={`${filteredAudits.length} total`} />

                  {audits.length > 5 && (
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        pb: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by URL..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        inputProps={{ 'aria-label': 'Search audits by URL' }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Icon name="search" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  )}

                  {filteredAudits.length === 0 && searchQuery ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                      No audits match “{searchQuery}”
                    </Typography>
                  ) : (
                    <Box
                      component="ul"
                      sx={{
                        listStyle: 'none',
                        m: 0,
                        p: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      {paginatedAudits.map((audit) => (
                        <AuditHistoryCard
                          key={audit.id}
                          audit={audit}
                          isPinned={pinnedAuditIds.has(audit.id)}
                          onPinToggle={loadMetrics}
                        />
                      ))}
                    </Box>
                  )}

                  {totalPages > 1 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 'auto',
                        pt: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Pagination
                        count={totalPages}
                        page={Math.min(currentPage, totalPages)}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {activeTab === 'metrics' && (
            <Box role="tabpanel" id={tabPanelId('metrics')} aria-labelledby={tabId('metrics')}>
              {metricsLoading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress aria-label="Loading performance metrics" />
                </Box>
              ) : audits.length === 0 ? (
                <EmptyState
                  icon="analytics"
                  title="No Metrics Available"
                  description="Run your first accessibility audit to start tracking performance metrics"
                />
              ) : (
                <Stack gap={5}>
                  <Box>
                    <SectionHeader component="h3" dense title="Latest Audit Scores" />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))',
                        gap: 3,
                      }}
                    >
                      {LATEST_SCORE_CATEGORIES.map((category) => (
                        <Box key={category.key} sx={{ textAlign: 'center' }}>
                          <ComplianceGauge score={latestAudit?.[category.key] || 0} size={120} label="" />
                          <Typography variant="subtitle1" sx={{ mt: 1.5, fontWeight: 600, lineHeight: 1.3 }}>
                            {category.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {category.subtitle}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <SectionHeader
                      component="h3"
                      dense
                      title="Average Scores"
                      meta={`Last ${allAuditsForAverage.length} audits`}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                        columnGap: 4,
                        rowGap: 3,
                      }}
                    >
                      <ScoreBar label="Performance" value={averageScores.performance} />
                      <ScoreBar label="Accessibility" value={averageScores.accessibility} />
                      <ScoreBar label="Best Practices" value={averageScores.bestPractices} />
                      <ScoreBar label="SEO" value={averageScores.seo} />
                    </Box>
                  </Box>
                </Stack>
              )}
            </Box>
          )}

          {activeTab === 'checks' && (
            <Box role="tabpanel" id={tabPanelId('checks')} aria-labelledby={tabId('checks')}>
              <SectionHeader component="h3" dense title="What We Check" />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '72ch' }}>
                Powered by <a href="https://developer.chrome.com/docs/lighthouse/"><strong>Google Lighthouse</strong></a>, our audits use the same trusted open-source tool that developers and organizations worldwide rely on to measure website quality. Lighthouse scans your website and provides detailed insights on accessibility, performance, best practices, and SEO—giving you actionable recommendations to improve user experience and compliance.
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                }}
              >
                {CHECKS.map((item) => (
                  <Box component="li" key={item.title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box aria-hidden="true" sx={iconCircleSx}>
                      <Icon name={item.icon} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </BezelCard>
    </PageCanvas>
  );
}
