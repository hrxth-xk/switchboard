import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/db";
import { hashPassword, passwordSchema } from "@/lib/password";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  password: passwordSchema
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a password with at least 8 characters." }, { status: 400 });
  }

  const limit = rateLimit(`reset:ip:${requestIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in a little while." }, { status: 429 });
  }

  const userId = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
  if (!userId) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      passwordChangedAt: new Date()
    }
  });

  await logActivity(userId, "Password reset");

  // No auto sign-in: the user signs in with the new password, which also
  // confirms it works, and every existing session is now revoked.
  return NextResponse.json({ ok: true });
}
