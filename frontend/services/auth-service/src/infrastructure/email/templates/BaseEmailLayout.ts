export class BaseEmailLayout {
  private static readonly FONT_STACK = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  static wrap(headerHtml: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:${this.FONT_STACK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        ${headerHtml}
        ${bodyHtml}
        <tr>
          <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;">AI Learning Platform</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">Built to make AI education accessible to everyone.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  static headerGradient(gradient: string, icon: string, title: string, subtitle?: string): string {
    const subtitleHtml = subtitle
      ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${subtitle}</p>`
      : "";
    return `<tr>
  <td style="background:${gradient};padding:44px 40px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">${icon}</div>
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${title}</h1>
    ${subtitleHtml}
  </td>
</tr>`;
  }

  static ctaButton(href: string, label: string, gradient: string, shadowColor: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:12px 0 28px;">
    <a href="${href}"
       style="display:inline-block;background:${gradient};color:#ffffff;
              font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;
              text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px ${shadowColor};">
      ${label}
    </a>
  </td></tr>
</table>`;
  }

  static infoCard(background: string, borderColor: string, titleColor: string, icon: string, title: string, text: string, textColor = "#6b7280"): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr>
    <td style="padding:16px 20px;background:${background};border-radius:12px;border-left:4px solid ${borderColor};">
      <p style="margin:0;color:${titleColor};font-size:14px;font-weight:700;">${icon} ${title}</p>
      <p style="margin:4px 0 0;color:${textColor};font-size:13px;line-height:1.5;">${text}</p>
    </td>
  </tr>
</table>`;
  }
}
