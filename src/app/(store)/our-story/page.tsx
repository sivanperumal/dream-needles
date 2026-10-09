import {
  ArrowDown,
  ArrowUpRight,
  HandHeart,
  Leaf,
  Sparkles,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Prose } from "@/components/content/prose";
import { getPage } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "How Dream Needles began, and the women artisans behind every stitch.",
};

const VALUES = [
  {
    Icon: Leaf,
    eyebrow: "Conscious Sourcing",
    title: "Empowerment & Sustainability",
    text: "Fostering economic independence for talented Indian women artisans while championing eco-friendly, natural fibers and zero-waste crafting.",
  },
  {
    Icon: Sparkles,
    eyebrow: "Heirloom Caliber",
    title: "Premium Yarns & Handcrafted Creations",
    text: "From ethically sourced organic wool and mercerized cotton to ergonomic carved hooks, every skein and stitch meets world-class quality standards.",
  },
  {
    Icon: HandHeart,
    eyebrow: "Made By Human Hands",
    title: "Handmade with Care in India",
    text: "Every toy, flower, cardigan, and keepsake is individually made by human hands with heartfelt dedication and heirloom-grade attention to detail.",
  },
];

const STATS = [
  { value: "2018", label: "Founded" },
  { value: "12,000+", label: "Customers" },
  { value: "350+", label: "Original designs" },
  { value: "150+", label: "Women artisans" },
];

const TEAM = [
  {
    name: "Indhu Padmanaban",
    role: "Founder & Creative Director",
    bio: "A lifelong fiber artist and champion of sustainable handicraft, Indhu founded Dream Needles with a singular dream: to make premium yarns accessible across India while building an inclusive artisan ecosystem that celebrates slow, soulful craftsmanship.",
    focus: "Design & Curation",
    base: "Chennai & Mumbai Studios",
  },
  {
    name: "Sivanananchaperumal K",
    role: "Co-Founder & Head of Operations",
    bio: "Bringing deep operational leadership and community outreach expertise, Sivanananchaperumal steers supply chain logistics, artisan empowerment partnerships, and retail expansions for கைவண்ணம் Store, ensuring every stitch touches lives meaningfully.",
    focus: "Logistics & Outreach",
    base: "Pan-India Operations",
  },
];

