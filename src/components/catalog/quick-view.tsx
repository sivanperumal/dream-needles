"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  PurchaseControls,
  selectionInfo,
} from "@/components/catalog/purchase-controls";
import { Dialog } from "@/components/ui/dialog";
import { RatingStars } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { loadQuickView } from "@/lib/actions/catalog";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import type { ProductDetail } from "@/lib/queries/catalog";
import { discountPercent, formatINR } from "@/lib/utils";

type QuickViewState = { open: (slug: string) => void };
const QuickViewContext = createContext<QuickViewState | null>(null);

/** Quick-view popup (Figma 72:2754), opened from product cards' eye icon. */
export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(null);

  const open = useCallback((next: string) => {
    setSlug(next);
    setProduct(null);
    setFailed(false);
    setVariantId(null);
    startTransition(async () => {
      const data = await loadQuickView(next);
      if (data) setProduct(data);
      else setFailed(true);
    });
  }, []);
  const close = () => setSlug(null);
  const value = useMemo(() => ({ open }), [open]);

  const variant = product?.variants.find((v) => v.id === variantId) ?? null;

  return (
    <QuickViewContext value={value}>
      {children}
      <Dialog
        open={slug !== null}
        onClose={close}
        title={product?.name ?? "Quick view"}
        hideTitle
        className="max-w-[720px] overflow-hidden"
      >
        {pending || (!product && !failed) ? (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <Skeleton className="aspect-square" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : failed || !product ? (
          <p className="p-8 text-center text-sm text-gray-600">
            Sorry, this product isn&apos;t available right now.
          </p>
        ) : (
          <QuickViewBody
            product={product}
            variant={variant}
            onVariant={(v) => setVariantId(v.id)}
            onClose={close}
          />
        )}
      </Dialog>
    </QuickViewContext>
  );
}

function QuickViewBody({
  product,
  variant,
  onVariant,
  onClose,
}: {
  product: ProductDetail;
  variant: ProductDetail["variants"][number] | null;
  onVariant: (v: ProductDetail["variants"][number]) => void;
  onClose: () => void;
}) {
  const image =
    product.images.find((i) => i.id === variant?.image_id) ?? product.images[0];
  const { price, stock } = selectionInfo(product, variant);
  const saving = discountPercent(price, product.compare_at_price);
  const collection = product.breadcrumbs.at(-1)?.name;

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative aspect-square bg-gray-50 md:aspect-auto md:min-h-[520px]">
        <Image
          src={imageUrl(image?.storage_path) ?? PLACEHOLDER_IMAGE}
          alt={image?.alt || product.name}
          fill
          sizes="360px"
          className="object-cover"
        />
        <span className="absolute top-4 left-4 rounded border border-gray-100 bg-white px-2.5 py-1 text-xs font-medium tracking-wide text-brand uppercase">
          Handcrafted
        </span>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-7">
        <p className="text-xs tracking-wide text-gray-500 uppercase">
          Dream Needles{collection ? ` • ${collection}` : ""}
        </p>
        <h2 className="text-2xl leading-8 font-bold text-gray-900">
          {product.name}
        </h2>
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatINR(price)}
          </span>
          {saving && product.compare_at_price && (
            <>
              <span className="text-sm text-gray-400 line-through">
                MRP {formatINR(product.compare_at_price)}
              </span>
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                SALE
              </span>
            </>
          )}
        </p>
        <p className="flex items-center gap-3 text-sm text-gray-600">
          {product.rating_count > 0 && (
            <span className="flex items-center gap-1.5">
              <RatingStars value={product.rating_avg} /> ({product.rating_count}{" "}
              reviews)
            </span>
          )}
          <span
            className={
              stock > 0 || (product.variants.length > 0 && !variant)
                ? "text-emerald-600"
                : "text-rose-600"
            }
          >
            ●{" "}
            {stock > 0 || (product.variants.length > 0 && !variant)
              ? "In Stock"
              : "Sold out"}
          </span>
        </p>
        <p className="line-clamp-4 border-b border-gray-100 pb-4 text-sm leading-6 text-gray-600">
          {product.description}
        </p>
        <PurchaseControls
          product={product}
          variant={variant}
          onVariantChange={onVariant}
          onAdded={onClose}
        />
        <Link
          href={`/products/${product.slug}`}
          onClick={onClose}
          className="mx-auto flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          View Full Product Details{" "}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx)
    throw new Error("useQuickView must be used inside <QuickViewProvider>");
  return ctx;
}
