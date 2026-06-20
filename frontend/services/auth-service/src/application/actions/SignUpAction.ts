import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordHasher } from "../interfaces/IPasswordHasher.js";
import type { ISessionTokensIssuer } from "../interfaces/ISessionTokensIssuer.js";
import type { IWelcomeEmailSender } from "../interfaces/IWelcomeEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { SignUpResponse } from "@ai-learning-platform/shared";
import type { ISignUpAction } from "../interfaces/ISignUpAction.js";
import { v4 as uuidv4 } from "uuid";

/** Single responsibility: execute sign-up. (SOLID: S, O, I — depends only on IWelcomeEmailSender.) */
export class SignUpAction implements ISignUpAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionTokensIssuer: ISessionTokensIssuer,
    private readonly welcomeEmailSender: IWelcomeEmailSender,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(email: string, password: string, name?: string): Promise<SignUpResponse> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("USER_ALREADY_EXISTS");

    const passwordHash = await this.passwordHasher.hash(password);
    const now = new Date();
    const user = User.create({
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name?.trim() ?? null,
      planTier: "free",
      createdAt: now,
      emailVerifiedAt: null,
      authProvider: "local",
      googleId: null,
      githubId: null,
    });

    await this.userRepo.save(user);

    const session = await this.sessionTokensIssuer.issueForUser(user);

    await this.welcomeEmailSender
      .sendWelcome({ to: user.email, name: user.name ?? undefined })
      .catch((err: unknown) =>
        console.warn("[SignUpAction] Welcome email failed (non-fatal):", err)
      );
    await this.eventPublisher.publish({
      type: AUTH_EVENTS.USER_REGISTERED,
      payload: {
        userId: user.id,
        email: user.email,
        name: user.name ?? undefined,
        registeredAt: now.toISOString(),
      },
      occurredAt: now.toISOString(),
    });

    return {
      userId: user.id,
      email: user.email,
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresInSeconds: session.expiresInSeconds,
        refreshExpiresInSeconds: session.refreshExpiresInSeconds,
      },
    };
  }
}
