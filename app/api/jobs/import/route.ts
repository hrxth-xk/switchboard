import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { importJobFromUrl } from "@/lib/job-import";
import { JOB_IMPORT_MESSAGES } from "@/lib/job-import/messages";
import { rateLimit, requestIp } from "@/lib/rate-limit";

/** The SSRF guard resolves DNS via node:dns, so this cannot run on Edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MINUTE_MS = 60_000;

const schema = z.object({
  url: z.string().min(1).max(2048)
});

export async function POST(request: Request) {
  const user = await requireUser();

  // This endpoint makes the server fetch a URL the user chose, so it is worth
  // limiting even though the SSRF guard already restricts where it can go.
  const userLimit = rateLimit(`jobs-import:user:${user.id}`, { limit: 20, windowMs: MINUTE_MS });
  const ipLimit = rateLimit(`jobs-import:ip:${requestIp(request)}`, { limit: 40, windowMs: MINUTE_MS });

  if (!userLimit.ok || !ipLimit.ok) {
    const retryAfterSeconds = Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds, 1);
    return NextResponse.json(
      { ok: false, code: "rate_limited", error: JOB_IMPORT_MESSAGES.rateLimited, retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_url", error: JOB_IMPORT_MESSAGES.invalidUrl },
      { status: 400 }
    );
  }

  const result = await importJobFromUrl(parsed.data.url);

  /*
   * A partial extraction counts as success: the body carries whatever resolved
   * plus `unresolved`, so the sheet fills what it has instead of showing an
   * empty form. Only a malformed or unreachable URL is an error now — the old
   * 422 "we learned nothing" case is gone.
   */
  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: result.code === "blocked_url" ? 403 : 400 });
}
