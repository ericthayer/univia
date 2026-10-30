import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { AccessibilityAudit } from '../../../types';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import ComplianceGauge from '../../ui/ComplianceGauge';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { ArrowButton } from '../../ui/ArrowButton/ArrowButton';
import Icon from '../../ui/Icon';

export interface LatestScoreCardProps {
  audit: AccessibilityAudit | null;
  loading: boolean;
  onRunAudit: () => void;
  reveal?: number;
}

const GAUGE_SIZE = 180;

/**
 * Hero cell of the dashboard bento: the latest accessibility score with the
 * URL it belongs to and a direct path to the full report.
 */
export function LatestScoreCard({ audit, loading, onRunAudit, reveal }: LatestScoreCardProps) {
  const headingId = 'latest-score-heading';

  return (
    <BezelCard
      component="section"
      aria-labelledby={headingId}
      reveal={reveal}
      sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}
    >
      <Typography id={headingId} variant="eyebrow" component="h2">
        Latest Audit Score
      </Typography>

      {loading ? (
        <>
          <Skeleton variant="circular" width={GAUGE_SIZE} height={GAUGE_SIZE} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </>
      ) : audit ? (
        <>
          <ComplianceGauge score={audit.accessibility_score || 0} size={GAUGE_SIZE} label="" />
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap title={audit.url_scanned}>
              {audit.url_scanned}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                <time dateTime={new Date(audit.created_at).toISOString()}>
                  {new Date(audit.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </Typography>
              {audit.device_type && (
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<Icon name={audit.device_type === 'mobile' ? 'smartphone' : 'computer'} style={{ fontSize: 14 }} />}
                  label={audit.device_type === 'mobile' ? 'Mobile' : 'Desktop'}
                  sx={{ height: 22, fontSize: '0.6875rem', textTransform: 'capitalize' }}
                />
              )}
            </Box>
          </Box>
          <ArrowButton
            variant="outlined"
            component={RouterLink}
            to={`/audit/${audit.audit_session_id || audit.id}`}
            sx={{ mt: 1 }}
          >
            View report
          </ArrowButton>
        </>
      ) : (
        <EmptyState
          compact
          icon="speed"
          title="No audits yet"
          description="Run your first audit to see your compliance score."
          action={<ArrowButton onClick={onRunAudit}>Run First Audit</ArrowButton>}
        />
      )}
    </BezelCard>
  );
}

export default LatestScoreCard;
