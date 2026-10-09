"use server";

import { z } from "zod";
import { getCartProducts } from "@/lib/queries/cart";
import {
  getProductBySlug,
  getProductCards,
  getStoreSettings,
} from "@/lib/queries/catalog";

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

/** Product details + pricing settings for the cart drawer / cart page. */
export async function loadCartDetails(ids: string[]) {
  const parsed = idsSchema.safeParse([...new Set(ids)]);
  if (!parsed.success) return null;
  const [products, settings] = await Promise.all([
    getCartProducts(parsed.data),
    getStoreSettings(),
  ]);
  return {
    products,
    settings: {
      free_shipping_threshold: settings.free_shipping_threshold,
      shipping_fee: settings.shipping_fee,
      gst_rate: settings.gst_rate,
    },
  };
}
