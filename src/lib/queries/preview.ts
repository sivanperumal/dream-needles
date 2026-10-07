import "server-only";
import {
  COLLECTION_TREE,
  type CollectionSeed,
  FOOTER_COLUMNS,
} from "../../../scripts/lib/catalog";
import {
  buildFooterColumns,
  buildHeaderMenu,
  type NavCollectionRow,
  type NavMenuItemRow,
} from "@/lib/navigation";
import type { Tables } from "@/types/database";

/*
 * Preview mode: lets the storefront layout render before Supabase is set up,
 * using the same seed definitions that generate supabase/seed/*.sql.
 * Never used once NEXT_PUBLIC_SUPABASE_URL is configured.
 */

let warned = false;
export function warnPreviewMode() {
  if (warned) return;
  warned = true;
  console.warn(
    "[dream-needles] Supabase is not configured: showing preview navigation. See SETUP.md Part 1.",
  );
}

export function previewNavigation() {
  const collections: NavCollectionRow[] = [];
  const walk = (nodes: CollectionSeed[], parent: string | null) =>
    nodes.forEach((n, index) => {
      collections.push({
        id: n.slug,
        parent_id: parent,
        name: n.name,
        slug: n.slug,
        description: n.description,
        show_in_menu: n.showInMenu ?? true,
        show_view_all: n.showViewAll ?? false,
        menu_order: index,
        menu_badge: null,
        is_system: n.isSystem ?? false,
      });
      if (n.children) walk(n.children, n.slug);
    });
  walk(COLLECTION_TREE, null);

  const items: NavMenuItemRow[] = [
    {
      id: "retail",
      menu: "header",
      parent_id: null,
      label: "Retail Store",
      url: "/retail-store",
      is_link: true,
      sort_order: 100,
      collection_slug: null,
    },
  ];
  FOOTER_COLUMNS.forEach((column, i) => {
    items.push({
      id: column.label,
      menu: "footer",
      parent_id: null,
      label: column.label,
      url: null,
      is_link: Boolean(column.slug),
      sort_order: i,
      collection_slug: column.slug ?? null,
    });
    column.links.forEach((link, j) =>
      items.push({
        id: `${column.label}:${link.label}`,
        menu: "footer",
        parent_id: column.label,
        label: link.label,
        url: link.url ?? null,
        is_link: true,
        sort_order: j,
        collection_slug: link.slug ?? null,
      }),
    );
  });
  return {
    header: buildHeaderMenu(collections, items),
    footer: buildFooterColumns(items),
  };
}

export function previewSettings(): Tables<"store_settings"> {
  return {
    id: 1,
    whats_new_days: 30,
    free_shipping_threshold: 999,
    shipping_fee: 79,
    gst_rate: 12,
    delivery_eta_text: "Delivered in 3–5 business days",
    low_stock_threshold: 5,
    promo_ticker: [
      "Free shipping across India on orders above ₹999",
      "Handmade with love by Indian makers",
      "Visit our retail store",
    ],
    home_intro: "",
    home_stats: [],
    marketplaces: [],
    social_links: { facebook: "", instagram: "", youtube: "", whatsapp: "" },
    contact_email: "care@dreamneedles.in",
    contact_phone: null,
    whatsapp_number: null,
    store_address: null,
    updated_at: new Date(0).toISOString(),
  };
}
