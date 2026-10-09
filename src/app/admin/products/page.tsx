import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  adminInput,
  Card,
  EmptyRow,
  FilterBar,
  PageHeader,
  Pill,
  SimplePager,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { flattenCollections } from "@/lib/admin/collections-tree";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Products" };
const PER_PAGE = 25;

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const status =
    sp.status === "active" || sp.status === "draft" ? sp.status : "";
  const collection = typeof sp.collection === "string" ? sp.collection : "";
  const lowStock = sp.stock === "low";
  const showDeleted = sp.deleted === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const { data: collectionRows } = await supabase
    .from("collections")
    .select(
      "id, parent_id, name, slug, menu_order, is_visible, show_in_menu, is_system",
    );
  const collections = flattenCollections(collectionRows ?? []).filter(
    (c) => !c.is_system,
  );

  // Products in the chosen collection (directly assigned).
  let collectionProductIds: string[] | null = null;
  if (collection) {
    const { data } = await supabase
      .from("product_collections")
      .select("product_id")
      .eq("collection_id", collection);
    collectionProductIds = (data ?? []).map((r) => r.product_id);
  }

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, sku, price, stock, status, whats_new_mode, deleted_at, created_at, product_images (storage_path, sort_order), product_variants (id), product_collections (collection_id)",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE);
  if (collectionProductIds)
    query = query.in(
      "id",
      collectionProductIds.length
        ? collectionProductIds
        : ["00000000-0000-0000-0000-000000000000"],
    );
  if (q)
    query = query.or(
      `name.ilike.%${q.replace(/[%,()]/g, " ")}%,sku.ilike.%${q.replace(/[%,()]/g, " ")}%`,
    );
  if (status) query = query.eq("status", status);
  if (lowStock) query = query.lte("stock", 5);
  query = showDeleted
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);
  const { data: rows, error } = await query;
  const products = (rows ?? []).slice(0, PER_PAGE);
  const hasMore = (rows?.length ?? 0) > PER_PAGE;

  const makeHref = (p: number) => {
    const params = new URLSearchParams(
      Object.entries({
        q,
        status,
        collection,
        stock: lowStock ? "low" : "",
        deleted: showDeleted ? "1" : "",
        page: p > 1 ? String(p) : "",
      }).filter(([, v]) => v),
    );
    return `/admin/products${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Add, edit and organise products. Hidden products stay in old orders but disappear from the store."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="size-4" aria-hidden="true" /> Add product
          </ButtonLink>
        }
      />
      <Card>
        <FilterBar>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Search
            <input
              name="q"
              defaultValue={q}
              placeholder="Name or SKU"
              className={`${adminInput} w-56`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Status
            <select name="status" defaultValue={status} className={adminInput}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Collection
            <select
              name="collection"
              defaultValue={collection}
              className={`${adminInput} max-w-64`}
            >
              <option value="">All collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {"— ".repeat(c.depth)}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="stock"
              value="low"
              defaultChecked={lowStock}
              className="size-4 accent-brand"
            />{" "}
            Low stock
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="deleted"
              value="1"
              defaultChecked={showDeleted}
              className="size-4 accent-brand"
            />{" "}
            Hidden
          </label>
        </FilterBar>
        {error && (
          <p className="p-4 text-sm text-rose-600">
            Couldn&apos;t load products: {error.message}
          </p>
        )}
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Stock</Th>
              <Th>Status</Th>
              <Th>Collections</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const image = [...p.product_images].sort(
                (a, b) => a.sort_order - b.sort_order,
              )[0]?.storage_path;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <Image
                        src={imageUrl(image) ?? PLACEHOLDER_IMAGE}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-gray-900 hover:text-brand">
                          {p.name}
                        </span>
                        {p.whats_new_mode !== "auto" && (
                          <span className="text-xs text-gray-500">
                            {p.whats_new_mode === "pinned"
                              ? "Pinned to What's New"
                              : "Excluded from What's New"}
                          </span>
                        )}
                      </span>
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs">{p.sku ?? "—"}</Td>
                  <Td className="text-right">{formatINR(p.price)}</Td>
                  <Td className="text-right">
                    {p.product_variants.length ? (
                      <span className="text-xs text-gray-500">
                        {p.product_variants.length} options
                      </span>
                    ) : (
                      <span
                        className={
                          p.stock === 0
                            ? "font-semibold text-rose-600"
                            : p.stock <= 5
                              ? "font-semibold text-amber-600"
                              : ""
                        }
                      >
                        {p.stock}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {p.deleted_at ? (
                      <Pill tone="red">Hidden</Pill>
                    ) : p.status === "active" ? (
                      <Pill tone="green">Active</Pill>
                    ) : (
                      <Pill>Draft</Pill>
                    )}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {p.product_collections.length}
                  </Td>
                </tr>
              );
            })}
            {!products.length && (
              <EmptyRow colSpan={6}>No products match these filters.</EmptyRow>
            )}
          </tbody>
        </Table>
        <SimplePager page={page} hasMore={hasMore} makeHref={makeHref} />
      </Card>
    </>
  );
}
