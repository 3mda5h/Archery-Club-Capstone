-- Matches the live Supabase schema as of 2026-11-17. Changes go in new
-- numbered migrations, never in this file.

CREATE TABLE member (
  id             bigserial PRIMARY KEY,
  full_name      text NOT NULL,
  user_name      text NOT NULL UNIQUE,
  date_joined    date NOT NULL,
  last_submitted date
);

CREATE TABLE event (
  id         bigserial PRIMARY KEY,
  event_type varchar NOT NULL CHECK (event_type IN ('tournament', 'league_comp', 'pinshoot'))
);

CREATE TABLE preset (
  id             bigserial PRIMARY KEY,
  type           varchar NOT NULL CHECK (type IN ('NFAA_indoor_sectionals', 'USAA_outdoor_state', 'beaver_bowdown', 'archers_afield')),
  level          varchar NOT NULL CHECK (level IN ('state', 'sectional', 'national', 'regional', 'local')),
  indoor         boolean NOT NULL,
  hosted_by      varchar CHECK (hosted_by IN ('OBH', 'cascadian_bowmen', 'OSU_archery_club', 'silvan_archers', 'benton_bowmen', 'archers_afield')),
  governing_body varchar CHECK (governing_body IN ('NFAA', 'USAA')),
  total_arrows   smallint NOT NULL,
  arrows_per_end smallint NOT NULL,
  num_scorecards smallint NOT NULL,
  target_type    varchar NOT NULL CHECK (target_type IN ('blueface', 'multicolor', 'field')),
  distance_yd    smallint,
  target_size    smallint
);

CREATE TABLE tournament (
  id             bigint PRIMARY KEY REFERENCES event(id),
  preset_id      bigint NOT NULL REFERENCES preset(id),
  display_name   text NOT NULL,
  type           varchar NOT NULL CHECK (type IN ('NFAA_indoor_sectionals', 'USAA_outdoor_state', 'beaver_bowdown', 'archers_afield')),
  level          varchar NOT NULL CHECK (level IN ('state', 'sectional', 'national', 'regional', 'local')),
  indoor         boolean NOT NULL,
  hosted_by      varchar CHECK (hosted_by IN ('OBH', 'cascadian_bowmen', 'OSU_archery_club', 'silvan_archers', 'benton_bowmen', 'archers_afield')),
  governing_body varchar CHECK (governing_body IN ('NFAA', 'USAA')),
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  total_arrows   smallint NOT NULL,
  arrows_per_end smallint NOT NULL,
  num_scorecards smallint NOT NULL,
  target_type    varchar NOT NULL CHECK (target_type IN ('blueface', 'multicolor', 'field')),
  distance_yd    smallint,
  target_size    smallint
);

CREATE TABLE league_comp (
  id   bigint PRIMARY KEY REFERENCES event(id),
  term text NOT NULL,
  year smallint NOT NULL
);

CREATE TABLE pinshoot (
  id   bigint PRIMARY KEY REFERENCES event(id),
  date date NOT NULL
);

CREATE TABLE scorecard (
  id             bigserial PRIMARY KEY,
  event_fk       bigint NOT NULL REFERENCES event(id),
  member_fk      bigint NOT NULL REFERENCES member(id),
  submitted_at   timestamptz NOT NULL,
  distance_yd    smallint NOT NULL,
  target_size_cm smallint NOT NULL,
  bow            varchar NOT NULL CHECK (bow IN ('barebow', 'recurve', 'compound')),
  final_score    smallint NOT NULL,
  total_x        smallint,
  multi_spot     boolean NOT NULL DEFAULT false
);

-- "end" is a reserved word in SQL, so always quote it.
CREATE TABLE "end" (
  id           bigserial PRIMARY KEY,
  scorecard_fk bigint NOT NULL REFERENCES scorecard(id),
  arrow_1      smallint NOT NULL,
  arrow_2      smallint NOT NULL,
  arrow_3      smallint NOT NULL,
  arrow_4      smallint,
  arrow_5      smallint,
  arrow_6      smallint
);

CREATE TABLE league_team (
  id             bigserial PRIMARY KEY,
  league_comp_fk bigint NOT NULL REFERENCES league_comp(id),
  date           date NOT NULL
);

CREATE TABLE league_team_member (
  id             bigserial PRIMARY KEY,
  league_team_fk bigint NOT NULL REFERENCES league_team(id),
  member_fk      bigint NOT NULL REFERENCES member(id)
);

CREATE TABLE member_league_avg (
  id             bigserial PRIMARY KEY,
  league_comp_fk bigint NOT NULL REFERENCES league_comp(id),
  member_fk      bigint NOT NULL REFERENCES member(id),
  avg            smallint NOT NULL,
  last_updated   date NOT NULL,
  distance_yd    smallint NOT NULL,
  target_size_cm smallint NOT NULL,
  bow            varchar NOT NULL CHECK (bow IN ('barebow', 'recurve', 'compound'))
);

CREATE TABLE member_pin (
  id        bigserial PRIMARY KEY,
  member_fk bigint NOT NULL REFERENCES member(id),
  bow       varchar NOT NULL CHECK (bow IN ('barebow', 'recurve', 'compound')),
  pin_num   smallint NOT NULL
);-- Add per-end X count and end order to "end".
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