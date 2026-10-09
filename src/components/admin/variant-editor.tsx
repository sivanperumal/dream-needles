"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, Table, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { saveVariants, type VariantInput } from "@/lib/admin/actions/products";

type Row = VariantInput & { key: string };

/** Colour/size options with their own stock, price and image. */
export function VariantEditor({
  productId,
  variants,
  images,
}: {
  productId: string;
  variants: VariantInput[];
  images: { id: string; label: string }[];
}) {
  const [rows, setRows] = useState<Row[]>(
    variants.map((v, i) => ({ ...v, key: v.id ?? `n${i}` })),
  );
  const [optionName, setOptionName] = useState(
    variants[0]?.option_name ?? "Colour",
  );
  const [pending, startTransition] = useTransition();

  const update = (key: string, patch: Partial<VariantInput>) =>
    setRows((r) =>
      r.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  const add = () =>
    setRows((r) => [
      ...r,
      {
        key: `n${Date.now()}`,
        option_name: optionName,
        value: "",
        swatch_hex: null,
        sku: "",
        price_override: null,
        stock: 0,
        is_active: true,
        image_id: null,
      },
    ]);
  const save = () =>
    startTransition(async () => {
      const result = await saveVariants(
        productId,
        rows.map((row) => ({
          id: row.id,
          value: row.value,
          swatch_hex: row.swatch_hex,
          sku: row.sku,
          price_override: row.price_override,
          stock: row.stock,
          is_active: row.is_active,
          image_id: row.image_id,
          option_name: optionName,
        })),
      );
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });

  const cell = "w-full rounded border border-gray-200 px-2 py-1 text-sm";

  return (
    <Card
      title={`Options (${rows.length})`}
      actions={
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-4" aria-hidden="true" /> Add option
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 text-sm">
        <label htmlFor="option-name" className="font-medium text-gray-700">
          Option name
        </label>
        <input
          id="option-name"
          value={optionName}
          onChange={(e) => setOptionName(e.target.value)}
          className={`${cell} w-40`}
        />
        <span className="text-xs text-gray-500">
          e.g. Colour, Size. Customers must pick one before adding to cart.
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">
          No options. The product&apos;s own price and stock are used.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Swatch</Th>
              <Th>SKU</Th>
              <Th>Price (₹)</Th>
              <Th>Stock</Th>
              <Th>Image</Th>
              <Th>Active</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <Td>
                  <input
                    aria-label="Option name"
                    value={row.value}
                    onChange={(e) => update(row.key, { value: e.target.value })}
                    className={cell}
                    placeholder="Sea Blue"
                  />
                </Td>
                <Td>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      aria-label="Swatch colour"
                      value={row.swatch_hex ?? "#ffffff"}
                      onChange={(e) =>
                        update(row.key, { swatch_hex: e.target.value })
                      }
                      className="size-8 cursor-pointer rounded border border-gray-200"
                    />
                    {row.swatch_hex && (
                      <button
                        type="button"
                        className="text-xs text-gray-500"
                        onClick={() => update(row.key, { swatch_hex: null })}
                      >
                        clear
                      </button>
                    )}
                  </span>
                </Td>
                <Td>
                  <input
                    aria-label="SKU"
                    value={row.sku ?? ""}
                    onChange={(e) => update(row.key, { sku: e.target.value })}
                    className={`${cell} w-28`}
                  />
                </Td>
                <Td>
                  <input
                    aria-label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Same"
                    value={row.price_override ?? ""}
                    onChange={(e) =>
                      update(row.key, {
                        price_override:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className={`${cell} w-24`}
                  />
                </Td>
                <Td>
                  <input
                    aria-label="Stock"
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={(e) =>
                      update(row.key, {
                        stock: Math.max(
                          0,
                          Math.floor(Number(e.target.value) || 0),
                        ),
                      })
                    }
                    className={`${cell} w-20`}
                  />
                </Td>
                <Td>
                  <select
                    aria-label="Image"
                    value={row.image_id ?? ""}
                    onChange={(e) =>
                      update(row.key, { image_id: e.target.value || null })
                    }
                    className={`${cell} w-32`}
                  >
                    <option value="">Main image</option>
                    {images.map((img) => (
                      <option key={img.id} value={img.id}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="checkbox"
                    aria-label="Active"
                    checked={row.is_active}
                    onChange={(e) =>
                      update(row.key, { is_active: e.target.checked })
                    }
                    className="size-4 accent-brand"
                  />
                </Td>
                <Td>
                  <button
                    type="button"
                    aria-label="Remove option"
                    onClick={() =>
                      setRows((r) => r.filter((x) => x.key !== row.key))
                    }
                    className="text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <div className="flex justify-end border-t border-gray-100 px-5 py-3">
        <Button size="sm" onClick={save} loading={pending}>
          Save options
        </Button>
      </div>
    </Card>
  );
}
