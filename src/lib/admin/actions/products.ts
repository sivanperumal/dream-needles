"use server";

import { z } from "zod";
import { type ActionResult, adminOrError } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { PRODUCT_BUCKET } from "@/lib/images";
import { slugify } from "@/lib/slug";
import { fieldErrors } from "@/lib/validation/account";

const money = z.coerce.number().min(0, "Must be 0 or more.").max(1_000_000);
const optionalMoney = z
  .union([
    z.literal(""),
    z.coerce.number().positive("Must be more than 0.").max(1_000_000),
  ])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));
const list = z
  .string()
  .optional()
  .transform((v) =>
    [
      ...new Set(
        (v ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ].slice(0, 30),
  );

const productSchema = z
  .object({
    id: z
      .uuid()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    name: z.string().trim().min(1, "Name is required.").max(160),
    slug: z.string().trim().max(80).optional(),
    description: z.string().trim().max(10_000).default(""),
    sku: z
      .string()
      .trim()
      .max(40)
      .regex(/^[A-Za-z0-9_-]*$/, "Use letters, numbers, - and _ only.")
      .transform((v) => v || null),
    price: money,
    compare_at_price: optionalMoney,
    stock: z.coerce.number().int("Whole numbers only.").min(0).max(100_000),
    status: z.enum(["active", "draft"]),
    whats_new_mode: z.enum(["auto", "pinned", "excluded"]),
    tags: list,
    badges: list,
    seo_title: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((v) => v || null),
    seo_description: z
      .string()
      .trim()
      .max(320)
      .optional()
      .transform((v) => v || null),
  })
  .transform((p) => ({ ...p, slug: slugify(p.slug || p.name) }))
  .refine((p) => p.slug.length > 0, {
    message: "Add a slug using letters or numbers.",
    path: ["slug"],
  })
  .refine((p) => p.compare_at_price === null || p.compare_at_price > p.price, {
    message: "Compare-at price should be higher than the price.",
    path: ["compare_at_price"],
  });

/** Create or update a product and its collection assignments. */
export async function saveProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const collectionIds = z
    .array(z.uuid())
    .max(50)
    .safeParse(formData.getAll("collection_ids"));
  if (!collectionIds.success)
    return { ok: false, message: "Invalid collections." };

  const { id, ...product } = parsed.data;
  const { supabase } = auth;
  const result = id
    ? await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select("id, slug")
        .single()
    : await supabase
        .from("products")
        .insert(product)
        .select("id, slug")
        .single();
  if (result.error) {
    const msg = result.error.message;
    if (msg.includes("products_slug_key"))
      return {
        ok: false,
        errors: { slug: "Another product already uses this slug." },
      };
    if (msg.includes("products_sku_key"))
      return {
        ok: false,
        errors: { sku: "Another product already uses this SKU." },
      };
    return {
      ok: false,
      message: "Couldn't save the product. Please try again.",
    };
  }
  const productId = result.data.id;

  // Sync collections: remove unticked, add newly ticked (keeps sort order of existing ones).
  const { data: current } = await supabase
    .from("product_collections")
    .select("collection_id")
    .eq("product_id", productId);
  const have = new Set((current ?? []).map((r) => r.collection_id));
  const want = new Set(collectionIds.data);
  const remove = [...have].filter((c) => !want.has(c));
  const add = [...want].filter((c) => !have.has(c));
  if (remove.length)
    await supabase
      .from("product_collections")
      .delete()
      .eq("product_id", productId)
      .in("collection_id", remove);
  if (add.length) {
    await supabase.from("product_collections").insert(
      add.map((collection_id) => ({
        product_id: productId,
        collection_id,
        sort_order: 999,
      })),
    );
  }

  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.product(result.data.slug));
  return {
    ok: true,
    message: id ? "Product saved." : "Product created. Now add images.",
    id: productId,
  };
}

const idSchema = z.uuid();

/** Soft delete: hidden from the store, kept for order history. */
export async function setProductDeleted(
  id: string,
  deleted: boolean,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!idSchema.safeParse(id).success)
    return { ok: false, message: "Invalid product." };
  const { data, error } = await auth.supabase
    .from("products")
    .update(
      deleted
        ? { deleted_at: new Date().toISOString(), status: "draft" }
        : { deleted_at: null },
    )
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, message: "Couldn't update the product." };
  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.product(data.slug));
  return {
    ok: true,
    message: deleted
      ? "Product hidden (deleted). You can restore it later."
      : "Product restored as a draft.",
  };
}

