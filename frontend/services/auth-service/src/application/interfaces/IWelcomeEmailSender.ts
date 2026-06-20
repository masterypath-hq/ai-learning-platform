/** ISP: only welcome email. SignUpAction depends only on this. */
export interface WelcomeEmailParams {
  to: string;
  name?: string;
}

export interface IWelcomeEmailSender {
  sendWelcome(params: WelcomeEmailParams): Promise<void>;
}
