import "server-only";
import { z } from "zod";
import { checkCoupon, type CouponRow, normalizeCode } from "@/lib/coupons";
import {
  computeTotals,
  type PricingSettings,
  type Totals,
} from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Builds the authoritative checkout: live prices and stock from the database,
 * coupon validation and totals. Used by the order summary (preview) and by
 * create-order, so what the customer sees is exactly what they're charged.
 */

export const lineSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable(),
  quantity: z.number().int().min(1).max(99),
});
export type LineInput = z.infer<typeof lineSchema>;

export type CheckoutLine = LineInput & {
  name: string;
  slug: string;
  variantLabel: string | null;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  stock: number;
  problem:
    "unavailable" | "choose_variant" | "out_of_stock" | "low_stock" | null;
};

export type CheckoutSummary = {
  lines: CheckoutLine[];
  totals: Totals;
  settings: PricingSettings & { delivery_eta_text: string };
  coupon: {
    code: string;
    applied: boolean;
    message: string | null;
    id: string | null;
  };
  canPay: boolean;
};

export async function buildCheckout(
  lines: LineInput[],
  couponCode?: string | null,
): Promise<CheckoutSummary> {
  const admin = createAdminClient();
  const ids = [...new Set(lines.map((l) => l.productId))];
  const [{ data: products, error }, { data: settings }] = await Promise.all([
    ids.length
      ? admin
          .from("products")
          .select(
            `id, slug, name, sku, price, stock, status, deleted_at,
             product_images (storage_path, sort_order),
             product_variants (id, option_name, value, sku, price_override, stock, is_active, image_id)`,
          )
          .in("id", ids)
      : Promise.resolve({ data: [], error: null }),
    admin
      .from("store_settings")
      .select(
        "free_shipping_threshold, shipping_fee, gst_rate, delivery_eta_text",
      )
      .eq("id", 1)
      .single(),
  ]);
  if (error) throw new Error(`Loading checkout products: ${error.message}`);
  if (!settings)
    throw new Error("Store settings are missing (run migration 0009).");

  const checkoutLines: CheckoutLine[] = lines.map((line) => {
    const product = products?.find(
      (p) => p.id === line.productId && p.status === "active" && !p.deleted_at,
    );
    const activeVariants =
      product?.product_variants.filter((v) => v.is_active) ?? [];
    const variant = activeVariants.find((v) => v.id === line.variantId) ?? null;
    const stock = variant ? variant.stock : (product?.stock ?? 0);
    const image =
      [...(product?.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      )[0]?.storage_path ?? null;
    const problem: CheckoutLine["problem"] = !product
      ? "unavailable"
      : activeVariants.length > 0 && !variant
        ? "choose_variant"
        : line.variantId && !variant
          ? "unavailable"
          : stock <= 0
            ? "out_of_stock"
            : line.quantity > stock
              ? "low_stock"
              : null;
    return {
      ...line,
      name: product?.name ?? "Unavailable product",
      slug: product?.slug ?? "",
      variantLabel: variant ? `${variant.option_name}: ${variant.value}` : null,
      sku: variant?.sku ?? product?.sku ?? null,
      image,
      unitPrice: variant?.price_override ?? product?.price ?? 0,
      stock,
      problem,
    };
  });

  const payable = checkoutLines.filter((l) => !l.problem);
  const pricing = payable.map((l) => ({
    unitPrice: l.unitPrice,
    quantity: l.quantity,
  }));
  const baseTotals = computeTotals(pricing, settings);

  let coupon: CheckoutSummary["coupon"] = {
    code: "",
    applied: false,
    message: null,
    id: null,
  };
  let totals = baseTotals;
  if (couponCode) {
    const code = normalizeCode(couponCode);
    const { data: row } = await admin
      .from("coupons")
      .select(
        "id, code, discount_type, value, min_subtotal, max_discount, usage_limit, used_count, starts_at, ends_at, is_active",
      )
      .eq("code", code)
      .maybeSingle();
    const check = checkCoupon(row as CouponRow | null, baseTotals.subtotal);
    if (check.ok) {
      totals = computeTotals(pricing, settings, check.coupon);
      coupon = {
        code,
        applied: true,
        message: `${code} applied: you save ₹${totals.discount.toLocaleString("en-IN")}`,
        id: check.coupon.id,
      };
    } else {
      coupon = { code, applied: false, message: check.message, id: null };
    }
  }

  return {
    lines: checkoutLines,
    totals,
    settings,
    coupon,
    canPay: payable.length > 0 && payable.length === checkoutLines.length,
  };
}
