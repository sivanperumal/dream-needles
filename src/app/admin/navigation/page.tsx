import { MenuEditor, type MenuRow } from "@/components/admin/menu-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { flattenCollections } from "@/lib/admin/collections-tree";

export const metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const { supabase } = await requireAdmin();
  const [{ data: items }, { data: collections }] = await Promise.all([
    supabase
      .from("menu_items")
      .select(
        "id, menu, parent_id, label, collection_id, url, is_link, sort_order",
      ),
    supabase
      .from("collections")
      .select(
        "id, parent_id, name, slug, menu_order, is_visible, show_in_menu, is_system",
      ),
  ]);
  return (
    <>
      <PageHeader
        title="Navigation"
        description="Edit the footer columns and extra header links."
      />
      <div className="flex flex-col gap-6">
        <MenuEditor
          items={(items ?? []) as MenuRow[]}
          collections={flattenCollections(collections ?? [])}
        />
      </div>
    </>
  );
}
