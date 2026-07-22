/** Map LeetCode topic tags to common DSA patterns when possible. */

const TAG_TO_PATTERN: Record<string, string> = {
  "two-pointers": "Two pointers",
  "sliding-window": "Sliding window",
  "binary-search": "Binary search",
  "depth-first-search": "DFS",
  "breadth-first-search": "BFS",
  "dynamic-programming": "Dynamic programming",
  backtracking: "Backtracking",
  greedy: "Greedy",
  "union-find": "Union find",
  trie: "Trie",
  "bit-manipulation": "Bit manipulation",
  "heap-priority-queue": "Heap",
  "stack": "Stack",
  "queue": "Queue",
  "monotonic-stack": "Monotonic stack",
  "monotonic-queue": "Monotonic queue",
  recursion: "Recursion",
  "divide-and-conquer": "Divide and conquer",
  "topological-sort": "Topological sort",
  "shortest-path": "Shortest path",
  sorting: "Sorting",
  "prefix-sum": "Prefix sum",
  "hash-table": "Hash map",
  "linked-list": "Linked list",
  tree: "Tree",
  "binary-tree": "Binary tree",
  graph: "Graph",
  "binary-search-tree": "BST",
  math: "Math",
  string: "String",
  array: "Array",
  matrix: "Matrix"
};

const PATTERN_PRIORITY = [
  "two-pointers",
  "sliding-window",
  "binary-search",
  "depth-first-search",
  "breadth-first-search",
  "dynamic-programming",
  "backtracking",
  "union-find",
  "trie",
  "monotonic-stack",
  "heap-priority-queue",
  "topological-sort",
  "prefix-sum",
  "hash-table",
  "linked-list",
  "binary-tree",
  "graph",
  "greedy",
  "stack",
  "queue",
  "sorting",
  "bit-manipulation",
  "math"
];

export function derivePattern(tags: Array<{ name: string; slug?: string }>): string | null {
  const bySlug = new Map(
    tags.map((tag) => [tag.slug?.toLowerCase() ?? tag.name.toLowerCase().replace(/\s+/g, "-"), tag])
  );

  for (const slug of PATTERN_PRIORITY) {
    if (bySlug.has(slug) && TAG_TO_PATTERN[slug]) return TAG_TO_PATTERN[slug];
  }

  for (const tag of tags) {
    const slug = tag.slug?.toLowerCase() ?? tag.name.toLowerCase().replace(/\s+/g, "-");
    if (TAG_TO_PATTERN[slug]) return TAG_TO_PATTERN[slug];
  }

  return null;
}

export function deriveTopic(tags: Array<{ name: string }>): string {
  if (tags[0]?.name?.trim()) return tags[0].name.trim();
  return "Algorithms";
}
