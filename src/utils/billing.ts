import { USER_TIERS } from '../config/tierConfig';
import type { UserTier } from '../types/auth';

/** Plans in display order, cheapest first. */
export const PLAN_ORDER: readonly UserTier[] = ['basic', 'pro', 'enterprise'];

export interface BillingAccount {
  id: string;
  email: string;
  full_name: string;
  tier: UserTier;
  status: string;
  created_at: string;
}

export interface PlanSummary {
  tier: UserTier;
  name: string;
  /** Monthly list price; `null` when the plan is custom-priced. */
  listPrice: number | null;
  accounts: number;
  activeAccounts: number;
  /** Share of all accounts on this plan, 0–100, rounded. */
  share: number;
  /** List price × active accounts; `null` for custom-priced plans. */
  estimatedMonthly: number | null;
}

export interface BillingSummary {
  totalAccounts: number;
  activeAccounts: number;
  paidAccounts: number;
  /** Paid accounts as a share of active accounts, 0–100, rounded. */
  paidShare: number;
  estimatedMrr: number;
  customPricedAccounts: number;
  churnedPaidAccounts: number;
  plans: PlanSummary[];
}

export function normalizeTier(tier: string | null | undefined): UserTier {
  return tier === 'pro' || tier === 'enterprise' ? tier : 'basic';
}

/** Parse the configured display price ("$49", "$0", "Custom") into dollars. */
export function listPrice(tier: UserTier): number | null {
  const match = /^\$(\d+(?:\.\d+)?)$/.exec(USER_TIERS[tier].price.trim());
  return match ? Number(match[1]) : null;
}

export function isPaidTier(tier: UserTier): boolean {
  return listPrice(tier) !== 0;
}

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function summarizeBilling(accounts: readonly BillingAccount[]): BillingSummary {
  const active = accounts.filter((account) => account.status === 'active');

  const plans = PLAN_ORDER.map((tier): PlanSummary => {
    const price = listPrice(tier);
    const onPlan = accounts.filter((account) => account.tier === tier);
    const activeOnPlan = onPlan.filter((account) => account.status === 'active').length;
    return {
      tier,
      name: USER_TIERS[tier].name,
      listPrice: price,
      accounts: onPlan.length,
      activeAccounts: activeOnPlan,
      share: percent(onPlan.length, accounts.length),
      estimatedMonthly: price === null ? null : price * activeOnPlan,
    };
  });

  const paidAccounts = active.filter((account) => isPaidTier(account.tier)).length;

  return {
    totalAccounts: accounts.length,
    activeAccounts: active.length,
    paidAccounts,
    paidShare: percent(paidAccounts, active.length),
    estimatedMrr: plans.reduce((sum, plan) => sum + (plan.estimatedMonthly ?? 0), 0),
    customPricedAccounts: plans
      .filter((plan) => plan.listPrice === null)
      .reduce((sum, plan) => sum + plan.activeAccounts, 0),
    churnedPaidAccounts: accounts.filter((account) => account.status === 'churned' && isPaidTier(account.tier))
      .length,
    plans,
  };
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

/** "$49/mo", "Free", or "Custom". */
export function formatListPrice(price: number | null): string {
  if (price === null) return 'Custom';
  if (price === 0) return 'Free';
  return `${formatCurrency(price)}/mo`;
}
