/**
 * Dedupes repeat knowledge-check passes the same way lesson_viewed/module_completed already
 * are, now that knowledge_check_completed drives lesson completion (see GetCourseProgressAction
 * / GetModuleStatusAction) rather than just being a fire-and-forget attempt log.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_records_knowledge_check_passed
      ON progress_records (user_id, lesson_id)
      WHERE activity_type = 'knowledge_check_completed' AND lesson_id IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS uq_progress_records_knowledge_check_passed;`);
};
