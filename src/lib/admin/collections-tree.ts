export type CollectionNode = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  menu_order: number;
  is_visible: boolean;
  show_in_menu: boolean;
  is_system: boolean;
};

export type FlatCollection = CollectionNode & { depth: number; path: string };

/** Depth-first, menu-ordered list with indentation depth and "Parent › Child" path. */
export function flattenCollections(rows: CollectionNode[]): FlatCollection[] {
  const out: FlatCollection[] = [];
  const walk = (parentId: string | null, depth: number, prefix: string) => {
    rows
      .filter((r) => r.parent_id === parentId)
      .sort(
        (a, b) => a.menu_order - b.menu_order || a.name.localeCompare(b.name),
      )
      .forEach((r) => {
        const path = prefix ? `${prefix} › ${r.name}` : r.name;
        out.push({ ...r, depth, path });
        walk(r.id, depth + 1, path);
      });
  };
  walk(null, 0, "");
  return out;
}
