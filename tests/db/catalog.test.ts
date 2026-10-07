import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb } from "./harness";

type Card = {
  slug: string;
  name: string;
  is_new: boolean;
  in_stock: boolean;
  images: string[];
};
type Listing = {
  collection: { name: string; ancestors: { slug: string }[] };
  total: number;
  items: Card[];
  facets: { subcollections: { slug: string; count: number }[] };
};
type SearchResult = {
  collections: { slug: string; parent_name: string | null }[];
  products: (Card & { matched_in: string })[];
};

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
  // A draft product in a real collection, to prove drafts stay hidden.
  await db.exec(`
    insert into products (name, slug, sku, price, status, tags)
      values ('Secret Draft Scrunchie', 'secret-draft-scrunchie', 'DN-TEST-001', 199, 'draft', '{scrunchie}');
    insert into product_collections (product_id, collection_id)
      select p.id, c.id from products p, collections c
      where p.slug = 'secret-draft-scrunchie' and c.slug = 'hair-accessories';
  `);
});
afterAll(async () => {
  await db.close();
});

const listing = (slug: string, args: Record<string, unknown> = {}) =>
  as(db, "anon", null, async (tx) => {
    const { rows } = await tx.query<{ r: Listing | null }>(
      `select public.get_collection_products(
         p_slug => $1, p_sort => $2, p_sub_slugs => $3, p_in_stock => $4, p_limit => $5
       ) as r`,
      [
        slug,
        args.sort ?? "featured",
        args.sub ?? null,
        args.inStock ?? false,
        args.limit ?? 60,
      ],
    );
    return rows[0].r;
  });

const search = (q: string) =>
  as(db, "anon", null, async (tx) => {
    const { rows } = await tx.query<{ r: SearchResult }>(
      "select public.search_catalog($1) as r",
      [q],
    );
    return rows[0].r;
  });

describe("seed data", () => {
  it("loads the catalog", async () => {
    const { rows } = await db.query<{
      products: number;
      images: number;
      collections: number;
    }>(
      `select (select count(*)::int from products where sku not like 'DN-TEST-%') as products,
              (select count(*)::int from product_images) as images,
              (select count(*)::int from collections) as collections`,
    );
    expect(rows[0]).toEqual({ products: 31, images: 113, collections: 27 });
  });

  it("assigns the duplicated Clover hook to both hook collections", async () => {
    const { rows } = await db.query<{ slug: string }>(
      `select c.slug from product_collections pc
       join products p on p.id = pc.product_id
       join collections c on c.id = pc.collection_id
       where p.slug = 'double-ended-tunisian-crochet-hook-by-clover' order by c.slug`,
    );
    expect(rows.map((r) => r.slug)).toEqual([
      "crochet-hooks",
      "tunisian-crochet-hooks",
    ]);
  });
});

describe("collection pages", () => {
  it("shows only products assigned to a leaf collection", async () => {
    const r = await listing("craft-rings");
    expect(r?.total).toBe(3);
    expect(r?.collection.ancestors.map((a) => a.slug)).toEqual([
      "tools",
      "tools-accessories",
    ]);
  });

  it("View all on a parent lists distinct products of all children", async () => {
    const r = await listing("crochet-tools");
    const slugs = r!.items.map((i) => i.slug);
    // 5 hooks + 3 Tunisian, minus the one product in both.
    expect(r?.total).toBe(7);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("filters by sub-collection and reports facet counts", async () => {
    const all = await listing("home-decor");
    expect(all?.facets.subcollections.map((s) => s.slug)).toEqual([
      "baby-blankets",
      "crochet-flowers",
      "key-chains",
      "toys",
    ]);
    const toys = await listing("home-decor", { sub: ["toys"] });
    expect(toys?.total).toBe(4);
  });

  it("hides draft products from customers", async () => {
    const r = await listing("hair-accessories");
    expect(r?.total).toBe(2);
    expect(r?.items.map((i) => i.slug)).not.toContain("secret-draft-scrunchie");
  });

  it("filters to in-stock products", async () => {
    const all = await listing("handmade");
    const inStock = await listing("handmade", { inStock: true });
    expect(inStock!.total).toBeLessThan(all!.total);
    expect(inStock!.items.every((i) => i.in_stock)).toBe(true);
  });

  it("returns null for unknown collections", async () => {
    expect(await listing("does-not-exist")).toBeNull();
  });
});

describe("What's New", () => {
  it("contains only products inside the time window, newest first", async () => {
    const r = await listing("whats-new");
    expect(r!.total).toBeGreaterThan(0);
    expect(r!.items.every((i) => i.is_new)).toBe(true);
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from products
       where status = 'active' and created_at >= now() - interval '30 days'`,
    );
    expect(r!.total).toBe(rows[0].n);
  });

  it("respects manual pin and exclude overrides", async () => {
    await db.exec(`
      update products set whats_new_mode = 'pinned', created_at = now() - interval '200 days'
        where slug = 'tote-bag-by-hobby-store';
      update products set whats_new_mode = 'excluded', created_at = now()
        where slug = 'tomato-keychain-red';
    `);
    const slugs = (await listing("whats-new"))!.items.map((i) => i.slug);
    expect(slugs).toContain("tote-bag-by-hobby-store");
    expect(slugs).not.toContain("tomato-keychain-red");
  });
});

describe("search", () => {
  it("tolerates typos", async () => {
    const r = await search("crochte");
    expect(r.products.length).toBeGreaterThan(0);
    expect(r.products[0].name.toLowerCase()).toContain("crochet");
  });

  it("matches partial words, case-insensitively", async () => {
    const r = await search("PENG");
    expect(r.products.map((p) => p.slug)).toContain(
      "handmade-amigurumi-crochet-penguin-keychain-sea-blue",
    );
  });

  it("matches SKUs and tags", async () => {
    expect((await search("DN-CR-001")).products[0].matched_in).toBe("sku");
    const tagHit = (await search("dreamcatcher")).products;
    expect(tagHit.length).toBe(3);
    expect(tagHit[0].matched_in).toBe("tags");
  });

  it("finds collections with their parent name", async () => {
    const r = await search("bags");
    expect(r.collections).toContainEqual(
      expect.objectContaining({ slug: "bags", parent_name: "Accessories" }),
    );
  });

  it("limits popup results and ignores 1-character queries", async () => {
    const r = await search("crochet");
    expect(r.products.length).toBeLessThanOrEqual(8);
    expect(r.collections.length).toBeLessThanOrEqual(4);
    expect(await search("c")).toEqual({ collections: [], products: [] });
  });

  it("never returns draft products", async () => {
    const r = await search("scrunchie");
    expect(r.products).toEqual([]);
  });

  it("paginates the full results page with a total", async () => {
    const page = await as(db, "anon", null, async (tx) => {
      const { rows } = await tx.query<{ r: { total: number; items: Card[] } }>(
        "select public.search_products('hook', p_limit => 3) as r",
      );
      return rows[0].r;
    });
    expect(page.items.length).toBe(3);
    expect(page.total).toBeGreaterThan(3);
  });
});
