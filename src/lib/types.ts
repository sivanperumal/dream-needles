/** Shapes returned by the catalog database functions (see migrations 0006–0007). */

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  badges: string[];
  rating_avg: number;
  rating_count: number;
  is_new: boolean;
  in_stock: boolean;
  has_variants: boolean;
  /** Up to two storage paths: primary image and hover image. */
  images: string[];
  created_at: string;
};

export type Breadcrumb = { name: string; slug: string };

export type CollectionListing = {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image_path: string | null;
    seo_title: string | null;
    seo_description: string | null;
    ancestors: Breadcrumb[];
  };
  total: number;
  items: ProductCard[];
  facets: {
    price_min: number | null;
    price_max: number | null;
    subcollections: { name: string; slug: string; count: number }[];
  };
};

export type SearchPopupResult = {
  collections: {
    id: string;
    name: string;
    slug: string;
    parent_name: string | null;
  }[];
  products: (ProductCard & {
    matched_in: "name" | "sku" | "tags" | "description";
    snippet: string | null;
  })[];
};

export type SearchPage = {
  total: number;
  items: ProductCard[];
  facets: {
    price_min: number | null;
    price_max: number | null;
    collections: { name: string; slug: string; count: number }[];
  };
};

export const COLLECTION_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "best_rated",
] as const;
export type CollectionSort = (typeof COLLECTION_SORTS)[number];

export const SEARCH_SORTS = [
  "relevance",
  ...COLLECTION_SORTS.filter((s) => s !== "featured"),
] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];
