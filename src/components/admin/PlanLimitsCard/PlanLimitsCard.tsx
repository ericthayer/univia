import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader';
import { srOnly } from '../../ui/srOnly';
import { USER_TIERS } from '../../../config/tierConfig';
import type { TierFeatures, UserTier } from '../../../types/auth';

interface Column {
  key: string;
  label: string;
  render: (tier: TierFeatures) => string;
}

const yesNo = (value: boolean): string => (value ? 'Yes' : '—');

const COLUMNS: Column[] = [
  { key: 'price', label: 'Price / mo', render: (t) => t.price },
  { key: 'audits', label: 'Audits / mo', render: (t) => (t.auditLimit === 'unlimited' ? 'Unlimited' : String(t.auditLimit)) },
  { key: 'seats', label: 'Team seats', render: (t) => (t.teamMembers ? String(t.teamMembers) : '1') },
  { key: 'scheduled', label: 'Scheduled', render: (t) => (t.scheduledAudits ? String(t.scheduledAudits) : '—') },
  { key: 'api', label: 'API', render: (t) => yesNo(t.apiAccess) },
  { key: 'webhooks', label: 'Webhooks', render: (t) => yesNo(t.webhooks) },
];

const TIER_ORDER: UserTier[] = ['basic', 'pro', 'enterprise'];

export interface PlanLimitsCardProps {
  reveal?: number;
}

/**
 * Read-only view of plan limits. Values come from `tierConfig`, the same
 * source the app enforces, so this table cannot drift from behavior.
 */
export function PlanLimitsCard({ reveal }: PlanLimitsCardProps) {
  const cellSx = {
    px: 2,
    py: 1.5,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: 1,
    borderColor: 'divider',
    fontVariantNumeric: 'tabular-nums',
  } as const;

  return (
    <BezelCard component="section" aria-labelledby="plans-heading" reveal={reveal}>
      <SectionHeader id="plans-heading" title="Plans & limits" dense />
      <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2.5, maxWidth: '60ch' }}>
        Limits are defined in code and ship with each release. Per-user overrides live in User Management.
      </Typography>

      <Box
        role="region"
        aria-labelledby="plans-heading"
        tabIndex={0}
        sx={{
          overflowX: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', typography: 'body2' }}>
          <Box component="caption" sx={srOnly}>
            Plan limits by tier
          </Box>
          <thead>
            <tr>
              <Box component="th" scope="col" sx={{ ...cellSx, typography: 'eyebrow' }}>
                Plan
              </Box>
              {COLUMNS.map((col) => (
                <Box component="th" scope="col" key={col.key} sx={{ ...cellSx, typography: 'eyebrow' }}>
                  {col.label}
                </Box>
              ))}
            </tr>
          </thead>
          <Box component="tbody" sx={{ '& tr:last-of-type > *': { borderBottom: 0 } }}>
            {TIER_ORDER.map((id) => {
              const tier = USER_TIERS[id];
              return (
                <tr key={id}>
                  <Box component="th" scope="row" sx={{ ...cellSx, fontWeight: 600 }}>
                    {tier.name}
                  </Box>
                  {COLUMNS.map((col) => (
                    <Box component="td" key={col.key} sx={{ ...cellSx, color: 'text.secondary' }}>
                      {col.render(tier)}
                    </Box>
                  ))}
                </tr>
              );
            })}
          </Box>
        </Box>
      </Box>
    </BezelCard>
  );
}

export default PlanLimitsCard;
