import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-hover disabled:bg-brand/50",
  secondary:
    "bg-brand-light text-brand hover:bg-purple-100 disabled:opacity-60",
  outline:
    "border border-purple-200 bg-white text-brand hover:bg-brand-tint disabled:opacity-60",
  ghost: "text-gray-700 hover:bg-gray-100 hover:text-brand disabled:opacity-60",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60",
} as const;

const sizes = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-base",
} as const;

type StyleProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
}: StyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
  );
}

type ButtonProps = ComponentProps<"button"> &
  StyleProps & { loading?: boolean };

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

/** Round icon button for header actions, close buttons, etc. Always pass an aria-label. */
export function IconButton({
  className,
  ...props
}: ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-brand-tint hover:text-brand",
        className,
      )}
      {...props}
    />
  );
}
