import type { Pool } from "pg";
import { Subscription } from "../../domain/models/Subscription.js";
import type { SubscriptionProvider, SubscriptionStatus, Currency } from "@ai-learning-platform/shared";
import type { ISubscriptionRepository } from "../../application/interfaces/ISubscriptionRepository.js";

const SELECT_COLS =
  "id, user_id, provider, status, currency, stripe_customer_id, stripe_subscription_id, " +
  "paystack_customer_code, paystack_subscription_code, paystack_email_token, current_period_end, created_at, updated_at";

export class PgSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const result = await this.pool.query(`SELECT ${SELECT_COLS} FROM subscriptions WHERE user_id = $1`, [userId]);
    if (result.rows.length === 0) return null;
    return this.rowToSubscription(result.rows[0]);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM subscriptions WHERE stripe_customer_id = $1`,
      [stripeCustomerId]
    );
    if (result.rows.length === 0) return null;
    return this.rowToSubscription(result.rows[0]);
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM subscriptions WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );
    if (result.rows.length === 0) return null;
    return this.rowToSubscription(result.rows[0]);
  }

  async findByPaystackSubscriptionCode(paystackSubscriptionCode: string): Promise<Subscription | null> {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM subscriptions WHERE paystack_subscription_code = $1`,
      [paystackSubscriptionCode]
    );
    if (result.rows.length === 0) return null;
    return this.rowToSubscription(result.rows[0]);
  }

  async upsert(subscription: Subscription): Promise<void> {
    const props = subscription.toJSON();
    await this.pool.query(
      `INSERT INTO subscriptions (
         id, user_id, provider, tier, status, currency,
         stripe_customer_id, stripe_subscription_id,
         paystack_customer_code, paystack_subscription_code, paystack_email_token,
         current_period_end, created_at, updated_at
       )
       VALUES ($1, $2, $3, 'pro', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id) DO UPDATE SET
         provider = EXCLUDED.provider,
         status = EXCLUDED.status,
         currency = EXCLUDED.currency,
         stripe_customer_id = EXCLUDED.stripe_customer_id,
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         paystack_customer_code = EXCLUDED.paystack_customer_code,
         paystack_subscription_code = EXCLUDED.paystack_subscription_code,
         paystack_email_token = EXCLUDED.paystack_email_token,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = EXCLUDED.updated_at`,
      [
        props.id,
        props.userId,
        props.provider,
        props.status,
        props.currency,
        props.stripeCustomerId,
        props.stripeSubscriptionId,
        props.paystackCustomerCode,
        props.paystackSubscriptionCode,
        props.paystackEmailToken,
        props.currentPeriodEnd,
        props.createdAt,
        props.updatedAt,
      ]
    );
  }

  private rowToSubscription(row: {
    id: string;
    user_id: string;
    provider: string;
    status: string;
    currency: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    paystack_customer_code: string | null;
    paystack_subscription_code: string | null;
    paystack_email_token: string | null;
    current_period_end: Date | null;
    created_at: Date;
    updated_at: Date;
  }): Subscription {
    return Subscription.create({
      id: row.id,
      userId: row.user_id,
      provider: row.provider as SubscriptionProvider,
      status: row.status as SubscriptionStatus,
      currency: row.currency as Currency,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      paystackCustomerCode: row.paystack_customer_code,
      paystackSubscriptionCode: row.paystack_subscription_code,
      paystackEmailToken: row.paystack_email_token,
      currentPeriodEnd: row.current_period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
