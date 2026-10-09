"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckboxField,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { saveCollection } from "@/lib/admin/actions/collections";
import type { FlatCollection } from "@/lib/admin/collections-tree";
import { slugify } from "@/lib/slug";

export type CollectionValues = {
  id?: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  menu_badge: string | null;
  is_visible: boolean;
  show_in_menu: boolean;
  show_view_all: boolean;
  seo_title: string | null;
  seo_description: string | null;
  is_system?: boolean;
};

export function CollectionForm({
  collection,
  parents,
}: {
  collection?: CollectionValues;
  parents: FlatCollection[];
}) {
  const router = useRouter();
  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [touched, setTouched] = useState(Boolean(collection));
  const [state, action, pending] = useAdminForm(saveCollection, (r) => {
    if (!collection && r.id) router.push(`/admin/collections/${r.id}`);
  });
  const e = state?.errors ?? {};
  // Can't nest a collection under itself or its own children.
  const own = collection?.id
    ? parents.find((p) => p.id === collection.id)
    : undefined;
  const options = parents.filter(
    (p) => !own || !(p.id === own.id || p.path.startsWith(`${own.path} ›`)),
  );

  return (
    <form
      action={action}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      noValidate
    >
      {collection?.id && (
        <input type="hidden" name="id" value={collection.id} />
      )}
      <Card title="Details">
        <div className="grid gap-4 p-5">
          <TextField
            label="Name"
            name="name"
            value={name}
            onChange={(ev) => {
              setName(ev.target.value);
              if (!touched) setSlug(slugify(ev.target.value));
            }}
            error={e.name}
            required
          />
          <TextField
            label="URL slug"
            name="slug"
            value={slug}
            onChange={(ev) => {
              setTouched(true);
              setSlug(ev.target.value);
            }}
            error={e.slug}
            hint={`/collections/${slug || "your-collection"}`}
            readOnly={collection?.is_system}
          />
          <SelectField
            label="Parent collection"
            name="parent_id"
            defaultValue={collection?.parent_id ?? ""}
            error={e.parent_id}
            options={[
              { value: "", label: "None (top level, shows in the main menu)" },
              ...options.map((p) => ({
                value: p.id,
                label: p.path,
              })),
            ]}
          />
          <TextArea
            label="Description"
            name="description"
            rows={3}
            defaultValue={collection?.description}
            hint="Shown at the top of the collection page."
          />
          <TextField
            label="SEO title"
            name="seo_title"
            defaultValue={collection?.seo_title ?? ""}
          />
          <TextArea
            label="SEO description"
            name="seo_description"
            rows={2}
            defaultValue={collection?.seo_description ?? ""}
          />
        </div>
      </Card>
      <Card title="Visibility & menu">
        <div className="grid gap-4 p-5">
          <CheckboxField
            label="Visible in the store"
            name="is_visible"
            defaultChecked={collection?.is_visible ?? true}
            hint="Hidden collections disappear from menus, pages and search."
          />
          <CheckboxField
            label="Show in the header menu"
            name="show_in_menu"
            defaultChecked={collection?.show_in_menu ?? true}
          />
          <CheckboxField
            label='Show "View all" under its sub-collections'
            name="show_view_all"
            defaultChecked={collection?.show_view_all ?? false}
          />
          <TextField
            label="Menu badge"
            name="menu_badge"
            defaultValue={collection?.menu_badge ?? ""}
            hint='Optional label in the menu, e.g. "Popular".'
          />
          <Button type="submit" loading={pending} fullWidth>
            {collection ? "Save collection" : "Create collection"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
