import { UserTier, TierFeatures } from '../types/auth';

/**
 * Plan catalog. Internal ids (`basic` / `pro` / `enterprise`) are stored on
 * profiles, so they stay fixed; only display names, prices and limits change.
 *
 * Copy rule: describe what the product does (finds, tracks, documents). Never
 * claim compliance, lawsuit protection, or legal advice.
 */
export const USER_TIERS: Record<UserTier, TierFeatures> = {
  basic: {
    name: 'Free',
    price: '$0',
    // Mirrors plan_audit_limit() in 20261108050610_enforce_plan_limits.
    auditLimit: 1,
    features: [
      '1 site audit per month',
      'Accessibility score and top issues',
      'Demand letter triage (1 letter)',
      'Self-serve help center'
    ],
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
  },
  pro: {
    name: 'Monitor',
    price: '$9',
    annualPrice: '$90',
    auditLimit: 30,
    features: [
      '30 site audits per month',
      'PDF export',
      '5 demand letter analyses per month'
    ],
    plannedFeatures: [
      'Weekly scans of up to 25 pages',
      'Alerts when new issues appear',
      'Fix tracker with re-scan confirmation',
      'Good-Faith Remediation Record (PDF)',
      'Accessibility statement generator',
      'Extra sites $5/month or $50/year each'
    ],
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
  },
  enterprise: {
    name: 'Agency',
    price: 'Custom',
    // No cap on the server today; allowances are agreed per account.
    auditLimit: 'unlimited',
    features: [
      'Everything in Monitor',
      'Allowances set to fit your volume'
    ],
    plannedFeatures: [
      'Monitoring for 10+ sites',
      'Team seats',
      'API access and webhooks',
      'White-label PDF reports',
      'Remediation Record per client',
      'Priority support'
    ],
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
  }
};
