import { HeroSlider } from "@/components/home/hero-slider";
import {
  AboutStory,
  HeroTiles,
  Marketplaces,
  ShopByCategory,
  StatsRow,
  TrustBadges,
} from "@/components/home/home-sections";
import { getBanners, getStoreSettings } from "@/lib/queries/catalog";

export default async function HomePage() {
  const [banners, settings] = await Promise.all([
    getBanners(),
    getStoreSettings(),
  ]);
  const stats = (settings.home_stats ?? []) as {
    value: string;
    label: string;
  }[];
  const marketplaces = (settings.marketplaces ?? []) as {
    name: string;
    url: string;
    logo_path: string | null;
  }[];

  return (
    <>
      <h1 className="sr-only">
        Dream Needles: crochet tools and handmade crochet products
      </h1>
      <section className="container-page grid gap-4 pt-6 pb-10 md:gap-6 md:pb-16 xl:grid-cols-2">
        <HeroSlider slides={banners.hero} />
        <HeroTiles tiles={banners.tiles} />
      </section>
      <TrustBadges />
      <ShopByCategory categories={banners.categories} />
      <Marketplaces items={marketplaces} />
      <StatsRow stats={stats} />
      <AboutStory markdown={settings.home_intro} />
    </>
  );
}
