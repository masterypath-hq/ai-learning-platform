-- Course service schema (local Docker initdb).
-- Run against your Supabase project or local Postgres before starting the service.

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subject VARCHAR(20) NOT NULL,
  track VARCHAR(40) NOT NULL,
  level VARCHAR(20) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  learning_objectives TEXT[],
  prerequisites TEXT[],
  estimated_duration_minutes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'GENERATING',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses (user_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status);
CREATE INDEX IF NOT EXISTS idx_courses_user_id_created_at ON courses (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  theme VARCHAR(500) NOT NULL,
  key_concepts TEXT[],
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules (course_id);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  explanation_content TEXT,
  key_takeaways TEXT[],
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, position)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons (module_id);

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
