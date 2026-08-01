import type { CaptureAnalysis, CaptureInput, CaptureKind, InputAnalyzer } from "@/lib/capture/types";

function detectInputKind(input: CaptureInput): CaptureAnalysis["inputKind"] {
  if (input.kind && input.kind !== "unknown") return input.kind;

  const value = input.value.trim();
  if (!value) return "unknown";

  if (input.mimeType?.startsWith("image/")) return "image";
  if (input.mimeType === "application/pdf" || input.fileName?.toLowerCase().endsWith(".pdf")) {
    return "file";
  }

  if (input.metadata?.extensionEvent || input.metadata?.source === "extension") {
    return "extension_event";
  }

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol === "http:" || url.protocol === "https:") return "url";
  } catch {
    // not a URL
  }

  if (value.startsWith("{") || value.startsWith("[")) return "json";
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return "html";
  return "text";
}

function tryParseUrl(value: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function detectSourceHint(urlString: string | null): CaptureAnalysis["sourceHint"] {
  if (!urlString) return "unknown";
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("greenhouse")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("ashbyhq.com")) return "ashby";
    if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "workday";
    if (host.includes("oracle")) return "oracle";
    if (host.includes("microsoft.com")) return "microsoft";
    if (host.includes("amazon.jobs")) return "amazon";
    if (host.includes("careers.google.com")) return "google";
    if (host.includes("google.com") && /careers|jobs/i.test(urlString)) return "google";
    if (host.includes("leetcode.com") || host.includes("leetcode.cn")) return "leetcode";
    return "generic";
  } catch {
    return "unknown";
  }
}

function detectCaptureKind(
  sourceHint: CaptureAnalysis["sourceHint"],
  urlString: string | null,
  preferredKind?: CaptureKind
): CaptureKind | null {
  if (preferredKind) return preferredKind;
  if (sourceHint === "leetcode") return "problem";
  if (
    sourceHint === "linkedin" ||
    sourceHint === "greenhouse" ||
    sourceHint === "lever" ||
    sourceHint === "ashby" ||
    sourceHint === "workday" ||
    sourceHint === "oracle" ||
    sourceHint === "microsoft" ||
    sourceHint === "amazon" ||
    sourceHint === "google"
  ) {
    return "application";
  }

  if (urlString?.includes("/problems/")) return "problem";
  if (urlString && /jobs?|careers|requisition/i.test(urlString)) return "application";
  return null;
}

/**
 * Classifies raw capture input so the dispatcher can pick an extractor.
 * Does not fetch remote content — that belongs in extractors.
 */
export function analyzeCaptureInput(
  input: CaptureInput,
  preferredKind?: CaptureKind
): CaptureAnalysis {
  const inputKind = detectInputKind(input);
  const url =
    inputKind === "url" || inputKind === "extension_event" ? tryParseUrl(input.value) : null;
  const sourceHint = detectSourceHint(url);
  const captureKind = detectCaptureKind(sourceHint, url, preferredKind);
  const confidence =
    captureKind && sourceHint !== "unknown" ? 0.85 : captureKind ? 0.55 : url ? 0.35 : 0.1;

  return {
    inputKind,
    captureKind,
    sourceHint,
    url,
    confidence,
    notes: []
  };
}

export const inputAnalyzer: InputAnalyzer = {
  analyze(input) {
    return analyzeCaptureInput(input);
  }
};
