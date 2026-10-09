import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/collection-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { flattenCollections } from "@/lib/admin/collections-tree";

export const metadata = { title: "Collection" };

export default async function CollectionPage({
  params,
}: PageProps<"/admin/collections/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase.from("collections").select("*");
  const parents = flattenCollections(rows ?? []).filter((c) => !c.is_system);
  const collection = id === "new" ? undefined : rows?.find((r) => r.id === id);
  if (id !== "new" && !collection) notFound();
  return (
    <>
      <PageHeader
        title={collection ? collection.name : "Add collection"}
        back={{ href: "/admin/collections", label: "Collections" }}
      />
      <CollectionForm collection={collection} parents={parents} />
    </>
  );
}
