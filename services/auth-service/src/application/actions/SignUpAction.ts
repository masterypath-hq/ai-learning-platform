import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordHasher } from "../interfaces/IPasswordHasher.js";
import type { ITokenService } from "../interfaces/ITokenService.js";
import type { IWelcomeEmailSender } from "../interfaces/IWelcomeEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { SignUpResponse } from "@ai-learning-platform/shared";
import type { ISignUpAction } from "../interfaces/ISignUpAction.js";
import { v4 as uuidv4 } from "uuid";

const ACCESS_TOKEN_EXPIRES_SECONDS = 900;

/** Single responsibility: execute sign-up. (SOLID: S, O, I — depends only on IWelcomeEmailSender.) */
export class SignUpAction implements ISignUpAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
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
      createdAt: now,
      emailVerifiedAt: null,
    });

    await this.userRepo.save(user);

    const accessToken = await this.tokenService.signAccessToken(
      { userId: user.id, email: user.email },
      ACCESS_TOKEN_EXPIRES_SECONDS
    );

    await this.welcomeEmailSender.sendWelcome({ to: user.email, name: user.name ?? undefined });
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
      tokens: { accessToken, expiresInSeconds: ACCESS_TOKEN_EXPIRES_SECONDS },
    };
  }
}
