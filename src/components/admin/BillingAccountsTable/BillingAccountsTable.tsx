import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { StatusPill, TierPill } from '../UserBadges/UserBadges';
import { srOnly } from '../../ui/srOnly';
import { BillingAccount, formatListPrice, listPrice } from '../../../utils/billing';

export interface BillingAccountsTableProps {
  accounts: readonly BillingAccount[];
  caption: string;
}

const eyebrowSx = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  textAlign: 'left',
} as const;

/**
 * Native table of accounts and the plan each is billed on. Account edits live
 * in User Management, so each row links there pre-filtered by email.
 */
export function BillingAccountsTable({ accounts, caption }: BillingAccountsTableProps) {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
      }}
    >
      <Box
        component="table"
        sx={{
          width: '100%',
          minWidth: 640,
          borderCollapse: 'collapse',
          '& th, & td': { px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', verticalAlign: 'middle' },
          '& thead th': { ...eyebrowSx, bgcolor: 'action.hover', py: 1.25 },
          '& tbody tr:last-of-type td': { borderBottom: 0 },
          '& tbody tr:hover': { bgcolor: 'action.hover' },
          '& .BillingAccounts-num': { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
        }}
      >
        <Box component="caption" sx={srOnly}>
          {caption}
        </Box>
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Plan</th>
            <th scope="col">Status</th>
            <th scope="col">Member since</th>
            <th scope="col">List price</th>
            <th scope="col">
              <Box component="span" sx={srOnly}>
                Actions
              </Box>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const joined = new Date(account.created_at);
            return (
              <tr key={account.id}>
                <td>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {account.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                    {account.email}
                  </Typography>
                </td>
                <td>
                  <TierPill tier={account.tier} />
                </td>
                <td>
                  <StatusPill status={account.status} />
                </td>
                <td>
                  <Typography variant="body2" color="text.secondary" className="BillingAccounts-num">
                    <time dateTime={joined.toISOString()}>{joined.toLocaleDateString()}</time>
                  </Typography>
                </td>
                <td>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} className="BillingAccounts-num">
                    {formatListPrice(listPrice(account.tier))}
                  </Typography>
                </td>
                <Box component="td" sx={{ textAlign: 'right' }}>
                  <Button
                    component={RouterLink}
                    to={`/admin/users?q=${encodeURIComponent(account.email)}`}
                    variant="text"
                    size="small"
                    aria-label={`Manage ${account.full_name} in User Management`}
                  >
                    Manage
                  </Button>
                </Box>
              </tr>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
}

export default BillingAccountsTable;
