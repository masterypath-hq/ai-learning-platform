import type { WelcomeEmailParams } from "../../../application/interfaces/IWelcomeEmailSender.js";
import type { IEmailTemplate, EmailTemplateOutput } from "./IEmailTemplate.js";
import { BaseEmailLayout } from "./BaseEmailLayout.js";

export class WelcomeEmailTemplate implements IEmailTemplate<WelcomeEmailParams> {
  render(params: WelcomeEmailParams): EmailTemplateOutput {
    const greeting = params.name ?? "there";

    const header = BaseEmailLayout.headerGradient(
      "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)",
      "&#129302;",
      "Welcome to AI Learning Platform",
      "Your journey into AI starts now"
    );

    const features = [
      BaseEmailLayout.infoCard("#f5f3ff", "#4f46e5", "#4f46e5", "&#127891;", "Personalised Courses", "Adaptive learning paths that match your pace and goals."),
      BaseEmailLayout.infoCard("#faf5ff", "#7c3aed", "#7c3aed", "&#9889;", "AI-Powered Feedback", "Get instant, meaningful feedback on every exercise."),
      BaseEmailLayout.infoCard("#fdf4ff", "#a855f7", "#a855f7", "&#128200;", "Track Your Progress", "Visual dashboards to see how far you've come."),
    ].join("");

    const cta = BaseEmailLayout.ctaButton(
      "http://localhost:3000",
      "Start Learning",
      "linear-gradient(135deg,#4f46e5,#7c3aed)",
      "rgba(79,70,229,0.35)"
    );

    const body = `<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#1a1a2e;font-size:17px;line-height:1.6;">Hey ${greeting},</p>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
    We're thrilled to have you on board! Your account is ready and the entire world of
    AI-powered learning is at your fingertips.
  </p>
  <div style="margin-bottom:16px;">${features}</div>
  ${cta}
  <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;">
    If you didn't create this account, you can safely ignore this email.
  </p>
</td></tr>`;

    return {
      subject: "Welcome to AI Learning Platform",
      html: BaseEmailLayout.wrap(header, body),
    };
  }
}
