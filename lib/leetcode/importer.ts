import { alfaGet, leetCodeGraphql } from "@/lib/leetcode/client";
import { derivePattern, deriveTopic } from "@/lib/leetcode/patterns";
import type {
  LeetCodeDifficulty,
  LeetCodeHistoryImportResult,
  LeetCodeImportFromUrlResult,
  LeetCodeProblem
} from "@/lib/leetcode/types";

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      difficulty
      topicTags {
        name
        slug
      }
    }
  }
`;

const USER_EXISTS_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
    }
  }
`;

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
    }
  }
`;

const HISTORY_FETCH_LIMIT = 1000;
const ENRICH_CONCURRENCY = 6;

type QuestionPayload = {
  question: {
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: Array<{ name: string; slug: string }>;
  } | null;
};

type RecentAcPayload = {
  recentAcSubmissionList: Array<{
    title: string;
    titleSlug: string;
    timestamp: string;
  }> | null;
};

type UserProfilePayload = {
  matchedUser: { username: string } | null;
};

type AlfaQuestion = {
  questionTitle?: string;
  title?: string;
  titleSlug?: string;
  difficulty?: string;
  topicTags?: Array<{ name: string; slug?: string } | string>;
};

type AlfaAcSubmission = {
  count?: number;
  submission?: Array<{
    title: string;
    titleSlug: string;
    timestamp: string;
  }>;
};

type AlfaUserProfile = {
  username?: string;
  totalSolved?: number;
};

function normalizeDifficulty(value: string | null | undefined): LeetCodeDifficulty | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return null;
}

function toProblem(
  title: string,
  slug: string,
  difficulty: string | null | undefined,
  tags: Array<{ name: string; slug?: string }>
): LeetCodeProblem {
  return {
    title: title.trim(),
    slug,
    url: `https://leetcode.com/problems/${slug}/`,
    difficulty: normalizeDifficulty(difficulty),
    tags: tags.map((tag) => tag.name).filter(Boolean),
    topic: deriveTopic(tags),
    pattern: derivePattern(tags)
  };
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeAlfaTags(
  tags: AlfaQuestion["topicTags"]
): Array<{ name: string; slug?: string }> {
  if (!tags?.length) return [];
  return tags.map((tag) => {
    if (typeof tag === "string") return { name: tag };
    return { name: tag.name, slug: tag.slug };
  });
}

export function parseLeetCodeProblemUrl(raw: string): { slug: string; url: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!/(^|\.)leetcode\.com$/i.test(url.hostname) && !/(^|\.)leetcode\.cn$/i.test(url.hostname)) {
      return null;
    }

    const match = url.pathname.match(/\/problems\/([a-z0-9-]+)/i);
    if (!match?.[1]) return null;

    const slug = match[1].toLowerCase();
    return {
      slug,
      url: `https://leetcode.com/problems/${slug}/`
    };
  } catch {
    return null;
  }
}

async function fetchQuestionBySlug(slug: string): Promise<LeetCodeProblem | null> {
  const data = await leetCodeGraphql<QuestionPayload>(QUESTION_QUERY, { titleSlug: slug });
  const question = data?.question;
  if (question?.title && question.titleSlug) {
    return toProblem(question.title, question.titleSlug, question.difficulty, question.topicTags ?? []);
  }

  const alfa = await alfaGet<AlfaQuestion>(`/select?titleSlug=${encodeURIComponent(slug)}`);
  const title = alfa?.questionTitle ?? alfa?.title;
  const titleSlug = alfa?.titleSlug ?? slug;
  if (!title) return null;

  return toProblem(title, titleSlug, alfa?.difficulty, normalizeAlfaTags(alfa?.topicTags));
}

async function resolveUsername(username: string): Promise<string | null> {
  const profile = await leetCodeGraphql<UserProfilePayload>(USER_EXISTS_QUERY, {
    username
  });
  if (profile?.matchedUser?.username) return profile.matchedUser.username;

  const alfa = await alfaGet<AlfaUserProfile>(`/${encodeURIComponent(username)}`);
  if (alfa?.username) return alfa.username;

  // Profile endpoint may return ranking fields without username echo.
  const solved = await alfaGet<{ solvedProblem?: number }>(
    `/${encodeURIComponent(username)}/solved`
  );
  if (solved && typeof solved.solvedProblem === "number") return username;

  return null;
}

async function fetchRecentAccepted(username: string): Promise<{
  submissions: Array<{ title: string; titleSlug: string }>;
  totalSolvedHint: number | null;
}> {
  const recent = await leetCodeGraphql<RecentAcPayload>(RECENT_AC_QUERY, {
    username,
    limit: HISTORY_FETCH_LIMIT
  });

  if (recent?.recentAcSubmissionList?.length) {
    return {
      submissions: recent.recentAcSubmissionList,
      totalSolvedHint: null
    };
  }

  const [alfaSubs, alfaProfile] = await Promise.all([
    alfaGet<AlfaAcSubmission>(`/${encodeURIComponent(username)}/acSubmission`),
    alfaGet<AlfaUserProfile>(`/userProfile/${encodeURIComponent(username)}`)
  ]);

  return {
    submissions: alfaSubs?.submission ?? [],
    totalSolvedHint: alfaProfile?.totalSolved ?? null
  };
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

/**
 * Dedicated LeetCode importer service.
 * UI and future browser extensions should call this — not scrape themselves.
 */
export class LeetCodeImporter {
  async importFromUrl(rawUrl: string): Promise<LeetCodeImportFromUrlResult> {
    const parsed = parseLeetCodeProblemUrl(rawUrl);
    if (!parsed) {
      return {
        ok: false,
        error: "Paste a valid LeetCode problem URL (e.g. https://leetcode.com/problems/two-sum/)."
      };
    }

    const problem = await fetchQuestionBySlug(parsed.slug);
    if (!problem) {
      return {
        ok: false,
        error: "We couldn't fetch that LeetCode problem. Please fill the details manually."
      };
    }

    return { ok: true, problem: { ...problem, url: parsed.url } };
  }

  async importSolvedHistory(username: string): Promise<LeetCodeHistoryImportResult> {
    const cleaned = username.trim().replace(/^@/, "");
    if (!cleaned || cleaned.length < 2) {
      return { ok: false, error: "Enter a valid LeetCode username." };
    }

    const resolvedUsername = await resolveUsername(cleaned);
    if (!resolvedUsername) {
      return { ok: false, error: "LeetCode user not found. Check the username and try again." };
    }

    const { submissions, totalSolvedHint } = await fetchRecentAccepted(resolvedUsername);

    if (submissions.length === 0) {
      return {
        ok: true,
        username: resolvedUsername,
        problems: [],
        truncated: false
      };
    }

    const uniqueSlugs: string[] = [];
    const seen = new Set<string>();
    for (const submission of submissions) {
      const slug = submission.titleSlug?.trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      uniqueSlugs.push(slug);
    }

    const enriched = await mapPool(uniqueSlugs, ENRICH_CONCURRENCY, async (slug) => {
      const problem = await fetchQuestionBySlug(slug);
      if (problem) return problem;

      const fallbackTitle =
        submissions.find((item) => item.titleSlug === slug)?.title ?? titleFromSlug(slug);

      return toProblem(fallbackTitle, slug, null, []);
    });

    const truncated =
      (totalSolvedHint != null && totalSolvedHint > uniqueSlugs.length) ||
      submissions.length >= 20;

    return {
      ok: true,
      username: resolvedUsername,
      problems: enriched.filter(Boolean),
      truncated
    };
  }
}

export const leetCodeImporter = new LeetCodeImporter();
