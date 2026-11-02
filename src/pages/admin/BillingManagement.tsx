import { useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBillingAccounts } from '../../hooks/useBillingAccounts';
import Icon from '../../components/ui/Icon';
import { PageCanvas } from '../../components/ui/PageCanvas/PageCanvas';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { BezelCard } from '../../components/ui/BezelCard/BezelCard';
import { MetricTile } from '../../components/ui/MetricTile/MetricTile';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader';
import { FilterSelect } from '../../components/admin/FilterSelect/FilterSelect';
import { PlanMixCard } from '../../components/admin/PlanMixCard/PlanMixCard';
import { PlanCatalogCard } from '../../components/admin/PlanCatalogCard/PlanCatalogCard';
import { BillingAccountsTable } from '../../components/admin/BillingAccountsTable/BillingAccountsTable';
import { formatCurrency, isPaidTier, summarizeBilling } from '../../utils/billing';
import { USER_TIERS } from '../../config/tierConfig';

const DEFAULT_PLAN = 'paid';
const DEFAULT_STATUS = 'all';
const ACCOUNTS_TITLE_ID = 'billing-accounts-title';
const INVOICES_TITLE_ID = 'billing-invoices-title';

const PLAN_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'all', label: 'All' },
  { value: 'basic', label: 'Free' },
  { value: 'pro', label: 'Monitor' },
  { value: 'enterprise', label: 'Agency' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
] as const;

/**
 * Admin billing overview (docs/specs/billing-management/SPEC.md). Built only
 * from account plan and status plus configured list prices; no payment
 * processor is connected, so every money figure is labelled an estimate.
 */
export default function BillingManagement() {
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);
  const { accounts, loading, error, reload } = useBillingAccounts(isAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  const planFilter = searchParams.get('plan') ?? DEFAULT_PLAN;
  const statusFilter = searchParams.get('status') ?? DEFAULT_STATUS;
  const searchQuery = searchParams.get('q') ?? '';

  const updateParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value === defaultValue) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const summary = useMemo(() => summarizeBilling(accounts), [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return accounts.filter((account) => {
      if (planFilter === 'paid' && !isPaidTier(account.tier)) return false;
      if (planFilter !== 'paid' && planFilter !== 'all' && account.tier !== planFilter) return false;
      if (statusFilter !== DEFAULT_STATUS && account.status !== statusFilter) return false;
      if (query && !account.email.toLowerCase().includes(query) && !account.full_name.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [accounts, planFilter, statusFilter, searchQuery]);

  const hasActiveFilters = planFilter !== DEFAULT_PLAN || statusFilter !== DEFAULT_STATUS || searchQuery !== '';

  if (!isAdmin) {
    return (
      <PageCanvas maxWidth="xl">
        <EmptyState icon="shield" title="Access denied" description="You do not have permission to view this page." />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas maxWidth="xl">
      <PageHeader
        eyebrow="Admin"
        title="Billing Management"
        description="Plans, paid accounts, and list-price revenue across Univia."
        titleComponent="h1"
        actions={
          <Button
            component={RouterLink}
            to="/pricing"
            variant="outlined"
            startIcon={<Icon name="open_in_new" aria-hidden />}
          >
            View pricing page
          </Button>
        }
      />

      {error ? (
        <BezelCard>
          <EmptyState
            icon="error"
            title="Billing data could not be loaded"
            description={error}
            action={
              <Button variant="outlined" onClick={reload}>
                Retry
              </Button>
            }
            compact
          />
        </BezelCard>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: 3,
              mb: { xs: 4, md: 6 },
            }}
          >
            <MetricTile
              label="Estimated MRR"
              value={formatCurrency(summary.estimatedMrr)}
              support="List price × active accounts"
              icon={<Icon name="trending_up" />}
              loading={loading}
              reveal={0}
            />
            <MetricTile
              label="Paid Accounts"
              value={summary.paidAccounts}
              support={`${summary.paidShare}% of active accounts`}
              tone={summary.paidAccounts > 0 ? 'success' : 'neutral'}
              icon={<Icon name="credit_card" />}
              loading={loading}
              reveal={1}
            />
            <MetricTile
              label="Custom-Priced"
              value={summary.customPricedAccounts}
              support={`Active ${USER_TIERS.enterprise.name}, not in MRR`}
              icon={<Icon name="workspace_premium" />}
              loading={loading}
              reveal={2}
            />
            <MetricTile
              label="Churned Paid"
              value={summary.churnedPaidAccounts}
              support="Paid-plan accounts marked churned"
              tone={summary.churnedPaidAccounts > 0 ? 'error' : 'neutral'}
              icon={<Icon name="logout" />}
              loading={loading}
              reveal={3}
            />
          </Box>

          <Box sx={{ containerType: 'inline-size', mb: { xs: 4, md: 6 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: 3,
                '@container (min-width: 900px)': {
                  gridTemplateColumns: '7fr 5fr',
                },
              }}
            >
              <PlanMixCard plans={summary.plans} totalAccounts={summary.totalAccounts} loading={loading} reveal={4} />
              <PlanCatalogCard reveal={5} />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: { xs: 4, md: 6 } }}>
            <BezelCard component="section" aria-labelledby={ACCOUNTS_TITLE_ID} reveal={6}>
              <SectionHeader
                id={ACCOUNTS_TITLE_ID}
                title="Accounts"
                meta={loading ? undefined : `${filteredAccounts.length} of ${accounts.length}`}
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  mb: 3,
                }}
              >
                <FilterSelect
                  id="billing-plan-filter"
                  label="Plan"
                  value={planFilter}
                  options={PLAN_OPTIONS}
                  onChange={(next) => updateParam('plan', next, DEFAULT_PLAN)}
                />
                <FilterSelect
                  id="billing-status-filter"
                  label="Status"
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={(next) => updateParam('status', next, DEFAULT_STATUS)}
                />
                <TextField
                  placeholder="Search accounts…"
                  size="small"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => updateParam('q', event.target.value, '')}
                  slotProps={{
                    input: {
                      'aria-label': 'Search accounts',
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon name="search" style={{ fontSize: 18 }} aria-hidden />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    flex: { xs: '1 1 100%', sm: '0 1 260px' },
                    ml: { md: 'auto' },
                  }}
                />
              </Box>

              {loading ? (
                <Box aria-busy="true" aria-label="Loading accounts">
                  <Skeleton variant="rounded" height={240} sx={{ borderRadius: '12px' }} />
                </Box>
              ) : filteredAccounts.length === 0 ? (
                <EmptyState
                  icon="people"
                  title={accounts.length === 0 ? 'No accounts yet' : 'No accounts match these filters'}
                  description={
                    accounts.length === 0
                      ? 'Accounts appear here as people sign up.'
                      : 'Try a different plan, status, or search term.'
                  }
                  action={
                    hasActiveFilters ? (
                      <Button variant="text" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                  compact
                />
              ) : (
                <BillingAccountsTable accounts={filteredAccounts} caption="Accounts and their billing plan" />
              )}
            </BezelCard>

            <BezelCard component="section" aria-labelledby={INVOICES_TITLE_ID} reveal={7}>
              <SectionHeader id={INVOICES_TITLE_ID} title="Invoices" dense />
              <EmptyState
                icon="receipt_long"
                title="No invoices yet"
                description="Invoices, payment methods, and failed charges appear here once a payment processor is connected. Until then, revenue above is estimated from list prices."
                compact
              />
            </BezelCard>
          </Box>
        </>
      )}
    </PageCanvas>
  );
}
