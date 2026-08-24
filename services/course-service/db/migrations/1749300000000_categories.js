export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS categories (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name         TEXT        NOT NULL,
      slug         TEXT        UNIQUE NOT NULL,
      icon         TEXT,
      order_index  INT         NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO categories (name, slug)
    SELECT DISTINCT
      category,
      trim(BOTH '-' FROM lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')))
    FROM courses
    WHERE category IS NOT NULL
    ON CONFLICT (slug) DO NOTHING;

    ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories (id);

    UPDATE courses c
    SET category_id = cat.id
    FROM categories cat
    WHERE c.category = cat.name;

    DROP INDEX IF EXISTS idx_courses_category;
    ALTER TABLE courses DROP COLUMN IF EXISTS category;

    CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses (category_id);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
