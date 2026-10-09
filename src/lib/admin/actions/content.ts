"use server";

import { z } from "zod";
import { type ActionResult, adminOrError } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { fieldErrors } from "@/lib/validation/account";
import type { TablesUpdate } from "@/types/database";

const id = z.uuid();
const bool = z
  .union([
    z.literal("on"),
    z.literal("true"),
    z.literal("false"),
    z.literal(""),
  ])
  .optional()
  .transform((v) => v === "on" || v === "true");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
const localOrHttps = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v),
    "Use a path like /collections/toys or a full https:// link.",
  );

/* ---------------------------------------------------------------- coupons */

const couponSchema = z
  .object({
    id: id.optional().or(z.literal("").transform(() => undefined)),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "3–30 letters, numbers, - or _."),
    description: z.string().trim().max(200).default(""),
    discount_type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().positive("Must be more than 0."),
    min_subtotal: z.coerce.number().min(0).default(0),
    max_discount: z
      .union([z.literal(""), z.coerce.number().positive()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    usage_limit: z
      .union([z.literal(""), z.coerce.number().int().positive()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    starts_at: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(v).toISOString() : null)),
    ends_at: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(v).toISOString() : null)),
    is_active: bool,
  })
  .refine((c) => c.discount_type !== "percent" || c.value <= 100, {
    message: "A percentage can't exceed 100.",
    path: ["value"],
  })
  .refine((c) => !c.starts_at || !c.ends_at || c.ends_at > c.starts_at, {
    message: "End must be after start.",
    path: ["ends_at"],
  });

export async function saveCoupon(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { id: couponId, ...row } = parsed.data;
  const { error } = couponId
    ? await auth.supabase.from("coupons").update(row).eq("id", couponId)
    : await auth.supabase.from("coupons").insert(row);
  if (error) {
    return error.message.includes("coupons_code_key")
      ? { ok: false, errors: { code: "This code already exists." } }
      : { ok: false, message: "Couldn't save the coupon." };
  }
  return { ok: true, message: couponId ? "Coupon saved." : "Coupon created." };
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!id.safeParse(couponId).success)
    return { ok: false, message: "Invalid coupon." };
  const { error } = await auth.supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);
  return error
    ? { ok: false, message: "Couldn't delete the coupon." }
    : { ok: true, message: "Coupon deleted." };
}

/* ---------------------------------------------------------------- reviews */

export async function setReviewHidden(
  reviewId: string,
  hidden: boolean,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!id.safeParse(reviewId).success)
    return { ok: false, message: "Invalid review." };
  const { data, error } = await auth.supabase
    .from("reviews")
    .update({ is_hidden: hidden })
    .eq("id", reviewId)
    .select("product_id")
    .single();
  if (error) return { ok: false, message: "Couldn't update the review." };
  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.reviews(data.product_id));
  return {
    ok: true,
    message: hidden ? "Review hidden." : "Review visible again.",
  };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!id.safeParse(reviewId).success)
    return { ok: false, message: "Invalid review." };
  const { data, error } = await auth.supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .select("product_id")
    .single();
  if (error) return { ok: false, message: "Couldn't delete the review." };
  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.reviews(data.product_id));
  return { ok: true, message: "Review deleted." };
}

/* ---------------------------------------------------------------- banners */

const bannerSchema = z.object({
  id: id.optional().or(z.literal("").transform(() => undefined)),
  placement: z.enum(["hero", "tile", "category"]),
  title: z.string().trim().min(1, "Title is required.").max(80),
  subtitle: z.string().trim().max(160).default(""),
  cta_label: optionalText(40),
  image_path: z.string().trim().min(1, "Upload an image.").max(500),
  link_url: localOrHttps.transform((v) => v || null),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
  is_active: bool,
});

export async function saveBanner(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { id: bannerId, ...row } = parsed.data;
  const { error } = bannerId
    ? await auth.supabase.from("banners").update(row).eq("id", bannerId)
    : await auth.supabase.from("banners").insert(row);
  if (error) return { ok: false, message: "Couldn't save the banner." };
  refreshStorefront(CACHE_TAGS.content);
  return { ok: true, message: "Banner saved." };
}

export async function deleteBanner(bannerId: string): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!id.safeParse(bannerId).success)
    return { ok: false, message: "Invalid banner." };
  const { error } = await auth.supabase
    .from("banners")
    .delete()
    .eq("id", bannerId);
  if (error) return { ok: false, message: "Couldn't delete the banner." };
  refreshStorefront(CACHE_TAGS.content);
  return { ok: true, message: "Banner deleted." };
}

/* --------------------------------------------------------------- settings */

