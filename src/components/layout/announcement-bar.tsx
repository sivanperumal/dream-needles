import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SocialLinks } from "./social-links";

/** Desktop/tablet top bar (Figma 45:1272): socials left, shipping + store link right. */
export function AnnouncementBar({
  message,
  social,
}: {
  message: string;
  social: Record<string, string>;
}) {
  return (
    <div className="hidden border-b border-purple-100 bg-brand-light md:block">
      <div className="container-page flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Follow us</span>
          <SocialLinks
            links={social}
            className="gap-2.5"
            iconClassName="size-3.5 text-brand"
          />
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium tracking-[0.3px] text-brand">
            {message}
          </span>
          <span className="font-medium text-purple-300" aria-hidden="true">
            |
          </span>
          <Link
            href="/retail-store"
            className="flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            Visit our retail store
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Mobile promo strip under the header (Figma 42:6): scrolling messages. */
export function PromoTicker({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  const text = messages.join("  •  ");
  return (
    <div
      className="overflow-hidden bg-brand py-2.5 text-white shadow-sm md:hidden"
      aria-label="Store announcements"
    >
      <p className="sr-only">{text}</p>
      <div className="flex w-max animate-ticker" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span
            key={copy}
            className="flex items-center gap-2 px-4 text-[11px] leading-[14px] font-bold tracking-[0.28px] whitespace-nowrap"
          >
            {messages.map((m) => (
              <span key={m} className="flex items-center gap-2">
                <span className="text-[#ffd6a5]">✦</span>
                {m}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
