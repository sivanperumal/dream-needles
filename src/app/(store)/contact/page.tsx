import {
  ArrowRight,
  Clock,
  CircleHelp,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHero } from "@/components/content/page-hero";
import { getProfile } from "@/lib/auth";
import { getStoreSettings } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about an order, a product or a custom piece? Send Dream Needles a message.",
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const address =
    settings.store_address?.replace(/^\[to confirm\]\s*/, "") || null;
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Dream Needles ${address}`)}`
    : null;
  const whatsapp = settings.whatsapp_number?.replace(/\D/g, "") || null;

  return (
    <div className="bg-[#fafbff] pb-16">
      <PageHero
        eyebrow="We're here to help"
        title="Contact Us"
        intro="Have a question about a product, a custom piece, or your order? We'd love to hear from you."
        crumbs={[{ label: "Support" }, { label: "Contact Us" }]}
      />
      <div className="container-page grid items-start gap-6 lg:grid-cols-[452px_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <span className="rounded bg-pink-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-pink-700 uppercase">
                Retail store
              </span>
              <span className="rounded-full bg-[#eaeefa] px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                Walk-ins welcome
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[#210023]">
              Dream Needles Studio
            </h2>
            {address && (
              <p className="mt-3 flex gap-2 text-sm text-gray-700">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{" "}
                {address}
              </p>
            )}
            <div className="relative mt-4 overflow-hidden rounded-xl">
              <Image
                src="/images/store/Store-front-view-dream-needles-alt.jpg"
                alt="Dream Needles store front"
                width={404}
                height={172}
                className="h-44 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-between bg-linear-to-t from-[#210023]/80 to-transparent p-4">
                <span className="font-semibold text-white">
                  Visit us in person
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#210023]"
                  >
                    Directions{" "}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {whatsapp && (
              <section className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#eaeefa]">
                  <MessageSquare className="size-4" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-gray-900">
                  WhatsApp
                </h2>
                <p className="text-sm text-gray-600">Text-only support line.</p>
                <p className="mt-2 flex-1 font-semibold text-gray-900">
                  +{whatsapp}
                </p>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1 rounded-full bg-[#210023] py-2 text-sm font-semibold text-white"
                >
                  Chat <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </section>
            )}
            {settings.contact_email && (
              <section
                className={`flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 ${whatsapp ? "" : "sm:col-span-2"}`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#eaeefa]">
                  <Mail className="size-4" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-gray-900">
                  Email
                </h2>
                <p className="text-sm text-gray-600">
                  Orders, custom pieces &amp; bulk enquiries.
                </p>
                <p className="mt-2 flex-1 font-semibold break-all text-gray-900">
                  {settings.contact_email}
                </p>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="mt-4 flex items-center justify-center rounded-full bg-[#e8dcea] py-2 text-sm font-semibold text-[#210023]"
                >
                  Compose Mail
                </a>
              </section>
            )}
          </div>

          <section className="flex gap-4 rounded-2xl bg-[#f0f3ff] p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8dcea]">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <div className="text-sm">
              <h2 className="font-semibold text-gray-900">Working hours</h2>
              <p className="text-gray-700">Mon – Sat: 10:00 AM – 7:00 PM IST</p>
              <p className="text-gray-500">
                Closed on Sundays &amp; national holidays
              </p>
            </div>
          </section>

          <section className="flex items-center gap-5 rounded-2xl bg-brand p-5 text-white">
            <Image
              src="/images/pages/faq-slow-craft.jpg"
              alt=""
              width={80}
              height={80}
              className="size-20 shrink-0 rounded-lg object-cover"
            />
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-purple-200 uppercase">
                Handmade quality
              </p>
              <p className="text-xl font-bold">
                Crafted with care, strand by strand.
              </p>
              <p className="text-sm text-purple-100">
                Every piece is checked by hand before it ships.
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
              Send us a message
            </p>
            <h2 className="mt-1 text-3xl font-bold text-[#210023] md:text-4xl">
              Send Us a Message
            </h2>
            <p className="mt-2 mb-8 text-gray-600">
              We read every message and reply personally.
            </p>
            <Suspense fallback={<ContactForm />}>
              <PrefilledForm />
            </Suspense>
          </section>
          <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-linear-to-r from-[#ece6f2] to-[#f0f3ff] p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-white">
              <CircleHelp className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Need instant answers?
              </h2>
              <p className="text-sm text-gray-600">
                Shipping times, returns, caring for crochet and more.
              </p>
            </div>
            <Link
              href="/faq"
              className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm"
            >
              Explore FAQs <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>

      <section className="mt-16 bg-[#f0f3ff] py-12">
        <ul className="container-page grid gap-8 md:grid-cols-3">
          {[
            {
              Icon: Truck,
              title: "Pan-India delivery",
              text: "Reliable tracked shipping to pincodes across India.",
            },
            {
              Icon: Wrench,
              title: "Maker support",
              text: "Help choosing hooks, needles and the right tools.",
            },
            {
              Icon: ShieldCheck,
              title: "Handmade assurance",
              text: "Every piece is made and checked by hand.",
            },
          ].map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-gray-900">
                  {title}
                </span>
                <span className="text-sm text-gray-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Pre-fills name and email for signed-in customers. */
async function PrefilledForm() {
  const profile = await getProfile();
  return (
    <ContactForm
      defaultName={profile?.full_name ?? ""}
      defaultEmail={profile?.email ?? ""}
    />
  );
}
