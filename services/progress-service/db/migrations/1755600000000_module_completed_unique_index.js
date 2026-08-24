/**
 * Dedupes retried module_completed publishes the same way lesson_viewed already is, and keeps
 * GetModuleStatusAction's completed-module lookup index-backed.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_records_module_completed
      ON progress_records (user_id, module_id)
      WHERE activity_type = 'module_completed' AND module_id IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS uq_progress_records_module_completed;`);
};
