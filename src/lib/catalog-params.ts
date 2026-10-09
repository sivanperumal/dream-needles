import {
  COLLECTION_SORTS,
  type CollectionSort,
  SEARCH_SORTS,
  type SearchSort,
} from "@/lib/types";

/**
 * Parses collection/search filter query params. Invalid values fall back to
 * defaults instead of erroring, so hand-edited URLs never break the page.
 *   ?sort=price_asc&min=200&max=900&sub=toys,key-chains&stock=1&page=2&cols=3
 */

export const PER_PAGE = 24;

type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function price(v: string | string[] | undefined): number | null {
  const n = Number(first(v));
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.floor(n) : null;
}

export type ListingParams = {
  minPrice: number | null;
  maxPrice: number | null;
  sub: string[];
  inStock: boolean;
  page: number;
  cols: 2 | 3 | 4;
};

function common(raw: Raw): ListingParams {
  let minPrice = price(raw.min);
  let maxPrice = price(raw.max);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice)
    [minPrice, maxPrice] = [maxPrice, minPrice];
  const page = Math.floor(Number(first(raw.page)));
  const cols = Number(first(raw.cols));
  return {
    minPrice,
    maxPrice,
    sub: (first(raw.sub) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))
      .slice(0, 20),
    inStock: first(raw.stock) === "1",
    page: Number.isFinite(page) && page >= 1 && page <= 1000 ? page : 1,
    cols: cols === 2 || cols === 3 ? cols : 4,
  };
}

export function parseCollectionParams(
  raw: Raw,
): ListingParams & { sort: CollectionSort } {
  const sort = first(raw.sort);
  return {
    ...common(raw),
    sort: (COLLECTION_SORTS as readonly string[]).includes(sort ?? "")
      ? (sort as CollectionSort)
      : "featured",
  };
}

export function parseSearchParams(
  raw: Raw,
): ListingParams & { sort: SearchSort; q: string } {
  const sort = first(raw.sort);
  return {
    ...common(raw),
    q: (first(raw.q) ?? "").trim().slice(0, 64),
    sort: (SEARCH_SORTS as readonly string[]).includes(sort ?? "")
      ? (sort as SearchSort)
      : "relevance",
  };
}

/** Number of active filters, for the "Filter Products (3)" badge. */
export function activeFilterCount(p: ListingParams): number {
  return (
    (p.minPrice !== null || p.maxPrice !== null ? 1 : 0) +
    p.sub.length +
    (p.inStock ? 1 : 0)
  );
}

export const SORT_LABELS: Record<string, string> = {
  relevance: "Best match",
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A to Z",
  best_rated: "Best rated",
};
