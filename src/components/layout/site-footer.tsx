import { cacheLife } from "next/cache";
import Link from "next/link";
import type { FooterColumn } from "@/lib/navigation";
import { SocialLinks } from "./social-links";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const PAYMENT_METHODS = ["VISA", "Mastercard", "RuPay", "UPI", "GPay"];

/** Site footer (Figma 45:1565) with the six columns from the spec. */
export async function SiteFooter({
  columns,
  social,
}: {
  columns: FooterColumn[];
  social: Record<string, string>;
}) {
  return (
    <footer className="border-t border-purple-200/60 bg-brand-light pt-12 pb-24 md:pt-16 md:pb-12">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-purple-200/70 pb-12 md:grid-cols-3 xl:grid-cols-6 xl:gap-8">
          {columns.map((column) => (
            <div key={column.label} className="flex flex-col gap-4">
              <h2 className="text-sm font-bold tracking-[-0.35px] text-brand">
                {column.href ? (
                  <Link href={column.href} className="hover:underline">
                    {column.label}
                  </Link>
                ) : (
                  column.label
                )}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1.5 text-xs text-gray-700 transition-colors hover:text-brand"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full border border-purple-400 transition-colors group-hover:bg-purple-400"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-5 pt-8 md:flex-row md:justify-between">
          <SocialLinks
            links={social}
            className="gap-2"
            itemClassName="size-8 rounded-full bg-brand text-white"
            iconClassName="size-3.5"
          />
          <p className="text-center text-xs text-gray-600">
            © {await currentYear()} Dream Needles. All rights reserved.
          </p>
          <ul
            className="flex flex-wrap justify-center gap-1.5"
            aria-label="Accepted payment methods"
          >
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded border border-purple-200 bg-white px-2 py-1 text-[10px] leading-4 font-bold text-gray-700"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
