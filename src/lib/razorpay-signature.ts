import { createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time HMAC-SHA256 hex comparison. */
function hmacMatches(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout handler signature: HMAC(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(
  {
    orderId,
    paymentId,
    signature,
  }: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
): boolean {
  return hmacMatches(`${orderId}|${paymentId}`, signature, keySecret);
}

/** Webhook signature: HMAC(raw request body, webhook secret). */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  return hmacMatches(rawBody, signature, webhookSecret);
}

/** Rupees → paise for Razorpay (integer). */
export const toPaise = (rupees: number) => Math.round(rupees * 100);
