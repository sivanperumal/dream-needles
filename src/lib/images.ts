import { publicEnv } from "@/lib/env";

export const PRODUCT_BUCKET = "product-images";
export const SITE_ASSETS_BUCKET = "site-assets";

/**
 * URL for an image path stored in the database. Paths starting with "/" are
 * files in /public; anything else is an object in a public storage bucket.
 */
export function imageUrl(
  path: string | null | undefined,
  bucket = PRODUCT_BUCKET,
): string | null {
  if (!path) return null;
  if (path.startsWith("/") || /^https?:\/\//.test(path)) return path;
  const base = publicEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const PLACEHOLDER_IMAGE = "/images/brand/logo.png";
