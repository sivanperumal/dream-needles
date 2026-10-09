import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductMain } from "@/components/catalog/product-main";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { ReviewsSection } from "@/components/catalog/reviews";
import { Skeleton } from "@/components/ui/skeleton";
import { publicEnv } from "@/lib/env";
import { imageUrl } from "@/lib/images";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  getReviews,
  getStoreSettings,
} from "@/lib/queries/catalog";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  // Cache Components needs at least one param to validate the route at build time.
  return slugs.length
    ? slugs.map((slug) => ({ slug }))
    : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const image = imageUrl(product.images[0]?.storage_path);
  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, images: image ? [image] : undefined },
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <div className="bg-[#fafbff]">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent {...props} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews, settings] = await Promise.all([
    getRelatedProducts(product.id, 4),
    getReviews(product.id),
    getStoreSettings(),
  ]);
  const parent = product.breadcrumbs.at(-1);
  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku ?? undefined,
    description: product.description,
    image: product.images.map((i) => imageUrl(i.storage_path)),
    brand: { "@type": "Brand", name: "Dream Needles" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${site}/products/${product.slug}`,
    },
    ...(product.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating_avg,
        reviewCount: product.rating_count,
      },
    }),
  };

  return (
    <div className="container-page pt-6 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        items={[
          ...product.breadcrumbs.map((b) => ({
            label: b.name,
            href: `/collections/${b.slug}`,
          })),
          { label: product.name },
        ]}
      />
      <div className="mt-6 md:mt-8">
        <ProductMain
          product={product}
          freeShippingThreshold={settings.free_shipping_threshold}
        />
      </div>

      <section
        aria-labelledby="description-heading"
        className="mt-14 max-w-3xl"
      >
        <h2
          id="description-heading"
          className="text-2xl font-bold text-[#210023] md:text-3xl"
        >
          About this piece
        </h2>
        <p className="mt-4 text-base leading-7 whitespace-pre-line text-gray-700">
          {product.description}
        </p>
        {product.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
            {product.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <p className="text-[11px] font-semibold tracking-[1.1px] text-gray-500 uppercase">
            Coordinated companions
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <h2
              id="related-heading"
              className="text-2xl font-bold text-[#210023] md:text-4xl"
            >
              You May Also Like
            </h2>
            {parent && (
              <Link
                href={`/collections/${parent.slug}`}
                className="flex items-center gap-1 text-sm font-semibold text-[#210023] hover:underline"
              >
                View all {parent.name}{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
            {related.map((card) => (
              <li key={card.id}>
                <ProductCard product={card} eyebrow={parent?.name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-16">
        <ReviewsSection
          productId={product.id}
          productSlug={product.slug}
          reviews={reviews}
          average={product.rating_avg}
          count={product.rating_count}
        />
      </div>

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="container-page grid gap-8 pt-14 pb-16 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading product"
    >
      <Skeleton className="aspect-square" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
