import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Store-wide settings. Changes apply to the storefront immediately."
      />
      {settings && <SettingsForm settings={settings} />}
    </>
  );
}
