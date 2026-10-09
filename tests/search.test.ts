import { describe, expect, it } from "vitest";
import { highlightParts } from "@/lib/highlight";
import { buildSuggestions } from "@/lib/queries/search";

describe("highlightParts", () => {
  it("marks every query word, case-insensitively", () => {
    expect(highlightParts("Crochet Hook by Clover", "croch hook")).toEqual([
      { text: "Croch", match: true },
      { text: "et ", match: false },
      { text: "Hook", match: true },
      { text: " by Clover", match: false },
    ]);
  });

  it("ignores 1-letter words and regex characters", () => {
    expect(highlightParts("Craft Ring (Pack of 5)", "a ( ring")).toEqual([
      { text: "Craft ", match: false },
      { text: "Ring", match: true },
      { text: " (Pack of 5)", match: false },
    ]);
  });
});

describe("buildSuggestions", () => {
  it("starts with the query, then collections, then name phrases", () => {
    const result = {
      collections: [
        {
          id: "1",
          name: "Key Chains",
          slug: "key-chains",
          parent_name: "Home Decor",
        },
      ],
      products: [
        { name: "Tomato Keychain Red" },
        { name: "Cute Fish Keychain" },
      ],
    } as never;
    expect(buildSuggestions("keychain", result)).toEqual([
      "keychain",
      "key chains",
      "tomato keychain red",
      "fish keychain",
    ]);
  });
});
