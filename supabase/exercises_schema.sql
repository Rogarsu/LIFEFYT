-- ============================================================
-- LIFEFYT — Exercise Bank + Program System
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ─── 1. EXERCISES ────────────────────────────────────────────
DROP TABLE IF EXISTS program_blocks CASCADE;
DROP TABLE IF EXISTS user_programs  CASCADE;
DROP TABLE IF EXISTS exercises      CASCADE;

CREATE TABLE exercises (
  id                 TEXT PRIMARY KEY,
  name               TEXT        NOT NULL,
  name_es            TEXT        NOT NULL,
  muscle_group       TEXT        NOT NULL,  -- 'upperBody' | 'lowerBody' | 'core'
  muscle_target      TEXT        NOT NULL,  -- 'chest_upper' | 'quad' | 'bicep' | …
  primary_muscles    TEXT[]      NOT NULL DEFAULT '{}',
  secondary_muscles  TEXT[]      NOT NULL DEFAULT '{}',
  equipment          TEXT[]      NOT NULL DEFAULT '{}',
  difficulty         SMALLINT    NOT NULL CHECK (difficulty IN (1,2,3)),
  type               TEXT        NOT NULL CHECK (type IN ('compound','isolation')),
  compound_bonus     NUMERIC     NOT NULL DEFAULT 1.0,
  image              TEXT,
  instructions       TEXT[]      NOT NULL DEFAULT '{}',
  -- sets/reps/rest per level
  sets_beginner      TEXT        NOT NULL,
  sets_intermediate  TEXT        NOT NULL,
  sets_advanced      TEXT        NOT NULL,
  reps_beginner      TEXT        NOT NULL,
  reps_intermediate  TEXT        NOT NULL,
  reps_advanced      TEXT        NOT NULL,
  rest_beginner      INTEGER     NOT NULL,
  rest_intermediate  INTEGER     NOT NULL,
  rest_advanced      INTEGER     NOT NULL,
  -- Extended for program system (populated later)
  method_compatible  TEXT[]      NOT NULL DEFAULT '{}',
  movement_pattern   TEXT,       -- 'push'|'pull'|'squat'|'hinge'|'carry'|'core'
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises are public read-only
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_public_read" ON exercises
  FOR SELECT USING (true);

-- ─── 2. USER PROGRAMS ────────────────────────────────────────
CREATE TABLE user_programs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_months   INTEGER     NOT NULL CHECK (duration_months BETWEEN 1 AND 6),
  start_date        DATE        NOT NULL,
  current_block     INTEGER     NOT NULL DEFAULT 1,
  current_week      INTEGER     NOT NULL DEFAULT 1,
  training_method   TEXT        NOT NULL,  -- 'traditional' | 'supersets' | etc.
  goal              TEXT        NOT NULL,  -- 'hypertrophy' | 'body_composition' | etc.
  experience        TEXT        NOT NULL,  -- 'beginner' | 'intermediate' | 'advanced'
  days_per_week     INTEGER     NOT NULL,
  equipment         TEXT        NOT NULL,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_own" ON user_programs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. PROGRAM BLOCKS ───────────────────────────────────────
-- Each program has multiple 4-week blocks.
-- exercise_slots: which exercises rotate in each slot per block.
CREATE TABLE program_blocks (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     UUID     NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
  block_number   INTEGER  NOT NULL,
  weeks          INTEGER  NOT NULL DEFAULT 4,
  method         TEXT     NOT NULL,
  is_deload      BOOLEAN  NOT NULL DEFAULT FALSE,
  -- JSONB: [{slot:'chest_main', exercise_ids:['incline_press_barbell','incline_press_dumbbell'], current_idx:0}]
  exercise_slots JSONB    NOT NULL DEFAULT '[]',
  sets_override  TEXT,    -- null = use exercise default
  reps_override  TEXT,
  rest_override  INTEGER,
  tempo          TEXT,    -- e.g. '4-0-2-1' for TUT method
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, block_number)
);

ALTER TABLE program_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_own" ON program_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_programs
      WHERE user_programs.id = program_blocks.program_id
        AND user_programs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_programs
      WHERE user_programs.id = program_blocks.program_id
        AND user_programs.user_id = auth.uid()
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_exercises_muscle_target ON exercises (muscle_target);
CREATE INDEX idx_exercises_muscle_group  ON exercises (muscle_group);
CREATE INDEX idx_exercises_difficulty    ON exercises (difficulty);
CREATE INDEX idx_user_programs_user      ON user_programs (user_id);
CREATE INDEX idx_program_blocks_program  ON program_blocks (program_id);
