"use client";

import { ShoppingBag } from "lucide-react";
import { useUI } from "@/components/providers/ui-provider";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils";
import { CartLineItem, FreeShippingBar } from "./cart-parts";
import { useCartDetails } from "./use-cart-details";

/** Slide-out cart from the right (no Figma frame; styled to match the cart page). */
export function CartDrawer() {
  const { panel, close, cartCount } = useUI();
  const isOpen = panel === "cart";
  const { lines, totals, settings, loading, hasProblems } =
    useCartDetails(isOpen);

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      title={`Your Cart${cartCount ? ` (${cartCount})` : ""}`}
      placement="right"
      footer={
        lines.length > 0 && totals ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold text-gray-900">
                {formatINR(totals.subtotal)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Prices include GST. Shipping and coupons are applied at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="outline" onClick={close}>
                View Cart
              </ButtonLink>
              <ButtonLink
                href="/checkout"
                onClick={close}
                aria-disabled={hasProblems}
                className={
                  hasProblems ? "pointer-events-none opacity-50" : undefined
                }
              >
                Checkout
              </ButtonLink>
            </div>
            {hasProblems && (
              <p className="text-center text-xs text-rose-600">
                Remove unavailable items to check out.
              </p>
            )}
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-light text-brand">
            <ShoppingBag className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            Your cart is empty
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Discover handmade pieces and tools you&apos;ll love.
          </p>
          <ButtonLink
            href="/collections/whats-new"
            onClick={close}
            className="mt-6"
          >
            Shop What&apos;s New
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          {totals && settings && (
            <FreeShippingBar
              gap={totals.freeShippingGap}
              threshold={settings.free_shipping_threshold}
            />
          )}
          {loading && !totals ? (
            Array.from({ length: Math.min(3, lines.length) }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {lines.map((line) => (
                <li
                  key={`${line.productId}:${line.variantId}`}
                  className="py-4 first:pt-0"
                >
                  <CartLineItem line={line} compact onNavigate={close} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}
