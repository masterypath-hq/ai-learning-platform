import type {
  IEmailSender,
  WelcomeEmailParams,
  PasswordResetEmailParams,
  PasswordChangedEmailParams,
} from "../../application/interfaces/IEmailSender.js";

export class ConsoleEmailSender implements IEmailSender {
  async sendWelcome(params: WelcomeEmailParams): Promise<void> {
    console.log("[Email] Welcome email:", {
      to: params.to,
      name: params.name,
      subject: "Welcome to AI Learning Platform",
    });
  }

  async sendPasswordReset(params: PasswordResetEmailParams): Promise<void> {
    console.log("[Email] Password reset:", {
      to: params.to,
      resetLink: params.resetLink,
      expiresInMinutes: params.expiresInMinutes,
    });
  }

  async sendPasswordChanged(params: PasswordChangedEmailParams): Promise<void> {
    console.log("[Email] Password changed confirmation:", {
      to: params.to,
      name: params.name,
    });
  }
}
