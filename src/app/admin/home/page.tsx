import { BannerManager, HomeContentForm } from "@/components/admin/home-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Home page" };

export default async function HomeAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: banners }, { data: settings }] = await Promise.all([
    supabase.from("banners").select("*").order("placement").order("sort_order"),
    supabase
      .from("store_settings")
      .select("promo_ticker, home_intro, home_stats, marketplaces")
      .eq("id", 1)
      .single(),
  ]);
  return (
    <>
      <PageHeader
        title="Home page"
        description="Banners, announcement messages and the text on the home page."
      />
      <div className="flex flex-col gap-6">
        <HomeContentForm
          ticker={settings?.promo_ticker ?? []}
          intro={settings?.home_intro ?? ""}
          stats={
            (settings?.home_stats ?? []) as { value: string; label: string }[]
          }
          marketplaces={
            (settings?.marketplaces ?? []) as {
              name: string;
              url: string;
              logo_path: string | null;
            }[]
          }
        />
        <BannerManager banners={banners ?? []} />
      </div>
    </>
  );
}
