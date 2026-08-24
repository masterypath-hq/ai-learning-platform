/**
 * Billing: dual-provider (Stripe + Paystack) subscriptions, plus webhook
 * idempotency tracking. See CreateCheckoutSessionAction/HandleWebhookAction.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                     UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      provider                    VARCHAR(20)  NOT NULL,
      tier                        VARCHAR(20)  NOT NULL DEFAULT 'pro',
      status                      VARCHAR(20)  NOT NULL DEFAULT 'active',
      currency                    VARCHAR(3)   NOT NULL,
      stripe_customer_id          VARCHAR(255),
      stripe_subscription_id      VARCHAR(255),
      paystack_customer_code      VARCHAR(255),
      paystack_subscription_code  VARCHAR(255),
      paystack_email_token        VARCHAR(255),
      current_period_end          TIMESTAMPTZ,
      created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
      ON subscriptions (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
      ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paystack_subscription_code
      ON subscriptions (paystack_subscription_code) WHERE paystack_subscription_code IS NOT NULL;

    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      provider   VARCHAR(20)  NOT NULL,
      event_id   VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      UNIQUE (provider, event_id)
    );
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS processed_webhook_events;
    DROP TABLE IF EXISTS subscriptions;
  `);
};