/* ---------------------------------------------------------------- images */

/** Registers an image already uploaded to Storage (the browser uploads it directly, as admin). */
export async function addProductImage(
  productId: string,
  storagePath: string,
  alt: string,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (
    !idSchema.safeParse(productId).success ||
    !/^products\/[a-z0-9-]+\/[\w.-]+$/.test(storagePath)
  ) {
    return { ok: false, message: "Invalid image." };
  }
  const { supabase } = auth;
  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt: alt.slice(0, 160),
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { ok: false, message: "Couldn't save the image." };
  refreshStorefront(CACHE_TAGS.catalog);
  return { ok: true, message: "Image added." };
}

export async function reorderProductImages(
  productId: string,
  imageIds: string[],
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!z.array(z.uuid()).max(50).safeParse(imageIds).success)
    return { ok: false, message: "Invalid order." };
  await Promise.all(
    imageIds.map((imageId, index) =>
      auth.supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("product_id", productId),
    ),
  );
  refreshStorefront(CACHE_TAGS.catalog);
  return { ok: true, message: "Image order saved." };
}

export async function updateImageAlt(
  imageId: string,
  alt: string,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!idSchema.safeParse(imageId).success)
    return { ok: false, message: "Invalid image." };
  await auth.supabase
    .from("product_images")
    .update({ alt: alt.trim().slice(0, 160) })
    .eq("id", imageId);
  refreshStorefront(CACHE_TAGS.catalog);
  return { ok: true, message: "Alt text saved." };
}

export async function deleteProductImage(
  imageId: string,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!idSchema.safeParse(imageId).success)
    return { ok: false, message: "Invalid image." };
  const { data, error } = await auth.supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .select("storage_path")
    .single();
  if (error) return { ok: false, message: "Couldn't delete the image." };
  // Only remove the file if no other product uses it.
  const { count } = await auth.supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", data.storage_path);
  if (!count)
    await auth.supabase.storage
      .from(PRODUCT_BUCKET)
      .remove([data.storage_path]);
  refreshStorefront(CACHE_TAGS.catalog);
  return { ok: true, message: "Image deleted." };
}

/* -------------------------------------------------------------- variants */

const variantSchema = z.object({
  id: z.uuid().optional(),
  option_name: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1, "Each option needs a name.").max(60),
  swatch_hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #4D0851.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  sku: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9_-]*$/)
    .transform((v) => v || null),
  price_override: z.number().min(0).max(1_000_000).nullable(),
  stock: z.number().int().min(0).max(100_000),
  is_active: z.boolean(),
  image_id: z.uuid().nullable(),
});
export type VariantInput = z.input<typeof variantSchema>;

/** Replaces the product's variants with the given list (keeps ids that still exist). */
export async function saveVariants(
  productId: string,
  variants: VariantInput[],
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!idSchema.safeParse(productId).success)
    return { ok: false, message: "Invalid product." };
  const parsed = z.array(variantSchema).max(30).safeParse(variants);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the options.",
    };
  const values = parsed.data.map((v) => v.value.toLowerCase());
  if (new Set(values).size !== values.length)
    return { ok: false, message: "Two options have the same name." };

  const { supabase } = auth;
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  const keep = new Set(parsed.data.flatMap((v) => (v.id ? [v.id] : [])));
  const removed = (existing ?? [])
    .map((r) => r.id)
    .filter((id) => !keep.has(id));
  if (removed.length)
    await supabase.from("product_variants").delete().in("id", removed);

  for (const [index, { id, ...variant }] of parsed.data.entries()) {
    const row = { ...variant, product_id: productId, sort_order: index };
    const { error } = id
      ? await supabase.from("product_variants").update(row).eq("id", id)
      : await supabase.from("product_variants").insert(row);
    if (error) {
      return {
        ok: false,
        message: error.message.includes("sku")
          ? `SKU ${variant.sku} is already used.`
          : "Couldn't save the options.",
      };
    }
  }
  refreshStorefront(CACHE_TAGS.catalog);
  return {
    ok: true,
    message: variants.length ? "Options saved." : "Options removed.",
  };
}
