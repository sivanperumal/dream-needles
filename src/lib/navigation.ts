/**
 * Builds the header mega-menu and the footer columns from database rows.
 * Pure functions so the menu logic is unit-tested without a database.
 */

export type NavCollectionRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  show_in_menu: boolean;
  show_view_all: boolean;
  menu_order: number;
  menu_badge: string | null;
  is_system: boolean;
};

export type NavMenuItemRow = {
  id: string;
  menu: "header" | "footer";
  parent_id: string | null;
  label: string;
  url: string | null;
  is_link: boolean;
  sort_order: number;
  collection_slug: string | null;
};

export type MenuNode = {
  label: string;
  href: string;
  badge: string | null;
  children: MenuNode[];
  /** "View all" link shown under the children, when enabled. */
  viewAllHref: string | null;
};

export type FooterColumn = {
  label: string;
  href: string | null;
  links: { label: string; href: string }[];
};

const collectionHref = (slug: string) => `/collections/${slug}`;

const byOrder = (a: NavCollectionRow, b: NavCollectionRow) =>
  a.menu_order - b.menu_order || a.name.localeCompare(b.name);

/**
 * Header: top-level collections with show_in_menu (What's New, Tools,
 * Handmade…), each with up to two levels of menu children, followed by extra
 * header links (e.g. Retail Store). New collections appear automatically.
 */
export function buildHeaderMenu(
  collections: NavCollectionRow[],
  items: NavMenuItemRow[],
): MenuNode[] {
  const childrenOf = (parentId: string | null) =>
    collections
      .filter((c) => c.parent_id === parentId && c.show_in_menu)
      .sort(byOrder);

  const toNode = (c: NavCollectionRow, depth: number): MenuNode => ({
    label: c.name,
    href: collectionHref(c.slug),
    badge: c.menu_badge,
    children:
      depth < 2
        ? childrenOf(c.id).map((child) => toNode(child, depth + 1))
        : [],
    viewAllHref: c.show_view_all ? collectionHref(c.slug) : null,
  });

  const collectionNodes = childrenOf(null).map((c) => toNode(c, 0));
  const extraLinks = items
    .filter((i) => i.menu === "header" && !i.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map<MenuNode>((i) => ({
      label: i.label,
      href: i.collection_slug
        ? collectionHref(i.collection_slug)
        : (i.url ?? "/"),
      badge: null,
      children: [],
      viewAllHref: null,
    }));
  return [...collectionNodes, ...extraLinks];
}

/** Footer: one column per top-level footer item; headings may be plain text. */
export function buildFooterColumns(items: NavMenuItemRow[]): FooterColumn[] {
  const footer = items.filter((i) => i.menu === "footer");
  const hrefOf = (i: NavMenuItemRow) =>
    i.collection_slug ? collectionHref(i.collection_slug) : i.url;
  return footer
    .filter((i) => !i.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((column) => ({
      label: column.label,
      href: column.is_link ? hrefOf(column) : null,
      links: footer
        .filter((i) => i.parent_id === column.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((i) => {
          const href = hrefOf(i);
          return href ? [{ label: i.label, href }] : [];
        }),
    }));
}
