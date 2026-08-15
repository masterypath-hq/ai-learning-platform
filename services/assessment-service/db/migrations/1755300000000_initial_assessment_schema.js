/**
 * Graded quiz attempts (module_quiz, course_final). Knowledge checks are ungraded
 * and formative — they're generated on the fly by ai-service and never persisted here.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
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
      -- module_id for module_quiz, course_id for course_final — the (user, type, scope) cooldown/in-progress key.
      scope_id       UUID                NOT NULL,
      status         quiz_attempt_status NOT NULL DEFAULT 'in_progress',
      questions      JSONB               NOT NULL, -- full QuizQuestion[] including the answer key; never sent to the client as-is
      answers        JSONB,
      score          INTEGER, -- 0-100
      passed         BOOLEAN,
      feedback       JSONB,
      started_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      submitted_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_course ON quiz_attempts (user_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_cooldown ON quiz_attempts (user_id, type, scope_id, submitted_at DESC);
  `);
};

/**
 * Not implemented — dropping attempt history is unsafe for production. Restore from backup instead.
 */
export const down = () => {
  throw new Error("Down migration not supported for initial_assessment_schema.");
};
