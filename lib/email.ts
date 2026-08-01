import { Resend } from "resend";
import { TOKEN_TTL_MINUTES } from "@/lib/auth-tokens";

const FALLBACK_FROM = "Switchboard <onboarding@resend.dev>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function layout(paragraphs: string[], cta: { label: string; url: string }) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; font-size: 15px; line-height: 1.5; color: #111;">
      ${paragraphs.map((text) => `<p>${text}</p>`).join("")}
      <p><a href="${cta.url}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none;">${cta.label}</a></p>
      <p style="color:#555;">Or paste this link into your browser:<br /><a href="${cta.url}">${cta.url}</a></p>
    </div>
  `;
}

/**
 * Never throws. Callers must respond identically whether or not the account
 * exists, so delivery problems are logged and swallowed. Without
 * RESEND_API_KEY the link is printed to the server console so local
 * development works with no mail setup.
 */
async function send(to: string, subject: string, text: string, html: string, devLabel: string, url: string) {
  const resend = getResend();

  if (!resend) {
    console.info(`[email] RESEND_API_KEY not set — ${devLabel} for ${to}: ${url}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.MAIL_FROM || FALLBACK_FROM,
      to,
      subject,
      text,
      html
    });
    if (error) console.error(`${devLabel} email failed`, error);
  } catch (error) {
    console.error(`${devLabel} email failed`, error);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const expiry = `The link expires in ${TOKEN_TTL_MINUTES.PASSWORD_RESET} minutes and can only be used once.`;

  await send(
    to,
    "Reset your Switchboard password",
    [
      "You asked to reset your Switchboard password.",
      "",
      `Open this link to choose a new one: ${resetUrl}`,
      "",
      expiry,
      "If you didn't request this, you can ignore this email — your password stays the same."
    ].join("\n"),
    layout(
      [
        "You asked to reset your Switchboard password.",
        `<span style="color:#555;">${expiry} If you didn't request this, ignore this email — your password stays the same.</span>`
      ],
      { label: "Choose a new password", url: resetUrl }
    ),
    "password reset link",
    resetUrl
  );
}

