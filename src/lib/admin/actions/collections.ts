"use server";

import { z } from "zod";
import { type ActionResult, adminOrError } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { slugify } from "@/lib/slug";
import { fieldErrors } from "@/lib/validation/account";

const bool = z
  .union([
    z.literal("on"),
    z.literal("true"),
    z.literal("false"),
    z.literal(""),
  ])
  .optional()
  .transform((v) => v === "on" || v === "true");

const collectionSchema = z
  .object({
    id: z
      .uuid()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    name: z.string().trim().min(1, "Name is required.").max(80),
    slug: z.string().trim().max(80).optional(),
    parent_id: z
      .uuid()
      .nullable()
      .or(z.literal("").transform(() => null)),
    description: z.string().trim().max(2000).default(""),
    menu_badge: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => v || null),
    is_visible: bool,
    show_in_menu: bool,
    show_view_all: bool,
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
  .transform((c) => ({ ...c, slug: slugify(c.slug || c.name) }))
  .refine((c) => c.slug.length > 0, {
    message: "Add a slug using letters or numbers.",
    path: ["slug"],
  });

export async function saveCollection(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Please fix the highlighted fields.",
    };
  const { id, ...row } = parsed.data;
  const { supabase } = auth;

  let menu_order: number | undefined;
  if (!id) {
    // New collections go to the end of their siblings.
    const siblings = supabase
      .from("collections")
      .select("menu_order")
      .order("menu_order", { ascending: false })
      .limit(1);
    const { data } = row.parent_id
      ? await siblings.eq("parent_id", row.parent_id)
      : await siblings.is("parent_id", null);
    menu_order = (data?.[0]?.menu_order ?? -1) + 1;
  }
  const result = id
    ? await supabase
        .from("collections")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("collections")
        .insert({ ...row, menu_order })
        .select("id")
        .single();
  if (result.error) {
    const msg = result.error.message;
    if (msg.includes("collections_slug_key"))
      return {
        ok: false,
        errors: { slug: "Another collection already uses this slug." },
      };
    if (msg.includes("own ancestor"))
      return {
        ok: false,
        errors: {
          parent_id:
            "A collection can't be placed inside itself or its children.",
        },
      };
    return { ok: false, message: "Couldn't save the collection." };
  }
  refreshStorefront(
    CACHE_TAGS.catalog,
    CACHE_TAGS.navigation,
    CACHE_TAGS.collection(row.slug),
  );
  return {
    ok: true,
    message: id ? "Collection saved." : "Collection created.",
    id: result.data.id,
  };
}

/** Swap menu order with the previous/next sibling. */
export async function moveCollection(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!z.uuid().safeParse(id).success)
    return { ok: false, message: "Invalid collection." };
  const { supabase } = auth;
  const { data: current } = await supabase
    .from("collections")
    .select("id, parent_id, menu_order")
    .eq("id", id)
    .single();
  if (!current) return { ok: false, message: "Collection not found." };
  const siblingsQuery = supabase
    .from("collections")
    .select("id, menu_order, name")
    .order("menu_order")
    .order("name");
  const { data: siblings } = current.parent_id
    ? await siblingsQuery.eq("parent_id", current.parent_id)
    : await siblingsQuery.is("parent_id", null);
  const list = siblings ?? [];
  const index = list.findIndex((s) => s.id === id);
  const swapWith = list[direction === "up" ? index - 1 : index + 1];
  if (!swapWith) return { ok: true, message: "Already at the edge." };
  // Re-number all siblings so duplicate orders can't get stuck.
  const ordered = [...list];
  ordered.splice(index, 1);
  ordered.splice(direction === "up" ? index - 1 : index + 1, 0, list[index]);
  await Promise.all(
    ordered.map((s, i) =>
      supabase.from("collections").update({ menu_order: i }).eq("id", s.id),
    ),
  );
  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.navigation);
  return { ok: true, message: "Order updated." };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!z.uuid().safeParse(id).success)
    return { ok: false, message: "Invalid collection." };
  const { supabase } = auth;
  const { data: col } = await supabase
    .from("collections")
    .select("is_system")
    .eq("id", id)
    .single();
  if (col?.is_system)
    return {
      ok: false,
      message:
        "What's New is a built-in collection and can't be deleted. Hide it instead.",
    };
  const { count } = await supabase
    .from("collections")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (count)
    return { ok: false, message: "Move or delete its sub-collections first." };
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete the collection." };
  refreshStorefront(CACHE_TAGS.catalog, CACHE_TAGS.navigation);
  return { ok: true, message: "Collection deleted. Its products are kept." };
}
