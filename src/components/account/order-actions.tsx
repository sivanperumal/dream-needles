"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { useUI } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";

/** Adds an order's items back to the cart. */
export function BuyAgainButton({
  items,
}: {
  items: {
    productId: string | null;
    variantId: string | null;
    quantity: number;
  }[];
}) {
  const { addToCart } = useShop();
  const { open } = useUI();
  const available = items.filter(
    (
      i,
    ): i is { productId: string; variantId: string | null; quantity: number } =>
      Boolean(i.productId),
  );
  if (!available.length) return null;
  return (
    <Button
      variant="secondary"
      className="rounded-full"
      onClick={() => {
        available.forEach((i) =>
          addToCart(
            {
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            },
            { silent: true },
          ),
        );
        open("cart");
      }}
    >
      <RotateCcw className="size-4" aria-hidden="true" /> Buy Again
    </Button>
  );
}

/** After payment the server clears the cart; refresh the client copy. */
export function RefreshCartOnMount() {
  const { reloadCart, ready } = useShop();
  useEffect(() => {
    if (ready) void reloadCart();
  }, [ready, reloadCart]);
  return null;
}
