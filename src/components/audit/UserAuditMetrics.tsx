import { Box, Card, CardContent, Container, Grid, Stack, Typography, Button, LinearProgress, Alert, TextField, InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import ComplianceGauge from '../ui/ComplianceGauge';
import AuditHistoryCard from './AuditHistoryCard';
import StatCard from '../ui/StatCard';
import Icon from '../ui/Icon';
import { useUserAudits } from '../../hooks/useUserAudits';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useAuth } from '../../contexts/AuthContext';
import DocumentUploadDrawer from '../documents/DocumentUploadDrawer';

interface UserAuditMetricsProps {
  /**
   * The user ID to fetch audits for
   */
  userId?: string;
  /**
   * Maximum number of audits to fetch (defaults to 50)
   */
  limit?: number;
  /**
   * Whether to enable fetching (defaults to true)
   */
  enabled?: boolean;
  /**
   * Whether to show the container and full width styling
   */
  fullWidth?: boolean;
  /**
   * Callback when user navigates to run an audit
   */
  onAuditClick?: () => void;
}

/**
 * UserAuditMetrics Component
 *
 * Displays audit metrics for the signed-in user's dashboard including:
 * - Latest audit score with compliance gauge
 * - Average performance across all audits
 * - Total audit count
 * - Call-to-action for running new audits
 *
 * The component is self-contained, responsive, and handles loading/error states.
 *
 * @example
 * ```tsx
 * import UserAuditMetrics from '@/components/audit/UserAuditMetrics';
 *
 * // Basic usage
 * <UserAuditMetrics userId={currentUser.id} />
 *
 * // With custom configuration
 * <UserAuditMetrics
 *   userId={currentUser.id}
 *   limit={20}
 *   onAuditClick={() => navigate('/audit')}
 * />
 * ```
 */
