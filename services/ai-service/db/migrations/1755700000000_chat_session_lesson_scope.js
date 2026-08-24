/**
 * Lesson-scoped chat: every new session is created for one specific lesson instead of a
 * freeform subject/track/topic pick. Columns are nullable rather than NOT NULL so pre-existing
 * generic sessions (created before this shipped) keep working read-only — only the application
 * layer (CreateChatSessionAction) requires them going forward.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE chat_sessions
      ADD COLUMN IF NOT EXISTS lesson_id UUID,
      ADD COLUMN IF NOT EXISTS module_id UUID,
      ADD COLUMN IF NOT EXISTS course_id UUID,
      ADD COLUMN IF NOT EXISTS lesson_snapshot JSONB,
      ADD COLUMN IF NOT EXISTS curriculum_snapshot JSONB;

    -- Re-clicking a lesson resumes its still-open session instead of spawning a duplicate.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_sessions_open_lesson
      ON chat_sessions (user_id, lesson_id)
      WHERE closed_at IS NULL AND lesson_id IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS uq_chat_sessions_open_lesson;
    ALTER TABLE chat_sessions
      DROP COLUMN IF EXISTS lesson_id,
      DROP COLUMN IF EXISTS module_id,
      DROP COLUMN IF EXISTS course_id,
      DROP COLUMN IF EXISTS lesson_snapshot,
      DROP COLUMN IF EXISTS curriculum_snapshot;
  `);
};
