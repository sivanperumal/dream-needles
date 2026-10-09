"use client";

import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuickView } from "@/components/catalog/quick-view";
import { useShop } from "@/components/providers/shop-provider";
import { useUI } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { loadProductCards } from "@/lib/actions/catalog";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import type { ProductCard } from "@/lib/types";
import { discountPercent, formatINR } from "@/lib/utils";

/** Wishlist popup (Figma 74:2925). Guests: localStorage; signed in: database. */
export function WishlistModal() {
  const { panel, close, open } = useUI();
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const quickView = useQuickView();
  const isOpen = panel === "wishlist";
  const [cards, setCards] = useState<ProductCard[] | null>(null);
  const key = wishlist.join(",");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadProductCards(key ? key.split(",") : []).then(
      (data) => !cancelled && setCards(data),
    );
    return () => {
      cancelled = true;
    };
  }, [isOpen, key]);

  const shown = (cards ?? []).filter((c) => wishlist.includes(c.id));
  const addable = shown.filter((c) => c.in_stock && !c.has_variants);
  const add = (card: ProductCard) =>
    card.has_variants
      ? (close(), quickView.open(card.slug))
      : addToCart({ productId: card.id, variantId: null, quantity: 1 });

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      title={`My Wishlist${wishlist.length ? ` · ${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}` : ""}`}
      className="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-600 uppercase hover:text-brand"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Continue
            shopping
          </button>
          {shown.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!addable.length}
                onClick={() => {
                  addable.forEach((c) =>
                    addToCart(
                      { productId: c.id, variantId: null, quantity: 1 },
                      { silent: true },
                    ),
                  );
                  open("cart");
                }}
              >
                Move All to Cart
              </Button>
              <Button onClick={() => open("cart")}>View Full Cart</Button>
            </div>
          )}
        </div>
      }
    >
      {cards === null && wishlist.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 p-5 lg:grid-cols-4">
          {Array.from({ length: Math.min(4, wishlist.length) }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Tap the heart on any product to save it for later.
          </p>
          <Link
            href="/collections/whats-new"
            onClick={close}
            className="mt-6 font-semibold text-brand hover:underline"
          >
            Browse What&apos;s New →
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 p-5 lg:grid-cols-4">
          {shown.map((card) => {
            const saving = discountPercent(card.price, card.compare_at_price);
            return (
              <li
                key={card.id}
                className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-100"
              >
                <Link
                  href={`/products/${card.slug}`}
                  onClick={close}
                  className="relative aspect-square bg-gray-50"
                >
                  <Image
                    src={imageUrl(card.images[0]) ?? PLACEHOLDER_IMAGE}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 240px, 45vw"
                    className="object-cover"
                  />
                  {saving ? (
                    <span className="absolute top-3 left-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {saving}% OFF
                    </span>
                  ) : card.badges[0] ? (
                    <span className="absolute top-3 left-3 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white uppercase">
                      {card.badges[0]}
                    </span>
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col p-3 md:p-4">
                  <Link
                    href={`/products/${card.slug}`}
                    onClick={close}
                    className="line-clamp-2 text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {card.name}
                  </Link>
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-2 border-t border-gray-100 pt-2">
                    <span className="font-bold text-gray-900">
                      {formatINR(card.price)}
                    </span>
                    {saving && card.compare_at_price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatINR(card.compare_at_price)}
                      </span>
                    )}
                  </p>
                  <p
                    className={`mt-1 text-xs ${card.in_stock ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    ● {card.in_stock ? "In Stock" : "Sold out"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!card.in_stock}
                      onClick={() => add(card)}
                    >
                      <ShoppingBag className="size-3.5" aria-hidden="true" />{" "}
                      {card.has_variants ? "Choose" : "Add to Cart"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(card.id, card.name)}
                      aria-label={`Remove ${card.name} from wishlist`}
                      className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
