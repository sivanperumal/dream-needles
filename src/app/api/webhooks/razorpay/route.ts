import { serverEnv } from "@/lib/env";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay-signature";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  method?: string;
  error_description?: string | null;
};

/**
 * POST /api/webhooks/razorpay — backup confirmation from Razorpay
 * (payment.captured / payment.failed). Safe to receive more than once.
 */
export async function POST(request: Request) {
  const secret = serverEnv().RAZORPAY_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: { payment?: { entity?: PaymentEntity } };
  };
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return Response.json({ ok: true, ignored: true });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return Response.json({ ok: true, ignored: "unknown order" });

  if (event.event === "payment.captured") {
    try {
      await markOrderPaid({
        orderId: order.id,
        paymentId: payment.id,
        method: payment.method ?? null,
        amountRupees: payment.amount / 100,
        source: "webhook",
        raw: event,
      });
    } catch (error) {
      console.error("[webhook] markOrderPaid failed", error);
      // 500 makes Razorpay retry later.
      return Response.json(
        { error: "Could not record payment" },
        { status: 500 },
      );
    }
  } else if (event.event === "payment.failed") {
    await admin.from("payments").upsert(
      {
        order_id: order.id,
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        status: "failed",
        amount: payment.amount / 100,
        method: payment.method ?? null,
        error_description: payment.error_description ?? null,
        source: "webhook",
        raw: event as never,
      },
      { onConflict: "razorpay_payment_id" },
    );
  }
  return Response.json({ ok: true });
}
