/**
 * Splits text into parts, marking ones that match the search query.
 * Each query word matches case-insensitively at any position, so
 * "croch hook" highlights "Croch" in "Crochet" and "Hook".
 */
export function highlightParts(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((w) => w.length >= 2);
  if (!words.length) return [{ text, match: false }];

  const pattern = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, match: words.includes(part.toLowerCase()) }));
}
