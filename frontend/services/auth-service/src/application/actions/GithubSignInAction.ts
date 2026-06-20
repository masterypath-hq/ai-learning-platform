import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { ISessionTokensIssuer } from "../interfaces/ISessionTokensIssuer.js";
import type { IGithubAuthProvider } from "../interfaces/IGithubAuthProvider.js";
import type { IWelcomeEmailSender } from "../interfaces/IWelcomeEmailSender.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import { AUTH_EVENTS } from "@ai-learning-platform/shared";
import type { GithubSignInResponse } from "@ai-learning-platform/shared";
import type { IGithubSignInAction } from "../interfaces/IGithubSignInAction.js";
import { v4 as uuidv4 } from "uuid";

export class GithubSignInAction implements IGithubSignInAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionTokensIssuer: ISessionTokensIssuer,
    private readonly githubAuthProvider: IGithubAuthProvider,
    private readonly welcomeEmailSender: IWelcomeEmailSender,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(code: string): Promise<GithubSignInResponse> {
    const githubUser = await this.githubAuthProvider.exchangeCodeForUserInfo(code);

    let user = await this.userRepo.findByGithubId(githubUser.githubId);
    let isNewUser = false;
    let linkedExistingAccount = false;

    if (!user) {
      user = await this.userRepo.findByEmail(githubUser.email);

      if (user) {
        const linked = User.create({
          ...user.toJSON(),
          githubId: githubUser.githubId,
          authProvider: "github" as const,
        });
        await this.userRepo.save(linked);
        user = linked;
        linkedExistingAccount = true;
      } else {
        const now = new Date();
        user = User.create({
          id: uuidv4(),
          email: githubUser.email,
          passwordHash: null,
          name: githubUser.name,
          planTier: "free",
          createdAt: now,
          emailVerifiedAt: githubUser.emailVerified ? now : null,
          authProvider: "github",
          googleId: null,
          githubId: githubUser.githubId,
        });
        await this.userRepo.save(user);
        isNewUser = true;

        await this.welcomeEmailSender.sendWelcome({
          to: user.email,
          name: user.name ?? undefined,
        });
      }
    }

    const session = await this.sessionTokensIssuer.issueForUser(user);

    await this.eventPublisher.publish({
      type: AUTH_EVENTS.USER_SIGNED_IN_GITHUB,
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
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresInSeconds: session.expiresInSeconds,
        refreshExpiresInSeconds: session.refreshExpiresInSeconds,
      },
      isNewUser,
    };
  }
}
