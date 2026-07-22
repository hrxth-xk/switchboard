export type LeetCodeDifficulty = "Easy" | "Medium" | "Hard";

/** Normalized problem payload shared by Quick Add and history import. */
export type LeetCodeProblem = {
  title: string;
  slug: string;
  url: string;
  difficulty: LeetCodeDifficulty | null;
  tags: string[];
  topic: string;
  pattern: string | null;
};

export type LeetCodeImportFromUrlResult =
  | { ok: true; problem: LeetCodeProblem }
  | { ok: false; error: string };

export type LeetCodeHistoryImportResult =
  | {
      ok: true;
      username: string;
      problems: LeetCodeProblem[];
      /** True when LeetCode's public API may have truncated the list. */
      truncated: boolean;
    }
  | { ok: false; error: string };
