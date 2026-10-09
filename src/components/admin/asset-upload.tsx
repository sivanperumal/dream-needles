"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { imageUrl, SITE_ASSETS_BUCKET } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

/** Uploads an image to the site-assets bucket and keeps its path in a hidden input. */
export function AssetUpload({
  name,
  defaultValue,
  folder,
  label,
}: {
  name: string;
  defaultValue?: string | null;
  folder: string;
  label: string;
}) {
  const [path, setPath] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (
      !/^image\/(jpeg|png|webp|avif|svg\+xml)$/.test(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error("Use a JPG, PNG, WebP, AVIF or SVG under 5 MB.");
      return;
    }
    setBusy(true);
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const target = `${folder}/${Date.now()}-${safe}`;
    const { error } = await createClient()
      .storage.from(SITE_ASSETS_BUCKET)
      .upload(target, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });
    setBusy(false);
    if (error) toast.error(`Upload failed: ${error.message}`);
    else setPath(target);
  };

  const preview = path ? imageUrl(path, SITE_ASSETS_BUCKET) : null;
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input type="hidden" name={name} value={path} />
      <div className="flex items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
          {preview && (
            <Image
              src={preview}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-brand hover:text-brand"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
          {path ? "Replace image" : "Upload image"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </div>
  );
}
