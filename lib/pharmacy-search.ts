/**
 * Typo-tolerant medicine name matching (Track: smart medicine search) — a
 * small in-house Levenshtein scorer instead of a search-library dependency,
 * since it only ever runs over a hospital's own inventory (at most a few
 * hundred rows), not a large-scale index.
 */

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Lower is better; undefined means "no match, don't show this candidate".
 * An exact substring match always wins (score 0) — fuzzy matching (scores
 * 2+) only kicks in for a query of 4+ characters, and only tolerates 1-2
 * character edits, so a genuinely different drug name never surfaces just
 * because it happens to be short.
 */
export function medicineMatchScore(query: string, candidate: string): number | undefined {
  const q = query.trim().toLowerCase();
  const c = candidate.trim().toLowerCase();
  if (!q) return 0;
  if (c.includes(q)) return 0;
  if (q.length <= 3) return undefined;

  const words = c.split(/\s+/).filter(Boolean);
  let best = Infinity;
  for (const word of words) {
    const distance = levenshtein(q, word.slice(0, q.length + 2));
    if (distance < best) best = distance;
  }
  const maxAllowed = q.length <= 5 ? 1 : 2;
  return best <= maxAllowed ? best + 1 : undefined;
}
