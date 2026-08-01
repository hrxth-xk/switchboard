import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

export const passwordSchema = z.string().min(8);

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
