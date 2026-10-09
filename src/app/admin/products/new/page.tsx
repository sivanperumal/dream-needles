import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { flattenCollections } from "@/lib/admin/collections-tree";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("collections")
    .select(
      "id, parent_id, name, slug, menu_order, is_visible, show_in_menu, is_system",
    );
  return (
    <>
      <PageHeader
        title="Add product"
        description="Save the product first, then add images and options."
        back={{ href: "/admin/products", label: "Products" }}
      />
      <ProductForm
        collections={flattenCollections(data ?? []).filter((c) => !c.is_system)}
      />
    </>
  );
}
