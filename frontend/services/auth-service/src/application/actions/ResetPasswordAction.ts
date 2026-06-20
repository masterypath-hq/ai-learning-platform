import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordResetTokenRepository } from "../interfaces/IPasswordResetTokenRepository.js";
import type { IPasswordHasher } from "../interfaces/IPasswordHasher.js";
import type { IPasswordChangedEmailSender } from "../interfaces/IPasswordChangedEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { ResetPasswordResponse } from "@ai-learning-platform/shared";
import type { IResetPasswordAction } from "../interfaces/IResetPasswordAction.js";
import crypto from "node:crypto";

/** ISP: depends only on IPasswordChangedEmailSender. */
export class ResetPasswordAction implements IResetPasswordAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly resetTokenRepo: IPasswordResetTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly passwordChangedEmailSender: IPasswordChangedEmailSender,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await this.resetTokenRepo.findByTokenHash(tokenHash);

    if (!resetToken || resetToken.isUsed() || resetToken.isExpired()) {
      throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }

    const user = await this.userRepo.findById(resetToken.userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const newHash = await this.passwordHasher.hash(newPassword);
    const updatedUser = User.create({ ...user.toJSON(), passwordHash: newHash });
    await this.userRepo.save(updatedUser);
    await this.resetTokenRepo.markUsed(resetToken.id, new Date());

    await this.passwordChangedEmailSender.sendPasswordChanged({
      to: user.email,
      name: user.name ?? undefined,
    });

    await this.eventPublisher.publish({
      type: AUTH_EVENTS.PASSWORD_RESET_COMPLETED,
      payload: { userId: user.id, completedAt: new Date().toISOString() },
      occurredAt: new Date().toISOString(),
    });

    return { message: "Password has been reset. You can sign in with your new password." };
  }
}
