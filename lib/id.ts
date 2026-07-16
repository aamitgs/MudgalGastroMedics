/**
 * Sortable-ish, collision-resistant entity id: PREFIX-<base36 timestamp>-<base36 random>.
 * `randomLen` controls the random suffix length; keep call sites' existing length when
 * migrating an existing id format so ids already persisted stay the same shape.
 */
export function generateId(prefix: string, randomLen = 3): string {
  const random = Math.random()
    .toString(36)
    .slice(2, 2 + randomLen)
    .toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
}
