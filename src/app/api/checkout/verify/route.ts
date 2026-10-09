import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { markOrderPaid } from "@/lib/orders";
import { razorpay } from "@/lib/razorpay";
import { verifyPaymentSignature } from "@/lib/razorpay-signature";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(5).max(64),
  razorpay_payment_id: z.string().min(5).max(64),
  razorpay_signature: z.string().min(10).max(256),
});

/**
 * POST /api/checkout/verify — called by Razorpay Checkout's success handler.
 * Verifies the signature on the server before marking the order paid.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid payment response." },
      { status: 400 },
    );
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = parsed.data;

  const keySecret = serverEnv().RAZORPAY_KEY_SECRET ?? "";
  if (!verifyPaymentSignature({ orderId, paymentId, signature }, keySecret)) {
    return Response.json(
      {
        error:
          "Payment verification failed. If money was deducted, it will be refunded automatically.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, order_number")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (!order || (user && order.user_id !== user.id)) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  // Payment details (method, amount) straight from Razorpay, not the browser.
  let method: string | null = null;
  let amount: number | null = null;
  let raw: unknown = null;
  try {
    const payment = await razorpay().payments.fetch(paymentId);
    method = payment.method ?? null;
    amount =
      typeof payment.amount === "number"
        ? payment.amount / 100
        : Number(payment.amount) / 100;
    raw = payment;
  } catch (error) {
    console.error("[checkout] Could not fetch payment from Razorpay", error);
  }

  try {
    const result = await markOrderPaid({
      orderId: order.id,
      paymentId,
      method,
      amountRupees: amount,
      source: "checkout",
      raw,
    });
    return Response.json({ orderNumber: result.order_number });
  } catch (error) {
    console.error("[checkout] markOrderPaid failed", error);
    return Response.json(
      {
        error:
          "We received your payment but couldn't confirm the order. Our team will contact you.",
      },
      { status: 500 },
    );
  }
}
