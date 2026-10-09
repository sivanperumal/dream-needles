import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-1 inline-block text-sm text-gray-500 hover:text-brand"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Card({
  title,
  actions,
  className,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl bg-white shadow-sm ring-1 ring-gray-200",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Responsive table wrapper; scrolls horizontally on small screens. */
export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full min-w-[640px] text-left text-sm", className)}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-gray-100 px-4 py-3 align-middle text-gray-700",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-sm text-gray-500"
      >
        {children}
      </td>
    </tr>
  );
}

export function Pill({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "green" | "amber" | "red" | "purple" | "blue";
  children: ReactNode;
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-brand-light text-brand",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** GET search/filter bar for list pages (works without JavaScript). */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <form
      className="flex flex-wrap items-end gap-3 border-b border-gray-100 p-4"
      role="search"
    >
      {children}
      <button
        type="submit"
        className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Apply
      </button>
    </form>
  );
}

export const adminInput =
  "h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none";

export function SimplePager({
  page,
  hasMore,
  makeHref,
}: {
  page: number;
  hasMore: boolean;
  makeHref: (page: number) => string;
}) {
  if (page <= 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      {page > 1 ? (
        <Link
          href={makeHref(page - 1)}
          className="font-medium text-brand hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-gray-500">Page {page}</span>
      {hasMore ? (
        <Link
          href={makeHref(page + 1)}
          className="font-medium text-brand hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
