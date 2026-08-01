import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export type TokenPurpose = "PASSWORD_RESET";

export const TOKEN_TTL_MINUTES: Record<TokenPurpose, number> = {
  PASSWORD_RESET: 60
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a single-use token. Only the SHA-256 hash is stored, so a database
 * leak cannot be replayed as a link. Outstanding tokens for the same user and
 * purpose are dropped first — one live link at a time.
 */
export async function createAuthToken(userId: string, purpose: TokenPurpose) {
  const token = randomBytes(32).toString("base64url");

  await prisma.authToken.deleteMany({ where: { userId, purpose } });
  await prisma.authToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES[purpose] * 60 * 1000)
    }
  });

  return token;
}

/** Read-only check used when rendering a page. Does not consume. */
export async function findValidAuthToken(token: string, purpose: TokenPurpose) {
  if (!token) return null;

  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.purpose !== purpose) return null;
  if (record.usedAt || record.expiresAt.getTime() < Date.now()) return null;

  return record;
}

/** Marks the token used and returns the owning user id, or null when unusable. */
export async function consumeAuthToken(token: string, purpose: TokenPurpose) {
  const record = await findValidAuthToken(token, purpose);
  if (!record) return null;

  const claimed = await prisma.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() }
  });
  if (claimed.count === 0) return null;

  return record.userId;
}
