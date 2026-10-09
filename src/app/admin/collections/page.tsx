import { ArrowDown, ArrowUp, EyeOff, Plus } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import {
  deleteCollection,
  moveCollection,
} from "@/lib/admin/actions/collections";
import { flattenCollections } from "@/lib/admin/collections-tree";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase
      .from("collections")
      .select(
        "id, parent_id, name, slug, menu_order, is_visible, show_in_menu, is_system",
      ),
    supabase.from("product_collections").select("collection_id"),
  ]);
  const counts = new Map<string, number>();
  for (const l of links ?? [])
    counts.set(l.collection_id, (counts.get(l.collection_id) ?? 0) + 1);
  const tree = flattenCollections(rows ?? []);

  return (
    <>
      <PageHeader
        title="Collections"
        description="Top-level collections appear in the header menu in this order. Use the arrows to reorder."
        actions={
          <ButtonLink href="/admin/collections/new">
            <Plus className="size-4" aria-hidden="true" /> Add collection
          </ButtonLink>
        }
      />
      <Card>
        <ul className="divide-y divide-gray-100">
          {tree.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
              style={{ paddingLeft: 16 + c.depth * 28 }}
            >
              <div className="flex gap-1">
                <form
                  action={async () => {
                    "use server";
                    await moveCollection(c.id, "up");
                  }}
                >
                  <button
                    type="submit"
                    aria-label={`Move ${c.name} up`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await moveCollection(c.id, "down");
                  }}
                >
                  <button
                    type="submit"
                    aria-label={`Move ${c.name} down`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </form>
              </div>
              <Link
                href={`/admin/collections/${c.id}`}
                className="font-medium text-gray-900 hover:text-brand"
              >
                {c.name}
              </Link>
              <span className="font-mono text-xs text-gray-400">/{c.slug}</span>
              <span className="flex flex-wrap gap-1.5">
                {c.is_system && <Pill tone="purple">Automatic</Pill>}
                {!c.is_visible && (
                  <Pill tone="red">
                    <EyeOff className="mr-1 size-3" aria-hidden="true" /> Hidden
                  </Pill>
                )}
                {c.is_visible && !c.show_in_menu && <Pill>Not in menu</Pill>}
              </span>
              <span className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                {!c.is_system && `${counts.get(c.id) ?? 0} products`}
                {!c.is_system && (
                  <ConfirmButton
                    variant="ghost"
                    danger
                    title={`Delete "${c.name}"?`}
                    message="Products stay in the store and in their other collections. Sub-collections must be moved or deleted first."
                    confirmLabel="Delete"
                    action={deleteCollection.bind(null, c.id)}
                    className="text-rose-600"
                  >
                    Delete
                  </ConfirmButton>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
