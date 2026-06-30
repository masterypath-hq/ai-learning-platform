/**
 * Adds a `category` heading column to courses (e.g. "Programming & AI").
 * Also converts courses.slug from the track_slug enum to plain TEXT
 * so admins can freely add new courses without a schema change.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    -- Change courses.slug from the track_slug enum to plain TEXT
    ALTER TABLE courses ALTER COLUMN slug TYPE TEXT USING slug::TEXT;
    DROP TYPE IF EXISTS track_slug;

    -- Add a category heading to each course
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
