import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand text-white",
  soft: "bg-brand-tint text-brand",
  purple: "bg-purple-100 text-purple-700",
  rose: "bg-rose-50 text-rose-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "soft",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] leading-4 font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Small count bubble on header icons (cart, wishlist). Hidden at zero. */
export function CountBubble({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 font-bold text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
