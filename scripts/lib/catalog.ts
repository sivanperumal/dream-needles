import { createHash } from "node:crypto";

/**
 * Seed definition of the collection tree, the footer menu, and the rules that
 * turn `images/products/<Top>/<Collection>/<Sub>/<product>/` folders into
 * products. Pure functions only — file-system access lives in generate-seed.ts.
 */

export type CollectionSeed = {
  slug: string;
  name: string;
  description: string;
  showInMenu?: boolean;
  showViewAll?: boolean;
  isSystem?: boolean;
  children?: CollectionSeed[];
};

export const COLLECTION_TREE: CollectionSeed[] = [
  {
    slug: "whats-new",
    name: "What's New",
    description: "Fresh off the hook — our newest tools and handmade pieces.",
    isSystem: true,
  },
  {
    slug: "tools",
    name: "Tools",
    description:
      "Crochet hooks, knitting needles and the notions every maker needs.",
    children: [
      {
        slug: "crochet-tools",
        name: "Crochet Tools",
        description:
          "Hooks for every yarn weight, from steel lace hooks to Tunisian hooks.",
        children: [
          {
            slug: "crochet-hooks",
            name: "Crochet Hooks",
            description:
              "Ergonomic, wooden and aluminium crochet hooks in every size.",
          },
          {
            slug: "tunisian-crochet-hooks",
            name: "Tunisian Crochet Hooks",
            description:
              "Long, double-ended and interchangeable hooks for Tunisian crochet.",
          },
        ],
      },
      {
        slug: "tools-accessories",
        name: "Accessories",
        description:
          "Craft rings, project bags and handy extras for your crafting kit.",
        showViewAll: true,
        children: [
          {
            slug: "craft-rings",
            name: "Craft Rings",
            description:
              "Stainless steel rings for dreamcatchers, wreaths and macramé.",
          },
          {
            slug: "project-bags",
            name: "Project Bags",
            description:
              "Totes and pouches that keep your yarn and works-in-progress tidy.",
          },
        ],
      },
      {
        slug: "knitting-needles",
        name: "Knitting Needles",
        description: "Straight, circular and double-pointed knitting needles.",
        showInMenu: false,
      },
      {
        slug: "stitch-markers-holders",
        name: "Stitch Markers & Holders",
        description: "Locking stitch markers, stitch holders and row counters.",
        showInMenu: false,
      },
      {
        slug: "punch-needles",
        name: "Punch Needles",
        description:
          "Punch needles and threaders for rug hooking and embroidery.",
        showInMenu: false,
      },
      {
        slug: "tatting-shuttles",
        name: "Tatting Shuttles",
        description: "Shuttles for delicate tatted lace.",
        showInMenu: false,
      },
    ],
  },
  {
    slug: "handmade",
    name: "Handmade",
    description: "Crochet pieces handmade by our makers, one stitch at a time.",
    children: [
      {
        slug: "home-decor",
        name: "Home Decor",
        description:
          "Blankets, flowers, toys and keepsakes to make a house feel like home.",
        showViewAll: true,
        children: [
          {
            slug: "baby-blankets",
            name: "Baby Blankets",
            description: "Soft chenille blankets, gentle on little ones.",
          },
          {
            slug: "crochet-flowers",
            name: "Crochet Flowers",
            description:
              "Everlasting crochet blooms — lotus, sunflowers, lilies and more.",
          },
          {
            slug: "key-chains",
            name: "Key Chains",
            description: "Tiny amigurumi charms for keys, bags and backpacks.",
          },
          {
            slug: "toys",
            name: "Toys",
            description: "Huggable amigurumi plush toys, made to be loved.",
          },
          {
            slug: "fridge-magnets",
            name: "Fridge Magnets",
            description: "Cheerful crochet magnets for your fridge and boards.",
            showInMenu: false,
          },
          {
            slug: "wall-hangings",
            name: "Wall Hangings",
            description: "Crochet and macramé wall art.",
            showInMenu: false,
          },
        ],
      },
      {
        slug: "handmade-accessories",
        name: "Accessories",
        description: "Handmade bags, hair accessories and rakhis.",
        children: [
          {
            slug: "bags",
            name: "Bags",
            description: "Crochet bags for every day and every outing.",
          },
          {
            slug: "hair-accessories",
            name: "Hair Accessories",
            description: "Headbands, bandanas and scrunchies in soft yarns.",
          },
          {
            slug: "rakhis",
            name: "Rakhis",
            description: "Handmade crochet rakhis for Raksha Bandhan.",
          },
        ],
      },
      {
        slug: "apparel",
        name: "Apparel",
        description: "Handmade sweaters, cardigans, shawls and wraps.",
        showInMenu: false,
        children: [
          {
            slug: "sweaters-cardigans",
            name: "Sweaters & Cardigans",
            description: "Cosy handmade sweaters and cardigans.",
          },
          {
            slug: "shawls-wraps",
            name: "Shawls & Wraps",
            description: "Lightweight crochet shawls and wraps.",
          },
        ],
      },
    ],
  },
];

