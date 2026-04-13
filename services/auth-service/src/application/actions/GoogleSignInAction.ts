import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { ITokenService } from "../interfaces/ITokenService.js";
import type { IGoogleAuthProvider } from "../interfaces/IGoogleAuthProvider.js";
import type { IWelcomeEmailSender } from "../interfaces/IWelcomeEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { GoogleSignInResponse } from "@ai-learning-platform/shared";
import type { IGoogleSignInAction } from "../interfaces/IGoogleSignInAction.js";
import { v4 as uuidv4 } from "uuid";

const ACCESS_TOKEN_EXPIRES_SECONDS = 900;

/** Single responsibility: execute Google OAuth sign-in. (ISP: depends on IWelcomeEmailSender only.) */
export class GoogleSignInAction implements IGoogleSignInAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly googleAuthProvider: IGoogleAuthProvider,
    private readonly welcomeEmailSender: IWelcomeEmailSender,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(code: string): Promise<GoogleSignInResponse> {
    const googleUser = await this.googleAuthProvider.exchangeCodeForUserInfo(code);

    let user = await this.userRepo.findByGoogleId(googleUser.googleId);
    let isNewUser = false;
    let linkedExistingAccount = false;

    if (!user) {
      user = await this.userRepo.findByEmail(googleUser.email.toLowerCase().trim());

      if (user) {
        const linked = User.create({
          ...user.toJSON(),
          googleId: googleUser.googleId,
          authProvider: "google",
        });
        await this.userRepo.save(linked);
        user = linked;
        linkedExistingAccount = true;
      } else {
        const now = new Date();
        user = User.create({
          id: uuidv4(),
          email: googleUser.email.toLowerCase().trim(),
          passwordHash: null,
          name: googleUser.name,
          createdAt: now,
          emailVerifiedAt: googleUser.emailVerified ? now : null,
          authProvider: "google",
          googleId: googleUser.googleId,
        });
        await this.userRepo.save(user);
        isNewUser = true;

        await this.welcomeEmailSender.sendWelcome({
          to: user.email,
          name: user.name ?? undefined,
        });
      }
    }

    const accessToken = await this.tokenService.signAccessToken(
      { userId: user.id, email: user.email },
      ACCESS_TOKEN_EXPIRES_SECONDS
    );

    await this.eventPublisher.publish({
      type: AUTH_EVENTS.USER_SIGNED_IN_GOOGLE,
      payload: {
        userId: user.id,
        email: user.email,
        isNewUser,
        linkedExistingAccount,
        signedInAt: new Date().toISOString(),
      },
      occurredAt: new Date().toISOString(),
    });

    return {
      userId: user.id,
      email: user.email,
      tokens: { accessToken, expiresInSeconds: ACCESS_TOKEN_EXPIRES_SECONDS },
      isNewUser,
    };
  }
}
