"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { loadCartDetails } from "@/lib/actions/catalog";
import { computeTotals, type PricingSettings } from "@/lib/pricing";
import type { CartProduct } from "@/lib/queries/cart";

export type DetailedLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  product: CartProduct | null;
  name: string;
  slug: string | null;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  compareAt: number | null;
  stock: number;
  /** Why the line can't be bought as-is, if anything. */
  problem:
    "unavailable" | "choose_variant" | "out_of_stock" | "low_stock" | null;
};

/** Cart lines joined with live product data, plus display totals. */
export function useCartDetails(enabled: boolean) {
  const { cart, ready } = useShop();
  const [data, setData] = useState<{
    products: CartProduct[];
    settings: PricingSettings;
  } | null>(null);
  const ids = [...new Set(cart.map((l) => l.productId))].sort().join(",");
  const [loadedIds, setLoadedIds] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !ready) return;
    let cancelled = false;
    loadCartDetails(ids ? ids.split(",") : []).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoadedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [ids, enabled, ready]);

  const lines = useMemo<DetailedLine[]>(
    () =>
      cart.map((line) => {
        const product =
          data?.products.find((p) => p.id === line.productId) ?? null;
        const variant =
          product?.variants.find((v) => v.id === line.variantId) ?? null;
        const stock = variant ? variant.stock : (product?.stock ?? 0);
        const problem = !product
          ? "unavailable"
          : product.hasVariants && !variant
            ? "choose_variant"
            : stock <= 0
              ? "out_of_stock"
              : line.quantity > stock
                ? "low_stock"
                : null;
        return {
          ...line,
          product,
          name: product?.name ?? "Unavailable product",
          slug: product?.slug ?? null,
          image: variant?.image ?? product?.image ?? null,
          variantLabel: variant?.label ?? null,
          unitPrice: variant?.price ?? product?.price ?? 0,
          compareAt: product?.compare_at_price ?? null,
          stock,
          problem,
        };
      }),
    [cart, data],
  );

  // Lines that can't be bought are excluded; over-stock lines count up to stock.
  const totals = data
    ? computeTotals(
        lines
          .filter((l) => l.problem === null || l.problem === "low_stock")
          .map((l) => ({
            unitPrice: l.unitPrice,
            quantity: Math.min(l.quantity, l.stock),
          })),
        data.settings,
      )
    : null;

  return {
    lines,
    totals,
    settings: data?.settings ?? null,
    loading: cart.length > 0 && loadedIds !== ids,
    hasProblems: lines.some((l) => l.problem && l.problem !== "low_stock"),
  };
}