/** Footer columns from the spec. `slug` links a collection, `url` a page. */
export type FooterLink = { label: string; slug?: string; url?: string };
export type FooterColumn = {
  label: string;
  slug?: string;
  links: FooterLink[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    label: "Home Decor",
    slug: "home-decor",
    links: [
      { label: "Baby Blankets", slug: "baby-blankets" },
      { label: "Crochet Flowers", slug: "crochet-flowers" },
      { label: "Key Chains", slug: "key-chains" },
      { label: "Toys", slug: "toys" },
    ],
  },
  {
    label: "Accessories",
    slug: "handmade-accessories",
    links: [
      { label: "Bags", slug: "bags" },
      { label: "Hair Accessories", slug: "hair-accessories" },
      { label: "Rakhis", slug: "rakhis" },
    ],
  },
  {
    label: "Apparel",
    slug: "apparel",
    links: [
      { label: "Sweaters & Cardigans", slug: "sweaters-cardigans" },
      { label: "Shawls & Wraps", slug: "shawls-wraps" },
    ],
  },
  {
    // Heading only, not a link (per spec).
    label: "Tools",
    links: [
      { label: "Crochet Hooks", slug: "crochet-hooks" },
      { label: "Knitting Needles", slug: "knitting-needles" },
      { label: "Stitch Markers & Holders", slug: "stitch-markers-holders" },
      { label: "Project Bags", slug: "project-bags" },
      { label: "Punch Needles", slug: "punch-needles" },
      { label: "Tatting Shuttles", slug: "tatting-shuttles" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "Our Story", url: "/our-story" },
      { label: "Contact Us", url: "/contact" },
      { label: "Retail Store", url: "/retail-store" },
    ],
  },
  {
    label: "Support & Policies",
    links: [
      { label: "FAQ", url: "/faq" },
      { label: "Privacy Policy", url: "/privacy-policy" },
      { label: "Shipping Policy", url: "/shipping-policy" },
      { label: "Refund Policy", url: "/refund-policy" },
    ],
  },
];

/**
 * Image folders → collection slug. Folder names are kept exactly as they are
 * on disk (including the "Accersories"/"Accesories" spellings).
 */
export const FOLDER_TO_COLLECTION: Record<string, string> = {
  "Tools/Crochet-Tools/crochet-hooks": "crochet-hooks",
  "Tools/Crochet-Tools/tunisian-crochet-hooks-collection":
    "tunisian-crochet-hooks",
  "Tools/Accersories/craft-rings": "craft-rings",
  "Tools/Accersories/project-bags": "project-bags",
  "Handmade/Home-Decor/Baby-blanket": "baby-blankets",
  "Handmade/Home-Decor/Crochet-Flower": "crochet-flowers",
  "Handmade/Home-Decor/Key-Chain": "key-chains",
  "Handmade/Home-Decor/Toys": "toys",
  "Handmade/Accesories/bags": "bags",
  "Handmade/Accesories/hair-accessories": "hair-accessories",
};

type CategoryRules = {
  code: string;
  priceRange: [number, number];
  tags: string[];
  description: (name: string) => string;
};

const handmadeNote =
  "Every piece is crocheted by hand, so tiny variations make yours one of a kind.";

