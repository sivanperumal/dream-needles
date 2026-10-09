import { Clock, ExternalLink, Gift, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { StoreCompare } from "@/components/content/store-compare";
import { getStoreSettings } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: "Retail Store",
  description: "Visit the Dream Needles yarn and handmade store in person.",
};

const GALLERY = [
  {
    src: "/images/store/dream-needles-store-6.jpg",
    alt: "Yarn tree and hanging crochet mobiles",
  },
  {
    src: "/images/store/dream-needles-store-7.jpg",
    alt: "Honeycomb yarn shelving",
  },
  {
    src: "/images/store/Store-front-view-dream-needles-alt.jpg",
    alt: "Store facade and welcome glass",
  },
  {
    src: "/images/store/dream-needles-store-8.jpg",
    alt: "Communal crafting table",
  },
  {
    src: "/images/store/magic-needles-store-mumbai-14.webp",
    alt: "Handmade knitwear showcase",
  },
];

export default async function RetailStorePage() {
  const settings = await getStoreSettings();
  const address =
    settings.store_address?.replace(/^\[to confirm\]\s*/, "") ||
    "Address coming soon";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Dream Needles ${address}`)}`;

  return (
    <>
      <header className="bg-linear-to-b from-brand-light/70 to-white pt-14 pb-10 text-center">
        <div className="container-page max-w-3xl">
          <p className="mx-auto w-fit rounded-full bg-[#e8dcea] px-3 py-1 text-[11px] font-bold tracking-[1.1px] text-brand uppercase">
            Experience Dream Needles in-person
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand md:text-5xl">
            A Creative Haven for Knitters, Crocheters &amp; Crafters
          </h1>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            Step into a vibrant sanctuary of skeins, textures, and craft
            inspiration. Explore premium yarns, ergonomic tools, and handcrafted
            creations under one warm, maker-friendly roof.
          </p>
        </div>
      </header>

      <section className="container-page">
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          <Image
            src="/images/store/dream-needles-store-after.jpg"
            alt="Inside the Dream Needles retail store"
            width={1150}
            height={518}
            priority
            className="h-72 w-full object-cover md:h-[518px]"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/10 to-transparent p-6 text-white md:p-10">
            <p className="text-[11px] font-bold tracking-wide uppercase">
              Our flagship studio
            </p>
            <p className="mt-1 text-xl font-bold md:text-2xl">
              A Creative Haven for Knitters, Crocheters &amp; Crafters
            </p>
            <p className="mt-1 text-sm text-white/85">
              Visit our color wall, yarn tree, and open community workshop table
              in person.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 bg-[#fdf6fd] py-16">
        <div className="container-page text-center">
          <h2 className="text-3xl font-extrabold text-brand">
            A Store Designed for Makers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            From tactile yarn swatches to custom winding stations, every corner
            of our store was built with intention. Feel natural fibers, try
            tools before you buy, or pull up a bench at our communal making
            table.
          </p>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
            {GALLERY.map((img) => (
              <li
                key={img.src}
                className="overflow-hidden rounded-xl shadow-sm"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={212}
                  height={212}
                  className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <p className="text-[11px] font-bold tracking-[1.1px] text-brand uppercase">
          Two perspectives, one craft passion
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-brand">
          From the Outside, It&apos;s a Store. Inside, It&apos;s an Experience.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Behind our modern slate facade lies an explosion of vibrant hues, soft
          fibers, and handmade warmth. Drag the slider to step through our
          doors.
        </p>
        <StoreCompare
          outside="/images/store/Store-front-view-dream-needles-alt.jpg"
          inside="/images/store/dream-needles-store-after.jpg"
        />
      </section>

      <section className="bg-brand-light/70 py-16 text-center">
        <div className="container-page">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold text-brand">
            Come Experience It In Person
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Whether you&apos;re choosing yarn for your next sweater, seeking
            advice on crochet tension, or joining a weekend knit-along, our
            store team is ready to welcome you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              Visit Our Store{" "}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand"
            >
              <Navigation className="size-4" aria-hidden="true" /> Get
              Directions
            </a>
          </div>
          <dl className="mx-auto mt-10 grid max-w-3xl gap-6 rounded-2xl bg-white p-6 text-left shadow-sm md:grid-cols-3">
            {[
              { Icon: MapPin, label: "Address", value: address },
              {
                Icon: Clock,
                label: "Working hours",
                value: "Mon–Sun: 10:00 AM – 8:30 PM",
              },
              {
                Icon: Gift,
                label: "Store perks",
                value: "Free yarn winding · Sample swatches · Maker lounge",
              },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-rose-500"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[11px] font-bold tracking-wide text-gray-900 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-600">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
