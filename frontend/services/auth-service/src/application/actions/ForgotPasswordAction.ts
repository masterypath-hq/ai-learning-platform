import { PasswordResetToken } from "../../domain/models/PasswordResetToken.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordResetTokenRepository } from "../interfaces/IPasswordResetTokenRepository.js";
import type { IPasswordResetEmailSender } from "../interfaces/IPasswordResetEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { ForgotPasswordResponse } from "@ai-learning-platform/shared";
import type { IForgotPasswordAction } from "../interfaces/IForgotPasswordAction.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "node:crypto";

const RESET_TOKEN_EXPIRY_MINUTES = 60;
const RESET_LINK_PATH = "/reset-password";

/** ISP: depends only on IPasswordResetEmailSender. */
export class ForgotPasswordAction implements IForgotPasswordAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly resetTokenRepo: IPasswordResetTokenRepository,
    private readonly passwordResetEmailSender: IPasswordResetEmailSender,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user) return { message: "If an account exists, you will receive a reset link." };

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    const now = new Date();

    const token = PasswordResetToken.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: now,
    });
    await this.resetTokenRepo.save(token);

    const resetLink = `${resetLinkBaseUrl.replace(/\/$/, "")}${RESET_LINK_PATH}?token=${rawToken}`;
    await this.passwordResetEmailSender.sendPasswordReset({
      to: user.email,
      resetLink,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });

    await this.eventPublisher.publish({
      type: AUTH_EVENTS.PASSWORD_RESET_REQUESTED,
      payload: {
        userId: user.id,
        email: user.email,
        resetTokenId: token.id,
        requestedAt: now.toISOString(),
      },
      occurredAt: now.toISOString(),
    });

    return { message: "If an account exists, you will receive a reset link." };
  }
}
