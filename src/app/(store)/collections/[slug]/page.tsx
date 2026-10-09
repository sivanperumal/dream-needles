import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ListingLayout, type Query } from "@/components/catalog/listing";
import {
  EmptyResults,
  Pagination,
  ProductGrid,
} from "@/components/catalog/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  activeFilterCount,
  PER_PAGE,
  parseCollectionParams,
} from "@/lib/catalog-params";
import { getCollectionListing } from "@/lib/queries/catalog";
import { COLLECTION_SORTS } from "@/lib/types";

const DEFAULT_QUERY = parseCollectionParams({});

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getCollectionListing(slug, {
    ...DEFAULT_QUERY,
    perPage: 1,
  });
  if (!listing) return { title: "Collection not found" };
  const { collection } = listing;
  return {
    title: collection.seo_title || collection.name,
    description:
      collection.seo_description || collection.description || undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default function CollectionPage(
  props: PageProps<"/collections/[slug]">,
) {
  return (
    <div className="bg-[#fafbff]">
      <Suspense fallback={<ListingSkeleton />}>
        <CollectionContent {...props} />
      </Suspense>
    </div>
  );
}

async function CollectionContent({
  params,
  searchParams,
}: PageProps<"/collections/[slug]">) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const query = parseCollectionParams(raw);
  const listing = await getCollectionListing(slug, {
    ...query,
    perPage: PER_PAGE,
  });
  if (!listing) notFound();

  const { collection, items, total, facets } = listing;
  const crumbs = [
    ...collection.ancestors.map((a) => ({
      label: a.name,
      href: `/collections/${a.slug}`,
    })),
    { label: collection.name },
  ];
  const parent = collection.ancestors.at(-1);
  const pathname = `/collections/${collection.slug}`;
  const currentQuery = Object.fromEntries(
    Object.entries(raw).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v]] : [],
    ),
  ) as Query;

  return (
    <div className="container-page pt-6 pb-16">
      <Breadcrumbs items={crumbs} />

      <header className="mx-auto mt-8 mb-10 max-w-3xl text-center md:mt-10 md:mb-14">
        <p className="inline-block rounded-full bg-[#e8dcea] px-3 py-1 text-[11px] font-bold tracking-[1.1px] text-[#4f434c] uppercase">
          {collection.slug === "whats-new"
            ? "Fresh off the hook"
            : (parent?.name ?? "Collection")}
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#210023] md:text-5xl md:leading-[1.15]">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-4 text-base leading-6 text-gray-600 md:text-lg">
            {collection.description}
          </p>
        )}
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-gray-600">
          <span
            className="size-1.5 rounded-full bg-[#864784]"
            aria-hidden="true"
          />
          Showing {items.length} of {total}{" "}
          {total === 1 ? "product" : "products"}
        </p>
      </header>

      <ListingLayout
        query={currentQuery}
        total={total}
        sort={query.sort}
        sorts={COLLECTION_SORTS}
        cols={query.cols}
        activeFilters={activeFilterCount(query)}
        filters={{
          priceMin: facets.price_min,
          priceMax: facets.price_max,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          inStock: query.inStock,
          facetLabel: "Category",
          facetKey: "sub",
          facetOptions: facets.subcollections,
          selected: query.sub,
        }}
      >
        {items.length ? (
          <>
            <ProductGrid products={items} cols={query.cols} />
            <Pagination
              pathname={pathname}
              query={currentQuery}
              page={query.page}
              perPage={PER_PAGE}
              total={total}
            />
          </>
        ) : (
          <EmptyResults
            title={
              total === 0 && activeFilterCount(query) === 0
                ? "New pieces are on the way"
                : "No products match these filters"
            }
          >
            {activeFilterCount(query) > 0 ? (
              <ButtonLink href={pathname} variant="outline" className="mt-4">
                Clear filters
              </ButtonLink>
            ) : (
              <>
                <p>
                  We&apos;re crafting products for this collection. Take a look
                  at what&apos;s new meanwhile.
                </p>
                <ButtonLink href="/collections/whats-new" className="mt-4">
                  See What&apos;s New
                </ButtonLink>
              </>
            )}
          </EmptyResults>
        )}
      </ListingLayout>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div
      className="container-page pt-6 pb-16"
      aria-busy="true"
      aria-label="Loading products"
    >
      <Skeleton className="h-4 w-48" />
      <div className="mx-auto mt-10 mb-14 flex max-w-xl flex-col items-center gap-4">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Skeleton className="mb-6 h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[196/320] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
