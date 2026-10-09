import { z } from "zod";
import { buildCheckout } from "@/lib/checkout";
import { publicEnv } from "@/lib/env";
import { buyNowSchema, checkoutLinesFor } from "@/lib/orders";
import { razorpay } from "@/lib/razorpay";
import { toPaise } from "@/lib/razorpay-signature";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  addressId: z.uuid(),
  couponCode: z.string().max(30).optional().nullable(),
  giftNote: z.string().trim().max(300).optional().nullable(),
  buyNow: buyNowSchema,
});

const fail = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

/**
 * POST /api/checkout/create-order
 * Recomputes the order from the database (never trusts browser prices),
 * saves it as "pending" with an item snapshot, and opens a Razorpay order.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Please check your checkout details.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in to continue.", 401);

  const { data: address } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, line2, landmark, city, state, pincode")
    .eq("id", parsed.data.addressId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!address) return fail("Please choose a delivery address.");

  const lines = await checkoutLinesFor(supabase, parsed.data.buyNow);
  if (!lines.length) return fail("Your cart is empty.");
  const summary = await buildCheckout(lines, parsed.data.couponCode);
  if (!summary.canPay)
    return fail(
      "Some items are unavailable or out of stock. Please review your cart.",
      409,
    );
  if (parsed.data.couponCode && !summary.coupon.applied)
    return fail(summary.coupon.message ?? "That coupon can't be used.");

  const admin = createAdminClient();
  const { totals } = summary;
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      email: user.email!,
      phone: address.phone,
      subtotal: totals.subtotal,
      discount_total: totals.discount,
      shipping_total: totals.shipping,
      gst_total: totals.gstIncluded,
      total: totals.total,
      coupon_id: summary.coupon.id,
      coupon_code: summary.coupon.applied ? summary.coupon.code : null,
      shipping_address: address,
      gift_note: parsed.data.giftNote || null,
    })
    .select("id, order_number")
    .single();
  if (error || !order)
    return fail("We couldn't create your order. Please try again.", 500);

  const { error: itemsError } = await admin.from("order_items").insert(
    summary.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.name,
      product_slug: l.slug,
      variant_label: l.variantLabel,
      sku: l.sku,
      image_path: l.image,
      unit_price: l.unitPrice,
      quantity: l.quantity,
      line_total: Math.round(l.unitPrice * l.quantity * 100) / 100,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("We couldn't create your order. Please try again.", 500);
  }

  try {
    const rzpOrder = await razorpay().orders.create({
      amount: toPaise(totals.total),
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });
    await admin
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id);
    await admin.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      status: "created",
      amount: totals.total,
      source: "checkout",
    });
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    return Response.json({
      orderNumber: order.order_number,
      razorpayOrderId: rzpOrder.id,
      amount: toPaise(totals.total),
      currency: "INR",
      keyId: publicEnv().NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: profile?.full_name ?? address.full_name,
        email: user.email,
        contact: address.phone,
      },
    });
  } catch (err) {
    console.error("[checkout] Razorpay order failed", err);
    await admin
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        admin_note: "Razorpay order could not be created",
      })
      .eq("id", order.id);
    return fail(
      "Payments are unavailable right now. Please try again in a moment.",
      502,
    );
  }
}
