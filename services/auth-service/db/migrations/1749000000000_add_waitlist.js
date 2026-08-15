/**
 * Pre-launch email capture (Pro upgrade waitlist, Finance & Trading "coming
 * soon" interest) — see JoinWaitlistAction. Not linked to `users`; someone
 * can join before they ever create an account.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      email      VARCHAR(255) NOT NULL UNIQUE,
      source     VARCHAR(50),
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS waitlist;`);
};
