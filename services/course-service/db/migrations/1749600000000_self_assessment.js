export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE self_assessment_level AS ENUM (
        'complete_beginner', 'some_exposure', 'intermediate', 'advanced'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS self_assessed_level self_assessment_level,
      ADD COLUMN IF NOT EXISTS self_assessment_completed_at TIMESTAMPTZ;
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
