export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE confidence_level AS ENUM (
        'never_heard', 'seen_it', 'used_it', 'confident'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS user_skill_confidence (
      id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID              NOT NULL,
      skill_id   UUID              NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
      level      confidence_level  NOT NULL,
      rated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, skill_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_skill_confidence_user_id ON user_skill_confidence (user_id);
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
