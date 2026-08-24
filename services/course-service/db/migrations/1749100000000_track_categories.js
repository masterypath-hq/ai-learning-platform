export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE courses ALTER COLUMN slug TYPE TEXT USING slug::TEXT;
    DROP TYPE IF EXISTS track_slug;

    ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;

    UPDATE courses
    SET category = 'Programming & AI'
    WHERE slug IN ('backend', 'frontend', 'fullstack', 'ai-engineering', 'data-analysis', 'cybersecurity');

    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
