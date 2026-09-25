import { Resend } from "resend";
import { env } from "../config/env.js";
import type { SendVerificationEmailInput, VerificationEmailSender } from "../modules/auth/verification-email.sender.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class ResendVerificationEmailSender implements VerificationEmailSender {
  private readonly resend = new Resend(env.RESEND_API_KEY);

  async send(input: SendVerificationEmailInput): Promise<void> {
    const verificationUrl = new URL("/verify-email", env.WEB_ORIGIN);
    verificationUrl.searchParams.set("token", input.rawToken);
    const safeName = escapeHtml(input.firstName);
    const safeUrl = escapeHtml(verificationUrl.toString());

    const result = await this.resend.emails.send({
      from: env.AUTH_EMAIL_FROM,
      to: input.email,
      subject: "Verify your Make My Marriage email",
      text: [
        `Hello ${input.firstName},`,
        "",
        "Verify your Make My Marriage email address using this link:",
        verificationUrl.toString(),
        "",
        "This link expires in 24 hours. If you did not create this account, you can ignore this email.",
      ].join("\n"),
      html: `<p>Hello ${safeName},</p><p>Verify your Make My Marriage email address to continue.</p><p><a href="${safeUrl}">Verify email</a></p><p>If the button does not work, open this link:</p><p>${safeUrl}</p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
    });

    if (result.error) {
      throw new Error("The verification email provider rejected the request.");
    }
  }
}
