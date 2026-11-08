# Tenant-isolation matrix

Who may do what once `20261107214000_tenant_isolation.sql` is applied. Guests hold the `authenticated` role with their own user ID, so they follow the Owner column for their own rows. Edge Functions write as the service role.

| Subject | Signed out | Owner | Other user | Active admin | Service role |
|---|---|---|---|---|---|
| `user_profiles` | none | read; update own name only | none | read and update all | all |
| `accessibility_audits` | none | read own | none | none | all (written by `run-lighthouse-audit`) |
| `violations` | none | read through own audit | none | none | all |
| `demand_letters` | none | read and update own, except `created_at` | none | none | all (written through `insert_demand_letter`) |
| `shared_analysis_links` | token lookup through `get_shared_letter_analysis` only | create, list and revoke own through RPCs | none | none | all |
| `businesses`, `action_items` | none | none | none | none | all |
| `audit_quota_claims` | none | own monthly usage through `my_audit_usage` only | none | none | all (claimed and released by `run-lighthouse-audit`) |
| `action_plans`, `checklist_progress`, `pinned_audits` | none | own rows | none | none | all |
| `professional_resources` | none | read | read | read | all |
| `demand-letters` storage | none | objects under own user ID folder | none | none | all |
| Retired prototype tables | none | none | none | none | all |

Protected `user_profiles` fields (`tier`, `is_admin`, `audit_limit`, `status`, `email`, `audit_count`, `last_login`, `created_at`) change only through the service role, an active admin, or Auth's email sync.

Plan limits (`claim_audit_run`, `release_audit_run`, `letter_quota`, `insert_demand_letter`) run only as the service role. `audit_limit` is protected, so an account cannot raise its own limit.

Deleting an account deletes its letters, audits, violations and audit claims. Storage files are removed separately by account deletion (SPEC Phase 7).
