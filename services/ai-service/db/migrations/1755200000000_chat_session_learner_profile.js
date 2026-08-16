/**
 * Optional freeform learner-profile hint on chat sessions — used by the mobile
 * second-platform accelerator ("experienced mobile developer, new to Kotlin") to give
 * the tutor an upfront signal instead of waiting to infer level from the conversation.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS learner_profile TEXT;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE chat_sessions DROP COLUMN IF EXISTS learner_profile;
  `);
};
