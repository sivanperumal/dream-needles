import type { CouponRule } from "@/lib/pricing";

export type CouponRow = CouponRule & {
  id: string;
  code: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
};

export type CouponCheck =
  | { ok: true; coupon: CouponRow }
  | {
      ok: false;
      reason:
        | "not_found"
        | "inactive"
        | "not_started"
        | "expired"
        | "used_up"
        | "min_subtotal";
      message: string;
    };

export const normalizeCode = (code: string) =>
  code.trim().toUpperCase().slice(0, 30);

/** Can this coupon be used on this subtotal right now? */
export function checkCoupon(
  coupon: CouponRow | null,
  subtotal: number,
  now = new Date(),
): CouponCheck {
  if (!coupon)
    return {
      ok: false,
      reason: "not_found",
      message: "That code isn't valid.",
    };
  if (!coupon.is_active)
    return {
      ok: false,
      reason: "inactive",
      message: "That code is no longer active.",
    };
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return {
      ok: false,
      reason: "not_started",
      message: "That code isn't active yet.",
    };
  if (coupon.ends_at && new Date(coupon.ends_at) <= now)
    return { ok: false, reason: "expired", message: "That code has expired." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)
    return {
      ok: false,
      reason: "used_up",
      message: "That code has reached its usage limit.",
    };
  if (subtotal < coupon.min_subtotal)
    return {
      ok: false,
      reason: "min_subtotal",
      message: `Add ₹${Math.ceil(coupon.min_subtotal - subtotal).toLocaleString("en-IN")} more to use this code.`,
    };
  return { ok: true, coupon };
}
