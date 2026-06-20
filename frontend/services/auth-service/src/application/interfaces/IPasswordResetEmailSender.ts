/** ISP: only password reset email. ForgotPasswordAction depends only on this. */
export interface PasswordResetEmailParams {
  to: string;
  resetLink: string;
  expiresInMinutes: number;
}

export interface IPasswordResetEmailSender {
  sendPasswordReset(params: PasswordResetEmailParams): Promise<void>;
}
