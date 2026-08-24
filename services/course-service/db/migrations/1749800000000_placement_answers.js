export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS placement_answers (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID        NOT NULL,
      question_id      UUID        NOT NULL REFERENCES placement_questions (id) ON DELETE CASCADE,
      selected_option  TEXT        NOT NULL CHECK (selected_option IN ('a','b','c','d')),
      is_correct       BOOLEAN     NOT NULL,
      answered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_placement_answers_user_id ON placement_answers (user_id);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
