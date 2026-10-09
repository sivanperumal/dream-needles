"use server";

import { after } from "next/server";
import { z } from "zod";
import { type ActionResult, adminOrError } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { type OrderEmailKind, sendOrderEmail } from "@/lib/email/order-emails";
import {
  canTransition,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/order-status";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  orderId: z.uuid(),
  status: z.enum(ORDER_STATUSES),
  tracking_number: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  tracking_url: z
    .union([z.literal(""), z.url("Enter a full link starting with https://")])
    .optional()
    .transform((v) => v || null),
  admin_note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
  restock: z.literal("on").optional(),
  notify: z.literal("on").optional(),
});

/** Moves an order along pending → paid → shipped → delivered (or cancels it) and emails the customer. */
export async function updateOrder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, message: auth.error };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  const input = parsed.data;
  const { supabase } = auth;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", input.orderId)
    .single();
  if (!order) return { ok: false, message: "Order not found." };
  const from = order.status as OrderStatus;
  const changing = input.status !== from;
  if (changing && !canTransition(from, input.status)) {
    return {
      ok: false,
      message: `An order can't go from ${from} to ${input.status}.`,
    };
  }
  if (
    input.status === "shipped" &&
    !input.tracking_number &&
    !order.tracking_number
  ) {
    return {
      ok: false,
      message: "Add a tracking number before marking the order as shipped.",
    };
  }

  const now = new Date().toISOString();
  const patch = {
    status: input.status,
    tracking_number: input.tracking_number ?? order.tracking_number,
    tracking_url: input.tracking_url ?? order.tracking_url,
    admin_note: input.admin_note,
    ...(changing && input.status === "paid" && { paid_at: now }),
    ...(changing && input.status === "shipped" && { shipped_at: now }),
    ...(changing && input.status === "delivered" && { delivered_at: now }),
    ...(changing && input.status === "cancelled" && { cancelled_at: now }),
  };
  const { data: updated, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .select("*")
    .single();
  if (error || !updated)
    return { ok: false, message: "Couldn't update the order." };

  // Put items back on the shelf when a paid order is cancelled.
  const admin = createAdminClient();
  if (
    changing &&
    input.status === "cancelled" &&
    input.restock &&
    from !== "pending"
  ) {
    const { data: items } = await admin
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", order.id);
    for (const item of items ?? []) {
      const table = item.variant_id ? "product_variants" : "products";
      const id = item.variant_id ?? item.product_id;
      if (!id) continue;
      const { data: row } = await admin
        .from(table)
        .select("stock")
        .eq("id", id)
        .maybeSingle();
      if (row)
        await admin
          .from(table)
          .update({ stock: row.stock + item.quantity })
          .eq("id", id);
    }
    refreshStorefront(CACHE_TAGS.catalog);
  }

  const emailKind: Partial<Record<OrderStatus, OrderEmailKind>> = {
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    paid: "confirmation",
  };
  const kind = emailKind[input.status];
  if (changing && kind && input.notify) {
    after(async () => {
      const { data: items } = await admin
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      await sendOrderEmail(kind, updated, items ?? []);
    });
  }
  return {
    ok: true,
    message: changing
      ? `Order marked as ${input.status}.${kind && input.notify ? " The customer will be emailed." : ""}`
      : "Order saved.",
  };
}
