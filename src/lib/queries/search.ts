import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { SearchPage, SearchPopupResult, SearchSort } from "@/lib/types";

/* Catalog search via the Postgres functions in migration 0007 (full-text + pg_trgm). */

export type PopupResponse = SearchPopupResult & {
  total: number;
  suggestions: string[];
};

const EMPTY: PopupResponse = {
  collections: [],
  products: [],
  total: 0,
  suggestions: [],
};

/** Live-search popup: top 4 collections, top 8 products, total count and suggestions. */
export async function searchPopup(q: string): Promise<PopupResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  const query = q.trim().slice(0, 64);
  if (query.length < 2 || !isSupabaseConfigured()) return EMPTY;
  const supabase = createPublicClient();
  const [popup, page] = await Promise.all([
    supabase.rpc("search_catalog", {
      q: query,
      p_product_limit: 8,
      p_collection_limit: 4,
    }),
    supabase.rpc("search_products", { q: query, p_limit: 1 }),
  ]);
  if (popup.error) throw new Error(`Search failed: ${popup.error.message}`);
  const result = popup.data as unknown as SearchPopupResult;
  const total = page.error
    ? result.products.length
    : (page.data as unknown as SearchPage).total;
  return { ...result, total, suggestions: buildSuggestions(query, result) };
}

/**
 * "Suggested searches": the query itself, matching collection names, and
 * short phrases from matching product names that contain the query word.
 */
export function buildSuggestions(
  query: string,
  result: SearchPopupResult,
  limit = 5,
): string[] {
  const q = query.toLowerCase();
  const out = new Set<string>([q]);
  for (const c of result.collections) out.add(c.name.toLowerCase());
  for (const p of result.products) {
    const words = p.name.toLowerCase().split(/\s+/);
    const i = words.findIndex((w) => w.startsWith(q.split(/\s+/)[0]));
    if (i >= 0) out.add(words.slice(Math.max(0, i - 1), i + 2).join(" "));
  }
  return [...out].filter((s) => s.length >= 2).slice(0, limit);
}

export type SearchQuery = {
  q: string;
  sort: SearchSort;
  minPrice: number | null;
  maxPrice: number | null;
  sub: string[];
  inStock: boolean;
  page: number;
  perPage: number;
};

export async function searchProductsPage(
  query: SearchQuery,
): Promise<SearchPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  const empty: SearchPage = {
    total: 0,
    items: [],
    facets: { price_min: null, price_max: null, collections: [] },
  };
  if (query.q.length < 2 || !isSupabaseConfigured()) return empty;
  const { data, error } = await createPublicClient().rpc("search_products", {
    q: query.q,
    p_sort: query.sort,
    p_min_price: query.minPrice ?? undefined,
    p_max_price: query.maxPrice ?? undefined,
    p_collection_slugs: query.sub.length ? query.sub : undefined,
    p_in_stock: query.inStock,
    p_limit: query.perPage,
    p_offset: (query.page - 1) * query.perPage,
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data as unknown as SearchPage;
}
