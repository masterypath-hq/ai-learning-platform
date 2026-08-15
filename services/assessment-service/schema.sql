-- Assessment service schema (local Docker initdb). Prefer `npm run migrate:assessment` for Supabase/CI.
-- Keep in sync with `db/migrations/1755300000000_initial_assessment_schema.js`.

DO $$ BEGIN
  CREATE TYPE quiz_attempt_type AS ENUM ('module_quiz', 'course_final');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quiz_attempt_status AS ENUM ('in_progress', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID                NOT NULL,
  course_id      UUID                NOT NULL,
  module_id      UUID,
  type           quiz_attempt_type   NOT NULL,
  scope_id       UUID                NOT NULL,
  status         quiz_attempt_status NOT NULL DEFAULT 'in_progress',
  questions      JSONB               NOT NULL,
  answers        JSONB,
  score          INTEGER,
  passed         BOOLEAN,
  feedback       JSONB,
  started_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_course ON quiz_attempts (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_cooldown ON quiz_attempts (user_id, type, scope_id, submitted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempts_in_progress ON quiz_attempts (user_id, type, scope_id) WHERE status = 'in_progress';
