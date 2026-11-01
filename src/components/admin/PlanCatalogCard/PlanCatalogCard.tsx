import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { TierPill } from '../UserBadges/UserBadges';
import { USER_TIERS } from '../../../config/tierConfig';
import { formatListPrice, listPrice, PLAN_ORDER } from '../../../utils/billing';

export interface PlanCatalogCardProps {
  reveal?: number;
}

const TITLE_ID = 'billing-plan-catalog-title';

function formatAudits(limit: number | 'unlimited'): string {
  return limit === 'unlimited' ? 'Unlimited' : `${limit}/mo`;
}

/** Plans without `teamMembers` are single-seat. */
function formatSeats(seats: number | undefined): string {
  const count = seats ?? 1;
  return `${count} ${count === 1 ? 'seat' : 'seats'}`;
}

/**
 * Read-only plan catalog: list price and the limits each plan grants, from
 * `tierConfig`. Prices are changed in code, not here.
 */
export function PlanCatalogCard({ reveal }: PlanCatalogCardProps) {
  return (
    <BezelCard component="section" aria-labelledby={TITLE_ID} reveal={reveal} sx={{ height: '100%' }}>
      <SectionHeader id={TITLE_ID} title="Plan catalog" meta={`${PLAN_ORDER.length} plans`} dense />
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {PLAN_ORDER.map((tier, index) => {
          const plan = USER_TIERS[tier];
          return (
            <Box
              component="li"
              key={tier}
              sx={{
                py: 2,
                borderTop: index === 0 ? 0 : '1px solid',
                borderColor: 'divider',
                '&:first-of-type': { pt: 0 },
                '&:last-of-type': { pb: 0 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                <TierPill tier={tier} />
                <Typography
                  variant="h6"
                  component="p"
                  sx={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
                >
                  {formatListPrice(listPrice(tier))}
                </Typography>
              </Box>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 1.5,
                  '& dt': { typography: 'caption', color: 'text.secondary' },
                  '& dd': { m: 0, typography: 'body2', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
                }}
              >
                <div>
                  <dt>Audits</dt>
                  <dd>{formatAudits(plan.auditLimit)}</dd>
                </div>
                <div>
                  <dt>Team seats</dt>
                  <dd>{formatSeats(plan.teamMembers)}</dd>
                </div>
                <div>
                  <dt>API</dt>
                  <dd>{plan.apiAccess ? 'Included' : 'No'}</dd>
                </div>
              </Box>
            </Box>
          );
        })}
      </Box>
    </BezelCard>
  );
}

export default PlanCatalogCard;
