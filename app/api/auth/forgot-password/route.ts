import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { createAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email()
});

const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ipLimit = rateLimit(`forgot:ip:${requestIp(request)}`, { limit: 5, windowMs: HOUR_MS });
  const emailLimit = rateLimit(`forgot:email:${email}`, { limit: 5, windowMs: HOUR_MS });

  if (!ipLimit.ok || !emailLimit.ok) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again in a little while." },
      { status: 429 }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = await createAuthToken(user.id, "PASSWORD_RESET");
      const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }
  } catch (error) {
    console.error("Password reset request failed", error);
  }

  // Always the same response — never reveal whether an account exists.
  return NextResponse.json({ ok: true });
}
