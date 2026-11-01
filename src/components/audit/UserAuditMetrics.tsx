import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useUserAudits } from '../../hooks/useUserAudits';
import DocumentUploadDrawer from '../documents/DocumentUploadDrawer';
import Icon from '../ui/Icon';
import { MetricTile } from '../ui/MetricTile/MetricTile';
import { PageHeader } from '../ui/PageHeader/PageHeader';
import { scoreTone } from '../ui/ScoreBar/scoreTone';
import { QuickAuditBar } from '../dashboard/QuickAuditBar/QuickAuditBar';
import { LatestScoreCard } from '../dashboard/LatestScoreCard/LatestScoreCard';
import { RecentAuditsList } from '../dashboard/RecentAuditsList/RecentAuditsList';
import { ScoreBreakdownCard } from '../dashboard/ScoreBreakdownCard/ScoreBreakdownCard';

interface UserAuditMetricsProps {
  /** The user ID to fetch audits for */
  userId?: string;
  /** Maximum number of audits to fetch (defaults to 50) */
  limit?: number;
  /** Whether to enable fetching (defaults to true) */
  enabled?: boolean;
  /** Callback when user navigates to run an audit */
  onAuditClick?: () => void;
}

const WIDE = '@container (min-width: 1000px)';
const MID = '@container (min-width: 640px)';

/**
 * Signed-in dashboard: header with quick actions, a bento of the latest score
 * and four KPI tiles, then recent audits beside the score breakdown.
 * Data comes from `useUserAudits`; presentation lives in `components/dashboard`.
 */
export default function UserAuditMetrics({ userId, limit = 50, enabled = true, onAuditClick }: UserAuditMetricsProps) {
  const navigate = useNavigate();
  const { metrics, loading, error } = useUserAudits({ userId, limit, enabled });
  const [pinnedAuditIds, setPinnedAuditIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPinnedAudits = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('pinned_audits').select('audit_id').eq('user_id', userId);
    if (data) {
      setPinnedAuditIds(new Set(data.map((p) => p.audit_id)));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !enabled) return;
    fetchPinnedAudits();
  }, [userId, enabled, fetchPinnedAudits]);

  const handleAuditClick = () => {
    if (onAuditClick) {
      onAuditClick();
    } else {
      navigate('/audit');
    }
  };

  const { averageScores, desktopAverages, mobileAverages, totalAudits, latestAudit, allAudits } = metrics;
  const hasAudits = !loading && totalAudits > 0;

  const tiles = [
    {
      label: 'Total Audits',
      value: totalAudits,
      support: totalAudits > 0 ? 'Audits completed' : 'No audits yet',
      tone: 'neutral' as const,
      icon: 'assessment',
    },
    {
      label: 'Avg Accessibility',
      value: `${averageScores.accessibility}%`,
      support: 'Across all audits',
      tone: hasAudits ? scoreTone(averageScores.accessibility) : ('neutral' as const),
      icon: 'accessibility_new',
    },
    {
      label: 'Avg Performance',
      value: `${averageScores.performance}%`,
      support: 'Website speed & efficiency',
      tone: hasAudits ? scoreTone(averageScores.performance) : ('neutral' as const),
      icon: 'speed',
    },
    {
      label: 'Avg Best Practices',
      value: `${averageScores.bestPractices}%`,
      support: 'Code quality & standards',
      tone: hasAudits ? scoreTone(averageScores.bestPractices) : ('neutral' as const),
      icon: 'verified_user',
    },
  ];

  return (
    <Box component="section" aria-label="Audit metrics dashboard" sx={{ display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load audit metrics: {error}
        </Alert>
      )}

      <PageHeader
        eyebrow="Overview"
        title="Your Audit Performance"
        titleComponent="h1"
        actions={<QuickAuditBar onAnalyzeDocs={() => setDrawerOpen(true)} />}
      />

      <DocumentUploadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Row 1: latest score beside a 2×2 of KPI tiles */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: '1fr',
          [WIDE]: { gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)' },
        }}
      >
        <LatestScoreCard audit={latestAudit} loading={loading} onRunAudit={handleAuditClick} reveal={0} />
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: '1fr',
            [MID]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {tiles.map((tile, index) => (
            <MetricTile
              key={tile.label}
              label={tile.label}
              value={loading ? '' : tile.value}
              support={tile.support}
              tone={tile.tone}
              icon={<Icon name={tile.icon} />}
              loading={loading}
              reveal={index + 1}
            />
          ))}
        </Box>
      </Box>

      {/* Row 2: recent audits beside the score breakdown */}
      {hasAudits && (
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            mt: { xs: 4, md: 6 },
            gridTemplateColumns: '1fr',
            alignItems: 'start',
            [WIDE]: { gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)' },
          }}
        >
          <RecentAuditsList audits={allAudits} pinnedIds={pinnedAuditIds} onPinToggle={fetchPinnedAudits} reveal={5} />
          <ScoreBreakdownCard
            overall={{ ...averageScores, count: totalAudits }}
            desktop={desktopAverages}
            mobile={mobileAverages}
            reveal={6}
          />
        </Box>
      )}
    </Box>
  );
}
