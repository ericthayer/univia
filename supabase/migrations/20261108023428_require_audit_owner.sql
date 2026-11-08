/*
  Every audit has an owner, as letters already do.
  See docs/specs/monitor-launch/SPEC.md, Phase 2.

  run-lighthouse-audit no longer accepts a publishable key on its own, so it
  always stores the caller's user id. Deploy that function version before
  applying this, or a key-only call to the old version fails at insert time.

  This stops before changing anything while ownerless audits remain. There is
  no safe automatic owner for them: archive or delete them first, as Decision 1
  did, and never assign them to an admin or to whoever is signed in.

  Reversal: ALTER TABLE public.accessibility_audits ALTER COLUMN user_id DROP NOT NULL;
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.accessibility_audits WHERE user_id IS NULL) THEN
    RAISE EXCEPTION
      'require audit owner blocked: ownerless audits remain; archive or delete them first';
  END IF;
END;
$$;

ALTER TABLE public.accessibility_audits ALTER COLUMN user_id SET NOT NULL;
