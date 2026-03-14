import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IPasswordHasher } from "../interfaces/IPasswordHasher.js";
import type { ITokenService } from "../interfaces/ITokenService.js";
import type { SignInResponse } from "@ai-learning-platform/shared";
import type { ISignInAction } from "../interfaces/ISignInAction.js";

const ACCESS_TOKEN_EXPIRES_SECONDS = 900;

export class SignInAction implements ISignInAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(email: string, password: string): Promise<SignInResponse> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user) throw new Error("INVALID_CREDENTIALS");

    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    const accessToken = await this.tokenService.signAccessToken(
      { userId: user.id, email: user.email },
      ACCESS_TOKEN_EXPIRES_SECONDS
    );

    return {
      userId: user.id,
      email: user.email,
      tokens: { accessToken, expiresInSeconds: ACCESS_TOKEN_EXPIRES_SECONDS },
    };
  }
}
