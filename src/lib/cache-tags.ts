/**
 * Cache tags for `"use cache"` data. Admin server actions call
 * `updateTag(...)` with these after a change so the storefront updates at once.
 */
export const CACHE_TAGS = {
  catalog: "catalog",
  navigation: "navigation",
  settings: "settings",
  content: "content",
  product: (slug: string) => `product:${slug}`,
  collection: (slug: string) => `collection:${slug}`,
  page: (slug: string) => `page:${slug}`,
  reviews: (productId: string) => `reviews:${productId}`,
} as const;
