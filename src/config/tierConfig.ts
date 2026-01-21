import { UserTier, TierFeatures } from '../types/auth';

const USER_TIERS: Record<UserTier, TierFeatures> = {
  basic: {
    name: 'Basic',
    price: '$0',
    auditLimit: 3,
    features: [
      '3 Accessibility Audits per month',
      'Basic Violation Reports',
      'Demand Letter Analysis (Single)',
      'Community Support'
    ],
    emailNotifications: true,
    webhooks: false,
    apiAccess: false,
  },
  pro: {
    name: 'Pro',
    price: '$49',
    auditLimit: 50,
    features: [
      '50 Accessibility Audits per month',
      'Priority Analysis',
      'Advanced Remediation Plans',
      'PDF Export',
      'Team Collaboration (up to 5)',
      'Email Support'
    ],
    scheduledAudits: 5,
    emailNotifications: true,
    webhooks: true,
    apiAccess: true,
    teamMembers: 5,
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    auditLimit: 'unlimited',
    features: [
      'Unlimited Accessibility Audits',
      'Full API Access',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SSO & Advanced Security',
      'SLA Guarantees',
      'Unlimited Team Members'
    ],
    scheduledAudits: 20,
    emailNotifications: true,
    webhooks: true,
    apiAccess: true,
    teamMembers: 100,
  }
};

export { USER_TIERS };
export default USER_TIERS;
