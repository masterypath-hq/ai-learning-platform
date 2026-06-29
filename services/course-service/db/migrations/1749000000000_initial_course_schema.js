/**
 * Canonical course schema: courses, modules, lessons, worked_examples, practice_exercises.
 * Idempotent — uses IF NOT EXISTS so it's safe on DBs already bootstrapped from schema.sql.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE track_slug AS ENUM (
        'backend', 'frontend', 'fullstack', 'ai-engineering', 'data-analysis', 'cybersecurity'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE phase_level AS ENUM ('foundation', 'intermediate', 'advanced', 'mastery');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'completed', 'dropped');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY,
      slug track_slug UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      primary_language TEXT,
      thumbnail_url TEXT,
      duration_weeks INT,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses (is_published);

    CREATE TABLE IF NOT EXISTS modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
      phase phase_level NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INT NOT NULL,
      duration_weeks INT,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (course_id, order_index)
    );

    CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules (course_id);

    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      content_url TEXT,
      content_type TEXT DEFAULT 'article',
      duration_mins INT,
      order_index INT NOT NULL,
      is_published BOOLEAN DEFAULT FALSE,
      is_project BOOLEAN DEFAULT FALSE,
      project_github_required BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (module_id, order_index)
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons (module_id);

    CREATE TABLE IF NOT EXISTS enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
      status enrollment_status DEFAULT 'active',
      current_phase phase_level DEFAULT 'foundation',
      enrolled_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, course_id)
    );

    CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments (user_id);

    CREATE TABLE IF NOT EXISTS worked_examples (
      id UUID PRIMARY KEY,
      lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      solution TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lesson_id, position)
    );

    CREATE INDEX IF NOT EXISTS idx_worked_examples_lesson_id ON worked_examples (lesson_id);

    CREATE TABLE IF NOT EXISTS practice_exercises (
      id UUID PRIMARY KEY,
      lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      prompt TEXT NOT NULL,
      hints TEXT[],
      sample_solution TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lesson_id)
    );

    CREATE INDEX IF NOT EXISTS idx_practice_exercises_lesson_id ON practice_exercises (lesson_id);
  `);
};

/**
 * Not implemented — dropping course tables is unsafe for production. Restore from backup instead.
 */
export const down = () => {
  throw new Error("Down migration not supported for initial_course_schema.");
};
