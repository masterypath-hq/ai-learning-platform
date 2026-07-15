export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS skills (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id   UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
      name        TEXT        NOT NULL,
      icon        TEXT,
      order_index INT         NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (course_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_skills_course_id ON skills (course_id);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