const statSchema = z.object({
  value: z.string().trim().min(1).max(20),
  label: z.string().trim().min(1).max(60),
});
const marketplaceSchema = z.object({
  name: z.string().trim().min(1).max(40),
  url: z.union([z.literal(""), z.url()]),
  logo_path: z.string().trim().max(500).nullable(),
});
const socialSchema = z.object({
  facebook: z.union([z.literal(""), z.url()]),
  instagram: z.union([z.literal(""), z.url()]),
  youtube: z.union([z.literal(""), z.url()]),
  whatsapp: z.union([z.literal(""), z.url()]),
});

const settingsSchema = z.object({
  whats_new_days: z.coerce.number().int().min(1, "At least 1 day.").max(365),
  free_shipping_threshold: z.coerce.number().min(0),
  shipping_fee: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(28),
  delivery_eta_text: z.string().trim().min(3).max(120),
  low_stock_threshold: z.coerce.number().int().min(0).max(1000),
  contact_email: z
    .union([z.literal(""), z.email()])
    .optional()
    .transform((v) => v || null),
  contact_phone: optionalText(20),
  whatsapp_number: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[^\d]/g, "") : null))
    .refine(
      (v) => v === null || /^\d{10,13}$/.test(v),
      "Use the full number with country code, e.g. 919876543210.",
    ),
  store_address: optionalText(300),
  home_intro: z.string().trim().max(2000).optional(),
  promo_ticker: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6),
    ),
  home_stats: z.string().optional(),
  marketplaces: z.string().optional(),
  social_links: z.string().optional(),
});

/** Saves the settings form; JSON fields come from the editor as JSON strings. */
export async function saveSettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const raw = Object.fromEntries(formData);
  const parsed = settingsSchema.partial().safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { home_stats, marketplaces, social_links, ...rest } = parsed.data;

  // Only update fields that were on the submitted form.
  const patch = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key in raw),
  ) as TablesUpdate<"store_settings">;
  try {
    if (home_stats !== undefined)
      patch.home_stats = z
        .array(statSchema)
        .max(8)
        .parse(JSON.parse(home_stats));
    if (marketplaces !== undefined)
      patch.marketplaces = z
        .array(marketplaceSchema)
        .max(8)
        .parse(JSON.parse(marketplaces));
    if (social_links !== undefined)
      patch.social_links = socialSchema.parse(JSON.parse(social_links));
  } catch {
    return {
      ok: false,
      message:
        "Some links or values are invalid. Links must start with https://.",
    };
  }
  const { error } = await auth.supabase
    .from("store_settings")
    .update(patch)
    .eq("id", 1);
  if (error) return { ok: false, message: "Couldn't save settings." };
  refreshStorefront(CACHE_TAGS.settings, CACHE_TAGS.catalog);
  return { ok: true, message: "Settings saved." };
}

/* ------------------------------------------------------------------ pages */

const pageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().trim().min(1, "Title is required.").max(120),
  body_markdown: z.string().max(50_000),
  seo_description: optionalText(320),
});

export async function savePage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { slug, ...row } = parsed.data;
  const { error } = await auth.supabase
    .from("pages")
    .update(row)
    .eq("slug", slug);
  if (error) return { ok: false, message: "Couldn't save the page." };
  refreshStorefront(CACHE_TAGS.content, CACHE_TAGS.page(slug));
  return { ok: true, message: "Page saved." };
}

/* ------------------------------------------------------------- navigation */

const menuItemSchema = z
  .object({
    id: id.optional().or(z.literal("").transform(() => undefined)),
    menu: z.enum(["header", "footer"]),
    parent_id: id.nullable().or(z.literal("").transform(() => null)),
    label: z.string().trim().min(1, "Label is required.").max(60),
    collection_id: id.nullable().or(z.literal("").transform(() => null)),
    url: localOrHttps.transform((v) => v || null),
    is_link: bool,
    sort_order: z.coerce.number().int().min(0).max(999).default(0),
  })
  .refine((m) => !m.is_link || m.collection_id || m.url, {
    message: "Choose a collection or enter a link.",
    path: ["url"],
  });

export async function saveMenuItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = menuItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { id: itemId, ...row } = parsed.data;
  const { error } = itemId
    ? await auth.supabase.from("menu_items").update(row).eq("id", itemId)
    : await auth.supabase.from("menu_items").insert(row);
  if (error) return { ok: false, message: "Couldn't save the link." };
  refreshStorefront(CACHE_TAGS.navigation);
  return { ok: true, message: "Menu saved." };
}

export async function deleteMenuItem(itemId: string): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!id.safeParse(itemId).success)
    return { ok: false, message: "Invalid item." };
  const { error } = await auth.supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, message: "Couldn't delete the link." };
  refreshStorefront(CACHE_TAGS.navigation);
  return { ok: true, message: "Link deleted." };
}
