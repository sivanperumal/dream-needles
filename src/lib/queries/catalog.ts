import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isSupabaseConfigured } from "@/lib/env";
import {
  buildFooterColumns,
  buildHeaderMenu,
  type NavCollectionRow,
  type NavMenuItemRow,
} from "@/lib/navigation";
import {
  previewNavigation,
  previewSettings,
  warnPreviewMode,
} from "@/lib/queries/preview";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Breadcrumb,
  CollectionListing,
  CollectionSort,
  ProductCard,
} from "@/lib/types";

/*
 * Public catalog reads. All functions are cached (`"use cache"`) with the
 * anonymous client, so RLS only ever exposes active products and visible
 * collections. Admin edits invalidate the tags in CACHE_TAGS.
 */

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

export async function getNavigation() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.navigation, CACHE_TAGS.catalog);
  if (!isSupabaseConfigured()) {
    warnPreviewMode();
    return previewNavigation();
  }

  const supabase = createPublicClient();
  const [collections, items] = await Promise.all([
    supabase
      .from("collections")
      .select(
        "id, parent_id, name, slug, description, show_in_menu, show_view_all, menu_order, menu_badge, is_system",
      ),
    supabase
      .from("menu_items")
      .select(
        "id, menu, parent_id, label, url, is_link, sort_order, collections(slug)",
      ),
  ]);
  if (collections.error) fail("Loading collections", collections.error);
  if (items.error) fail("Loading menu items", items.error);

  const menuRows: NavMenuItemRow[] = items.data.map((i) => ({
    id: i.id,
    menu: i.menu as NavMenuItemRow["menu"],
    parent_id: i.parent_id,
    label: i.label,
    url: i.url,
    is_link: i.is_link,
    sort_order: i.sort_order,
    collection_slug: i.collections?.slug ?? null,
  }));
  return {
    header: buildHeaderMenu(collections.data as NavCollectionRow[], menuRows),
    footer: buildFooterColumns(menuRows),
  };
}

export async function getStoreSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  if (!isSupabaseConfigured()) return previewSettings();

  const { data, error } = await createPublicClient()
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) fail("Loading store settings", error);
  return data;
}

export async function getBanners() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const { data, error } = await createPublicClient()
    .from("banners")
    .select(
      "id, placement, title, subtitle, cta_label, image_path, link_url, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order");
  if (error) fail("Loading banners", error);
  return {
    hero: data.filter((b) => b.placement === "hero"),
    tiles: data.filter((b) => b.placement === "tile"),
    categories: data.filter((b) => b.placement === "category"),
  };
}

export type CollectionQuery = {
  sort: CollectionSort;
  minPrice: number | null;
  maxPrice: number | null;
  sub: string[];
  inStock: boolean;
  page: number;
  perPage: number;
};

export async function getCollectionListing(
  slug: string,
  query: CollectionQuery,
) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.collection(slug));

  const { data, error } = await createPublicClient().rpc(
    "get_collection_products",
    {
      p_slug: slug,
      p_sort: query.sort,
      p_min_price: query.minPrice ?? undefined,
      p_max_price: query.maxPrice ?? undefined,
      p_sub_slugs: query.sub.length ? query.sub : undefined,
      p_in_stock: query.inStock,
      p_limit: query.perPage,
      p_offset: (query.page - 1) * query.perPage,
    },
  );
  if (error) fail(`Loading collection ${slug}`, error);
  return data as unknown as CollectionListing | null;
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.product(slug));

  const supabase = createPublicClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, description, sku, tags, price, compare_at_price, stock, badges,
       rating_avg, rating_count, seo_title, seo_description, created_at,
       product_images (id, storage_path, alt, sort_order),
       product_variants (id, option_name, value, swatch_hex, sku, price_override, stock, image_id, sort_order, is_active),
       product_collections (sort_order, collections (id, name, slug, is_system))`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail(`Loading product ${slug}`, error);
  if (!product) return null;

  const cards = await supabase.rpc("get_product_cards", {
    p_ids: [product.id],
  });
  if (cards.error) fail("Loading product flags", cards.error);
  const card = (cards.data as unknown as ProductCard[])[0];

  // Breadcrumbs follow the product's first (lowest sort order) real collection.
  const primary =
    [...product.product_collections]
      .filter((pc) => pc.collections && !pc.collections.is_system)
      .sort((a, b) => a.sort_order - b.sort_order)[0]?.collections ?? null;
  let breadcrumbs: Breadcrumb[] = [];
  if (primary) {
    const { data: ancestors, error: ancestorsError } = await supabase.rpc(
      "collection_ancestors",
      {
        collection_id: primary.id,
      },
    );
    if (ancestorsError) fail("Loading breadcrumbs", ancestorsError);
    breadcrumbs = [
      ...(ancestors as unknown as Breadcrumb[]),
      { name: primary.name, slug: primary.slug },
    ];
  }

  return {
    ...product,
    images: [...product.product_images].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    variants: product.product_variants
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
    isNew: card?.is_new ?? false,
    inStock: card?.in_stock ?? product.stock > 0,
    breadcrumbs,
  };
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getRelatedProducts(productId: string, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const { data, error } = await createPublicClient().rpc(
    "get_related_products",
    {
      p_product_id: productId,
      p_limit: limit,
    },
  );
  if (error) fail("Loading related products", error);
  return data as unknown as ProductCard[];
}

export async function getProductCards(ids: string[]) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  if (!ids.length) return [];
  const { data, error } = await createPublicClient().rpc("get_product_cards", {
    p_ids: ids,
  });
  if (error) fail("Loading products", error);
  return data as unknown as ProductCard[];
}

export async function getPage(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.content, CACHE_TAGS.page(slug));

  const { data, error } = await createPublicClient()
    .from("pages")
    .select("slug, title, body_markdown, seo_description, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail(`Loading page ${slug}`, error);
  return data;
}

/** Active product slugs, for prerendering product pages at build time. */
export async function getAllProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select("slug")
    .order("created_at", { ascending: false });
  if (error) fail("Loading product slugs", error);
  return data.map((p) => p.slug);
}

export async function getReviews(productId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.reviews(productId));

  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, rating, title, body, author_name, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail("Loading reviews", error);
  return data;
}
