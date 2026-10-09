"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  min = 1,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-brand-tint disabled:opacity-40",
    size === "sm" ? "size-6" : "size-7",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white",
        size === "sm" ? "p-1" : "p-1.5",
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span
        className={cn(
          "min-w-6 text-center font-medium text-gray-900 tabular-nums",
          size === "sm" ? "text-xs" : "text-sm",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
