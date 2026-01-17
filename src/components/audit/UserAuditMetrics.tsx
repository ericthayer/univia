import { Box, Card, CardContent, Container, Grid, Stack, Typography, Button, LinearProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import ComplianceGauge from '../ui/ComplianceGauge';
import AuditHistoryCard from './AuditHistoryCard';
import StatCard from '../ui/StatCard';
import Icon from '../ui/Icon';
import { useUserAudits } from '../../hooks/useUserAudits';

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
  const { metrics, loading, error, refetch } = useUserAudits({
    userId,
    limit,
    enabled,
  });
  const [pinnedAuditIds, setPinnedAuditIds] = useState<Set<string>>(new Set());

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


        <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="space-between" columnGap={3} rowGap={1.5}>
        
          {/* Header */}
          <Typography
            variant="h3"
            component="h2"
          >
            Your Audit Performance
          </Typography>
  
           {/* Call to Action */}
          {!loading && metrics.totalAudits > 0 && (
            <Button
              variant="contained"
              onClick={handleAuditClick}
              startIcon={<Icon name="refresh" />}
            >
              Run New Audit
            </Button>
          )}

        </Stack>

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
                  sx={{
                    placeContent: 'center',
                  }}
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
      </Container>
    </Box>
  );
}
