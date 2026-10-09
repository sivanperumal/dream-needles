"use server";

import { z } from "zod";
import { buildCheckout, lineSchema } from "@/lib/checkout";
import { buyNowSchema, checkoutLinesFor } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

const previewSchema = z.object({
  couponCode: z.string().max(30).optional().nullable(),
  buyNow: buyNowSchema,
  /** Guests only: their local cart (prices are still read from the database). */
  guestLines: z.array(lineSchema).max(50).optional(),
});

/** Server-computed order summary for the checkout page. */
export async function previewCheckout(input: z.input<typeof previewSchema>) {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lines = user
    ? await checkoutLinesFor(supabase, parsed.data.buyNow)
    : (parsed.data.guestLines ?? []);
  return buildCheckout(lines, parsed.data.couponCode);
}
