import { describe, expect, it } from "vitest";
import { checkCoupon, type CouponRow, normalizeCode } from "@/lib/coupons";

const base: CouponRow = {
  id: "c1",
  code: "WELCOME10",
  discount_type: "percent",
  value: 10,
  min_subtotal: 500,
  max_discount: null,
  is_active: true,
  starts_at: null,
  ends_at: null,
  usage_limit: null,
  used_count: 0,
};
const now = new Date("2026-10-09T12:00:00Z");

describe("checkCoupon", () => {
  it("accepts a valid coupon", () => {
    expect(checkCoupon(base, 800, now).ok).toBe(true);
  });

  it.each([
    [null, 800, "not_found"],
    [{ ...base, is_active: false }, 800, "inactive"],
    [{ ...base, starts_at: "2026-11-01T00:00:00Z" }, 800, "not_started"],
    [{ ...base, ends_at: "2026-10-01T00:00:00Z" }, 800, "expired"],
    [{ ...base, usage_limit: 5, used_count: 5 }, 800, "used_up"],
    [base, 400, "min_subtotal"],
  ] as const)("rejects %#", (coupon, subtotal, reason) => {
    const result = checkCoupon(coupon, subtotal, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });

  it("tells the customer how much more to add", () => {
    const result = checkCoupon(base, 420, now);
    expect(!result.ok && result.message).toBe("Add ₹80 more to use this code.");
  });
});

describe("normalizeCode", () => {
  it("trims and upper-cases", () => {
    expect(normalizeCode("  welcome10 ")).toBe("WELCOME10");
  });
});
