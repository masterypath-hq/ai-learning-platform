/**
 * Subscription/tier contracts. New contracts use Zod so services can validate
 * at the boundary instead of trusting the shape; existing auth/course contracts
 * predate this convention and stay as plain interfaces.
 */
import { z } from "zod";

export const SubscriptionTierSchema = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SubscriptionProviderSchema = z.enum(["stripe", "paystack"]);
export type SubscriptionProvider = z.infer<typeof SubscriptionProviderSchema>;

export const CurrencySchema = z.enum(["usd", "ngn"]);
export type Currency = z.infer<typeof CurrencySchema>;

export const SubscriptionStatusSchema = z.enum(["active", "cancelling", "cancelled", "past_due"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  userId: z.string(),
  tier: SubscriptionTierSchema,
  provider: SubscriptionProviderSchema,
  status: SubscriptionStatusSchema,
  currency: CurrencySchema,
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  paystackCustomerCode: z.string().nullable(),
  paystackSubscriptionCode: z.string().nullable(),
  paystackEmailToken: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(), // ISO 8601
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ----- Billing API contracts -----

export const CheckoutSessionRequestSchema = z.object({
  provider: SubscriptionProviderSchema,
  currency: CurrencySchema,
});
export type CheckoutSessionRequest = z.infer<typeof CheckoutSessionRequestSchema>;

export const CheckoutSessionResponseSchema = z.object({ url: z.string() });
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;

export const PortalSessionResponseSchema = z.object({ url: z.string() });
export type PortalSessionResponse = z.infer<typeof PortalSessionResponseSchema>;

export const CancelSubscriptionResponseSchema = z.object({ message: z.string() });
export type CancelSubscriptionResponse = z.infer<typeof CancelSubscriptionResponseSchema>;

export const SubscriptionStatusResponseSchema = z.object({
  tier: SubscriptionTierSchema,
  provider: SubscriptionProviderSchema.nullable(),
  status: SubscriptionStatusSchema.nullable(),
  currency: CurrencySchema.nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelling: z.boolean(),
});
export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>;
