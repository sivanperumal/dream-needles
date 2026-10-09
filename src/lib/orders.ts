import "server-only";
import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { type LineInput, lineSchema } from "@/lib/checkout";
import { sendOrderEmail } from "@/lib/email/order-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/types/database";

export const buyNowSchema = z
  .object({
    productId: z.uuid(),
    variantId: z.uuid().nullable().optional(),
    quantity: z.number().int().min(1).max(99),
  })
  .nullable()
  .optional();

/** Lines to check out: a single "Buy Now" item, or the signed-in user's saved cart. */
export async function checkoutLinesFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  buyNow: z.infer<typeof buyNowSchema>,
): Promise<LineInput[]> {
  if (buyNow)
    return [
      {
        productId: buyNow.productId,
        variantId: buyNow.variantId ?? null,
        quantity: buyNow.quantity,
      },
    ];
  const { data } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity")
    .order("created_at");
  return (data ?? []).map((r) =>
    lineSchema.parse({
      productId: r.product_id,
      variantId: r.variant_id,
      quantity: r.quantity,
    }),
  );
}

/**
 * Marks an order paid (idempotent, see place_order_paid in migration 0006).
 * When this call is the one that changed the status, the stock cache is
 * refreshed and the confirmation email is sent after the response.
 */
export async function markOrderPaid(input: {
  orderId: string;
  paymentId: string;
  method: string | null;
  amountRupees: number | null;
  source: "checkout" | "webhook";
  raw?: unknown;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("place_order_paid", {
    p_order_id: input.orderId,
    p_razorpay_payment_id: input.paymentId,
    // SQL accepts null for both (null amount skips the amount check); the
    // generated types can't express nullable function arguments.
    p_method: input.method as string,
    p_amount: input.amountRupees as number,
    p_source: input.source,
    p_raw: (input.raw ?? null) as Json,
  });
  if (error) throw new Error(`place_order_paid failed: ${error.message}`);
  const result = data as unknown as {
    order_number: string;
    already_paid: boolean;
    stock_issue?: boolean;
  };

  if (!result.already_paid) {
    revalidateTag(CACHE_TAGS.catalog, "max");
    after(async () => {
      const { data: order } = await admin
        .from("orders")
        .select("*")
        .eq("id", input.orderId)
        .single();
      const { data: items } = await admin
        .from("order_items")
        .select("*")
        .eq("order_id", input.orderId);
      if (order && items) await sendOrderEmail("confirmation", order, items);
    });
  }
  return result;
}
