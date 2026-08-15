import type { SubscriptionProvider } from "@ai-learning-platform/shared";

export interface IHandleWebhookAction {
  /** Throws on an invalid signature (caller maps to 400); otherwise always resolves. */
  execute(provider: SubscriptionProvider, rawBody: Buffer, signatureHeader: string): Promise<void>;
}
