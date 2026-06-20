/** ISP: only password-changed confirmation email. ResetPasswordAction depends on this. */
export interface PasswordChangedEmailParams {
  to: string;
  name?: string;
}

export interface IPasswordChangedEmailSender {
  sendPasswordChanged(params: PasswordChangedEmailParams): Promise<void>;
}
