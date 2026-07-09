import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";

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

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as SessionUser;
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
