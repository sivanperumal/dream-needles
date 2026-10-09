"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { ProductDetail } from "@/lib/queries/catalog";
import { cn, formatINR } from "@/lib/utils";

type Variant = ProductDetail["variants"][number];

/** Effective price and stock for the current selection. */
export function selectionInfo(
  product: Pick<ProductDetail, "price" | "stock" | "variants">,
  variant: Variant | null,
) {
  return {
    price: variant?.price_override ?? product.price,
    stock: variant
      ? variant.stock
      : product.variants.length
        ? 0
        : product.stock,
  };
}

/**
 * Colour swatches, quantity, Add to cart and (optionally) Buy Now.
 * Shared by the product page and the quick-view popup.
 */
export function PurchaseControls({
  product,
  variant,
  onVariantChange,
  showBuyNow,
  onAdded,
}: {
  product: Pick<ProductDetail, "id" | "name" | "price" | "stock" | "variants">;
  variant: Variant | null;
  onVariantChange: (variant: Variant) => void;
  showBuyNow?: boolean;
  onAdded?: () => void;
}) {
  const { addToCart } = useShop();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const { price, stock } = selectionInfo(product, variant);
  const needsVariant = product.variants.length > 0 && !variant;
  const soldOut = !needsVariant && stock <= 0;
  const maxQty = Math.max(1, Math.min(99, stock));
  const optionName = product.variants[0]?.option_name ?? "Colour";

  const add = () => {
    addToCart({
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity,
    });
    onAdded?.();
  };
  const buyNow = () => {
    const params = new URLSearchParams({
      buy: product.id,
      qty: String(quantity),
    });
    if (variant) params.set("variant", variant.id);
    router.push(`/checkout?${params}`);
  };

  return (
    <div className="flex flex-col gap-5">
      {product.variants.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 flex w-full items-center justify-between text-xs tracking-wide text-gray-500 uppercase">
            <span>
              {optionName}:{" "}
              <span className="font-semibold text-gray-900">
                {variant?.value ?? "Choose one"}
              </span>
            </span>
            <span className="text-[11px] normal-case">
              {product.variants.length} options
            </span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => {
              const selected = v.id === variant?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onVariantChange(v)}
                  aria-pressed={selected}
                  title={`${v.value}${v.stock <= 0 ? " (sold out)" : ""}`}
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition",
                    v.swatch_hex
                      ? "size-8"
                      : "h-9 rounded-lg border border-gray-200 px-3 text-sm",
                    selected &&
                      (v.swatch_hex
                        ? "ring-2 ring-brand ring-offset-2"
                        : "border-brand bg-brand-tint text-brand"),
                    v.stock <= 0 && "opacity-40",
                  )}
                  style={
                    v.swatch_hex ? { backgroundColor: v.swatch_hex } : undefined
                  }
                >
                  {v.swatch_hex ? (
                    <span className="sr-only">{v.value}</span>
                  ) : (
                    v.value
                  )}
                  {selected && v.swatch_hex && (
                    <Check
                      className="size-4 text-white drop-shadow"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={Math.min(quantity, maxQty)}
          onChange={setQuantity}
          max={maxQty}
        />
        <Button
          size="lg"
          className="flex-1 rounded-full"
          onClick={add}
          disabled={needsVariant || soldOut}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          {soldOut
            ? "Sold out"
            : needsVariant
              ? `Choose a ${optionName.toLowerCase()}`
              : `Add to Cart · ${formatINR(price * quantity)}`}
        </Button>
        {showBuyNow && (
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full"
            onClick={buyNow}
            disabled={needsVariant || soldOut}
          >
            Buy Now
          </Button>
        )}
      </div>
      {!soldOut && !needsVariant && stock <= 5 && (
        <p className="text-xs font-medium text-amber-700">
          Only {stock} left in stock
        </p>
      )}
    </div>
  );
}
