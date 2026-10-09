/**
 * Order totals: the single source of truth used by the cart (display) and
 * by the server when creating the Razorpay order (authoritative).
 * All prices are GST-inclusive; GST is reported as the included share.
 * Amounts are rounded to paise to avoid floating-point drift.
 */

export type PricingSettings = {
  free_shipping_threshold: number;
  shipping_fee: number;
  gst_rate: number;
};

export type PricingLine = { unitPrice: number; quantity: number };

export type CouponRule = {
  discount_type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  max_discount: number | null;
};

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  gstIncluded: number;
  total: number;
  /** Amount still needed for free shipping (0 when already free). */
  freeShippingGap: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function couponDiscount(
  coupon: CouponRule | null,
  subtotal: number,
): number {
  if (!coupon || subtotal < coupon.min_subtotal) return 0;
  let discount =
    coupon.discount_type === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.max_discount !== null)
    discount = Math.min(discount, coupon.max_discount);
  return round(Math.min(discount, subtotal));
}

export function computeTotals(
  lines: PricingLine[],
  settings: PricingSettings,
  coupon: CouponRule | null = null,
): Totals {
  const subtotal = round(
    lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
  const discount = couponDiscount(coupon, subtotal);
  const afterDiscount = round(subtotal - discount);
  // Free shipping is judged on the discounted amount, so coupons can't game it.
  const freeShipping = afterDiscount >= settings.free_shipping_threshold;
  const shipping =
    subtotal === 0 || freeShipping ? 0 : round(settings.shipping_fee);
  const total = round(afterDiscount + shipping);
  const gstIncluded = round(total - total / (1 + settings.gst_rate / 100));
  return {
    subtotal,
    discount,
    shipping,
    gstIncluded,
    total,
    freeShippingGap:
      freeShipping || subtotal === 0
        ? 0
        : round(settings.free_shipping_threshold - afterDiscount),
  };
}
