import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Grid,
  InputAdornment,
  Stack,
  Pagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AccessibilityAudit as AuditType } from '../types';
import ComplianceGauge from '../components/ui/ComplianceGauge';
import AuditHistoryCard from '../components/audit/AuditHistoryCard';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/ui/Icon';
import { useFormValidation } from '../hooks/useFormValidation';
import ValidationFeedback from '../components/validation/ValidationFeedback';

export default function AccessibilityAudit() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [audits, setAudits] = useState<AuditType[]>([]);
  const [pinnedAuditIds, setPinnedAuditIds] = useState<Set<string>>(new Set());
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const AUDITS_PER_PAGE = 6;
  const MAX_AUDITS_TO_LOAD = 30;

  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;

  useEffect(() => {
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadMetrics();
    }
  }, [user]);

  const loadMetrics = async () => {
    try {
      let query = supabase
        .from('accessibility_audits')
        .select('id, url_scanned, accessibility_score, performance_score, best_practices_score, seo_score, device_type, audit_session_id, created_at, user_id')
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
        query = query.is('user_id', null).limit(MAX_AUDITS_TO_LOAD * 2);
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
  };

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

  const [allAuditsForAverage, setAllAuditsForAverage] = useState<AuditType[]>([]);

  const filteredAudits = audits.filter(audit =>
    audit.url_scanned.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAudits.length / AUDITS_PER_PAGE);
  const startIndex = (currentPage - 1) * AUDITS_PER_PAGE;
  const endIndex = startIndex + AUDITS_PER_PAGE;
  const paginatedAudits = filteredAudits.slice(startIndex, endIndex);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 340, behavior: 'smooth' });
  };

  const latestAudit = audits[0];
  const averageScores = allAuditsForAverage.length > 0
    ? {
        performance: Math.round(
          allAuditsForAverage.reduce((sum, a) => sum + (a.performance_score || 0), 0) / allAuditsForAverage.length
        ),
        accessibility: Math.round(
          allAuditsForAverage.reduce((sum, a) => sum + (a.accessibility_score || 0), 0) / allAuditsForAverage.length
        ),
        bestPractices: Math.round(
          allAuditsForAverage.reduce((sum, a) => sum + (a.best_practices_score || 0), 0) / allAuditsForAverage.length
        ),
        seo: Math.round(
          allAuditsForAverage.reduce((sum, a) => sum + (a.seo_score || 0), 0) / allAuditsForAverage.length
        ),
      }
    : { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };

  return (
    <Stack sx={{ py: 6, flex: 1 }}>
      <Container maxWidth="md" sx={{ pt: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Audit Intro Section */}
        <Stack gap={1} sx={{ mb: 3 }}>
          <Typography variant="h3" component="h2">
            Web Accessibility Audit
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Run audits, track performance metrics, and monitor WCAG compliance over time.
          </Typography>          
        </Stack>

        <Card sx={{ mb: 4, containerType: 'inline-size' }}>
          <CardContent sx={{ pt: 3, px: 4, pb: 'calc(4 * var(--mui-spacing)) !important' }}>
            <Stack gap={3}>
              <Typography variant="h5" component="h2">Run Audit</Typography>
              <Box component="form" onSubmit={handleSubmit} autoComplete="on">
                <Box sx={{ mb: 3 }}>
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
                    error={Boolean(urlField.error) && (urlField.isDirty || urlField.isTouched)}
                    InputProps={{
                      startAdornment: (
                        <Icon name="language" style={{ marginRight: 8, color: 'var(--mui-palette-grey-500)' }} />
                      ),
                      endAdornment: urlField.value && !loading ? (
                        <InputAdornment position="end">
                          <Button
                            onClick={handleReset}
                            sx={{
                              minWidth: 'auto',
                              p: 0.5,
                              color: 'text.secondary',
                              '&:hover': { color: 'text.primary' },
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

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {loading ? (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled
                        startIcon={<CircularProgress size={20} color="inherit" />}
                      >
                        Running Audits...
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleCancel}
                        startIcon={<Icon name="close" />}
                        sx={{ minWidth: 120 }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<Icon name="search" />}
                    >
                      Run Audit
                    </Button>
                  )}
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {!user && audits.length > 0 && (
          <Alert
            severity="info"
            icon={<Icon name="workspace_premium" />}
            sx={{ display: 'none', mb: 4 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/pricing')}>
                Sign Up Free
              </Button>
            }
          >
            Sign up for free to save up to 20 audits, pin important results, and track your progress over time!
          </Alert>
        )}

        <Card sx={{ mb: 0, borderBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            aria-label="scrollable force tabs example"
            onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Audit History" />
            <Tab label="Performance Metrics" />
            <Tab label="What We Check" />
          </Tabs>
        </Card>

        {activeTab === 1 && (
          <>
            {metricsLoading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress />
              </Box>
            ) : audits.length === 0 ? (
              <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Icon name="analytics" style={{ fontSize: 40, color: '#94A3B8' }} />
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    No Metrics Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Run your first accessibility audit to start tracking performance metrics
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card sx={{ borderRadius: 0, pb: 1 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                      Latest Audit Scores
                    </Typography>
                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ComplianceGauge
                            score={latestAudit?.performance_score || 0}
                            size={160}
                            label=""
                          />
                          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                            Performance
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Speed & optimization
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ComplianceGauge
                            score={latestAudit?.accessibility_score || 0}
                            size={160}
                            label=""
                          />
                          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                            Accessibility
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            WCAG compliance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ComplianceGauge
                            score={latestAudit?.best_practices_score || 0}
                            size={160}
                            label=""
                          />
                          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                            Best Practices
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Code quality
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ComplianceGauge
                            score={latestAudit?.seo_score || 0}
                            size={160}
                            label=""
                          />
                          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                            SEO
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Search optimization
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ mb: 4, borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <CardContent sx={{ p: 4, flex: 1 }}>
                    <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
                      Average Scores (Last {allAuditsForAverage.length} Audits)
                    </Typography>
                    <Grid container spacing={{ xs: 0, md: 4 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Performance
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {averageScores.performance}/100
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={averageScores.performance}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Accessibility
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {averageScores.accessibility}/100
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={averageScores.accessibility}
                            color="success"
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Best Practices
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {averageScores.bestPractices}/100
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={averageScores.bestPractices}
                            color="warning"
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              SEO
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                              {averageScores.seo}/100
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={averageScores.seo}
                            color="secondary"
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {activeTab === 0 && (
          <>
            {metricsLoading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress />
              </Box>
            ) : audits.length === 0 ? (
              <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, flex: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 8, flex: 1 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <Icon name="history" style={{ fontSize: 40, color: '#94A3B8' }} />
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    No Audit History
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Run your first accessibility audit to start building your audit history
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h5" component="h2">
                      Audit History
                    </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total: {filteredAudits.length}
                      </Typography>
                  </Stack>

                  {audits.length > 5 && (
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        pb: { xs: 0, tiny: 2 },
                        mb: 2,
                      }}
                    >
                      <TextField
                        fullWidth
                        placeholder="Search by URL..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Icon name="search" />
                            </InputAdornment>
                          ),
                        }}
                      />

                       {totalPages > 1 && (
                        <Box sx={{ display: { xs: 'flex', tiny: 'none' }, justifyContent: 'space-evenly', mt: 2 }}>
                          <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            size="small"
                            showFirstButton
                            showLastButton
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                  

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {filteredAudits.length === 0 && searchQuery && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                        No audits found matching "{searchQuery}"
                      </Typography>
                    )}

                    {paginatedAudits.map((audit) => (
                import AuditHistoryCard from '../components/audit/AuditHistoryCard';
                      <AuditHistoryCard
                        key={audit.id}
                        audit={audit}
                        isPinned={pinnedAuditIds.has(audit.id)}
                        onPinToggle={loadMetrics}
                      />
                    ))}
                  </Box>

                  {totalPages > 1 && audits.length > 5 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 2 && (
          <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                What We Check
              </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Powered by <a href="https://developer.chrome.com/docs/lighthouse/"><strong>Google Lighthouse</strong></a>, our audits use the same trusted open-source tool that developers and organizations worldwide rely on to measure website quality. Lighthouse scans your website and provides detailed insights on accessibility, performance, best practices, and SEO—giving you actionable recommendations to improve user experience and compliance.
          </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { icon: 'contrast', title: 'Color Contrast', description: 'Ensures text is readable for users with visual impairments' },
                  { icon: 'keyboard', title: 'Keyboard Navigation', description: 'Verifies all interactive elements are keyboard accessible' },
                  { icon: 'image', title: 'Alternative Text', description: 'Checks images have descriptive alt text for screen readers' },
                  { icon: 'language', title: 'ARIA Labels', description: 'Validates proper semantic markup and ARIA attributes' },
                  { icon: 'text_fields', title: 'Form Labels', description: 'Ensures form inputs have associated labels' },
                  { icon: 'article', title: 'Document Structure', description: 'Reviews heading hierarchy and page structure' },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={item.icon} style={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Stack>
  );
}
