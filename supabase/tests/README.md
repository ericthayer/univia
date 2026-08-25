# Supabase security tests

`tenant-isolation-matrix.md` is the required owner/other-user/admin matrix for an integration environment.

`tenant-isolation-policy.sql` is a pgTAP policy contract. Run it only against a disposable database after applying migrations. It does not replace authenticated integration tests: those must create two users, an active admin, tenant fixtures, and verify denied operations have no side effects.

## Legacy ownership gate

The hardening migration fails closed if any audit or demand letter still has a
`NULL user_id`. This is intentional: production currently has 36 unowned
audits and 40 unowned letters, all without a business association, so there is
no safe automatic owner mapping. Before applying the migration, export and
review those records, obtain an approved owner mapping for each record, or
place them in an operator-only archive. Do not assign them to the first admin
or to the currently authenticated caller.

The migration may be applied only after the approved recovery is complete and
the preflight query returns zero unowned audits and letters. Preserve the
backup and recovery manifest for the release record.
