"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  productId: z.uuid(),
  productSlug: z.string().max(200),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(""),
  body: z
    .string()
    .trim()
    .min(5, "Please write a few words (at least 5 characters).")
    .max(2000),
});

export type ReviewState = { ok: boolean; message: string } | null;

/** Signed-in customers can post one review per product (editing replaces it). */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in to write a review." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const author =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Verified customer";

  const { productId, productSlug, rating, title, body } = parsed.data;
  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: productId,
      user_id: user.id,
      rating,
      title: title || null,
      body,
      author_name: author.slice(0, 60),
    },
    { onConflict: "product_id,user_id" },
  );
  if (error)
    return {
      ok: false,
      message: "Sorry, we couldn't save your review. Please try again.",
    };

  updateTag(CACHE_TAGS.reviews(productId));
  updateTag(CACHE_TAGS.product(productSlug));
  return { ok: true, message: "Thank you! Your review is now live." };
}
