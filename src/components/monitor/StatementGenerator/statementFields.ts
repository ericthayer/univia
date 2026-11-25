import type { ResponseDays, StatementStandard } from './buildStatement';

export interface StatementFields {
  organization: string;
  contactEmail: string;
  contactPhone: string;
  responseDays: ResponseDays;
  standard: StatementStandard;
  measures: string;
  includeLimitations: boolean;
}

export interface StatementErrors {
  organization?: string;
  contactEmail?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStatementFields(fields: StatementFields): StatementErrors {
  const errors: StatementErrors = {};
  if (!fields.organization.trim()) errors.organization = 'Enter the name people know you by.';
  if (!fields.contactEmail.trim()) errors.contactEmail = 'Enter an email address people can write to.';
  else if (!EMAIL_PATTERN.test(fields.contactEmail.trim())) errors.contactEmail = 'Enter an email address like help@example.com.';
  return errors;
}

