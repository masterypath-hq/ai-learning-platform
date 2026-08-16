export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS goal TEXT;
  `);
};

export const down = () => {
  throw new Error("Down migration not supported. Restore from backup.");
};
