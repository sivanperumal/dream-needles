import { describe, expect, it } from "vitest";
import {
  buildFooterColumns,
  buildHeaderMenu,
  type NavCollectionRow,
  type NavMenuItemRow,
} from "@/lib/navigation";

const col = (
  id: string,
  parent: string | null,
  name: string,
  order: number,
  extra: Partial<NavCollectionRow> = {},
): NavCollectionRow => ({
  id,
  parent_id: parent,
  name,
  slug: name.toLowerCase().replace(/[^a-z]+/g, "-"),
  show_in_menu: true,
  show_view_all: false,
  menu_order: order,
  menu_badge: null,
  is_system: false,
  ...extra,
});

const collections = [
  col("new", null, "What's New", 0, { slug: "whats-new", is_system: true }),
  col("tools", null, "Tools", 1),
  col("handmade", null, "Handmade", 2),
  col("acc", "tools", "Accessories", 2, {
    show_view_all: true,
    slug: "tools-accessories",
  }),
  col("ct", "tools", "Crochet Tools", 1),
  col("rings", "acc", "Craft Rings", 1),
  col("knit", "tools", "Knitting Needles", 3, { show_in_menu: false }),
];

const item = (
  id: string,
  menu: "header" | "footer",
  label: string,
  extra: Partial<NavMenuItemRow> = {},
): NavMenuItemRow => ({
  id,
  menu,
  parent_id: null,
  label,
  url: null,
  is_link: true,
  sort_order: 0,
  collection_slug: null,
  ...extra,
});

describe("header menu", () => {
  const menu = buildHeaderMenu(collections, [
    item("rs", "header", "Retail Store", {
      url: "/retail-store",
      sort_order: 100,
    }),
  ]);

  it("lists top-level collections in order, then extra links", () => {
    expect(menu.map((m) => m.label)).toEqual([
      "What's New",
      "Tools",
      "Handmade",
      "Retail Store",
    ]);
    expect(menu[3].href).toBe("/retail-store");
  });

  it("nests children, hides menu-hidden collections, and adds View all", () => {
    const tools = menu[1];
    expect(tools.children.map((c) => c.label)).toEqual([
      "Crochet Tools",
      "Accessories",
    ]);
    const accessories = tools.children[1];
    expect(accessories.children.map((c) => c.label)).toEqual(["Craft Rings"]);
    expect(accessories.viewAllHref).toBe("/collections/tools-accessories");
    expect(tools.children[0].viewAllHref).toBeNull();
  });
});

describe("footer columns", () => {
  it("builds columns with plain-text headings and links", () => {
    const columns = buildFooterColumns([
      item("tools", "footer", "Tools", { is_link: false, sort_order: 1 }),
      item("home", "footer", "Home Decor", {
        collection_slug: "home-decor",
        sort_order: 0,
      }),
      item("hooks", "footer", "Crochet Hooks", {
        parent_id: "tools",
        collection_slug: "crochet-hooks",
      }),
      item("faq", "footer", "FAQ", { parent_id: "home", url: "/faq" }),
    ]);
    expect(columns).toEqual([
      {
        label: "Home Decor",
        href: "/collections/home-decor",
        links: [{ label: "FAQ", href: "/faq" }],
      },
      {
        label: "Tools",
        href: null,
        links: [{ label: "Crochet Hooks", href: "/collections/crochet-hooks" }],
      },
    ]);
  });
});
