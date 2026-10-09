import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/lib/razorpay-signature";

const secret = "test_secret_123";
const sign = (payload: string, key = secret) =>
  createHmac("sha256", key).update(payload).digest("hex");

describe("verifyPaymentSignature", () => {
  const ids = { orderId: "order_ABC", paymentId: "pay_XYZ" };

  it("accepts Razorpay's signature", () => {
    expect(
      verifyPaymentSignature(
        { ...ids, signature: sign("order_ABC|pay_XYZ") },
        secret,
      ),
    ).toBe(true);
  });

  it("rejects tampered ids, wrong secrets and junk", () => {
    expect(
      verifyPaymentSignature(
        {
          ...ids,
          paymentId: "pay_OTHER",
          signature: sign("order_ABC|pay_XYZ"),
        },
        secret,
      ),
    ).toBe(false);
    expect(
      verifyPaymentSignature(
        { ...ids, signature: sign("order_ABC|pay_XYZ", "other") },
        secret,
      ),
    ).toBe(false);
    expect(verifyPaymentSignature({ ...ids, signature: "abc" }, secret)).toBe(
      false,
    );
    expect(
      verifyPaymentSignature(
        { ...ids, signature: sign("order_ABC|pay_XYZ") },
        "",
      ),
    ).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured" });

  it("checks the exact raw body", () => {
    expect(verifyWebhookSignature(body, sign(body), secret)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, sign(body), secret)).toBe(false);
  });
});

describe("toPaise", () => {
  it("converts rupees to whole paise", () => {
    expect(toPaise(1199)).toBe(119900);
    expect(toPaise(229.1)).toBe(22910);
    expect(toPaise(0.29)).toBe(29);
  });
});
