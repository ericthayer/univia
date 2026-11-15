# Supabase database tests

Run these only against a disposable database built from `supabase/migrations/`, as a superuser. Each file runs in one transaction and rolls back. Never run them against production.

| File | Covers | Style |
|---|---|---|
| `accounts-behavior.sql` | Sign-up creates a profile, guests convert, email sync, profile saving, protected profile fields, admin access | pgTAP |
| `tenant-isolation-behavior.sql` | Owners, other users, guests and signed-out visitors on audits, violations and letters; letters and audits always have an owner; deleting an account deletes its data | pgTAP |
| `plan-limits-behavior.sql` | Monthly audit allowance by plan and for guests, release of failed runs, letter allowance by plan, letters that cannot be backdated, plan changes setting the limit, and what browsers can and cannot call | pgTAP |
| `monitor-scans-behavior.sql` | Who can use Monitor, adding sites and pages (limits, URL rules), owner-only reads, the scan queue (claims, retries, crashed workers), issue diffing across runs (detected, resolved, reopened, fix confirmed or not), weekly scheduling, pausing, losing access, append-only history, account deletion | pgTAP |
| `letter-sharing-behavior.sql` | Share-link creation, lookup, expiry and revocation | Plain SQL `ASSERT` |

`tenant-isolation-matrix.md` lists who may do what. Update it with any policy change.

## Running locally

The `public.ecr.aws/supabase/postgres` image provides `auth` and `storage` schemas, but not every column or function that Supabase's services add at runtime. Before applying migrations to a bare container, add `auth.users.is_anonymous`, `storage.buckets`, `storage.objects` and `storage.foldername()`. Apply migrations in filename order, then run each file with `psql -v ON_ERROR_STOP=1`. pgTAP files print `ok` / `not ok` lines; the plain SQL file stops on the first failed assertion.

Production applies migrations as `postgres`, which does not own `auth.users`. A migration that drops or replaces a trigger on that table will fail there even if it passes as a superuser.

## Legacy ownership gate

`20261107214000_tenant_isolation.sql` refuses to run while any audit or letter has no owner. This is intentional: there is no safe automatic owner for those rows. Resolve them first (Monitor launch SPEC, Decision 1). Do not assign them to an admin or to whoever is signed in.

`20261108023428_require_audit_owner.sql` has the same gate for audits. It runs after the `run-lighthouse-audit` version that rejects key-only calls (production version 34).
