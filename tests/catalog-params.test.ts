import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  parseCollectionParams,
  parseSearchParams,
} from "@/lib/catalog-params";

describe("collection params", () => {
  it("uses defaults for an empty query", () => {
    expect(parseCollectionParams({})).toEqual({
      sort: "featured",
      minPrice: null,
      maxPrice: null,
      sub: [],
      inStock: false,
      page: 1,
      cols: 4,
    });
  });

  it("parses valid filters", () => {
    const p = parseCollectionParams({
      sort: "price_asc",
      min: "200",
      max: "900",
      sub: "toys,key-chains",
      stock: "1",
      page: "2",
      cols: "3",
    });
    expect(p).toMatchObject({
      sort: "price_asc",
      minPrice: 200,
      maxPrice: 900,
      sub: ["toys", "key-chains"],
      inStock: true,
      page: 2,
      cols: 3,
    });
    expect(activeFilterCount(p)).toBe(4);
  });

  it("ignores junk and swaps a reversed price range", () => {
    const p = parseCollectionParams({
      sort: "drop table",
      min: "900",
      max: "200",
      sub: "Toys;--,ok-slug",
      page: "-3",
      cols: "9",
    });
    expect(p).toMatchObject({
      sort: "featured",
      minPrice: 200,
      maxPrice: 900,
      sub: ["ok-slug"],
      page: 1,
      cols: 4,
    });
  });

  it("takes the first value of repeated params", () => {
    expect(parseCollectionParams({ sort: ["newest", "price_asc"] }).sort).toBe(
      "newest",
    );
  });
});

describe("search params", () => {
  it("trims and caps the query and defaults to relevance", () => {
    const p = parseSearchParams({ q: `  ${"x".repeat(100)}  ` });
    expect(p.q.length).toBe(64);
    expect(p.sort).toBe("relevance");
    expect(parseSearchParams({ q: "hook", sort: "featured" }).sort).toBe(
      "relevance",
    );
  });
});

describe("FAQ markdown", () => {
  it("splits on ## headings into question/answer pairs", async () => {
    const { parseFaq } = await import("@/components/content/prose");
    expect(
      parseFaq(
        "Intro text\n\n## Do you ship?\n\nYes, across India.\n\n## COD?\nNo.",
      ),
    ).toEqual([
      { question: "Do you ship?", answer: "Yes, across India." },
      { question: "COD?", answer: "No." },
    ]);
  });
});
