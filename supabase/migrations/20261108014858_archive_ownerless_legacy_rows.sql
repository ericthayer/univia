/*
  Archive demand letters and audits that have no owner, with their violations.
  See docs/specs/monitor-launch/SPEC.md, Phase 1, Decision 1.

  Rows move to the archive schema, which the API does not expose. Each row
  keeps archived_at and purge_after (30 days out). archive.purge_expired_ownerless()
  deletes rows whose purge_after has passed. Nothing runs it automatically.

  Forward-only. On a rebuilt database, every table here is empty.
*/

CREATE SCHEMA IF NOT EXISTS archive;
REVOKE ALL ON SCHEMA archive FROM PUBLIC, anon, authenticated;

CREATE TABLE archive.demand_letters_ownerless AS
SELECT letters.*, now() AS archived_at, now() + interval '30 days' AS purge_after
FROM public.demand_letters AS letters
WHERE letters.user_id IS NULL;

CREATE TABLE archive.accessibility_audits_ownerless AS
SELECT audits.*, now() AS archived_at, now() + interval '30 days' AS purge_after
FROM public.accessibility_audits AS audits
WHERE audits.user_id IS NULL;

CREATE TABLE archive.violations_ownerless AS
SELECT violations.*, now() AS archived_at, now() + interval '30 days' AS purge_after
FROM public.violations AS violations
JOIN public.accessibility_audits AS audits ON audits.id = violations.audit_id
WHERE audits.user_id IS NULL;

ALTER TABLE archive.demand_letters_ownerless ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive.accessibility_audits_ownerless ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive.violations_ownerless ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA archive FROM PUBLIC, anon, authenticated;

-- Violations cascade with their audit, so they are removed from the live table by the audit delete.
DELETE FROM public.accessibility_audits WHERE user_id IS NULL;
DELETE FROM public.demand_letters WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION archive.purge_expired_ownerless()
RETURNS integer
LANGUAGE plpgsql
SET search_path = archive
AS $$
DECLARE
  removed integer := 0;
  step integer;
BEGIN
  DELETE FROM archive.violations_ownerless WHERE purge_after <= now();
  GET DIAGNOSTICS step = ROW_COUNT;
  removed := removed + step;

  DELETE FROM archive.accessibility_audits_ownerless WHERE purge_after <= now();
  GET DIAGNOSTICS step = ROW_COUNT;
  removed := removed + step;

  DELETE FROM archive.demand_letters_ownerless WHERE purge_after <= now();
  GET DIAGNOSTICS step = ROW_COUNT;
  removed := removed + step;

  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION archive.purge_expired_ownerless() FROM PUBLIC, anon, authenticated;
