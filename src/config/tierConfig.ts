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
    auditLimit: 1,
    features: [
      '1 homepage scan per month',
      'Accessibility score and top issues',
      'Demand letter triage (1 letter)',
      'Community support'
    ],
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
  },
  pro: {
    name: 'Monitor',
    price: '$9',
    annualPrice: '$90',
    priceUnit: 'site',
    auditLimit: 30,
    features: [
      'Weekly scans of up to 25 pages',
      'Alerts when new issues appear',
      'Fix tracker with re-scan confirmation',
      'Good-Faith Remediation Record (PDF)',
      'Accessibility statement generator',
      '5 demand letter analyses per month',
      'Extra sites $5/month each'
    ],
    scheduledAudits: 1,
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
    teamMembers: 2,
  },
  enterprise: {
    name: 'Agency',
    price: 'Custom',
    auditLimit: 'unlimited',
    features: [
      'Monitoring for 10+ sites',
      'White-label PDF reports',
      'Remediation Record per client',
      'API access and webhooks',
      '5+ team seats',
      'Priority support'
    ],
    scheduledAudits: 20,
    emailNotifications: true,
    webhooks: true,
    apiAccess: true,
    teamMembers: 100,
  }
};
