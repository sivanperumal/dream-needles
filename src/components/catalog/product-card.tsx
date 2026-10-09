"use client";

import { Eye, Heart, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/components/providers/shop-provider";
import { useQuickView } from "@/components/catalog/quick-view";
import { RatingStars } from "@/components/ui/rating";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import type { ProductCard as Card } from "@/lib/types";
import { cn, discountPercent, formatINR } from "@/lib/utils";

/**
 * Product card (Figma 70:374): image with hover actions (wishlist, quick view,
 * add to bag), badges, name, rating and price.
 */
export function ProductCard({
  product,
  eyebrow,
  priority,
}: {
  product: Card;
  eyebrow?: string;
  priority?: boolean;
}) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const quickView = useQuickView();
  const href = `/products/${product.slug}`;
  const [primary, hover] = product.images;
  const saving = discountPercent(product.price, product.compare_at_price);
  const wished = isWishlisted(product.id);

  // Products with colour options need a choice first, so send them to quick view.
  const add = () =>
    product.has_variants
      ? quickView.open(product.slug)
      : addToCart({ productId: product.id, variantId: null, quantity: 1 });

  const badge = !product.in_stock
    ? { label: "Sold out", className: "bg-gray-100 text-gray-600" }
    : saving
      ? { label: `Sale -${saving}%`, className: "bg-rose-50 text-rose-700" }
      : product.is_new
        ? { label: "New", className: "bg-brand-tint text-brand" }
        : product.badges[0]
          ? {
              label: product.badges[0],
              className: "bg-amber-50 text-amber-700",
            }
          : null;

  return (
    <article className="group flex flex-col rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f0f3ff]">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={imageUrl(primary) ?? PLACEHOLDER_IMAGE}
            alt=""
            fill
            sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 50vw"
            priority={priority}
            className={cn(
              "object-cover transition duration-500 group-hover:scale-105",
              hover && "group-hover:opacity-0",
            )}
          />
          {hover && (
            <Image
              src={imageUrl(hover)!}
              alt=""
              fill
              sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 50vw"
              className="object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] leading-[14px] font-bold tracking-[0.55px] uppercase",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )}
        {product.is_new && badge?.label !== "New" && (
          <span className="absolute bottom-2 left-2 rounded-full bg-brand px-2 py-0.5 text-[10px] leading-[14px] font-bold tracking-wide text-white uppercase">
            New
          </span>
        )}

        {/* Always-visible wishlist shortcut (hidden while hover actions show) */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wished}
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-opacity md:group-hover:opacity-0"
        >
          <Heart
            className={cn(
              "size-4",
              wished ? "fill-rose-500 text-rose-500" : "text-[#210023]",
            )}
          />
        </button>

        {/* Hover actions (desktop) */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-1 bg-[#210023]/20 opacity-0 backdrop-blur-[1px] transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 md:flex">
          <HoverButton
            label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggleWishlist(product.id, product.name)}
          >
            <Heart
              className={cn(
                "size-[17px]",
                wished ? "fill-rose-500 text-rose-500" : "text-[#210023]",
              )}
            />
          </HoverButton>
          <HoverButton
            label="Quick view"
            onClick={() => quickView.open(product.slug)}
          >
            <Eye className="size-[18px] text-[#210023]" />
          </HoverButton>
          <HoverButton
            label={product.in_stock ? "Add to cart" : "Sold out"}
            onClick={add}
            disabled={!product.in_stock}
            dark
          >
            <ShoppingBag className="size-4 text-white" />
          </HoverButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pt-[13px]">
        {eyebrow && (
          <p className="text-[11px] leading-[16.5px] tracking-[0.28px] text-[#864784] uppercase">
            {eyebrow}
          </p>
        )}
        <h3 className="line-clamp-2 text-base leading-[22px] font-semibold text-[#210023]">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.rating_count > 0 && (
          <p className="flex items-center gap-1 text-[11px] leading-[16.5px] text-gray-600">
            <RatingStars value={product.rating_avg} />
            {product.rating_avg.toFixed(1)} ({product.rating_count})
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-1 pt-2">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-lg leading-[26px] font-bold tracking-[0.18px] text-[#210023]">
            {formatINR(product.price)}
          </span>
          {saving && product.compare_at_price && (
            <span className="text-xs text-gray-400 line-through">
              <span className="sr-only">was </span>
              {formatINR(product.compare_at_price)}
            </span>
          )}
        </p>
        {product.in_stock ? (
          <button
            type="button"
            onClick={add}
            aria-label={`Add ${product.name} to cart`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8dcea] text-[#210023] transition-colors hover:bg-brand hover:text-white"
          >
            <Plus className="size-4" />
          </button>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
            Sold out
          </span>
        )}
      </div>
    </article>
  );
}

function HoverButton({
  label,
  onClick,
  children,
  dark,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  dark?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 disabled:opacity-50",
        dark ? "bg-[#420745]" : "bg-white",
      )}
    >
      {children}
    </button>
  );
}
