import { describe, expect, it } from "vitest";
import { computeTotals, couponDiscount } from "@/lib/pricing";

const settings = {
  free_shipping_threshold: 999,
  shipping_fee: 79,
  gst_rate: 12,
};

describe("computeTotals", () => {
  it("adds the flat shipping fee below the free-shipping threshold", () => {
    const t = computeTotals([{ unitPrice: 229, quantity: 2 }], settings);
    expect(t).toMatchObject({
      subtotal: 458,
      discount: 0,
      shipping: 79,
      total: 537,
      freeShippingGap: 541,
    });
  });

  it("ships free at or above the threshold", () => {
    const t = computeTotals([{ unitPrice: 999, quantity: 1 }], settings);
    expect(t).toMatchObject({ shipping: 0, total: 999, freeShippingGap: 0 });
  });

  it("reports the GST included in the total", () => {
    const t = computeTotals([{ unitPrice: 1120, quantity: 1 }], settings);
    expect(t.gstIncluded).toBe(120);
  });

  it("is zero for an empty cart", () => {
    expect(computeTotals([], settings)).toMatchObject({
      subtotal: 0,
      shipping: 0,
      total: 0,
      freeShippingGap: 0,
    });
  });

  it("judges free shipping after the coupon discount", () => {
    const coupon = {
      discount_type: "fixed" as const,
      value: 100,
      min_subtotal: 0,
      max_discount: null,
    };
    const t = computeTotals(
      [{ unitPrice: 1050, quantity: 1 }],
      settings,
      coupon,
    );
    expect(t).toMatchObject({ discount: 100, shipping: 79, total: 1029 });
  });

  it("rounds to paise", () => {
    const t = computeTotals([{ unitPrice: 0.1, quantity: 3 }], {
      ...settings,
      shipping_fee: 0,
    });
    expect(t.subtotal).toBe(0.3);
  });
});

describe("couponDiscount", () => {
  const percent = {
    discount_type: "percent" as const,
    value: 10,
    min_subtotal: 500,
    max_discount: 150,
  };

  it("applies a percentage with a cap", () => {
    expect(couponDiscount(percent, 1000)).toBe(100);
    expect(couponDiscount(percent, 5000)).toBe(150);
  });

  it("needs the minimum subtotal", () => {
    expect(couponDiscount(percent, 499)).toBe(0);
  });

  it("never exceeds the subtotal", () => {
    expect(
      couponDiscount(
        {
          discount_type: "fixed",
          value: 500,
          min_subtotal: 0,
          max_discount: null,
        },
        300,
      ),
    ).toBe(300);
  });
});

describe("order status transitions", async () => {
  const { canTransition } = await import("@/lib/order-status");
  it("follows pending → paid → shipped → delivered", () => {
    expect(canTransition("pending", "paid")).toBe(true);
    expect(canTransition("paid", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
  });
  it("blocks skipping back or changing finished orders", () => {
    expect(canTransition("delivered", "shipped")).toBe(false);
    expect(canTransition("shipped", "paid")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });
});
