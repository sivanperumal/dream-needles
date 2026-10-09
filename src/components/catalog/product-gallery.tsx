"use client";

import { Heart, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; storage_path: string; alt: string };

/** Main image with hover zoom + thumbnails (Figma 71:1950). */
export function ProductGallery({
  images,
  activeId,
  onSelect,
  productId,
  productName,
  badges,
}: {
  images: GalleryImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  productId: string;
  productName: string;
  badges: string[];
}) {
  const { isWishlisted, toggleWishlist } = useShop();
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const active = images.find((i) => i.id === activeId) ?? images[0];
  const wished = isWishlisted(productId);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-gray-50"
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - box.left) / box.width) * 100,
            y: ((e.clientY - box.top) / box.height) * 100,
          });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          src={imageUrl(active?.storage_path) ?? PLACEHOLDER_IMAGE}
          alt={active?.alt || productName}
          fill
          priority
          sizes="(min-width: 1280px) 568px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-200"
          style={
            zoom
              ? {
                  transform: "scale(2)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }
              : undefined
          }
        />
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span
              key={b}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                i === 0
                  ? "bg-white text-rose-600"
                  : "bg-brand-light text-brand",
              )}
            >
              {b}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(productId, productName)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Heart
            className={cn(
              "size-[18px]",
              wished ? "fill-rose-500 text-rose-500" : "text-gray-800",
            )}
          />
        </button>
        <span className="pointer-events-none absolute right-3 bottom-3 hidden items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] text-gray-700 md:flex">
          <ZoomIn className="size-3" aria-hidden="true" /> Hover to inspect
          stitch
        </span>
      </div>

      {images.length > 1 && (
        <ul
          className="grid grid-cols-4 gap-3 md:gap-4"
          aria-label="Product images"
        >
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => onSelect(image.id)}
                aria-label={`Show image ${i + 1}`}
                aria-current={image.id === active?.id}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded border-2 transition",
                  image.id === active?.id
                    ? "border-brand"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={imageUrl(image.storage_path)!}
                  alt=""
                  fill
                  sizes="124px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
