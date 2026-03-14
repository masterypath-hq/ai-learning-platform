import type { PasswordResetEmailParams } from "../../../application/interfaces/IPasswordResetEmailSender.js";
import type { IEmailTemplate, EmailTemplateOutput } from "./IEmailTemplate.js";
import { BaseEmailLayout } from "./BaseEmailLayout.js";

export class PasswordResetEmailTemplate implements IEmailTemplate<PasswordResetEmailParams> {
  render(params: PasswordResetEmailParams): EmailTemplateOutput {
    const header = BaseEmailLayout.headerGradient(
      "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
      "&#128274;",
      "Reset Your Password"
    );

    const cta = BaseEmailLayout.ctaButton(
      params.resetLink,
      "Reset Password",
      "linear-gradient(135deg,#4f46e5,#7c3aed)",
      "rgba(79,70,229,0.35)"
    );

    const expiryCard = BaseEmailLayout.infoCard(
      "#fef3c7", "#f59e0b", "#92400e",
      "&#9200;",
      `Expires in ${params.expiresInMinutes} minutes`,
      "After that you'll need to request a new one.",
      "#92400e"
    );

    const body = `<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
    We received a request to reset the password for your AI Learning Platform account.
    Click the button below to choose a new one:
  </p>
  ${cta}
  ${expiryCard}
  <p style="margin:16px 0 16px;color:#6b7280;font-size:13px;line-height:1.6;">
    If you didn't request this, you can safely ignore this email &mdash; your password won't change.
  </p>
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
    Can't click the button? Copy and paste this link into your browser:<br>
    <span style="color:#4f46e5;word-break:break-all;">${params.resetLink}</span>
  </p>
</td></tr>`;

    return {
      subject: "Reset Your Password \u2014 AI Learning Platform",
      html: BaseEmailLayout.wrap(header, body),
    };
  }
}
