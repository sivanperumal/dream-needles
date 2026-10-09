import {
  AnnouncementBar,
  PromoTicker,
} from "@/components/layout/announcement-bar";
import { FloatingActions } from "@/components/layout/floating-actions";
import {
  MobileBottomNav,
  MobileBottomNavWithPath,
} from "@/components/layout/mobile-bottom-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  SiteHeader,
  SiteHeaderWithPath,
} from "@/components/layout/site-header";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { QuickViewProvider } from "@/components/catalog/quick-view";
import { ShopProvider } from "@/components/providers/shop-provider";
import { UIProvider } from "@/components/providers/ui-provider";
import { SearchOverlay } from "@/components/search/search-overlay";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WishlistModal } from "@/components/wishlist/wishlist-modal";
import { getNavigation, getStoreSettings } from "@/lib/queries/catalog";

/** Storefront shell: top bar, sticky header, page, footer and overlays. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [navigation, settings] = await Promise.all([
    getNavigation(),
    getStoreSettings(),
  ]);
  const social = (settings.social_links ?? {}) as Record<string, string>;
  const whatsappUrl = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`
    : social.whatsapp || null;

  return (
    <UIProvider>
      <ShopProvider>
        <QuickViewProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Skip to content
          </a>
          <AnnouncementBar
            message={settings.promo_ticker[0] ?? "Free shipping across India"}
            social={social}
          />
          <Suspense
            fallback={<SiteHeader menu={navigation.header} pathname={null} />}
          >
            <SiteHeaderWithPath menu={navigation.header} />
          </Suspense>
          <PromoTicker messages={settings.promo_ticker} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter columns={navigation.footer} social={social} />
          <MobileMenu menu={navigation.header} whatsappUrl={whatsappUrl} />
          <Suspense fallback={<MobileBottomNav pathname="" />}>
            <MobileBottomNavWithPath />
          </Suspense>
          <FloatingActions whatsappUrl={whatsappUrl} />
          <SearchOverlay />
          <CartDrawer />
          <WishlistModal />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ className: "font-sans" }}
          />
        </QuickViewProvider>
      </ShopProvider>
    </UIProvider>
  );
}
