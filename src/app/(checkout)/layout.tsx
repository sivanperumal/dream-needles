import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "sonner";
import { ShopProvider } from "@/components/providers/shop-provider";
import { UIProvider } from "@/components/providers/ui-provider";

/** Distraction-free checkout (Figma 77:5928): logo, secure badge, policy links. */
export default function CheckoutLayout({ children }: LayoutProps<"/">) {
  return (
    <UIProvider>
      <ShopProvider>
        <header className="border-b border-gray-100 bg-white">
          <div className="container-page flex h-20 items-center justify-between">
            <Link href="/" aria-label="Dream Needles home">
              <Image
                src="/images/brand/logo.svg"
                alt="Dream Needles"
                width={145}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>
            <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 md:text-sm">
              <Lock className="size-3.5" aria-hidden="true" /> Secure checkout
            </span>
          </div>
        </header>
        <main id="main" className="flex-1 bg-[#fafbff]">
          {children}
        </main>
        <footer className="border-t border-gray-100 bg-white">
          <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-gray-500 md:flex-row">
            <p>© Dream Needles. Handcrafted with love.</p>
            <nav aria-label="Policies" className="flex flex-wrap gap-4">
              <Link
                href="/refund-policy"
                className="hover:text-brand hover:underline"
              >
                Refund Policy
              </Link>
              <Link
                href="/shipping-policy"
                className="hover:text-brand hover:underline"
              >
                Shipping Policy
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-brand hover:underline"
              >
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-brand hover:underline">
                Terms of Service
              </Link>
            </nav>
          </div>
        </footer>
        <Toaster position="top-center" richColors closeButton />
      </ShopProvider>
    </UIProvider>
  );
}
