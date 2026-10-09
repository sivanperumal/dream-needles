import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/public";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image: string | null;
  variants: {
    id: string;
    label: string;
    price: number;
    stock: number;
    image: string | null;
  }[];
  hasVariants: boolean;
};

/** Current details for products in a cart (active products only). */
export async function getCartProducts(ids: string[]): Promise<CartProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalog);

  if (!ids.length) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock,
       product_images (id, storage_path, sort_order),
       product_variants (id, option_name, value, price_override, stock, image_id, is_active)`,
    )
    .in("id", ids);
  if (error) throw new Error(`Loading cart products: ${error.message}`);

  return data.map((p) => {
    const images = [...p.product_images].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const variants = p.product_variants.filter((v) => v.is_active);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      compare_at_price: p.compare_at_price,
      stock: p.stock,
      image: images[0]?.storage_path ?? null,
      hasVariants: variants.length > 0,
      variants: variants.map((v) => ({
        id: v.id,
        label: `${v.option_name}: ${v.value}`,
        price: v.price_override ?? p.price,
        stock: v.stock,
        image:
          images.find((i) => i.id === v.image_id)?.storage_path ??
          images[0]?.storage_path ??
          null,
      })),
    };
  });
}
