/**
 * Prevents two concurrent POST /attempts requests for the same (user, type, scope)
 * from both passing the findInProgress check and creating duplicate in-progress
 * attempts. PgQuizAttemptRepository.create() catches the resulting unique violation.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempts_in_progress
      ON quiz_attempts (user_id, type, scope_id) WHERE status = 'in_progress';
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS uq_quiz_attempts_in_progress;`);
};
