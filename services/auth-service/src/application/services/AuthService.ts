import type { ISignUpAction } from "../interfaces/ISignUpAction.js";
import type { ISignInAction } from "../interfaces/ISignInAction.js";
import type { IForgotPasswordAction } from "../interfaces/IForgotPasswordAction.js";
import type { IResetPasswordAction } from "../interfaces/IResetPasswordAction.js";
import type {
  SignUpResponse,
  SignInResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "@ai-learning-platform/shared";
import type { IAuthService } from "../interfaces/IAuthService.js";

/**
 * Application service: single entry for auth operations. Delegates to actions.
 * (SOLID: D — depends on action interfaces only, not concretions.)
 */
export class AuthService implements IAuthService {
  constructor(
    private readonly signUpAction: ISignUpAction,
    private readonly signInAction: ISignInAction,
    private readonly forgotPasswordAction: IForgotPasswordAction,
    private readonly resetPasswordAction: IResetPasswordAction
  ) {}

  async signUp(email: string, password: string, name?: string): Promise<SignUpResponse> {
    return this.signUpAction.execute(email, password, name);
  }

  async signIn(email: string, password: string): Promise<SignInResponse> {
    return this.signInAction.execute(email, password);
  }

  async forgotPassword(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse> {
    return this.forgotPasswordAction.execute(email, resetLinkBaseUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    return this.resetPasswordAction.execute(token, newPassword);
  }
}
