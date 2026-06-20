import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordHasher } from "../interfaces/IPasswordHasher.js";
import type { ISessionTokensIssuer } from "../interfaces/ISessionTokensIssuer.js";
import type { SignInResponse } from "@ai-learning-platform/shared";
import type { ISignInAction } from "../interfaces/ISignInAction.js";

export class SignInAction implements ISignInAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionTokensIssuer: ISessionTokensIssuer
  ) {}

  async execute(email: string, password: string): Promise<SignInResponse> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user) throw new Error("INVALID_CREDENTIALS");

    if (!user.passwordHash) throw new Error("NO_PASSWORD_SET");

    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    const session = await this.sessionTokensIssuer.issueForUser(user);

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
