const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";
const ALFA_API = "https://alfa-leetcode-api.onrender.com";
const FETCH_TIMEOUT_MS = 12_000;

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function leetCodeGraphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  const response = await fetchWithTimeout(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://leetcode.com/",
      Origin: "https://leetcode.com"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response?.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  try {
    const body = (await response.json()) as GraphQlResponse<T>;
    if (body.errors?.length || !body.data) return null;
    return body.data;
  } catch {
    return null;
  }
}

/** Public mirror used when leetcode.com GraphQL is Cloudflare-blocked. */
export async function alfaGet<T>(path: string): Promise<T | null> {
  const response = await fetchWithTimeout(`${ALFA_API}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SwitchboardLeetCodeImport/1.0"
    }
  });

  if (!response?.ok) return null;

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
