/** Only allow same-site relative paths as post-login redirects (blocks "//evil.com" and "https://…"). */
export function safeNext(next: unknown, fallback = "/account"): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  )
    return fallback;
  return next.slice(0, 300);
}
