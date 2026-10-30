import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import { StatusPill, TierPill } from '../UserBadges/UserBadges';

export interface UserCardUser {
  id: string;
  email: string;
  full_name: string;
  tier: string;
  status: string;
  last_login: string;
  audit_count: number;
}

export interface UserCardProps {
  user: UserCardUser;
  /** Stagger index for the mount reveal. */
  reveal?: number;
}

/**
 * Directory card for one account: avatar, identity, tier/status, and the two
 * activity figures. Presentational.
 */
export function UserCard({ user, reveal }: UserCardProps) {
  const lastActive = new Date(user.last_login);

  return (
    <BezelCard component="article" interactive reveal={reveal} aria-label={user.full_name} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, minWidth: 0 }}>
        <Avatar sx={{ width: 44, height: 44, fontWeight: 600 }}>{user.full_name.charAt(0)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {user.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {user.email}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
        <TierPill tier={user.tier} />
        <StatusPill status={user.status} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          mt: 'auto',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="eyebrow" component="p">
            Audits
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {user.audit_count}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="eyebrow" component="p">
            Last Active
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            <time dateTime={lastActive.toISOString()}>{lastActive.toLocaleDateString()}</time>
          </Typography>
        </Box>
      </Box>
    </BezelCard>
  );
}

export default UserCard;
