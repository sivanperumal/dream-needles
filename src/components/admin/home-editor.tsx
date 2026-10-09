"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AssetUpload } from "@/components/admin/asset-upload";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  CheckboxField,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  deleteBanner,
  saveBanner,
  saveSettings,
} from "@/lib/admin/actions/content";
import { imageUrl, SITE_ASSETS_BUCKET } from "@/lib/images";
import type { Tables } from "@/types/database";

type Banner = Tables<"banners">;
const PLACEMENTS = [
  {
    value: "hero",
    label: "Hero slider",
    hint: "Large rotating images at the top of the home page.",
  },
  {
    value: "tile",
    label: "Tiles beside the slider",
    hint: "Four square tiles. The image should include its label.",
  },
  {
    value: "category",
    label: "Shop by Category",
    hint: "Tall cards with a title over the image.",
  },
] as const;

export function BannerManager({ banners }: { banners: Banner[] }) {
  const [editing, setEditing] = useState<
    Banner | { placement: Banner["placement"] } | null
  >(null);
  return (
    <>
      {PLACEMENTS.map((p) => {
        const list = banners.filter((b) => b.placement === p.value);
        return (
          <Card
            key={p.value}
            title={`${p.label} (${list.length})`}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing({ placement: p.value })}
              >
                <Plus className="size-4" aria-hidden="true" /> Add
              </Button>
            }
          >
            <p className="px-5 pt-3 text-xs text-gray-500">{p.hint}</p>
            <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((b) => (
                <li
                  key={b.id}
                  className={`rounded-lg border p-2 ${b.is_active ? "border-gray-200" : "border-dashed border-gray-300 opacity-60"}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={imageUrl(b.image_path, SITE_ASSETS_BUCKET)!}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {b.link_url ?? "No link"}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditing(b)}
                      className="flex items-center gap-1 text-xs font-medium text-brand"
                    >
                      <Pencil className="size-3" aria-hidden="true" /> Edit
                    </button>
                    <ConfirmButton
                      variant="ghost"
                      danger
                      title="Delete this banner?"
                      message="It will disappear from the home page."
                      confirmLabel="Delete"
                      action={deleteBanner.bind(null, b.id)}
                    >
                      <Trash2
                        className="size-3.5 text-rose-600"
                        aria-label="Delete"
                      />
                    </ConfirmButton>
                  </div>
                </li>
              ))}
              {!list.length && (
                <li className="col-span-full py-4 text-center text-sm text-gray-500">
                  Nothing here yet.
                </li>
              )}
            </ul>
          </Card>
        );
      })}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing && "id" in editing ? "Edit banner" : "Add banner"}
        className="max-w-xl"
      >
        {editing && (
          <BannerForm banner={editing} onDone={() => setEditing(null)} />
        )}
      </Dialog>
    </>
  );
}

function BannerForm({
  banner,
  onDone,
}: {
  banner: Partial<Banner> & { placement: Banner["placement"] };
  onDone: () => void;
}) {
  const [state, action, pending] = useAdminForm(saveBanner, onDone);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4 p-5" noValidate>
      {banner.id && <input type="hidden" name="id" value={banner.id} />}
      <SelectField
        label="Section"
        name="placement"
        defaultValue={banner.placement}
        options={PLACEMENTS.map((p) => ({ value: p.value, label: p.label }))}
      />
      <TextField
        label="Title"
        name="title"
        defaultValue={banner.title}
        error={e.title}
        required
      />
      <TextField
        label="Subtitle"
        name="subtitle"
        defaultValue={banner.subtitle}
      />
      <TextField
        label="Button label"
        name="cta_label"
        defaultValue={banner.cta_label ?? ""}
        hint='e.g. "Shop Crochet Flowers"'
      />
      <TextField
        label="Link"
        name="link_url"
        defaultValue={banner.link_url ?? ""}
        error={e.link_url}
        hint="e.g. /collections/key-chains"
      />
      <AssetUpload
        name="image_path"
        defaultValue={banner.image_path}
        folder="banners"
        label="Image"
      />
      {e.image_path && <p className="text-xs text-rose-600">{e.image_path}</p>}
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Position"
          name="sort_order"
          type="number"
          min="0"
          defaultValue={banner.sort_order ?? 0}
          hint="Lower shows first."
        />
        <div className="flex items-end pb-2">
          <CheckboxField
            label="Visible"
            name="is_active"
            defaultChecked={banner.is_active ?? true}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Save banner
        </Button>
      </div>
    </form>
  );
}

type Stat = { value: string; label: string };
type Marketplace = { name: string; url: string; logo_path: string | null };

/** Promo ticker, stats, intro and marketplace links (stored in store_settings). */
export function HomeContentForm({
  ticker,
  intro,
  stats,
  marketplaces,
}: {
  ticker: string[];
  intro: string;
  stats: Stat[];
  marketplaces: Marketplace[];
}) {
  const [statRows, setStatRows] = useState(stats);
  const [markets, setMarkets] = useState(marketplaces);
  const [, action, pending] = useAdminForm(saveSettings);
  const cell = "w-full rounded border border-gray-200 px-2 py-1.5 text-sm";

  return (
    <Card title="Home page text">
      <form action={action} className="grid gap-5 p-5">
        <input
          type="hidden"
          name="home_stats"
          value={JSON.stringify(statRows.filter((s) => s.value && s.label))}
        />
        <input
          type="hidden"
          name="marketplaces"
          value={JSON.stringify(markets.filter((m) => m.name))}
        />
        <TextArea
          label="Announcement messages"
          name="promo_ticker"
          rows={3}
          defaultValue={ticker.join("\n")}
          hint="One message per line. The first also shows in the top bar on desktop."
        />
        <TextArea
          label="Welcome text"
          name="home_intro"
          rows={5}
          defaultValue={intro}
          hint="Shown near the bottom of the home page. Use **bold** for emphasis."
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Stats row
          </legend>
          <div className="grid gap-2">
            {statRows.map((s, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2">
                <input
                  aria-label="Value"
                  value={s.value}
                  onChange={(e) =>
                    setStatRows(
                      statRows.map((r, j) =>
                        j === i ? { ...r, value: e.target.value } : r,
                      ),
                    )
                  }
                  className={cell}
                  placeholder="350+"
                />
                <input
                  aria-label="Label"
                  value={s.label}
                  onChange={(e) =>
                    setStatRows(
                      statRows.map((r, j) =>
                        j === i ? { ...r, label: e.target.value } : r,
                      ),
                    )
                  }
                  className={cell}
                  placeholder="Handmade designs"
                />
                <button
                  type="button"
                  aria-label="Remove stat"
                  onClick={() =>
                    setStatRows(statRows.filter((_, j) => j !== i))
                  }
                  className="px-2 text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {statRows.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setStatRows([...statRows, { value: "", label: "" }])
                }
                className="w-fit text-sm font-medium text-brand"
              >
                + Add stat
              </button>
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            &ldquo;We are selling on&rdquo; links
          </legend>
          <div className="grid gap-2">
            {markets.map((m, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2">
                <input
                  aria-label="Marketplace"
                  value={m.name}
                  onChange={(e) =>
                    setMarkets(
                      markets.map((r, j) =>
                        j === i ? { ...r, name: e.target.value } : r,
                      ),
                    )
                  }
                  className={cell}
                />
                <input
                  aria-label={`${m.name} store link`}
                  value={m.url}
                  onChange={(e) =>
                    setMarkets(
                      markets.map((r, j) =>
                        j === i ? { ...r, url: e.target.value } : r,
                      ),
                    )
                  }
                  className={cell}
                  placeholder="https://www.amazon.in/stores/…"
                />
                <button
                  type="button"
                  aria-label="Remove marketplace"
                  onClick={() => setMarkets(markets.filter((_, j) => j !== i))}
                  className="px-2 text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Logos without a link are shown but not clickable.
            </p>
          </div>
        </fieldset>
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Save home page text
          </Button>
        </div>
      </form>
    </Card>
  );
}
