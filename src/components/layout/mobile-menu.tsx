"use client";

import {
  ArrowLeft,
  ChevronRight,
  HandHeart,
  MessageCircle,
  Shapes,
  Sparkles,
  Store,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import type { MenuNode } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Sparkles> = {
  "/collections/whats-new": Sparkles,
  "/collections/tools": Wrench,
  "/collections/handmade": HandHeart,
  "/retail-store": Store,
};

/**
 * Slide-in navigation for mobile and tablet (Figma 42:390). Collections with
 * children drill down one level at a time.
 */
export function MobileMenu({
  menu,
  whatsappUrl,
}: {
  menu: MenuNode[];
  whatsappUrl: string | null;
}) {
  const { panel, close } = useUI();
  const isOpen = panel === "menu";
  const [trail, setTrail] = useState<MenuNode[]>([]);
  // Start from the top level each time the menu opens.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTrail([]);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
    };
  }, [isOpen, close]);

  const current = trail.at(-1);
  const items = current ? current.children : menu;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 xl:hidden",
        !isOpen && "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        inert={!isOpen}
        className={cn(
          "absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white transition-[translate,visibility] duration-300",
          isOpen
            ? "visible translate-x-0 shadow-2xl"
            : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Image
            src="/images/brand/logo.svg"
            alt="Dream Needles"
            width={102}
            height={28}
            className="h-7 w-auto"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="flex size-11 items-center justify-center rounded-lg text-gray-600 hover:bg-brand-tint"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 bg-brand-light/40 p-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand text-xl font-semibold text-white shadow-sm">
            DN
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Dream Needles</p>
            <p className="text-[13px] text-gray-600">Handcrafted with care</p>
          </div>
        </div>

        <nav
          aria-label="Mobile"
          className="min-h-0 flex-1 overflow-y-auto p-4"
          // Any link inside closes the menu as it navigates.
          onClick={(e) => (e.target as HTMLElement).closest("a") && close()}
        >
          {current ? (
            <button
              type="button"
              onClick={() => setTrail(trail.slice(0, -1))}
              className="mb-1 flex items-center gap-2 px-3 py-2 text-[11px] font-bold tracking-[0.55px] text-gray-500 uppercase"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {trail.length > 1 ? trail.at(-2)?.label : "All categories"}
            </button>
          ) : (
            <p className="mb-1 px-3 text-[11px] leading-[14px] font-bold tracking-[0.55px] text-gray-500 uppercase">
              Categories
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {current && (
              <li>
                <Link
                  href={current.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand-tint"
                >
                  Shop all {current.label}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            )}
            {items.map((item) => {
              const Icon = ICONS[item.href] ?? Shapes;
              const content = (
                <>
                  <span className="flex items-center gap-4">
                    {!current && (
                      <Icon
                        className="size-[18px] text-[#2e0031]"
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </span>
                  <ChevronRight
                    className="size-4 text-gray-400"
                    aria-hidden="true"
                  />
                </>
              );
              const classes =
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-brand-tint hover:text-brand";
              return (
                <li key={item.href}>
                  {item.children.length ? (
                    <button
                      type="button"
                      className={classes}
                      onClick={() => setTrail([...trail, item])}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link href={item.href} className={classes}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {!current && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="px-3 text-[11px] leading-[14px] font-bold tracking-[0.55px] text-gray-500 uppercase">
                My account
              </p>
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-lg bg-brand-light text-sm font-semibold text-brand"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/20"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="bg-gray-50 p-4">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-gray-600"
            >
              <MessageCircle
                className="size-4 text-[#2e0031]"
                aria-hidden="true"
              />
              Need yarn guidance? Chat with us.
            </a>
          ) : (
            <Link
              href="/contact"
              className="flex items-center gap-2 text-[13px] text-gray-600"
            >
              <MessageCircle
                className="size-4 text-[#2e0031]"
                aria-hidden="true"
              />
              Need yarn guidance? Contact us.
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
