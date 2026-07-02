export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS placement_questions (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id         UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      level             phase_level NOT NULL,
      question          TEXT        NOT NULL,
      options           JSONB       NOT NULL,
      correct_option    TEXT        NOT NULL CHECK (correct_option IN ('a','b','c','d')),
      phase_if_correct  phase_level NOT NULL,
      phase_if_wrong    phase_level NOT NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (course_id, level)
    );

    CREATE INDEX IF NOT EXISTS idx_placement_questions_course_level
      ON placement_questions (course_id, level);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
