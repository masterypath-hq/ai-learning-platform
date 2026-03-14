import { Resend } from "resend";
import type {
  IEmailSender,
  WelcomeEmailParams,
  PasswordResetEmailParams,
  PasswordChangedEmailParams,
} from "../../application/interfaces/IEmailSender.js";
import type { IEmailTemplate } from "./templates/IEmailTemplate.js";

export class ResendEmailSender implements IEmailSender {
  private readonly client: Resend;
  private readonly fromAddress: string;

  constructor(
    apiKey: string,
    fromAddress: string,
    private readonly welcomeTemplate: IEmailTemplate<WelcomeEmailParams>,
    private readonly passwordResetTemplate: IEmailTemplate<PasswordResetEmailParams>,
    private readonly passwordChangedTemplate: IEmailTemplate<PasswordChangedEmailParams>
  ) {
    this.client = new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  async sendWelcome(params: WelcomeEmailParams): Promise<void> {
    const { subject, html } = this.welcomeTemplate.render(params);
    await this.send(params.to, subject, html, "Welcome");
  }

  async sendPasswordReset(params: PasswordResetEmailParams): Promise<void> {
    const { subject, html } = this.passwordResetTemplate.render(params);
    await this.send(params.to, subject, html, "Password reset");
  }

  async sendPasswordChanged(params: PasswordChangedEmailParams): Promise<void> {
    const { subject, html } = this.passwordChangedTemplate.render(params);
    await this.send(params.to, subject, html, "Password changed");
  }

  private async send(to: string, subject: string, html: string, label: string): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[ResendEmailSender] ${label} email failed:`, error);
      throw new Error(`Failed to send ${label.toLowerCase()} email: ${error.message}`);
    }
  }
}
