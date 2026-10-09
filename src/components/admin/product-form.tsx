"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/admin/ui";
import {
  CheckboxField,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/auth";
import { saveProduct } from "@/lib/admin/actions/products";
import type { FlatCollection } from "@/lib/admin/collections-tree";
import { slugify } from "@/lib/slug";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: string;
  whats_new_mode: string;
  tags: string[];
  badges: string[];
  seo_title: string | null;
  seo_description: string | null;
  collection_ids: string[];
};

export function ProductForm({
  product,
  collections,
}: {
  product?: ProductFormValues;
  collections: FlatCollection[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(product?.collection_ids ?? []),
  );
  const [state, action, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await saveProduct(prev, formData);
      if (result.ok) {
        toast.success(result.message);
        if (!product && result.id) router.push(`/admin/products/${result.id}`);
        else router.refresh();
      } else if (result.message) toast.error(result.message);
      return result;
    },
    null,
  );
  const e = state?.errors ?? {};

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form
      action={action}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      noValidate
    >
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="collection_ids" value={id} />
      ))}

      <div className="flex flex-col gap-6">
        <Card title="Basics">
          <div className="grid gap-4 p-5">
            <TextField
              label="Name"
              name="name"
              value={name}
              onChange={(ev) => {
                setName(ev.target.value);
                if (!slugTouched) setSlug(slugify(ev.target.value));
              }}
              error={e.name}
              required
            />
            <TextField
              label="URL slug"
              name="slug"
              value={slug}
              onChange={(ev) => {
                setSlugTouched(true);
                setSlug(ev.target.value);
              }}
              error={e.slug}
              hint={`dreamneedles…/products/${slug || "your-product"}`}
            />
            <TextArea
              label="Description"
              name="description"
              defaultValue={product?.description}
              rows={6}
              error={e.description}
            />
          </div>
        </Card>

        <Card title="Pricing & stock">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <TextField
              label="Price (₹, incl. GST)"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price ?? ""}
              error={e.price}
              required
            />
            <TextField
              label="Compare-at price (₹)"
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compare_at_price ?? ""}
              error={e.compare_at_price}
              hint="Shown crossed out. Leave empty for no sale."
            />
            <TextField
              label="Stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stock ?? 0}
              error={e.stock}
              hint="Ignored when the product has options (each option has its own stock)."
            />
            <TextField
              label="SKU"
              name="sku"
              defaultValue={product?.sku ?? ""}
              error={e.sku}
              hint="e.g. DN-KC-012"
            />
          </div>
        </Card>

        <Card title="Search & SEO">
          <div className="grid gap-4 p-5">
            <TextField
              label="Tags"
              name="tags"
              defaultValue={product?.tags.join(", ")}
              hint="Comma separated. Used by the search box, e.g. keychain, amigurumi, gift."
            />
            <TextField
              label="SEO title"
              name="seo_title"
              defaultValue={product?.seo_title ?? ""}
              hint="Optional. Defaults to the product name."
            />
            <TextArea
              label="SEO description"
              name="seo_description"
              rows={2}
              defaultValue={product?.seo_description ?? ""}
              hint="Optional. Shown in Google results."
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Publish">
          <div className="grid gap-4 p-5">
            <SelectField
              label="Status"
              name="status"
              defaultValue={product?.status ?? "draft"}
              options={[
                { value: "active", label: "Active (visible in the store)" },
                { value: "draft", label: "Draft (hidden)" },
              ]}
            />
            <SelectField
              label="What's New"
              name="whats_new_mode"
              defaultValue={product?.whats_new_mode ?? "auto"}
              options={[
                {
                  value: "auto",
                  label: "Automatic (new for the first few weeks)",
                },
                { value: "pinned", label: "Always show in What's New" },
                { value: "excluded", label: "Never show in What's New" },
              ]}
            />
            <TextField
              label="Badges"
              name="badges"
              defaultValue={product?.badges.join(", ")}
              hint="Comma separated, e.g. Bestseller, Limited Edition."
            />
            <Button type="submit" loading={pending} fullWidth>
              {product ? "Save product" : "Create product"}
            </Button>
          </div>
        </Card>

        <Card title={`Collections (${selected.size})`}>
          <fieldset className="max-h-96 overflow-y-auto p-3">
            <legend className="sr-only">
              Collections this product appears in
            </legend>
            {collections.map((c) => (
              <div key={c.id} style={{ paddingLeft: c.depth * 16 }}>
                <CheckboxField
                  label={c.name}
                  name={`collection-${c.id}`}
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  hint={!c.is_visible ? "Hidden collection" : undefined}
                />
              </div>
            ))}
          </fieldset>
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
            A product shows on each ticked collection, and in &ldquo;View
            all&rdquo; of their parents.
          </p>
        </Card>
      </div>
    </form>
  );
}