/** Placeholder pricing, SKU codes, tags and copy per collection (edit in admin later). */
export const CATEGORY_RULES: Record<string, CategoryRules> = {
  "crochet-hooks": {
    code: "HK",
    priceRange: [249, 899],
    tags: ["crochet", "hook", "crochet hook", "tools"],
    description: (n) =>
      `${n} glides smoothly through every stitch for comfortable, even tension. A dependable hook for beginners and seasoned makers alike, sized for a wide range of yarn weights.`,
  },
  "tunisian-crochet-hooks": {
    code: "TH",
    priceRange: [449, 1499],
    tags: ["crochet", "tunisian", "afghan hook", "hook", "tools"],
    description: (n) =>
      `${n} is made for Tunisian (afghan) crochet, with the length and smooth finish you need to hold a full row of loops. Ideal for blankets, scarves and textured fabric.`,
  },
  "craft-rings": {
    code: "CR",
    priceRange: [199, 449],
    tags: [
      "craft ring",
      "metal ring",
      "dreamcatcher",
      "macrame",
      "wreath",
      "accessories",
    ],
    description: (n) =>
      `${n} — sturdy, rust-resistant stainless steel rings with a smooth weld. Perfect for dreamcatchers, wreaths, macramé and crochet wall hangings.`,
  },
  "project-bags": {
    code: "PB",
    priceRange: [499, 999],
    tags: ["project bag", "yarn storage", "tote", "pouch", "accessories"],
    description: (n) =>
      `${n} keeps your yarn, hooks and works-in-progress together and tangle-free. Roomy, lightweight and easy to carry to class or on your travels.`,
  },
  "baby-blankets": {
    code: "BB",
    priceRange: [1299, 1999],
    tags: [
      "baby blanket",
      "chenille",
      "blanket",
      "baby",
      "handmade",
      "home decor",
    ],
    description: (n) =>
      `${n} is crocheted in velvety-soft chenille yarn that's gentle on delicate skin. Warm, breathable and machine washable on a gentle cycle. ${handmadeNote}`,
  },
  "crochet-flowers": {
    code: "CF",
    priceRange: [299, 649],
    tags: ["crochet flower", "flowers", "bouquet", "handmade", "home decor"],
    description: (n) =>
      `${n} — everlasting blooms crocheted petal by petal. They never wilt, making them a thoughtful gift and a cheerful accent for any room. ${handmadeNote}`,
  },
  "key-chains": {
    code: "KC",
    priceRange: [149, 299],
    tags: ["keychain", "key chain", "amigurumi", "charm", "handmade", "gift"],
    description: (n) =>
      `${n} is a tiny amigurumi charm for your keys, bag or backpack. Lightweight, durable and fitted with a sturdy metal ring. ${handmadeNote}`,
  },
  toys: {
    code: "TY",
    priceRange: [499, 999],
    tags: ["toy", "amigurumi", "plush", "soft toy", "handmade", "gift"],
    description: (n) =>
      `${n} is a huggable amigurumi friend, firmly stitched and stuffed with soft fibre-fill. Not suitable for children under 3. ${handmadeNote}`,
  },
  bags: {
    code: "BG",
    priceRange: [899, 1599],
    tags: ["bag", "crochet bag", "handbag", "handmade", "accessories"],
    description: (n) =>
      `${n} — a sturdy, stylish crochet bag with plenty of room for your everyday essentials. ${handmadeNote}`,
  },
  "hair-accessories": {
    code: "HA",
    priceRange: [199, 449],
    tags: ["hair accessory", "headband", "bandana", "handmade", "accessories"],
    description: (n) =>
      `${n} adds a soft, handmade touch to any outfit. Comfortable to wear all day. ${handmadeNote}`,
  },
};

const SMALL_WORDS = new Set([
  "by",
  "of",
  "and",
  "with",
  "for",
  "in",
  "the",
  "a",
]);
const COLOUR_WORDS = new Set([
  "blue",
  "red",
  "black",
  "white",
  "pink",
  "brown",
  "yellow",
  "green",
  "cream",
  "lavender",
  "fuchsia",
  "citron",
  "mustard",
  "blush",
  "off-white",
  "dark",
  "sea",
]);
const BRANDS = ["clover", "prym", "pony", "hobby store"];

/** Folder name → URL slug: lower-case, trailing numeric IDs (4+ digits) removed. */
export function productSlug(folder: string): string {
  return folder
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-\d{4,}$/, "");
}

/** Folder name → display name, e.g. "Amour-Crochet-Hook-by-Clover" → "Amour Crochet Hook by Clover". */
export function productName(folder: string): string {
  return productSlug(folder)
    .split("-")
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Search tags: category tags + brand + colour words found in the name. */
export function productTags(slug: string, collection: string): string[] {
  const words = slug.split("-");
  const text = words.join(" ");
  const tags = new Set(CATEGORY_RULES[collection]?.tags ?? []);
  for (const brand of BRANDS) if (text.includes(brand)) tags.add(brand);
  for (const word of words)
    if (COLOUR_WORDS.has(word) && word !== "dark" && word !== "sea")
      tags.add(word);
  return [...tags];
}

/** Storage-safe file name: lower-case, hyphens only, extension kept. */
export function storageFileName(file: string): string {
  const dot = file.lastIndexOf(".");
  const base = file
    .slice(0, dot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}${file.slice(dot).toLowerCase()}`;
}

/** Stable 0..1 number from a string (so regenerated seeds don't change). */
export function stableFraction(key: string): number {
  return createHash("sha256").update(key).digest().readUInt32BE(0) / 0xffffffff;
}

/** Deterministic UUID (v5-style layout) so seed files can reference rows by id. */
export function stableUuid(key: string): string {
  const hex = createHash("sha1").update(`dream-needles:${key}`).digest("hex");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Round to a retail price ending in 9, e.g. 417 → 419, 1302 → 1299. */
export function retailPrice(value: number): number {
  return Math.max(9, Math.round(value / 10) * 10 - 1);
}

export function placeholderPrice(slug: string, collection: string): number {
  const [min, max] = CATEGORY_RULES[collection]?.priceRange ?? [299, 999];
  return retailPrice(min + stableFraction(`price:${slug}`) * (max - min));
}
