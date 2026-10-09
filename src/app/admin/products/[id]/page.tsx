import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader, Pill } from "@/components/admin/ui";
import { VariantEditor } from "@/components/admin/variant-editor";
import { requireAdmin } from "@/lib/admin/auth";
import { setProductDeleted } from "@/lib/admin/actions/products";
import { flattenCollections } from "@/lib/admin/collections-tree";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: product }, { data: collections }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, product_images (id, storage_path, alt, sort_order), product_variants (*), product_collections (collection_id)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("collections")
      .select(
        "id, parent_id, name, slug, menu_order, is_visible, show_in_menu, is_system",
      ),
  ]);
  if (!product) notFound();
  const images = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const deleteAction = setProductDeleted.bind(
    null,
    product.id,
    !product.deleted_at,
  );

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            {product.deleted_at ? (
              <Pill tone="red">Hidden</Pill>
            ) : product.status === "active" ? (
              <Pill tone="green">Active</Pill>
            ) : (
              <Pill>Draft</Pill>
            )}
            {product.status === "active" && !product.deleted_at && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                View in store{" "}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            )}
            <ConfirmButton
              danger={!product.deleted_at}
              variant={product.deleted_at ? "outline" : "danger"}
              title={
                product.deleted_at ? "Restore product?" : "Delete product?"
              }
              message={
                product.deleted_at
                  ? "The product comes back as a draft. Set it to Active to show it in the store."
                  : "The product will be hidden from the store, search and carts. Past orders keep their details. You can restore it later from Products → Hidden."
              }
              confirmLabel={product.deleted_at ? "Restore" : "Delete"}
              action={deleteAction}
            >
              {product.deleted_at ? "Restore" : "Delete"}
            </ConfirmButton>
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <ProductForm
          product={{
            ...product,
            collection_ids: product.product_collections.map(
              (c) => c.collection_id,
            ),
          }}
          collections={flattenCollections(collections ?? []).filter(
            (c) => !c.is_system,
          )}
        />
        <ImageManager
          productId={product.id}
          slug={product.slug}
          productName={product.name}
          images={images}
        />
        <VariantEditor
          productId={product.id}
          variants={[...product.product_variants]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(
              ({
                id,
                option_name,
                value,
                swatch_hex,
                sku,
                price_override,
                stock,
                is_active,
                image_id,
              }) => ({
                id,
                option_name,
                value,
                swatch_hex,
                sku: sku ?? "",
                price_override,
                stock,
                is_active,
                image_id,
              }),
            )}
          images={images.map((img, i) => ({
            id: img.id,
            label: `Image ${i + 1}`,
          }))}
        />
      </div>
    </>
  );
}
