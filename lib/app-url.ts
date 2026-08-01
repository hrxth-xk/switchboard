import { headers } from "next/headers";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/** Absolute origin for links we send by email. */
export function getAppUrl() {
  if (process.env.APP_URL) return stripTrailingSlash(process.env.APP_URL);
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  try {
    const headerList = headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    if (host) {
      const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is unavailable outside a request scope — fall through.
  }

  return "http://localhost:3000";
}
