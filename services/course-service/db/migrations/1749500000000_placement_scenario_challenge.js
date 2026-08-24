export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE placement_questions
      ADD COLUMN IF NOT EXISTS code_snippet   TEXT,
      ADD COLUMN IF NOT EXISTS code_language  TEXT,
      ADD COLUMN IF NOT EXISTS skill_id       UUID REFERENCES skills (id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_placement_questions_skill_id ON placement_questions (skill_id);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
