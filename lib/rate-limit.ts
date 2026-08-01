type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Fixed-window limiter held in process memory. It resets on cold start and is
 * per-instance, so treat it as a deterrent against casual abuse rather than a
 * guarantee.
 */
export function rateLimit(key: string, options: { limit: number; windowMs: number }) {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > options.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client identity for limiter keys. */
export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Exported for tests/dev only — clears all windows. */
export function resetRateLimits() {
  windows.clear();
}
