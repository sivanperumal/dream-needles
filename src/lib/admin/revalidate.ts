import "server-only";
import { updateTag } from "next/cache";

/** Refresh storefront caches right after an admin change (pass tags from CACHE_TAGS). */
export function refreshStorefront(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
