import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ListingLayout, type Query } from "@/components/catalog/listing";
import {
  EmptyResults,
  Pagination,
  ProductGrid,
} from "@/components/catalog/product-grid";
import { SearchBox } from "@/components/search/search-box";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  activeFilterCount,
  PER_PAGE,
  parseSearchParams,
} from "@/lib/catalog-params";
import { searchProductsPage } from "@/lib/queries/search";
import { SEARCH_SORTS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="bg-[#fafbff]">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults {...props} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: PageProps<"/search">) {
  const raw = await searchParams;
  const query = parseSearchParams(raw);
  const result = await searchProductsPage({ ...query, perPage: PER_PAGE });
  const currentQuery = Object.fromEntries(
    Object.entries(raw).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v]] : [],
    ),
  ) as Query;

  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <header className="mx-auto mt-8 mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#210023] md:text-4xl">
          {query.q ? (
            <>Results for &ldquo;{query.q}&rdquo;</>
          ) : (
            "Search the store"
          )}
        </h1>
        <div className="mt-6">
          <SearchBox defaultValue={query.q} />
        </div>
      </header>

      {query.q.length < 2 ? (
        <EmptyResults title="What are you looking for?">
          Type at least 2 letters, for example &ldquo;hook&rdquo; or
          &ldquo;keychain&rdquo;.
        </EmptyResults>
      ) : (
        <ListingLayout
          query={currentQuery}
          total={result.total}
          sort={query.sort}
          sorts={SEARCH_SORTS}
          cols={query.cols}
          activeFilters={activeFilterCount(query)}
          filters={{
            priceMin: result.facets.price_min,
            priceMax: result.facets.price_max,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            inStock: query.inStock,
            facetLabel: "Collections",
            facetKey: "sub",
            facetOptions: result.facets.collections,
            selected: query.sub,
          }}
        >
          {result.items.length ? (
            <>
              <ProductGrid products={result.items} cols={query.cols} />
              <Pagination
                pathname="/search"
                query={currentQuery}
                page={query.page}
                perPage={PER_PAGE}
                total={result.total}
              />
            </>
          ) : (
            <EmptyResults title={`No results for “${query.q}”`}>
              <p>
                Check the spelling, use fewer words, or try a more general term.
              </p>
              {activeFilterCount(query) > 0 ? (
                <ButtonLink
                  href={`/search?q=${encodeURIComponent(query.q)}`}
                  variant="outline"
                  className="mt-4"
                >
                  Clear filters
                </ButtonLink>
              ) : (
                <Link
                  href="/collections/whats-new"
                  className="mt-4 inline-block font-semibold text-brand hover:underline"
                >
                  Browse What&apos;s New →
                </Link>
              )}
            </EmptyResults>
          )}
        </ListingLayout>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div
      className="container-page pt-6 pb-16"
      aria-busy="true"
      aria-label="Loading results"
    >
      <Skeleton className="mx-auto mt-10 h-10 w-2/3" />
      <Skeleton className="mx-auto mt-6 mb-10 h-12 w-full max-w-2xl rounded-full" />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[196/320] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
