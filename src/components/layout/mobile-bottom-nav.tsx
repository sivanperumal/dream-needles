"use client";

import { Heart, Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/components/providers/ui-provider";
import { cn } from "@/lib/utils";

/** Fixed bottom tab bar on phones (Figma 42:367). */
export function MobileBottomNavWithPath() {
  return <MobileBottomNav pathname={usePathname()} />;
}

/** Render MobileBottomNavWithPath inside <Suspense> with this (pathname "") as the fallback. */
export function MobileBottomNav({ pathname }: { pathname: string }) {
  const { open, panel } = useUI();
  const item =
    "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-[14px] font-bold";
  const color = (active: boolean) => (active ? "text-brand" : "text-gray-600");

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
    >
      <div className="flex h-16 px-5">
        <Link
          href="/"
          className={cn(item, color(pathname === "/"))}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home className="size-[18px]" aria-hidden="true" />
          Home
        </Link>
        <button
          type="button"
          onClick={() => open("wishlist")}
          className={cn(item, color(panel === "wishlist"))}
        >
          <Heart className="size-[18px]" aria-hidden="true" />
          Wishlist
        </button>
        <button
          type="button"
          onClick={() => open("search")}
          className={cn(item, color(panel === "search"))}
        >
          <Search className="size-4" aria-hidden="true" />
          Search
        </button>
        <Link
          href="/account"
          className={cn(item, color(pathname.startsWith("/account")))}
          aria-current={pathname.startsWith("/account") ? "page" : undefined}
        >
          <User className="size-[18px]" aria-hidden="true" />
          Account
        </Link>
      </div>
    </nav>
  );
}
