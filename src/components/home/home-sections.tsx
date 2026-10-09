import { ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { imageUrl } from "@/lib/images";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string | null;
  image_path: string;
  link_url: string | null;
};

const bannerSrc = (path: string) => imageUrl(path, "site-assets")!;

/** 2×2 tiles beside the hero (Figma 45:1442). Tile images include their label. */
export function HeroTiles({ tiles }: { tiles: Banner[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      {tiles.slice(0, 4).map((tile) => (
        <Link
          key={tile.id}
          href={tile.link_url ?? "/"}
          className="group relative aspect-square overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm"
        >
          <Image
            src={bannerSrc(tile.image_path)}
            alt={`Shop ${tile.title}`}
            fill
            sizes="(min-width: 1280px) 286px, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      ))}
    </div>
  );
}

const TRUST_BADGES = [
  {
    src: "/images/home/trust-7-days-return.png",
    alt: "7 days return: easy return process",
  },
  {
    src: "/images/home/trust-free-shipping.png",
    alt: "Free shipping across India",
  },
  {
    src: "/images/home/trust-truly-handmade.png",
    alt: "Truly handmade and sustainable",
  },
  { src: "/images/home/trust-secure-payment.png", alt: "100% secure payment" },
];

/** Four trust badges (Figma 45:1451). */
export function TrustBadges() {
  return (
    <section
      aria-label="Why shop with us"
      className="border-y border-gray-100 bg-white py-8"
    >
      <ul className="container-page grid grid-cols-2 gap-4 md:gap-8 xl:grid-cols-4">
        {TRUST_BADGES.map((badge) => (
          <li
            key={badge.src}
            className="flex items-center justify-center rounded-2xl border border-purple-100/70 bg-white p-4 shadow-sm md:p-6"
          >
            <Image
              src={badge.src}
              alt={badge.alt}
              width={156}
              height={128}
              className="h-auto w-28 md:w-[156px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

const ACCENTS = [
  "text-amber-200/90",
  "text-blue-200/90",
  "text-rose-200/90",
  "text-orange-200/90",
];

function SectionHeading({
  eyebrow,
  title,
  eyebrowClass = "text-brand",
}: {
  eyebrow: string;
  title: string;
  eyebrowClass?: string;
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p
        className={`text-xs font-semibold tracking-[0.6px] uppercase ${eyebrowClass}`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.75px] text-gray-900 md:text-4xl md:tracking-[-0.9px]">
        {title}
      </h2>
    </div>
  );
}

/** "Shop by Category" cards with gradient overlay (Figma 45:1465). */
export function ShopByCategory({ categories }: { categories: Banner[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page pt-16 pb-12 md:pt-20 md:pb-16">
      <SectionHeading
        eyebrow="Browse our collections"
        title="Shop by Category"
      />
      <div className="mt-10 grid grid-cols-2 gap-4 md:mt-12 md:gap-6 xl:grid-cols-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={cat.link_url ?? "/"}
            className="group relative flex aspect-[286/358] flex-col justify-end overflow-hidden rounded-2xl shadow-md"
          >
            <Image
              src={bannerSrc(cat.image_path)}
              alt=""
              fill
              sizes="(min-width: 1280px) 286px, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span
              className="absolute inset-0 bg-linear-to-b from-overlay-from via-overlay-via to-overlay-to opacity-90"
              aria-hidden="true"
            />
            <span className="relative p-4 md:p-6">
              {cat.subtitle && (
                <span
                  className={`mb-1 block text-xs ${ACCENTS[i % ACCENTS.length]}`}
                >
                  {cat.subtitle}
                </span>
              )}
              <span className="block text-xl font-bold tracking-[-0.6px] text-white md:text-2xl">
                {cat.title}
              </span>
              <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-white">
                {cat.cta_label ?? "Shop Now"}{" "}
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

type Marketplace = { name: string; url: string; logo_path: string | null };

/** "We are selling on" marketplace logos (Figma 45:1524). Links set in admin settings. */
export function Marketplaces({ items }: { items: Marketplace[] }) {
  const shown = items.filter((m) => m.logo_path);
  if (!shown.length) return null;
  return (
    <section className="container-page py-14">
      <SectionHeading
        eyebrow="Our brand partners"
        title="We are selling on"
        eyebrowClass="text-gray-500"
      />
      <ul className="mt-10 grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {shown.map((m) => {
          const logo = (
            <Image
              src={bannerSrc(m.logo_path!)}
              alt={`Buy Dream Needles products on ${m.name}`}
              width={282}
              height={207}
              className="h-auto w-full rounded-lg"
            />
          );
          return (
            <li
              key={m.name}
              className="overflow-hidden rounded-xl bg-white p-0.5 shadow-sm transition-shadow hover:shadow-md"
            >
              {m.url ? (
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  {logo}
                </a>
              ) : (
                logo
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Big stats row (Figma 45:1539). */
export function StatsRow({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  if (!stats.length) return null;
  return (
    <section
      aria-label="Dream Needles in numbers"
      className="container-page pt-12 pb-16 md:pb-24"
    >
      <dl className="grid grid-cols-2 gap-y-8 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-1 text-center ${i % 2 === 1 ? "border-l border-purple-100" : ""} ${i > 0 ? "xl:border-l xl:border-purple-100" : ""}`}
          >
            <dt className="order-2 text-sm font-medium text-gray-600">
              {stat.label}
            </dt>
            <dd className="text-4xl font-extrabold tracking-[-1.2px] text-brand md:text-5xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Welcome / SEO story card (Figma 45:1560). */
export function AboutStory({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  return (
    <section className="container-page pb-16 md:pb-20">
      <div className="mx-auto flex max-w-[832px] flex-col items-center gap-4 rounded-3xl border border-purple-100/70 bg-linear-to-r from-brand-tint/50 via-pink-50/30 to-brand-tint/50 p-8 text-center md:p-12">
        <Quote
          className="size-8 fill-brand/20 text-transparent"
          aria-hidden="true"
        />
        <div className="text-base leading-6 text-gray-700 [&_strong]:font-semibold [&_strong]:text-brand">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