export default function UserAuditMetrics({
  userId,
  limit = 50,
  enabled = true,
  fullWidth = true,
  onAuditClick,
}: UserAuditMetricsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { metrics, loading, error, refetch } = useUserAudits({
    userId,
    limit,
    enabled,
  });
  const [pinnedAuditIds, setPinnedAuditIds] = useState<Set<string>>(new Set());
  const [auditLoading, setAuditLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;

  // Fetch pinned audits
  useEffect(() => {
    if (!userId || !enabled) return;

    const fetchPinnedAudits = async () => {
      const { data } = await supabase
        .from('pinned_audits')
        .select('audit_id')
        .eq('user_id', userId);

      if (data) {
        setPinnedAuditIds(new Set(data.map(p => p.audit_id)));
      }
    };

    fetchPinnedAudits();
  }, [userId, enabled]);

  const handleAuditClick = () => {
    if (onAuditClick) {
      onAuditClick();
    } else {
      navigate('/audit');
    }
  };

  const handleQuickAudit = async () => {
    if (!urlField.value.trim() || urlField.error || auditLoading) return;

    setAuditLoading(true);

    try {
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
      }
    } finally {
      setAuditLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAudit();
    }
  };

  const handlePinToggle = async () => {
    // Refetch pinned audits after toggle
    if (!userId) return;

    const { data } = await supabase
      .from('pinned_audits')
      .select('audit_id')
      .eq('user_id', userId);

    if (data) {
      setPinnedAuditIds(new Set(data.map(p => p.audit_id)));
    }
  };

  const containerProps = fullWidth
    ? {}
    : {
        maxWidth: 'lg',
      };

  return (
    <Box
      component="section"
      aria-label="Audit metrics dashboard"
      sx={{
        ...(fullWidth && {
          bgcolor: 'background.paper',
          borderBottom: '1px solid var(--mui-palette-divider)',
        }),
      }}
    >
      <Container {...containerProps} sx={{ p: '0 !important' }}>
        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Failed to load audit metrics: {error}
          </Alert>
        )}


        <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="space-between" columnGap={3} rowGap={2} sx={{ mb: 2 }}>

          {/* Header */}
          <Typography
            variant="h3"
            component="h2"
          >
            Your Audit Performance
          </Typography>

          {/* Quick Actions */}
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="yoursite.com"
              value={urlField.value}
              onChange={(e) => {
                setFieldValue('url', e.target.value);
                validateFieldDebounced('url', e.target.value, 'url');
              }}
              onKeyPress={handleKeyPress}
              disabled={auditLoading}
              error={!!urlField.error}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="language" style={{ fontSize: 20, color: 'var(--mui-palette-text-secondary)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleQuickAudit}
                      disabled={auditLoading || !urlField.value.trim() || !!urlField.error}
                      size="small"
                      aria-label="Run audit"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Icon name="search" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={() => setDrawerOpen(true)}
              sx={{
                bgcolor: 'grey.900',
                color: 'common.white',
                '&:hover': {
                  bgcolor: 'grey.800',
                },
              }}
            >
              Analyze Docs
            </Button>
          </Stack>

        </Stack>

        <DocumentUploadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        {/* Main Metrics Grid */}
        <Grid container spacing={3} sx={{ containerType: 'inline-size', py: 4 }}>
          {/* Latest Audit Score */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              sx={{
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, flexGrow: 1 }}>
                {loading ? (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Loading metrics...
                    </Typography>
                    <LinearProgress sx={{ mb: 2 }} />
                  </Box>
                ) : metrics.latestAudit ? (
                  <>
                    <ComplianceGauge
                      score={metrics.latestAudit.accessibility_score || 0}
                      size={180}
                      label="Latest Audit Score"
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, textAlign: 'center' }}
                    >
                      {new Date(metrics.latestAudit.created_at).toLocaleDateString()}
                    </Typography>
                  </>
                ) : (
                  <Stack sx={{ width: '100%', alignItems: 'center' }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                      No audits yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                      Start by running your first audit to see your compliance score
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleAuditClick}
                      startIcon={<Icon name="add" />}
                    >
                      Run First Audit
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Stat Cards */}
          <Grid size={{ xs: 12, md: 6, lg: 8 }}>
            <Grid container spacing={3}>
              {/* Total Audits */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatCard
                  title="Total Audits"
                  value={loading ? '...' : metrics.totalAudits}
                  subtitle={metrics.totalAudits > 0 ? 'Audits completed' : 'No audits yet'}
                  color="primary.main"
                  icon={<Icon name="assessment" />}
                />
              </Grid>

              {/* Average Accessibility Score */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatCard
                  title="Avg Accessibility"
                  value={loading ? '...' : `${metrics.averageScores.accessibility}%`}
                  subtitle="Across all audits"
                  color="success.main"
                  icon={<Icon name="accessibility_new" />}
                />
              </Grid>

              {/* Average Performance Score */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatCard
                  title="Avg Performance"
                  value={loading ? '...' : `${metrics.averageScores.performance}%`}
                  subtitle="Website speed & efficiency"
                  color="info.main"
                  icon={<Icon name="speed" />}
                />
              </Grid>

              {/* Average Best Practices Score */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatCard
                  title="Avg Best Practices"
                  value={loading ? '...' : `${metrics.averageScores.bestPractices}%`}
                  subtitle="Code quality & standards"
                  color="warning.main"
                  icon={<Icon name="verified_user" />}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Audit History */}
        {!loading && metrics.allAudits.length > 0 && (
          <Box sx={{ py: 6 }}>
            <Typography variant="h5" component="h3" sx={{ mb: 3 }}>
              Recent Audits
            </Typography>
            <Stack spacing={2}>
              {metrics.allAudits
                .sort((a, b) => {
                  // Show pinned audits first
                  const aIsPinned = pinnedAuditIds.has(a.id);
                  const bIsPinned = pinnedAuditIds.has(b.id);
                  if (aIsPinned && !bIsPinned) return -1;
                  if (!aIsPinned && bIsPinned) return 1;
                  // Then sort by date (most recent first)
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .slice(0, 10)
                .map(audit => (
                  <AuditHistoryCard
                    key={audit.id}
                    audit={audit}
                    isPinned={pinnedAuditIds.has(audit.id)}
                    onPinToggle={handlePinToggle}
                  />
                ))}
            </Stack>
          </Box>
        )}

        {/* Average Scores Breakdown */}
        {!loading && metrics.totalAudits > 0 && (
          <Box sx={{ py: 3 }}>
            <Typography variant="h5" component="h3" sx={{ mb: 3 }}>
              Score Breakdown
            </Typography>

            {/* Overall Averages */}
            <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon name="analytics" style={{ fontSize: 20 }} />
              Overall ({metrics.totalAudits} audits)
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Accessibility
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {metrics.averageScores.accessibility}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.averageScores.accessibility}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'action.disabled',
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Performance
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {metrics.averageScores.performance}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.averageScores.performance}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'action.disabled',
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Best Practices
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {metrics.averageScores.bestPractices}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.averageScores.bestPractices}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'action.disabled',
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      SEO
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {metrics.averageScores.seo}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.averageScores.seo}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'action.disabled',
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Device-Specific Averages */}
            {(metrics.desktopAverages.count > 0 || metrics.mobileAverages.count > 0) && (
              <Grid container spacing={4}>
                {/* Desktop Averages */}
                {metrics.desktopAverages.count > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon name="computer" style={{ fontSize: 20 }} />
                      Desktop ({metrics.desktopAverages.count} audits)
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Accessibility
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.desktopAverages.accessibility}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.desktopAverages.accessibility}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Performance
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.desktopAverages.performance}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.desktopAverages.performance}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Best Practices
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.desktopAverages.bestPractices}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.desktopAverages.bestPractices}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            SEO
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.desktopAverages.seo}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.desktopAverages.seo}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                )}

                {/* Mobile Averages */}
                {metrics.mobileAverages.count > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon name="smartphone" style={{ fontSize: 20 }} />
                      Mobile ({metrics.mobileAverages.count} audits)
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Accessibility
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.mobileAverages.accessibility}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.mobileAverages.accessibility}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Performance
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.mobileAverages.performance}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.mobileAverages.performance}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Best Practices
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.mobileAverages.bestPractices}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.mobileAverages.bestPractices}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            SEO
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {metrics.mobileAverages.seo}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.mobileAverages.seo}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: 'action.disabled',
                          }}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        )}
  
      </Container>
    </Box>
  );
}
