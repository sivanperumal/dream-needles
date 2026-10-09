import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isSupabaseConfigured } from "@/lib/env";
import { POLICY_PAGES } from "@/lib/policy-pages";
import { createPublicClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.navigation);

  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const pages: MetadataRoute.Sitemap = [
    "",
    "/retail-store",
    "/our-story",
    "/faq",
    "/contact",
    ...Object.keys(POLICY_PAGES).map((s) => `/${s}`),
  ].map((path) => ({
    url: `${site}${path}`,
    changeFrequency: path ? "monthly" : "daily",
    priority: path ? 0.5 : 1,
  }));
  if (!isSupabaseConfigured()) return pages;

  const supabase = createPublicClient();
  const [{ data: collections }, { data: products }] = await Promise.all([
    supabase.from("collections").select("slug, updated_at"),
    supabase
      .from("products")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false }),
  ]);
  return [
    ...pages,
    ...(collections ?? []).map((c) => ({
      url: `${site}/collections/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(products ?? []).map((p) => ({
      url: `${site}/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
