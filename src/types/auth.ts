export type UserTier = 'basic' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  tier: UserTier;
  audit_limit: number;
  is_admin: boolean;
  status: string;
  audit_count: number;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface TierFeatures {
  name: string;
  price: string;
  auditLimit: number | 'unlimited';
  features: string[];
  scheduledAudits?: number;
  emailNotifications: boolean;
  webhooks: boolean;
  apiAccess: boolean;
  teamMembers?: number;
}

export const TIER_CONFIG: Record<UserTier, TierFeatures> = {
  basic: {
    name: 'Basic',
    price: 'Free Forever',
    auditLimit: 20,
    features: [
      'Save up to 20 audits',
      'Pin important audits',
      'Full audit history',
      'Violation tracking',
      'Audit comparison',
      'Export reports (PDF/JSON)',
      'Email support',
    ],
    emailNotifications: false,
    webhooks: false,
    apiAccess: false,
  },
  pro: {
    name: 'Pro',
    price: '$29/month',
    auditLimit: 'unlimited',
    features: [
      'Everything in Basic',
      'Unlimited audit history',
      '10 scheduled audits',
      'Email notifications',
      'Webhook support',
      'Advanced filtering',
      'Priority support',
    ],
    scheduledAudits: 10,
    emailNotifications: true,
    webhooks: true,
    apiAccess: false,
  },
  enterprise: {
    name: 'Enterprise',
    price: '$149/month',
    auditLimit: 'unlimited',
    features: [
      'Everything in Pro',
      'Unlimited scheduled audits',
      '10 team members',
      'API access',
      'Custom schedules (hourly)',
      'White-label reports',
      'Dedicated support',
      '99.9% SLA',
    ],
    scheduledAudits: -1,
    emailNotifications: true,
    webhooks: true,
    apiAccess: true,
    teamMembers: 10,
  },
};
