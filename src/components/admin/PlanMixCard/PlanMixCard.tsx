import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { TierPill } from '../UserBadges/UserBadges';
import { formatCurrency, PlanSummary } from '../../../utils/billing';

export interface PlanMixCardProps {
  plans: readonly PlanSummary[];
  totalAccounts: number;
  loading?: boolean;
  reveal?: number;
}

const TITLE_ID = 'billing-plan-mix-title';

/**
 * Share of accounts on each plan with the plan's estimated monthly revenue.
 * Bars are neutral: plan is conveyed by the tier pill, not by hue.
 */
export function PlanMixCard({ plans, totalAccounts, loading = false, reveal }: PlanMixCardProps) {
  return (
    <BezelCard component="section" aria-labelledby={TITLE_ID} reveal={reveal} sx={{ height: '100%' }}>
      <SectionHeader
        id={TITLE_ID}
        title="Plan mix"
        meta={loading ? undefined : `${totalAccounts} ${totalAccounts === 1 ? 'account' : 'accounts'}`}
        dense
      />
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5 }}>
        {plans.map((plan) => (
          <Box component="li" key={plan.tier} sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <TierPill tier={plan.tier} />
                {loading ? (
                  <Skeleton variant="text" width={72} />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {plan.accounts} {plan.accounts === 1 ? 'account' : 'accounts'}
                  </Typography>
                )}
              </Box>
              {!loading && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                >
                  {plan.share}%
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant={loading ? 'indeterminate' : 'determinate'}
              value={plan.share}
              aria-label={`${plan.name} share of accounts`}
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: 'text.primary' },
              }}
            />
            {!loading && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.75, fontVariantNumeric: 'tabular-nums' }}
              >
                {plan.listPrice === null
                  ? `${plan.activeAccounts} active · custom pricing, not in MRR`
                  : plan.listPrice === 0
                    ? `${plan.activeAccounts} active · free plan`
                    : `${plan.activeAccounts} active · ${formatCurrency(plan.estimatedMonthly ?? 0)}/mo at list price`}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </BezelCard>
  );
}

export default PlanMixCard;
