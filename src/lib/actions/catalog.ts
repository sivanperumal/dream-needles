"use server";

import { z } from "zod";
import { getProductBySlug, getProductCards } from "@/lib/queries/catalog";

/* Read-only catalog data for client components (quick view, recently viewed, wishlist). */

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(200);
const idsSchema = z.array(z.uuid()).max(60);

export async function loadQuickView(slug: string) {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;
  return getProductBySlug(parsed.data);
}

export async function loadProductCards(ids: string[]) {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return [];
  return getProductCards(parsed.data);
}
