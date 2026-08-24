/**
 * Subscription model — domain entity. No framework or DB imports. (SOLID: S.)
 * MVP scope: only Pro subscriptions are persisted here (a free-tier user has no row).
 */
import type { SubscriptionProvider, SubscriptionStatus, Currency } from "@ai-learning-platform/shared";

export interface SubscriptionProps {
  id: string;
  userId: string;
  provider: SubscriptionProvider;
  status: SubscriptionStatus;
  currency: Currency;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
  paystackEmailToken: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static create(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get provider(): SubscriptionProvider {
    return this.props.provider;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }

  get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }

  get paystackCustomerCode(): string | null {
    return this.props.paystackCustomerCode;
  }

  get paystackSubscriptionCode(): string | null {
    return this.props.paystackSubscriptionCode;
  }

  get paystackEmailToken(): string | null {
    return this.props.paystackEmailToken;
  }

  get currentPeriodEnd(): Date | null {
    return this.props.currentPeriodEnd;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withStatus(status: SubscriptionStatus): Subscription {
    return Subscription.create({ ...this.props, status, updatedAt: new Date() });
  }

  withPeriodEnd(currentPeriodEnd: Date | null): Subscription {
    return Subscription.create({ ...this.props, currentPeriodEnd, updatedAt: new Date() });
  }

  /** True once the paid-for period has elapsed for a subscription that was cancelled. */
  hasLapsed(now: Date = new Date()): boolean {
    return (
      this.props.status === "cancelling" &&
      this.props.currentPeriodEnd !== null &&
      now >= this.props.currentPeriodEnd
    );
  }

  toJSON(): SubscriptionProps {
    return { ...this.props };
  }
}
