"use client";

import {
  BadgeCheck,
  HandHeart,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PincodeCheck } from "@/components/catalog/pincode-check";
import { ProductGallery } from "@/components/catalog/product-gallery";
import {
  PurchaseControls,
  selectionInfo,
} from "@/components/catalog/purchase-controls";
import { useShop } from "@/components/providers/shop-provider";
import { RatingStars } from "@/components/ui/rating";
import type { ProductDetail } from "@/lib/queries/catalog";
import { discountPercent, formatINR } from "@/lib/utils";

const FEATURES = [
  {
    Icon: HandHeart,
    title: "Handcrafted in India",
    text: "Made by our makers",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Payments",
    text: "UPI, cards & netbanking",
  },
  {
    Icon: RotateCcw,
    title: "7-Day Easy Returns",
    text: "On finished handmade pieces",
  },
];

/** Product page top section (Figma 71:1950): gallery + purchase column. */
export function ProductMain({
  product,
  freeShippingThreshold,
}: {
  product: ProductDetail;
  freeShippingThreshold: number;
}) {
  const { markViewed } = useShop();
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].id : null,
  );
  const [imageId, setImageId] = useState<string | null>(
    product.images[0]?.id ?? null,
  );
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const { price, stock } = selectionInfo(product, variant);
  const saving = discountPercent(price, product.compare_at_price);
  const available =
    product.variants.length > 0 && !variant ? product.inStock : stock > 0;

  useEffect(() => markViewed(product.id), [product.id, markViewed]);

  const badges = [
    ...(product.badges.length ? product.badges : []),
    ...(product.isNew ? ["New arrival"] : []),
    "Small Batch Craft",
  ].slice(0, 2);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-8">
      <div className="flex flex-col gap-6">
        <ProductGallery
          images={product.images}
          activeId={imageId}
          onSelect={setImageId}
          productId={product.id}
          productName={product.name}
          badges={badges}
        />
        <ArtisanNote className="hidden lg:flex" />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-[1px] text-gray-500 uppercase">
            Dream Needles{product.sku ? ` • SKU: ${product.sku}` : ""}
          </p>
          <span
            className={
              available
                ? "text-xs font-semibold text-emerald-600"
                : "text-xs font-semibold text-rose-600"
            }
          >
            ● {available ? "Ready to Ship" : "Sold out"}
          </span>
        </div>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-[#210023] md:text-[40px] md:leading-[48px]">
          {product.name}
        </h1>
        {product.rating_count > 0 && (
          <a
            href="#reviews"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand"
          >
            <RatingStars value={product.rating_avg} size={14} />
            <span className="font-semibold text-gray-900">
              {product.rating_avg.toFixed(1)}
            </span>
            {product.rating_count} verified{" "}
            {product.rating_count === 1 ? "review" : "reviews"}
          </a>
        )}

        <div className="rounded-xl bg-[#f0f3ff] p-4">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-bold text-[#210023]">
              {formatINR(price)}
            </span>
            {saving && product.compare_at_price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  MRP {formatINR(product.compare_at_price)}
                </span>
                <span className="rounded-full bg-[#210023] px-2.5 py-0.5 text-xs font-semibold text-white">
                  Save {saving}%
                </span>
              </>
            )}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Inclusive of all taxes. Free tracked shipping on orders above{" "}
            {formatINR(freeShippingThreshold)} across India.
          </p>
        </div>

        <PurchaseControls
          product={product}
          variant={variant}
          showBuyNow
          onVariantChange={(v) => {
            setVariantId(v.id);
            if (v.image_id) setImageId(v.image_id);
          }}
        />

        <PincodeCheck />

        <ul className="grid grid-cols-3 gap-2 rounded-xl bg-[#e8dcea]/50 p-3 text-center">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center gap-1">
              <Icon className="size-4 text-[#210023]" aria-hidden="true" />
              <span className="text-xs font-semibold text-gray-900">
                {title}
              </span>
              <span className="text-[11px] text-gray-500">{text}</span>
            </li>
          ))}
        </ul>
        <ArtisanNote className="lg:hidden" />
      </div>
    </div>
  );
}

function ArtisanNote({ className }: { className?: string }) {
  return (
    <div
      className={`items-start gap-3 rounded-xl bg-[#f0f3ff] p-4 ${className ?? ""}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <div className="text-sm">
        <p className="text-gray-900">Made With Heart by Master Makers</p>
        <p className="mt-0.5 text-gray-600">
          Every piece is finished by hand, so tiny variations make yours one of
          a kind.
        </p>
      </div>
    </div>
  );
}
