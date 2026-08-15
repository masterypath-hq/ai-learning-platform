import express from "express";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { BillingController } from "../controllers/BillingController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Split into two registration passes because Stripe/Paystack webhooks need the
 * raw request body for signature verification — they must be mounted with
 * `express.raw()` BEFORE the app's global `express.json()` runs. See App.ts.
 */
export class BillingResource {
  constructor(
    private readonly app: Express,
    private readonly controller: BillingController,
    private readonly bearerAuth: RequestHandler
  ) {}

  registerWebhooks(): void {
    const raw = express.raw({ type: "application/json" });
    this.app.post(
      "/api/v1/billing/webhooks/stripe",
      raw,
      this.wrapAsync((req, res) => this.controller.webhook("stripe", req, res))
    );
    this.app.post(
      "/api/v1/billing/webhooks/paystack",
      raw,
      this.wrapAsync((req, res) => this.controller.webhook("paystack", req, res))
    );
  }

  registerAuthenticated(): void {
    this.app.post(
      "/api/v1/billing/checkout-session",
      this.bearerAuth,
      this.wrapAsync((req, res) => this.controller.createCheckoutSession(req, res))
    );
    this.app.post(
      "/api/v1/billing/portal-session",
      this.bearerAuth,
      this.wrapAsync((req, res) => this.controller.createPortalSession(req, res))
    );
    this.app.post(
      "/api/v1/billing/cancel",
      this.bearerAuth,
      this.wrapAsync((req, res) => this.controller.cancelSubscription(req, res))
    );
    this.app.get(
      "/api/v1/billing/subscription",
      this.bearerAuth,
      this.wrapAsync((req, res) => this.controller.getSubscriptionStatus(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
