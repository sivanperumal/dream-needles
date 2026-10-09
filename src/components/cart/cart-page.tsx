"use client";

import { ArrowLeft, ArrowRight, Gift, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { PincodeCheck } from "@/components/catalog/pincode-check";
import { useShop } from "@/components/providers/shop-provider";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils";
import { CartLineItem, FreeShippingBar } from "./cart-parts";
import { useCartDetails } from "./use-cart-details";

const PAYMENT_BADGES = ["VISA", "Mastercard", "RuPay", "UPI", "GPay"];

/** Full cart page (Figma 76:3350). */
export function CartPageContent() {
  const { ready, cart } = useShop();
  const { lines, totals, settings, loading, hasProblems } =
    useCartDetails(true);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  if (!ready || (loading && !totals)) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-light text-brand">
          <ShoppingBag className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Your cart is empty
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Find something lovely, handmade just for you.
        </p>
        <ButtonLink href="/collections/whats-new" className="mt-6">
          Shop What&apos;s New
        </ButtonLink>
        <RecentlyViewed />
      </div>
    );
  }

  return (
    <>
      {totals && settings && (
        <div className="mx-auto mb-8 max-w-xl">
          <FreeShippingBar
            gap={totals.freeShippingGap}
            threshold={settings.free_shipping_threshold}
          />
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section
          aria-label="Cart items"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:p-6"
        >
          <div className="hidden grid-cols-[1fr_120px] border-b border-gray-100 pb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase md:grid">
            <span>Product</span>
            <span className="text-right">Total</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {lines.map((line) => (
              <li key={`${line.productId}:${line.variantId}`} className="py-5">
                <CartLineItem line={line} />
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-brand-light/60 p-4 text-sm text-brand">
            <span className="flex items-center gap-2">
              <Gift className="size-4" aria-hidden="true" /> Add a personalised
              gift note at checkout.
            </span>
          </p>
          <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
            <Link
              href="/collections/whats-new"
              className="flex items-center gap-1 hover:text-brand"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Continue
              Shopping
            </Link>
            <span>
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </span>
          </div>
        </section>

        <aside
          aria-label="Order summary"
          className="flex flex-col gap-4 lg:sticky lg:top-28"
        >
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-bold text-[#210023]">Order Summary</h2>
            {totals && (
              <dl className="mt-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-semibold text-gray-900">
                    {formatINR(totals.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between text-xs">
                  <dt className="text-gray-500">GST (included)</dt>
                  <dd className="text-gray-500">
                    {formatINR(totals.gstIncluded)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd
                    className={
                      totals.shipping
                        ? "text-gray-900"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {totals.shipping ? formatINR(totals.shipping) : "FREE"}
                  </dd>
                </div>
                <div className="mt-2 flex items-end justify-between border-t border-gray-100 pt-4">
                  <dt>
                    <span className="block font-bold text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-xs text-gray-500">
                      Inclusive of all applicable taxes
                    </span>
                  </dt>
                  <dd className="text-2xl font-bold text-[#210023]">
                    {formatINR(totals.total)}
                  </dd>
                </div>
              </dl>
            )}
            <p className="mt-4 rounded-lg bg-brand-light/60 p-3 text-xs text-gray-700">
              Coupons and gift notes are added at checkout. By placing an order
              you agree to our{" "}
              <Link
                href="/terms"
                className="font-semibold text-brand underline"
              >
                Terms
              </Link>
              .
            </p>
            <ButtonLink
              href="/checkout"
              size="lg"
              fullWidth
              className={`mt-5 rounded-xl ${hasProblems ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={hasProblems}
            >
              Proceed to Checkout{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            {hasProblems && (
              <p className="mt-2 text-center text-xs text-rose-600">
                Remove unavailable items to check out.
              </p>
            )}
            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              <Lock className="size-3" aria-hidden="true" /> 100% secure
              checkout
            </p>
            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
              {PAYMENT_BADGES.map((b) => (
                <li
                  key={b}
                  className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <PincodeCheck />
        </aside>
      </div>
      <RecentlyViewed />
    </>
  );
}
