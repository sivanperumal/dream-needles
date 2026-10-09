/**
 * Tiny localStorage helpers that never throw (private browsing, blocked
 * storage). Used for the guest cart, guest wishlist and recently viewed.
 */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: state still works for this page view.
  }
}

export const STORAGE_KEYS = {
  cart: "dn:cart",
  wishlist: "dn:wishlist",
  recentlyViewed: "dn:recently-viewed",
} as const;
