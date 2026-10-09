"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  CheckboxField,
  SelectField,
  TextField,
} from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteMenuItem, saveMenuItem } from "@/lib/admin/actions/content";
import type { FlatCollection } from "@/lib/admin/collections-tree";

export type MenuRow = {
  id: string;
  menu: "header" | "footer";
  parent_id: string | null;
  label: string;
  collection_id: string | null;
  url: string | null;
  is_link: boolean;
  sort_order: number;
};

type Draft = Partial<MenuRow> & Pick<MenuRow, "menu" | "parent_id">;

/** Footer columns + links, and extra header links (Retail Store). */
export function MenuEditor({
  items,
  collections,
}: {
  items: MenuRow[];
  collections: FlatCollection[];
}) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const columns = items
    .filter((i) => i.menu === "footer" && !i.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const headerLinks = items
    .filter((i) => i.menu === "header" && !i.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const name = (i: MenuRow) =>
    i.collection_id
      ? (collections.find((c) => c.id === i.collection_id)?.path ??
        "Collection")
      : (i.url ?? "Heading only");

  return (
    <>
      <Card
        title="Footer columns"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setEditing({
                menu: "footer",
                parent_id: null,
                is_link: false,
                sort_order: columns.length,
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" /> Add column
          </Button>
        }
      >
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((col) => {
            const links = items
              .filter((i) => i.parent_id === col.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div
                key={col.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <ul className="border-b border-gray-100 pb-1">
                  <Row item={col} target={name(col)} onEdit={setEditing} />
                </ul>
                <ul className="divide-y divide-gray-50 pl-3">
                  {links.map((l) => (
                    <Row
                      key={l.id}
                      item={l}
                      target={name(l)}
                      onEdit={setEditing}
                    />
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      menu: "footer",
                      parent_id: col.id,
                      is_link: true,
                      sort_order: links.length,
                    })
                  }
                  className="mt-2 text-sm font-medium text-brand"
                >
                  + Add link
                </button>
              </div>
            );
          })}
        </div>
      </Card>
      <Card
        title="Extra header links"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setEditing({
                menu: "header",
                parent_id: null,
                is_link: true,
                sort_order: 100 + headerLinks.length,
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" /> Add link
          </Button>
        }
      >
        <p className="px-5 pt-3 text-xs text-gray-500">
          Collections appear in the header automatically (Collections → “Show in
          the header menu”). Add other links here, e.g. Retail Store.
        </p>
        <ul className="divide-y divide-gray-100 px-5 pb-3">
          {headerLinks.map((l) => (
            <Row key={l.id} item={l} target={name(l)} onEdit={setEditing} />
          ))}
        </ul>
      </Card>
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit link" : "Add link"}
      >
        {editing && (
          <MenuItemForm
            item={editing}
            collections={collections}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
    </>
  );
}

function Row({
  item,
  target,
  onEdit,
}: {
  item: MenuRow;
  target: string;
  onEdit: (item: MenuRow) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <span>
        <span className="font-medium text-gray-900">{item.label}</span>
        <span className="ml-2 text-xs text-gray-500">{target}</span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Edit ${item.label}`}
          onClick={() => onEdit(item)}
          className="text-brand"
        >
          <Pencil className="size-4" />
        </button>
        <ConfirmButton
          variant="ghost"
          danger
          title={`Delete "${item.label}"?`}
          message={
            item.parent_id
              ? "The link is removed from the footer."
              : "The whole column and its links are removed."
          }
          confirmLabel="Delete"
          action={deleteMenuItem.bind(null, item.id)}
        >
          <Trash2 className="size-4 text-rose-600" aria-label="Delete" />
        </ConfirmButton>
      </span>
    </li>
  );
}

function MenuItemForm({
  item,
  collections,
  onDone,
}: {
  item: Draft;
  collections: FlatCollection[];
  onDone: () => void;
}) {
  const [state, action, pending] = useAdminForm(saveMenuItem, onDone);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4 p-5" noValidate>
      {item.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="menu" value={item.menu} />
      <input type="hidden" name="parent_id" value={item.parent_id ?? ""} />
      <TextField
        label="Label"
        name="label"
        defaultValue={item.label}
        error={e.label}
        required
      />
      <SelectField
        label="Links to a collection"
        name="collection_id"
        defaultValue={item.collection_id ?? ""}
        options={[
          { value: "", label: "— None —" },
          ...collections.map((c) => ({ value: c.id, label: c.path })),
        ]}
      />
      <TextField
        label="…or a page link"
        name="url"
        defaultValue={item.url ?? ""}
        error={e.url}
        hint="e.g. /faq or /retail-store. Ignored when a collection is chosen."
      />
      <CheckboxField
        label="Clickable"
        name="is_link"
        defaultChecked={item.is_link ?? true}
        hint="Untick for a plain column heading (like “Tools”)."
      />
      <TextField
        label="Position"
        name="sort_order"
        type="number"
        min="0"
        defaultValue={item.sort_order ?? 0}
        hint="Lower shows first."
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
