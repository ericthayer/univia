# Tenant-isolation test matrix

The database integration suite must execute these cases against a disposable Supabase database with two users (`owner_a`, `owner_b`), one active admin, and one business owned by each user. Tests must run inside a transaction or clean up all fixtures.

| Subject | Anonymous | Owner | Other user | Active admin | Service role |
| --- | --- | --- | --- | --- | --- |
| `businesses` | no read/write | CRUD own only; insert owner is server-assigned | no read/write | CRUD all | migration/worker access only |
| `accessibility_audits` | no read/write | CRUD own; `user_id` cannot be forged; business must be owned | no read/write | CRUD all | worker access only |
| `violations` | no read/write | CRUD through own audit only | no read/write | CRUD all | worker access only |
| `demand_letters` | no read/write | CRUD own; business must be owned | no read/write | CRUD all | worker access only |
| `action_items` | no read/write | CRUD through own business and same-tenant related records | no read/write | CRUD all | worker access only |
| `action_plans` | no read/write | CRUD own; related audit must be owned | no read/write | CRUD all | worker access only |
| `checklist_progress` | no read/write | CRUD own only | no read/write | CRUD all | worker access only |
| `pinned_audits` | no read/write | CRUD own pins for own audits | no read/write | CRUD all | worker access only |
| `shared_analysis_links` | direct table blocked; valid active token only through safe RPC; protected links require the password argument | CRUD own links through the password-safe view/RPC | no read/write | CRUD all | worker access only |
| `user_profiles` | no read/write | read/update own profile fields only | no read/write | read/update all | worker access only |
| `professional_resources` | read only | read only | read only | CRUD | worker access only |
| `demand-letters` storage | no access | CRUD objects under own UUID prefix | no access | CRUD all | worker access only |

Negative cases are mandatory: forged `user_id`, forged `owner_id`, cross-tenant `business_id`, cross-tenant audit/letter references, anonymous direct share-link reads, password-protected share-link reads through the public RPC, concurrent calls beyond `max_access_count`, and privilege-field updates on `user_profiles`.
