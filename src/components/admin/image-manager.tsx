"use client";

import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/admin/ui";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  updateImageAlt,
} from "@/lib/admin/actions/products";
import { imageUrl, PRODUCT_BUCKET } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductImage = {
  id: string;
  storage_path: string;
  alt: string;
  sort_order: number;
};

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Upload (drag & drop), reorder (drag), alt text and delete for product images. */
export function ImageManager({
  productId,
  slug,
  productName,
  images,
}: {
  productId: string;
  slug: string;
  productName: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [order, setOrder] = useState(images);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [, startTransition] = useTransition();

  // Follow server data after refresh.
  const [lastImages, setLastImages] = useState(images);
  if (lastImages !== images) {
    setLastImages(images);
    setOrder(images);
  }

  const upload = async (files: FileList | File[]) => {
    const list = [...files];
    const bad = list.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      toast.error(`${bad.name}: use JPG, PNG, WebP or AVIF under 5 MB.`);
      return;
    }
    const supabase = createClient();
    setUploading(list.length);
    for (const file of list) {
      const safe = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+/, "");
      const path = `products/${slug}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from(PRODUCT_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
      if (error) {
        toast.error(`Upload failed for ${file.name}: ${error.message}`);
      } else {
        const result = await addProductImage(productId, path, productName);
        if (!result.ok) toast.error(result.message);
      }
      setUploading((n) => n - 1);
    }
    toast.success("Images uploaded.");
    router.refresh();
  };

  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const next = [...order];
    const from = next.findIndex((i) => i.id === fromId);
    const to = next.findIndex((i) => i.id === toId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
  };

  const saveOrder = () =>
    startTransition(async () => {
      const result = await reorderProductImages(
        productId,
        order.map((i) => i.id),
      );
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });

  return (
    <Card
      title={`Images (${order.length})`}
      actions={
        <span className="text-xs text-gray-500">
          Drag to reorder · first image is the main one
        </span>
      }
    >
      <div className="p-5">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {order.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragging(image.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragging) move(dragging, image.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                saveOrder();
              }}
              className={cn(
                "group rounded-lg border bg-white p-2",
                dragging === image.id
                  ? "border-brand opacity-50"
                  : "border-gray-200",
              )}
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-gray-50">
                <Image
                  src={imageUrl(image.storage_path)!}
                  alt={image.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                    MAIN
                  </span>
                )}
                <span
                  className="absolute top-1 right-1 cursor-grab rounded bg-white/90 p-1 text-gray-600"
                  aria-hidden="true"
                >
                  <GripVertical className="size-4" />
                </span>
              </div>
              <label className="sr-only" htmlFor={`alt-${image.id}`}>
                Alt text
              </label>
              <input
                id={`alt-${image.id}`}
                defaultValue={image.alt}
                placeholder="Describe the image"
                onBlur={(e) =>
                  e.target.value !== image.alt &&
                  updateImageAlt(image.id, e.target.value).then(
                    (r) => r.ok && toast.success(r.message),
                  )
                }
                className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      move(image.id, order[index - 1].id);
                      setTimeout(saveOrder, 0);
                    }}
                    className="rounded px-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => {
                      move(image.id, order[index + 1].id);
                      setTimeout(saveOrder, 0);
                    }}
                    className="rounded px-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Move later"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Delete this image?")) return;
                    startTransition(async () => {
                      const r = await deleteProductImage(image.id);
                      if (r.ok) {
                        toast.success(r.message);
                        router.refresh();
                      } else toast.error(r.message);
                    });
                  }}
                  className="rounded p-1 text-rose-600 hover:bg-rose-50"
                  aria-label="Delete image"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropActive(false);
                if (e.dataTransfer.files.length)
                  void upload(e.dataTransfer.files);
              }}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-gray-500 transition-colors",
                dropActive
                  ? "border-brand bg-brand-tint"
                  : "border-gray-300 hover:border-brand hover:text-brand",
              )}
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-6" aria-hidden="true" />
              )}
              {uploading ? `Uploading ${uploading}…` : "Add images"}
              <span className="text-xs">or drop files here</span>
            </button>
            <input
              ref={input}
              type="file"
              accept={TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        </ul>
      </div>
    </Card>
  );
}
