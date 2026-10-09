import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { Prose } from "@/components/content/prose";
import { POLICY_PAGES, type PolicySlug } from "@/lib/policy-pages";
import { getPage } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

const updated = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function policyMetadata(slug: PolicySlug): Promise<Metadata> {
  const page = await getPage(slug);
  return {
    title: page?.title ?? POLICY_PAGES[slug],
    description: page?.seo_description ?? undefined,
  };
}

/** Shared layout for Privacy, Shipping, Refund and Terms (Figma 93:4739). */
export async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="bg-[#fafbff] pb-20">
      <PageHero
        eyebrow="Support & policies"
        title={page.title}
        crumbs={[{ label: "Policies" }, { label: page.title }]}
      >
        <p className="mt-3 text-sm text-gray-500">
          Last updated {updated.format(new Date(page.updated_at))}
        </p>
      </PageHero>
      <div className="container-page grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10">
          <Prose markdown={page.body_markdown} />
        </article>
        <aside>
          <nav
            aria-label="Policies"
            className="sticky top-28 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <p className="text-[11px] font-bold tracking-wide text-gray-500 uppercase">
              Other policies
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {(Object.keys(POLICY_PAGES) as PolicySlug[]).map((s) => (
                <li key={s}>
                  <Link
                    href={`/${s}`}
                    aria-current={s === slug ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm",
                      s === slug
                        ? "bg-brand-light font-semibold text-brand"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {POLICY_PAGES[s]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/faq"
                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
