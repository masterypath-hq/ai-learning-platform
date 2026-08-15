import { CheckoutSessionRequestSchema } from "@ai-learning-platform/shared";

/** Request object for POST /billing/checkout-session. (OOP: encapsulates and validates input.) */
export class CreateCheckoutSessionRequest {
  private constructor(
    public readonly provider: "stripe" | "paystack",
    public readonly currency: "usd" | "ngn"
  ) {}

  static fromBody(body: unknown): { ok: true; request: CreateCheckoutSessionRequest } | { ok: false; error: string } {
    const parsed = CheckoutSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" };
    }
    return { ok: true, request: new CreateCheckoutSessionRequest(parsed.data.provider, parsed.data.currency) };
  }
}
