import type { PasswordChangedEmailParams } from "../../../application/interfaces/IPasswordChangedEmailSender.js";
import type { IEmailTemplate, EmailTemplateOutput } from "./IEmailTemplate.js";
import { BaseEmailLayout } from "./BaseEmailLayout.js";

export class PasswordChangedEmailTemplate implements IEmailTemplate<PasswordChangedEmailParams> {
  render(params: PasswordChangedEmailParams): EmailTemplateOutput {
    const greeting = params.name ?? "there";

    const header = BaseEmailLayout.headerGradient(
      "linear-gradient(135deg,#059669 0%,#10b981 100%)",
      "&#9989;",
      "Password Changed Successfully"
    );

    const successCard = BaseEmailLayout.infoCard(
      "#ecfdf5", "#059669", "#065f46",
      "&#128274;", "Your account is secure",
      "You can now sign in with your new password."
    );

    const warningCard = BaseEmailLayout.infoCard(
      "#fef3c7", "#f59e0b", "#92400e",
      "&#9888;&#65039;", "Didn't make this change?",
      "If you did not reset your password, your account may be compromised. Please reset your password immediately and contact our support team.",
      "#92400e"
    );

    const cta = BaseEmailLayout.ctaButton(
      "http://localhost:3000",
      "Sign In Now",
      "linear-gradient(135deg,#059669,#10b981)",
      "rgba(5,150,105,0.35)"
    );

    const body = `<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#1a1a2e;font-size:17px;line-height:1.6;">Hey ${greeting},</p>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
    This is a confirmation that the password for your AI Learning Platform account
    has been successfully changed.
  </p>
  ${successCard}
  ${warningCard}
  ${cta}
</td></tr>`;

    return {
      subject: "Your Password Has Been Changed \u2014 AI Learning Platform",
      html: BaseEmailLayout.wrap(header, body),
    };
  }
}
