import type { Request, Response } from "express";
import type { SubscriptionProvider } from "@ai-learning-platform/shared";
import type { ICreateCheckoutSessionAction } from "../../../application/interfaces/ICreateCheckoutSessionAction.js";
import type { ICreatePortalSessionAction } from "../../../application/interfaces/ICreatePortalSessionAction.js";
import type { ICancelSubscriptionAction } from "../../../application/interfaces/ICancelSubscriptionAction.js";
import type { IHandleWebhookAction } from "../../../application/interfaces/IHandleWebhookAction.js";
import type { IGetSubscriptionStatusAction } from "../../../application/interfaces/IGetSubscriptionStatusAction.js";
import { CreateCheckoutSessionRequest } from "../request/CreateCheckoutSessionRequest.js";
import type { AuthedRequest } from "../middleware/bearerAuth.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  UNPROCESSABLE: 422,
} as const;

/** Controller: HTTP → Request objects → billing actions. (SOLID: S, D — depends only on action interfaces.) */
export class BillingController {
  constructor(
    private readonly createCheckoutSessionAction: ICreateCheckoutSessionAction,
    private readonly createPortalSessionAction: ICreatePortalSessionAction,
    private readonly cancelSubscriptionAction: ICancelSubscriptionAction,
    private readonly handleWebhookAction: IHandleWebhookAction,
    private readonly getSubscriptionStatusAction: IGetSubscriptionStatusAction
  ) {}

  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    const parsed = CreateCheckoutSessionRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error });
      return;
    }
    const { userId, email } = (req as AuthedRequest).auth;
    const result = await this.createCheckoutSessionAction.execute(
      userId,
      email,
      parsed.request.provider,
      parsed.request.currency
    );
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }

  async createPortalSession(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthedRequest).auth;
    try {
      const result = await this.createPortalSessionAction.execute(userId);
      res.status(HTTP.OK).json({ success: true, data: result, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "PORTAL_NOT_SUPPORTED") {
        res.status(HTTP.UNPROCESSABLE).json({
          success: false,
          data: null,
          error: "No Stripe subscription found for this account.",
        });
        return;
      }
      throw e;
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthedRequest).auth;
    try {
      const result = await this.cancelSubscriptionAction.execute(userId);
      res.status(HTTP.OK).json({ success: true, data: result, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "NO_ACTIVE_SUBSCRIPTION") {
        res.status(HTTP.UNPROCESSABLE).json({ success: false, data: null, error: "No active subscription found." });
        return;
      }
      if (e instanceof Error && e.message === "CANCEL_NOT_SUPPORTED_USE_PORTAL") {
        res.status(HTTP.UNPROCESSABLE).json({
          success: false,
          data: null,
          error: "Manage your Stripe subscription from the billing portal instead.",
        });
        return;
      }
      throw e;
    }
  }

  async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthedRequest).auth;
    const result = await this.getSubscriptionStatusAction.execute(userId);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }

  async webhook(provider: SubscriptionProvider, req: Request, res: Response): Promise<void> {
    const signatureHeader = provider === "stripe" ? req.headers["stripe-signature"] : req.headers["x-paystack-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : (signatureHeader ?? "");
    const rawBody = req.body as Buffer;

    try {
      await this.handleWebhookAction.execute(provider, rawBody, signature);
      res.status(HTTP.OK).json({ success: true, data: null, error: null });
    } catch (e) {
      console.error(`[BillingController] ${provider} webhook rejected:`, e instanceof Error ? e.message : e);
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: "Invalid webhook signature." });
    }
  }
}
