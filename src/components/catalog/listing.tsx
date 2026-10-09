"use client";

import {
  Check,
  ChevronDown,
  Columns2,
  Columns3,
  Grid2X2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SORT_LABELS } from "@/lib/catalog-params";
import { cn, formatINR } from "@/lib/utils";

export type Query = Record<string, string>;
export type FacetOption = { name: string; slug: string; count: number };

/** Builds a URL from the current query with some keys changed (null removes). Resets to page 1. */
export function withQuery(
  pathname: string,
  query: Query,
  changes: Record<string, string | null>,
  keepPage = false,
) {
  const next = new URLSearchParams(query);
  if (!keepPage) next.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function useNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    go: (query: Query, changes: Record<string, string | null>) =>
      startTransition(() =>
        router.push(withQuery(pathname, query, changes), { scroll: false }),
      ),
  };
}

type ListingProps = {
  query: Query;
  total: number;
  sort: string;
  sorts: readonly string[];
  cols: number;
  activeFilters: number;
  filters: FiltersProps;
  children: ReactNode;
};

/** Toolbar + filter sidebar + results (Figma 70:222 / 70:256). */
export function ListingLayout({
  query,
  total,
  sort,
  sorts,
  cols,
  activeFilters,
  filters,
  children,
}: ListingProps) {
  const { go, pending } = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 md:p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              window.matchMedia("(min-width: 1024px)").matches
                ? setShowSidebar((s) => !s)
                : setSheetOpen(true)
            }
            className="flex items-center gap-2 rounded-full bg-[#e8dcea] px-4 py-2 text-sm font-medium text-[#4f434c] transition-colors hover:bg-purple-200"
            aria-expanded={showSidebar}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filter Products
            {activeFilters > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#210023] text-[11px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
          <p
            className="hidden text-sm text-gray-600 sm:block"
            aria-live="polite"
          >
            {total} {total === 1 ? "Product" : "Products"} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">Sort by:</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(e) =>
                  go(query, {
                    sort: e.target.value === sorts[0] ? null : e.target.value,
                  })
                }
                className="appearance-none rounded-lg border-0 bg-[#f0f3ff] py-2 pr-9 pl-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-brand/20"
              >
                {sorts.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
            </span>
          </label>
          <div
            className="hidden items-center gap-1 border-l border-gray-200 pl-3 lg:flex"
            role="group"
            aria-label="Grid density"
          >
            {[
              { n: 2, Icon: Columns2 },
              { n: 3, Icon: Columns3 },
              { n: 4, Icon: Grid2X2 },
            ].map(({ n, Icon }) => (
              <button
                key={n}
                type="button"
                onClick={() => go(query, { cols: n === 4 ? null : String(n) })}
                aria-label={`${n} columns`}
                aria-pressed={cols === n}
                className={cn(
                  "rounded-md p-1.5 text-gray-500 hover:bg-gray-100",
                  cols === n &&
                    "bg-white text-[#210023] shadow-sm ring-1 ring-gray-200",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {showSidebar && (
          <aside className="hidden w-72 shrink-0 lg:block" aria-label="Filters">
            <div className="sticky top-28 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <Filters key={JSON.stringify(query)} {...filters} query={query} />
            </div>
          </aside>
        )}
        <div
          className={cn(
            "min-w-0 flex-1 transition-opacity",
            pending && "opacity-60",
          )}
        >
          {children}
        </div>
      </div>

      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        placement="left"
      >
        <div className="p-5">
          <Filters
            key={JSON.stringify(query)}
            {...filters}
            query={query}
            onApplied={() => setSheetOpen(false)}
          />
        </div>
      </Dialog>
    </>
  );
}

type FiltersProps = {
  priceMin: number | null;
  priceMax: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  facetLabel: string;
  facetKey: string;
  facetOptions: FacetOption[];
  selected: string[];
};

function Filters({
  query,
  priceMin,
  priceMax,
  minPrice,
  maxPrice,
  inStock,
  facetLabel,
  facetKey,
  facetOptions,
  selected,
  onApplied,
}: FiltersProps & { query: Query; onApplied?: () => void }) {
  const { go } = useNavigate();
  const floor = Math.floor(priceMin ?? 0);
  const ceil = Math.ceil(priceMax ?? 0);
  const [min, setMin] = useState(String(minPrice ?? floor));
  const [max, setMax] = useState(String(maxPrice ?? ceil));
  const apply = (changes: Record<string, string | null>) => {
    go(query, changes);
    onApplied?.();
  };
  const toggleFacet = (slug: string) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    apply({ [facetKey]: next.length ? next.join(",") : null });
  };
  const applyPrice = () => {
    const lo = Number(min);
    const hi = Number(max);
    apply({
      min: Number.isFinite(lo) && lo > floor ? String(lo) : null,
      max: Number.isFinite(hi) && hi < ceil ? String(hi) : null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#eaeefa] pb-2">
        <p className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters
        </p>
        <button
          type="button"
          onClick={() =>
            apply({ min: null, max: null, stock: null, [facetKey]: null })
          }
          className="flex items-center gap-1 text-xs font-medium tracking-wide text-brand hover:underline"
        >
          <RotateCcw className="size-3" aria-hidden="true" /> Reset All
        </button>
      </div>

      <FilterGroup title="Availability">
        <Checkbox
          label="In stock only"
          checked={inStock}
          onChange={() => apply({ stock: inStock ? null : "1" })}
        />
      </FilterGroup>

      {ceil > floor && (
        <FilterGroup title="Price (₹)">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyPrice();
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "min", label: "Min", value: min, set: setMin },
                { id: "max", label: "Max", value: max, set: setMax },
              ].map((f) => (
                <label key={f.id} className="text-xs text-gray-500">
                  {f.label}
                  <span className="mt-1 flex items-center gap-1 rounded-lg bg-[#f0f3ff] px-2.5 py-2">
                    <span className="text-gray-400">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={floor}
                      max={ceil}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-900 focus:outline-none"
                    />
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-500">
              Range {formatINR(floor)} to {formatINR(ceil)}
            </p>
            <Button type="submit" variant="outline" size="sm">
              Apply price
            </Button>
          </form>
        </FilterGroup>
      )}

      {facetOptions.length > 0 && (
        <FilterGroup title={facetLabel}>
          {facetOptions.map((o) => (
            <Checkbox
              key={o.slug}
              label={o.name}
              count={o.count}
              checked={selected.includes(o.slug)}
              onChange={() => toggleFacet(o.slug)}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <fieldset className="border-b border-[#e4e8f4] pb-5 last:border-0 last:pb-0">
      <legend className="w-full">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-[15px] font-semibold text-gray-900"
        >
          {title}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </legend>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </fieldset>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-gray-700">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          className="flex size-4 items-center justify-center rounded border border-gray-400 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30"
          aria-hidden="true"
        >
          {checked && <Check className="size-3 text-white" strokeWidth={3} />}
        </span>
        {label}
      </span>
      {count !== undefined && <span className="text-gray-500">({count})</span>}
    </label>
  );
}
