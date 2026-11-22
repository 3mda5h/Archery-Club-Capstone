BEGIN;
ALTER TABLE "end"
  DROP CONSTRAINT end_scorecard_number_key,
  DROP COLUMN end_number,
  DROP COLUMN total_x;
COMMIT;