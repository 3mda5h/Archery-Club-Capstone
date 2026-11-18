-- Add per-end X count and end order to "end".
-- Approved by Emily, 2026-11-17.
BEGIN;

ALTER TABLE "end"
  ADD COLUMN total_x    smallint NOT NULL DEFAULT 0,
  ADD COLUMN end_number smallint;

-- Number any existing ends 1, 2, 3... within each scorecard.
UPDATE "end" e
SET end_number = n.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY scorecard_fk ORDER BY id) AS rn
  FROM "end"
) n
WHERE e.id = n.id;

ALTER TABLE "end"
  ALTER COLUMN end_number SET NOT NULL,
  ADD CONSTRAINT end_scorecard_number_key UNIQUE (scorecard_fk, end_number);

COMMIT;