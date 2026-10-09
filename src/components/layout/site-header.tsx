"use client";

import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CountBubble } from "@/components/ui/badge";
import { useUI } from "@/components/providers/ui-provider";
import type { MenuNode } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Sticky main header (Figma 45:1303 desktop, 43:782 tablet, 42:347 mobile).
 * Menus come from the database, so new collections appear without code changes.
 */
export function SiteHeader({
  menu,
  pathname,
}: {
  menu: MenuNode[];
  pathname: string | null;
}) {
  const { open, cartCount, wishlistCount } = useUI();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mega-menu on navigation…
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpenIndex(null);
  }
  // …and on Escape or a click outside the header.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setOpenIndex(null);
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenIndex(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [openIndex]);

  const hoverOpen = (index: number) => {
    clearTimeout(closeTimer.current);
    setOpenIndex(index);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 150);
  };

  const active = openIndex !== null ? menu[openIndex] : null;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur md:shadow-none"
      onMouseLeave={hoverClose}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        {/* Left: menu button (mobile/tablet) + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => open("menu")}
            className="-ml-2 flex size-11 items-center justify-center rounded-lg text-[#2e0031] hover:bg-brand-tint xl:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/" aria-label="Dream Needles home" className="shrink-0">
            <Image
              src="/images/brand/logo.svg"
              alt="Dream Needles"
              width={174}
              height={48}
              priority
              className="h-8 w-auto xl:h-12"
            />
          </Link>
        </div>

        {/* Center: primary navigation */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center xl:gap-2">
            {menu.map((item, index) => {
              const hasPanel = item.children.length > 0;
              const isOpen = openIndex === index;
              const isCurrent = pathname === item.href;
              const base =
                "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors xl:px-4 xl:py-2";
              const state =
                isOpen || isCurrent
                  ? "border-purple-200/60 bg-brand-tint font-semibold text-brand"
                  : "border-transparent text-gray-700 hover:text-brand";
              return (
                <li
                  key={item.href}
                  onMouseEnter={() =>
                    hasPanel && window.innerWidth >= 1280
                      ? hoverOpen(index)
                      : hoverClose()
                  }
                >
                  {/* Below xl the tablet design uses plain links; the drawer holds sub-menus. */}
                  <Link
                    href={item.href}
                    className={cn(base, state, hasPanel && "xl:hidden")}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                  {hasPanel && (
                    <button
                      type="button"
                      className={cn(base, state, "hidden xl:flex")}
                      aria-expanded={isOpen}
                      aria-controls="mega-menu"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          isOpen && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: search, wishlist, cart, account */}
        <div className="flex items-center gap-1 xl:gap-2">
          <HeaderIcon
            label="Search"
            onClick={() => open("search")}
            className="hidden md:flex"
          >
            <Search className="size-5" />
          </HeaderIcon>
          <HeaderIcon
            label={`Wishlist, ${wishlistCount} items`}
            onClick={() => open("wishlist")}
            className="hidden md:flex"
          >
            <Heart className="size-5" />
            <CountBubble count={wishlistCount} />
          </HeaderIcon>
          <HeaderIcon
            label={`Cart, ${cartCount} items`}
            onClick={() => open("cart")}
          >
            <ShoppingBag className="size-5 text-brand md:text-current" />
            <CountBubble count={cartCount} />
          </HeaderIcon>
          <Link
            href="/account"
            aria-label="My account"
            className="ml-1 flex size-8 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            <User className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Mega-menu (Figma 45:1342) */}
      {active && active.children.length > 0 && (
        <div
          id="mega-menu"
          className="absolute inset-x-0 top-full hidden border-t border-purple-100 bg-white shadow-xl xl:block"
          onMouseEnter={() => clearTimeout(closeTimer.current)}
        >
          <MegaMenuPanel item={active} />
        </div>
      )}
    </header>
  );
}

/** Reads the URL for active-link styling; render inside <Suspense> (fallback: SiteHeader with pathname null). */
export function SiteHeaderWithPath({ menu }: { menu: MenuNode[] }) {
  return <SiteHeader menu={menu} pathname={usePathname()} />;
}

function HeaderIcon({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-brand-tint hover:text-brand md:size-8 xl:size-9",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MegaMenuPanel({ item }: { item: MenuNode }) {
  return (
    <div className="container-page grid grid-cols-4 gap-8 pt-7 pb-7">
      {item.children.slice(0, 3).map((group) => (
        <div key={group.href} className="flex flex-col gap-3">
          <Link
            href={group.href}
            className="flex items-center gap-2 border-b border-purple-100 pb-1.5 text-xs font-bold tracking-[0.6px] text-brand uppercase hover:opacity-80"
          >
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
            {group.label}
          </Link>
          <ul className="flex flex-col gap-2">
            {group.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className="flex items-center justify-between gap-2 text-sm text-gray-600 transition-colors hover:text-brand"
                >
                  {child.label}
                  {child.badge && (
                    <span className="rounded bg-brand-tint px-1.5 py-0.5 text-[10px] leading-4 font-medium text-brand">
                      {child.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {group.children.length === 0 && (
              <li>
                <Link
                  href={group.href}
                  className="text-sm text-gray-600 hover:text-brand"
                >
                  Shop {group.label}
                </Link>
              </li>
            )}
            {group.viewAllHref && (
              <li>
                <Link
                  href={group.viewAllHref}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                >
                  View all
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </li>
            )}
          </ul>
        </div>
      ))}

      {/* Featured card (Figma 45:1406), always in the last column */}
      <div className="col-start-4 flex flex-col justify-between rounded-2xl border border-purple-200/70 bg-linear-[141deg] from-brand-light to-[#fae6fb] p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <span className="w-fit rounded-full border border-purple-200 bg-white px-2.5 py-1 text-[10px] leading-[15px] font-bold tracking-[0.5px] text-brand uppercase">
            Explore {item.label}
          </span>
          <p className="pt-px text-sm leading-[19.25px] font-bold text-gray-900">
            {item.label} at Dream Needles
          </p>
          <p className="text-xs leading-[19.5px] text-gray-600">
            {item.description}
          </p>
        </div>
        <Link
          href={item.href}
          className="mt-4 flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
        >
          Explore {item.label} Catalog →
        </Link>
      </div>
    </div>
  );
}
