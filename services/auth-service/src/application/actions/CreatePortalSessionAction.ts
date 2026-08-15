import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IBillingProvider } from "../interfaces/IBillingProvider.js";
import type { ICreatePortalSessionAction } from "../interfaces/ICreatePortalSessionAction.js";

export class CreatePortalSessionAction implements ICreatePortalSessionAction {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly stripeProvider: IBillingProvider,
    private readonly portalReturnUrl: string
  ) {}

  async execute(userId: string): Promise<{ url: string }> {
    const sub = await this.subscriptionRepo.findByUserId(userId);
    if (!sub || sub.provider !== "stripe" || !sub.stripeCustomerId || !this.stripeProvider.createPortalSession) {
      throw new Error("PORTAL_NOT_SUPPORTED");
    }
    return this.stripeProvider.createPortalSession(sub.stripeCustomerId, this.portalReturnUrl);
  }
}
