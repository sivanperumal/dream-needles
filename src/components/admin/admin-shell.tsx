"use client";

import {
  FileText,
  FolderTree,
  Home,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareQuote,
  Navigation,
  Package,
  Settings,
  ShoppingCart,
  Store,
  TicketPercent,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/collections", label: "Collections", Icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", Icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", Icon: MessageSquareQuote },
  { href: "/admin/contact", label: "Contact messages", Icon: Mail },
  { href: "/admin/home", label: "Home page", Icon: Home },
  { href: "/admin/navigation", label: "Navigation", Icon: Navigation },
  { href: "/admin/pages", label: "Pages", Icon: FileText },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {ADMIN_NAV.map(({ href, label, Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-purple-100/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-5"
        onClick={onNavigate}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-white">
          <Image
            src="/images/brand/favicon-32.png"
            alt=""
            width={24}
            height={24}
          />
        </span>
        <span>
          <span className="block text-sm font-bold text-white">
            Dream Needles
          </span>
          <span className="text-xs text-purple-200">Admin</span>
        </span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <NavLinks onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-purple-100/80 hover:bg-white/10 hover:text-white"
        >
          <Store className="size-4" aria-hidden="true" /> View store
        </Link>
      </div>
    </div>
  );
}

/** Admin layout: brand sidebar (drawer below lg), top bar, content. */
export function AdminShell({
  children,
  topbar,
}: {
  children: ReactNode;
  topbar: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-1 bg-gray-50">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 bg-brand lg:block">
        <SidebarContent />
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
        >
          <div
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-3 text-white"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            {topbar}
          </div>
        </header>
        <main id="main" className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