export default async function OurStoryPage() {
  const page = await getPage("our-story");

  return (
    <>
      {/* Hero (Figma 55:3883) */}
      <section className="relative isolate flex min-h-[480px] items-center justify-center overflow-hidden text-center md:min-h-[640px]">
        <Image
          src="/images/pages/story-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-[#210023]/55"
          aria-hidden="true"
        />
        <div className="container-page max-w-3xl text-white">
          <p className="mx-auto w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[1.5px] uppercase backdrop-blur">
            ✦ Handcrafted with devotion
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
            A Brand Built From Passion
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 md:text-lg">
            Empowering women artisans across India with handcrafted crochet,
            knitting heritage, and premium sustainable yarns for makers
            worldwide.
          </p>
          <a
            href="#story"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold shadow-lg hover:bg-brand-hover"
          >
            Read More <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 -mt-10 rounded-t-[32px] bg-[#fdf6fd] pt-14 pb-16">
        <ul className="container-page grid gap-6 md:grid-cols-3">
          {VALUES.map(({ Icon, eyebrow, title, text }) => (
            <li
              key={title}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-purple-100"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                {eyebrow}
              </p>
              <h2 className="mt-1 text-lg font-bold text-brand">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Story + stats */}
      <section
        id="story"
        className="container-page scroll-mt-28 py-16 md:py-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-[#210023] md:text-4xl">
            Our Story
          </h2>
          {page && (
            <Prose
              markdown={page.body_markdown}
              className="mt-6 text-base md:text-lg [&_p]:leading-8"
            />
          )}
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-2xl bg-brand-light/70 px-4 py-6 text-center"
            >
              <dt className="order-2 mt-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                {s.label}
              </dt>
              <dd className="text-3xl font-extrabold text-[#210023]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Founder letter */}
        <figure className="mt-12 grid items-center gap-8 rounded-3xl bg-brand-light/60 p-6 md:grid-cols-[340px_1fr] md:p-10">
          <Image
            src="/images/pages/story-founder.png"
            alt="Indhu Padmanaban, founder of Dream Needles, at the store"
            width={340}
            height={440}
            className="mx-auto h-auto w-full max-w-[340px] rounded-2xl object-cover shadow-lg"
          />
          <blockquote className="flex flex-col gap-4 text-[15px] leading-7 text-gray-700">
            <p>
              Dream Needles began quietly, with my hands and a pair of knitting
              needles. During a difficult phase when I was searching for
              purpose, knitting and crochet gave me something steady to hold on
              to. What started as a personal connection to craft slowly became
              something more, as people began asking for the pieces I was making
              and encouraging me to keep going.
            </p>
            <p>
              If someone had told me years ago that a pair of knitting needles
              would help me process grief, find direction, connect me to
              thousands of makers across India, and grow into an empowering
              handmade initiative supporting over 150 women artisans, I would
              never have believed it. Yet creativity has a quiet way of carrying
              us through our hardest moments, and I&apos;ve learned that the
              most difficult paths often lead to the most meaningful
              destinations.
            </p>
            <p>
              Over time, that small beginning grew into a brand built on craft,
              care, and community. Even today, every skein we curate and every
              handmade product we create carries that same intention: to make
              something meaningful, lasting, and beautiful.
            </p>
            <figcaption className="font-semibold text-[#210023]">
              – Indhu Padmanaban, Founder
            </figcaption>
          </blockquote>
        </figure>
      </section>

      {/* Team */}
      <section className="bg-[#fafbff] py-16 md:py-20">
        <div className="container-page">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#210023] md:text-4xl">
              The Visionaries Behind Dream Needles
            </h2>
            <p className="mt-3 text-gray-600">
              Guided by passion, community empowerment, and craft excellence.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {TEAM.map((m) => (
              <li
                key={m.name}
                className="flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-purple-100"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex size-12 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand"
                    aria-hidden="true"
                  >
                    {m.name[0]}
                  </span>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{m.name}</p>
                    <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                      {m.role}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-gray-600">
                  {m.bio}
                </p>
                <p className="mt-5 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <span
                      className="size-1.5 rounded-full bg-brand"
                      aria-hidden="true"
                    />{" "}
                    {m.focus}
                  </span>
                  {m.base}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Social impact */}
      <section className="container-page py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto w-fit rounded-full bg-[#e8dcea] px-3 py-1 text-[11px] font-bold tracking-[1.1px] text-[#210023] uppercase">
            Community &amp; Impact
          </p>
          <h2 className="mt-4 text-3xl font-extrabold text-[#210023] md:text-4xl">
            Social Impact at Our Core
          </h2>
          <p className="mt-4 text-gray-600">
            Beyond yarn and crochet kits lies a commitment to transformative
            economic empowerment. We organize regular artisan training workshops
            in rural and peri-urban hubs across South India, offering free raw
            materials, fair living wages, and an avenue for women homemakers to
            become proud micro-entrepreneurs from the comfort of their homes.
          </p>
        </div>
        <div className="relative mt-10 overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="/images/pages/story-storefront.png"
            alt="The Dream Needles and கைவண்ணம் store front"
            width={1152}
            height={460}
            className="h-72 w-full object-cover md:h-[460px]"
          />
          <div className="absolute inset-0 flex flex-col justify-end gap-4 bg-linear-to-t from-black/70 via-black/20 to-transparent p-6 md:flex-row md:items-end md:justify-between md:p-10">
            <p className="max-w-xl text-xl font-bold text-white md:text-2xl">
              ட்ரீம் நீடில்ஸ் &amp; கைவண்ணம் Store: where our artisans and craft
              lovers unite
            </p>
            <Link
              href="/retail-store"
              className="flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand"
            >
              View Store Details{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#210023]">
            Our Story is Still Unfolding
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            With thousands of parcels traversing states every month and our
            community workshops growing daily, our narrative is penned by every
            crafter who casts on a row with Dream Needles.
          </p>
        </div>
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center text-white md:px-16">
          <span
            className="absolute -top-16 -right-16 size-56 rounded-full bg-white/5"
            aria-hidden="true"
          />
          <Sparkles
            className="mx-auto size-6 text-white/70"
            aria-hidden="true"
          />
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold md:text-3xl">
            Why are we considered the best knitting and crochet store in India?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Discover heirloom-quality yarns, certified handmade creations, and a
            warm community waiting to welcome your creative journey.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/collections/handmade"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand"
            >
              Explore Collections
            </Link>
            <Link
              href="/retail-store"
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-white hover:underline"
            >
              <Store className="size-4" aria-hidden="true" /> Visit Our Store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
