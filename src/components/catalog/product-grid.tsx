import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Query } from "./listing";

const COLS = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
} as const;

export function ProductGrid({
  products,
  cols = 4,
}: {
  products: Card[];
  cols?: 2 | 3 | 4;
}) {
  return (
    <ul className={cn("grid gap-3 md:gap-5", COLS[cols])}>
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

/** Numbered pagination (Figma 70:648); plain links so it works without JavaScript. */
export function Pagination({
  pathname,
  query,
  page,
  perPage,
  total,
}: {
  pathname: string;
  query: Query;
  page: number;
  perPage: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const href = (p: number) => {
    const next = new URLSearchParams(query);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  // Show first, last, and two either side of the current page.
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2,
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#eaeefa] pt-6 sm:flex-row"
    >
      <p className="text-[13px] text-gray-600">
        Showing {from} - {to} of {total} items
      </p>
      {pages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <PageLink
              href={href(page - 1)}
              disabled={page <= 1}
              className="gap-1 px-3.5"
            >
              <ChevronLeft className="size-3" aria-hidden="true" /> Previous
            </PageLink>
          </li>
          {numbers.map((p, i) => (
            <li key={p} className="flex items-center">
              {i > 0 && p - numbers[i - 1] > 1 && (
                <span className="px-1 text-gray-400">…</span>
              )}
              <PageLink href={href(p)} current={p === page} className="size-9">
                {p}
              </PageLink>
            </li>
          ))}
          <li>
            <PageLink
              href={href(page + 1)}
              disabled={page >= pages}
              className="gap-1 px-3.5"
            >
              Next <ChevronRight className="size-3" aria-hidden="true" />
            </PageLink>
          </li>
        </ul>
      )}
    </nav>
  );
}

function PageLink({
  href,
  current,
  disabled,
  className,
  children,
}: {
  href: string;
  current?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = cn(
    "flex h-9 items-center justify-center rounded-full text-xs font-semibold tracking-[0.48px]",
    current ? "bg-brand text-white" : "text-[#171c24] hover:bg-gray-100",
    className,
  );
  if (disabled)
    return <span className={cn(base, "opacity-40")}>{children}</span>;
  return (
    <Link
      href={href}
      className={base}
      aria-current={current ? "page" : undefined}
      scroll
    >
      {children}
    </Link>
  );
}

export function EmptyResults({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <div className="mt-2 text-sm text-gray-600">{children}</div>
    </div>
  );
}
