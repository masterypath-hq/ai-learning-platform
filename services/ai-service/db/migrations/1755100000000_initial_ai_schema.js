/**
 * Chat sessions + messages for the AI tutor (Stage 3).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE chat_subject_area AS ENUM ('finance', 'programming');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE chat_message_role AS ENUM ('user', 'assistant');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      subject_area chat_subject_area NOT NULL,
      track TEXT NOT NULL,
      topic TEXT,
      summary TEXT,
      suggested_next_questions TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_created_at ON chat_sessions (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
      role chat_message_role NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id_created_at ON chat_messages (session_id, created_at ASC);
  `);
};

/**
 * Not implemented — dropping chat tables is unsafe for production. Restore from backup instead.
 */
export const down = () => {
  throw new Error("Down migration not supported for initial_ai_schema.");
};
