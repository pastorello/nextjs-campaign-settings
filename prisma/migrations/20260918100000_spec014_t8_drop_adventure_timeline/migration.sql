-- SPEC-014 T8: `adventure.timeline` is superseded by calendar events
-- (T5/T6) and is dropped here. The DM confirmed on 2026-09-18 to go ahead,
-- after checking the DM's database that no adventure still carries planned
-- timeline text (0 of 2 at the time). This guard re-checks that at deploy
-- time rather than trusting the confirmation alone: it raises and aborts,
-- before anything is dropped, if a later deploy still finds a non-blank
-- value — the message says to move it into calendar events first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "adventure"
    WHERE "timeline" IS NOT NULL AND btrim("timeline") <> ''
  ) THEN
    RAISE EXCEPTION 'adventure.timeline still holds text on at least one row — move it into calendar events (SPEC-014 T6) before dropping the column';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "adventure" DROP COLUMN "timeline";
