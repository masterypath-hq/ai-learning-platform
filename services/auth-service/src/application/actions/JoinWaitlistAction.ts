import type { JoinWaitlistResponse } from "@ai-learning-platform/shared";
import type { IWaitlistRepository } from "../interfaces/IWaitlistRepository.js";
import type { IJoinWaitlistAction } from "../interfaces/IJoinWaitlistAction.js";

export class JoinWaitlistAction implements IJoinWaitlistAction {
  constructor(private readonly waitlistRepo: IWaitlistRepository) {}

  async execute(email: string, source?: string): Promise<JoinWaitlistResponse> {
    const { alreadyJoined } = await this.waitlistRepo.add(email.toLowerCase().trim(), source?.trim() || null);
    return {
      message: alreadyJoined ? "You're already on the list." : "You're on the list — we'll email you when it's ready.",
      alreadyJoined,
    };
  }
}
