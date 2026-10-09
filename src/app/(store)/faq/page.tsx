import { ArrowRight, Clock, Mail, MessageCircle, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/content/faq-list";
import { PageHero } from "@/components/content/page-hero";
import { parseFaq } from "@/components/content/prose";
import { getPage, getStoreSettings } from "@/lib/queries/catalog";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about orders, shipping, returns and our handmade products.",
};

export default async function FaqPage() {
  const [page, settings] = await Promise.all([
    getPage("faq"),
    getStoreSettings(),
  ]);
  const items = parseFaq(page?.body_markdown ?? "");
  const address = settings.store_address?.replace(/^\[to confirm\]\s*/, "");

  return (
    <div className="bg-[#fafbff] pb-20">
      <PageHero
        eyebrow="Knowledge base"
        title={page?.title ?? "Frequently Asked Questions"}
        intro="Everything you need to know about orders, shipping, and caring for your handmade pieces."
        crumbs={[{ label: "Support" }, { label: "FAQ" }]}
      />
      <div className="container-page">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-brand-light to-white p-5 ring-1 ring-purple-100">
          <div className="flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand text-white">
              <Truck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-wide text-gray-900 uppercase">
                Domestic dispatch assurance
              </p>
              <p className="text-sm text-gray-700">
                Free shipping across India on orders above{" "}
                {formatINR(settings.free_shipping_threshold)}.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
            <Clock className="size-3.5" aria-hidden="true" /> Dispatched within
            24–48 hrs
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <FaqList items={items} />
          <aside className="flex flex-col gap-5">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <Image
                src="/images/pages/faq-slow-craft.jpg"
                alt="Hands knitting with wooden needles"
                width={363}
                height={208}
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <h2 className="text-lg font-bold text-[#210023]">
                  The Slow Craft Promise
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Every piece is made slowly and with care. We honor the quiet
                  rhythm of purposeful creation.
                </p>
                <Link
                  href="/our-story"
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#210023] hover:underline"
                >
                  Read our story{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-[#ece6f2] p-5">
              <p className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white">
                  <MessageCircle className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold tracking-wide text-gray-900 uppercase">
                    Need personal assistance?
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    We&apos;re here to help
                  </span>
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Questions about an order, a product or a custom piece? Write to
                us.
              </p>
              {settings.contact_email && (
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-800">
                  <Mail className="size-4" aria-hidden="true" />
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="hover:underline"
                  >
                    {settings.contact_email}
                  </a>
                </p>
              )}
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                <Clock className="size-4" aria-hidden="true" /> Mon – Sat: 10:00
                AM – 6:00 PM IST
              </p>
              <Link
                href="/contact"
                className="mt-4 flex items-center justify-center gap-1 rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Contact Us <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {address && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="text-[11px] font-bold tracking-wide text-gray-900 uppercase">
                  Store &amp; workshop lounge
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Visit our retail store
                </p>
                <p className="mt-1 text-sm text-gray-600">{address}</p>
                <Link
                  href="/retail-store"
                  className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
                >
                  Store details →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
