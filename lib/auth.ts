import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "switchboard_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

function secretKey() {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "switchboard-local-development-secret");
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

/**
 * True when the session should no longer be honoured: the account is gone, or
 * the password changed after this token was issued.
 *
 * JWT `iat` is second-precision while `passwordChangedAt` carries milliseconds,
 * so both sides are floored to whole seconds. Otherwise a cookie re-issued in
 * the same second as the change (what /api/auth/change-password does) would
 * invalidate itself immediately.
 */
async function isRevoked(userId: string, issuedAt: unknown) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordChangedAt: true }
    });
    if (!user) return true;
    if (!user.passwordChangedAt || typeof issuedAt !== "number") return false;
    return issuedAt < Math.floor(user.passwordChangedAt.getTime() / 1000);
  } catch (error) {
    // The signature is still valid; only revocation is unverifiable. Fail open
    // so a database blip doesn't sign everyone out.
    console.error("Session revocation check failed", error);
    return false;
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const user = payload as unknown as SessionUser;
    if (await isRevoked(user.id, payload.iat)) return null;
    return user;
  } catch {
    return null;
  }
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

export const requireAdmin = cache(async () => {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
});
