-- Progress service schema (local Docker initdb). Prefer `npm run migrate:progress` for Supabase/CI.
-- Keep in sync with `db/migrations/1755500000000_initial_progress_schema.js`.

DO $$ BEGIN
  CREATE TYPE progress_activity_type AS ENUM (
    'lesson_viewed', 'knowledge_check_completed', 'module_completed', 'chat_session_closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS progress_records (
  id             UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID                    NOT NULL,
  course_id      UUID,
  module_id      UUID,
  lesson_id      UUID,
  activity_type  progress_activity_type  NOT NULL,
  occurred_at    TIMESTAMPTZ             NOT NULL,
  created_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_records_user_course ON progress_records (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_records_user_occurred ON progress_records (user_id, occurred_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_records_lesson_view
  ON progress_records (user_id, lesson_id)
  WHERE activity_type = 'lesson_viewed' AND lesson_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS streaks (
  user_id             UUID         PRIMARY KEY,
  current_streak      INTEGER      NOT NULL DEFAULT 0,
  longest_streak      INTEGER      NOT NULL DEFAULT 0,
  last_activity_date  DATE,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
