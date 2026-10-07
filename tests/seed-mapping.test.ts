import { describe, expect, it } from "vitest";
import {
  COLLECTION_TREE,
  FOLDER_TO_COLLECTION,
  placeholderPrice,
  productName,
  productSlug,
  productTags,
  retailPrice,
  stableUuid,
  storageFileName,
} from "../scripts/lib/catalog";

const allSlugs = (nodes = COLLECTION_TREE): string[] =>
  nodes.flatMap((n) => [n.slug, ...allSlugs(n.children ?? [])]);

describe("product folders", () => {
  it("become clean slugs without trailing numeric IDs", () => {
    expect(productSlug("cute-handmade-hexagon-bags-blue-10377")).toBe(
      "cute-handmade-hexagon-bags-blue",
    );
    expect(productSlug("Amour-Crochet-Hook-by-Clover")).toBe(
      "amour-crochet-hook-by-clover",
    );
    // Short numbers are part of the name, not an ID.
    expect(
      productSlug("6-inch-round-stainless-steel-craft-ring-pack-of-5"),
    ).toBe("6-inch-round-stainless-steel-craft-ring-pack-of-5");
  });

  it("treat case-different duplicates as the same product", () => {
    expect(productSlug("Double-Ended-Tunisian-Crochet-Hook-by-Clover")).toBe(
      productSlug("double-ended-tunisian-crochet-hook-by-clover"),
    );
  });

  it("become readable names", () => {
    expect(productName("Amour-Crochet-Hook-by-Clover")).toBe(
      "Amour Crochet Hook by Clover",
    );
    expect(productName("handmade-amigurumi-plush-toy-duck-10519")).toBe(
      "Handmade Amigurumi Plush Toy Duck",
    );
  });

  it("get category, brand and colour tags", () => {
    const tags = productTags(
      "soft-touch-crochet-hooks-by-prym",
      "crochet-hooks",
    );
    expect(tags).toEqual(expect.arrayContaining(["crochet", "hook", "prym"]));
    expect(productTags("tomato-keychain-red", "key-chains")).toContain("red");
  });
});

describe("collection mapping", () => {
  it("maps every image folder to a collection in the tree", () => {
    const slugs = new Set(allSlugs());
    for (const target of Object.values(FOLDER_TO_COLLECTION))
      expect(slugs).toContain(target);
  });

  it("has unique collection slugs", () => {
    const slugs = allSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("helpers", () => {
  it("make storage-safe file names", () => {
    expect(storageFileName("Clover Amour_Hook (2).WEBP")).toBe(
      "clover-amour-hook-2.webp",
    );
  });

  it("round prices to end in 9", () => {
    expect(retailPrice(417)).toBe(419);
    expect(retailPrice(1302)).toBe(1299);
    const price = placeholderPrice("tomato-keychain-red", "key-chains");
    expect(price % 10).toBe(9);
    expect(price).toBeGreaterThanOrEqual(149);
    expect(price).toBeLessThanOrEqual(299);
  });

  it("make stable, valid UUIDs", () => {
    expect(stableUuid("x")).toBe(stableUuid("x"));
    expect(stableUuid("x")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
