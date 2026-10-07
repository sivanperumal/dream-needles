import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "block w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 aria-invalid:border-rose-500 aria-invalid:focus:ring-rose-500/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(inputClasses, "min-h-28", className)} {...props} />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-gray-700",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({
  children,
  id,
}: {
  children?: string;
  id?: string;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-rose-600">
      {children}
    </p>
  );
}
