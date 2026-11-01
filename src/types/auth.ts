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
  /** Yearly price when the plan offers annual billing, e.g. "$90". */
  annualPrice?: string;
  /** What one price unit buys, e.g. "site" renders "/site/month". */
  priceUnit?: string;
  auditLimit: number | 'unlimited';
  features: string[];
  scheduledAudits?: number;
  emailNotifications: boolean;
  webhooks: boolean;
  apiAccess: boolean;
  teamMembers?: number;
}

