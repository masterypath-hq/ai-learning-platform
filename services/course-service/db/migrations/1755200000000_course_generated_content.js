/**
 * Adds the columns AI-generated course content fills in: course-level overview
 * fields, module key concepts, and inline lesson explanation content.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS prerequisites TEXT[] NOT NULL DEFAULT '{}';

    ALTER TABLE modules
      ADD COLUMN IF NOT EXISTS key_concepts TEXT[] NOT NULL DEFAULT '{}';

    ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS explanation_content TEXT,
      ADD COLUMN IF NOT EXISTS key_takeaways TEXT[] NOT NULL DEFAULT '{}';
  `);
};

/**
 * Not implemented — dropping columns is unsafe for production. Restore from backup instead.
 */
export const down = () => {
  throw new Error("Down migration not supported for course_generated_content.");
};
