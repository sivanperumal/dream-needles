"use client";

import { AlertCircle, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/components/providers/shop-provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import { formatINR } from "@/lib/utils";
import type { DetailedLine } from "./use-cart-details";

/** "Spend ₹262 more to enjoy FREE Shipping" progress bar (Figma cart page). */
export function FreeShippingBar({
  gap,
  threshold,
}: {
  gap: number;
  threshold: number;
}) {
  const progress =
    threshold > 0 ? Math.min(100, ((threshold - gap) / threshold) * 100) : 100;
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="flex items-center justify-center gap-2 text-center text-sm text-gray-700">
        <Truck className="size-4 text-brand" aria-hidden="true" />
        {gap > 0 ? (
          <span>
            Spend <strong className="text-gray-900">{formatINR(gap)}</strong>{" "}
            more to enjoy{" "}
            <strong className="text-gray-900">FREE Shipping</strong> in India!
          </span>
        ) : (
          <span className="font-semibold text-emerald-700">
            You&apos;ve unlocked FREE shipping!
          </span>
        )}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-brand-light"
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function LineProblem({ line }: { line: DetailedLine }) {
  if (!line.problem) return null;
  const text = {
    unavailable: "This product is no longer available. Please remove it.",
    choose_variant: "Please choose an option for this product again.",
    out_of_stock: "Sold out. Please remove it to continue.",
    low_stock: `Only ${line.stock} left. Quantity will be reduced at checkout.`,
  }[line.problem];
  return (
    <p className="mt-1 flex items-start gap-1 text-xs text-rose-600">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />{" "}
      {text}
    </p>
  );
}

/** One cart line: image, name, variant, price, quantity, remove. */
export function CartLineItem({
  line,
  compact,
  onNavigate,
}: {
  line: DetailedLine;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { setQuantity, removeFromCart } = useShop();
  const href = line.slug ? `/products/${line.slug}` : null;
  const name = href ? (
    <Link
      href={href}
      onClick={onNavigate}
      className="font-semibold text-gray-900 hover:underline"
    >
      {line.name}
    </Link>
  ) : (
    <span className="font-semibold text-gray-500">{line.name}</span>
  );

  return (
    <div className="flex gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imageUrl(line.image) ?? PLACEHOLDER_IMAGE}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-sm">
            {name}
            {line.variantLabel && (
              <p className="text-xs text-gray-500">{line.variantLabel}</p>
            )}
            {!compact && (
              <p className="mt-0.5 text-xs text-gray-500">
                {formatINR(line.unitPrice)} each
              </p>
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold text-gray-900">
            {formatINR(line.unitPrice * line.quantity)}
          </p>
        </div>
        <LineProblem line={line} />
        <div className="mt-2 flex items-center justify-between">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={Math.max(1, Math.min(99, line.stock || line.quantity))}
            onChange={(q) => setQuantity(line.productId, line.variantId, q)}
            label={`Quantity of ${line.name}`}
          />
          <button
            type="button"
            onClick={() => removeFromCart(line.productId, line.variantId)}
            className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
          >
            <Trash2 className="size-3.5" aria-hidden="true" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}
