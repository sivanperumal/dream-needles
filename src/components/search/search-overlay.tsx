"use client";

import {
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Heart,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { useUI } from "@/components/providers/ui-provider";
import { highlightParts } from "@/lib/highlight";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import type { PopupResponse } from "@/lib/queries/search";
import { cn, discountPercent, formatINR } from "@/lib/utils";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

type Status = "idle" | "loading" | "done" | "error";

/**
 * Live search popup (Figma 98:6446 desktop, 98:6614 mobile).
 * Debounced, cancels stale requests (results never arrive out of order),
 * keyboard navigable (↑ ↓ Enter Esc), closes on outside click.
 */
export function SearchOverlay() {
  const { panel, close } = useUI();
  const isOpen = panel === "search";
  return isOpen ? <SearchPanel onClose={close} /> : null;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useShop();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PopupResponse | null>(null);
  const [active, setActive] = useState(-1);
  const requestId = useRef(0);

  const trimmed = query.trim();

  // Fetch after the user stops typing; abort the previous request.
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) {
      requestId.current += 1;
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as PopupResponse;
        if (id !== requestId.current) return; // a newer request is in flight
        setResult(data);
        setActive(-1);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name === "AbortError" || id !== requestId.current)
          return;
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Lock scroll and focus the input while open.
  useEffect(() => {
    inputRef.current?.focus();
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, []);

  const showResults =
    trimmed.length >= MIN_CHARS && result !== null && status !== "idle";
  const collections = showResults ? result.collections : [];
  const products = showResults ? result.products : [];
  const viewAllHref = `/search?q=${encodeURIComponent(trimmed)}`;
  // Flat list for arrow-key navigation: collections, products, then "view all".
  const options = [
    ...collections.map((c) => ({
      id: `c-${c.id}`,
      href: `/collections/${c.slug}`,
    })),
    ...products.map((p) => ({ id: `p-${p.id}`, href: `/products/${p.slug}` })),
    ...(products.length ? [{ id: "all", href: viewAllHref }] : []),
  ];

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].href);
      else if (trimmed.length >= MIN_CHARS) go(viewAllHref);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  let index = -1;
  const nextIndex = () => ++index;

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the store"
        className="absolute inset-0 flex flex-col bg-brand-tint md:inset-x-auto md:top-24 md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-8rem)] md:w-[768px] md:max-w-[calc(100vw-3rem)] md:-translate-x-1/2 md:overflow-hidden md:rounded-2xl md:bg-white md:shadow-2xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-purple-100 bg-white p-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-brand md:hidden"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-brand/70 bg-white px-4 py-2.5">
            <Search
              className="size-4 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={options.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? optionId(active) : undefined}
              aria-label="Search products and collections"
              placeholder="Search hooks, keychains, blankets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={64}
              className="w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {status === "loading" && (
              <Loader2
                className="size-4 shrink-0 animate-spin text-brand"
                aria-label="Searching"
              />
            )}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResult(null);
                  setStatus("idle");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6"
          id={listId}
          role="listbox"
          aria-label="Search results"
        >
          {trimmed.length < MIN_CHARS ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Type at least {MIN_CHARS} letters to search.
            </p>
          ) : status === "error" ? (
            <p className="py-10 text-center text-sm text-rose-600">
              Search isn&apos;t available right now. Please try again.
            </p>
          ) : !result ||
            (status === "loading" &&
              !products.length &&
              !collections.length) ? (
            <ResultsSkeleton />
          ) : !products.length && !collections.length ? (
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-gray-900">
                No results for &ldquo;{trimmed}&rdquo;
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Check the spelling or try a more general word.
              </p>
              <button
                type="button"
                onClick={() => go("/collections/whats-new")}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
              >
                <Sparkles className="size-4" aria-hidden="true" /> Browse
                What&apos;s New
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-6",
                status === "loading" && "opacity-60",
              )}
            >
              {result.suggestions.length > 1 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold tracking-[0.6px] text-gray-500 uppercase">
                    Suggested searches
                  </h2>
                  <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
                    {result.suggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setQuery(s)}
                          className={cn(
                            "rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
                            s === trimmed.toLowerCase()
                              ? "border-purple-300 bg-brand-light text-brand"
                              : "border-transparent bg-gray-100 text-gray-700 hover:bg-brand-tint",
                          )}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {collections.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold tracking-[0.6px] text-gray-500 uppercase">
                    Collections
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {collections.map((c) => {
                      const i = nextIndex();
                      return (
                        <li
                          key={c.id}
                          id={optionId(i)}
                          role="option"
                          aria-selected={active === i}
                        >
                          <Link
                            href={`/collections/${c.slug}`}
                            onClick={onClose}
                            onMouseEnter={() => setActive(i)}
                            className={cn(
                              "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                              active === i
                                ? "border-purple-300 bg-brand-tint"
                                : "border-gray-100 bg-gray-50 hover:bg-brand-tint",
                            )}
                          >
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                              <FolderOpen
                                className="size-5"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="min-w-0">
                              {c.parent_name && (
                                <span className="block text-xs text-gray-500">
                                  {c.parent_name} ›
                                </span>
                              )}
                              <span className="block truncate font-semibold text-gray-900">
                                <Highlight query={trimmed} text={c.name} />
                              </span>
                              <span className="text-xs font-medium text-brand">
                                View Collection →
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {products.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-semibold tracking-[0.6px] text-gray-500 uppercase">
                      Products{" "}
                      <span className="md:hidden">
                        ({products.length} of {result.total})
                      </span>
                    </h2>
                    <p
                      className="hidden text-xs text-gray-500 md:block"
                      aria-live="polite"
                    >
                      {result.total} {result.total === 1 ? "item" : "items"}{" "}
                      found
                    </p>
                  </div>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {products.map((p) => {
                      const i = nextIndex();
                      const saving = discountPercent(
                        p.price,
                        p.compare_at_price,
                      );
                      const wished = isWishlisted(p.id);
                      return (
                        <li
                          key={p.id}
                          id={optionId(i)}
                          role="option"
                          aria-selected={active === i}
                          className="relative"
                        >
                          <Link
                            href={`/products/${p.slug}`}
                            onClick={onClose}
                            onMouseEnter={() => setActive(i)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border bg-white p-2.5 pr-10 transition-colors md:pr-2.5",
                              active === i
                                ? "border-purple-300 bg-brand-tint"
                                : "border-gray-100 hover:border-purple-200",
                            )}
                          >
                            <Image
                              src={imageUrl(p.images[0]) ?? PLACEHOLDER_IMAGE}
                              alt=""
                              width={64}
                              height={64}
                              className="size-16 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0">
                              <span className="line-clamp-2 text-sm font-medium text-gray-900">
                                <Highlight query={trimmed} text={p.name} />
                              </span>
                              {p.matched_in !== "name" && (
                                <span className="block truncate text-[11px] text-gray-500">
                                  Matched{" "}
                                  {p.matched_in === "sku"
                                    ? "SKU"
                                    : p.matched_in}
                                  {p.snippet ? (
                                    <>
                                      :{" "}
                                      <Highlight
                                        query={trimmed}
                                        text={p.snippet}
                                      />
                                    </>
                                  ) : null}
                                </span>
                              )}
                              <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                                <span className="font-bold text-gray-900">
                                  {formatINR(p.price)}
                                </span>
                                {saving && p.compare_at_price && (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">
                                      MRP {formatINR(p.compare_at_price)}
                                    </span>
                                    <span className="rounded bg-emerald-50 px-1 text-[11px] font-semibold text-emerald-700 md:hidden">
                                      {saving}% off
                                    </span>
                                  </>
                                )}
                              </span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(p.id, p.name)}
                            aria-label={
                              wished
                                ? `Remove ${p.name} from wishlist`
                                : `Add ${p.name} to wishlist`
                            }
                            aria-pressed={wished}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 md:hidden"
                          >
                            <Heart
                              className={cn(
                                "size-4",
                                wished && "fill-rose-500 text-rose-500",
                              )}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="border-t border-purple-100 bg-white p-4 md:flex md:items-center md:justify-between md:bg-[#faf7fb] md:px-6 md:py-3">
            <p className="hidden text-xs text-gray-500 md:block">
              Press{" "}
              <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px]">
                ESC
              </kbd>{" "}
              to close
            </p>
            {(() => {
              const i = nextIndex();
              return (
                <Link
                  href={viewAllHref}
                  onClick={onClose}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-semibold text-white shadow-lg md:bg-transparent md:p-0 md:text-brand md:shadow-none md:hover:underline",
                    active === i && "md:underline",
                  )}
                >
                  View all {result?.total ?? ""} results for &ldquo;{trimmed}
                  &rdquo; <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-sm bg-brand-light px-0.5 text-brand">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5"
          >
            <div className="size-16 animate-pulse rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
