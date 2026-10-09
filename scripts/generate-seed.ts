/**
 * Scans images/products-old (originals grouped as <Top>/<Collection>/<Sub>/<product>/,
 * which is where collection assignments come from) and writes:
 *   supabase/seed/01_collections.sql   collection tree + header/footer menu items
 *   supabase/seed/02_products.sql      products, images and collection assignments
 *   supabase/seed/image-manifest.json  local file → storage path (used by upload-images.ts)
 *   images/products/<slug>/NN-file      flat copies named exactly like the storage paths
 *
 * Run: npm run seed:generate
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  CATEGORY_RULES,
  COLLECTION_TREE,
  FOLDER_TO_COLLECTION,
  FOOTER_COLUMNS,
  type CollectionSeed,
  placeholderPrice,
  productName,
  productSlug,
  productTags,
  retailPrice,
  stableFraction,
  stableUuid,
  storageFileName,
} from "./lib/catalog";

const ROOT = join(__dirname, "..");
const PRODUCTS_DIR = join(ROOT, "images", "products-old");
// Flat copies, one folder per product slug, mirroring the storage bucket.
const FLAT_DIR = join(ROOT, "images");
const SEED_DIR = join(ROOT, "supabase", "seed");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

const lit = (value: string | null | undefined) =>
  value == null ? "null" : `'${value.replace(/'/g, "''")}'`;
const textArray = (values: string[]) =>
  values.length
    ? `array[${values.map(lit).join(", ")}]::text[]`
    : "'{}'::text[]";
const collectionId = (slug: string) => stableUuid(`collection:${slug}`);

const dirs = (path: string) =>
  readdirSync(path)
    .filter(
      (name) =>
        !name.startsWith(".") && statSync(join(path, name)).isDirectory(),
    )
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

/* ---------------------------------------------------------------- scan */

type ScannedProduct = {
  slug: string;
  name: string;
  collections: string[];
  images: { local: string; file: string }[];
};

function scanProducts(): ScannedProduct[] {
  const bySlug = new Map<string, ScannedProduct>();
  for (const top of dirs(PRODUCTS_DIR)) {
    for (const group of dirs(join(PRODUCTS_DIR, top))) {
      for (const sub of dirs(join(PRODUCTS_DIR, top, group))) {
        const key = `${top}/${group}/${sub}`;
        const collection = FOLDER_TO_COLLECTION[key];
        if (!collection)
          throw new Error(
            `No collection mapping for images/products-old/${key}`,
          );
        for (const folder of dirs(join(PRODUCTS_DIR, key))) {
          const slug = productSlug(folder);
          const product = bySlug.get(slug) ?? {
            slug,
            name: productName(folder),
            collections: [],
            images: [],
          };
          if (!product.collections.includes(collection))
            product.collections.push(collection);
          const files = readdirSync(join(PRODUCTS_DIR, key, folder))
            .filter((f) => IMAGE_EXT.test(f))
            .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
          for (const file of files) {
            // The same product can live in two folders; keep each image once.
            if (
              product.images.some(
                (i) => i.file.toLowerCase() === file.toLowerCase(),
              )
            )
              continue;
            product.images.push({
              local: relative(ROOT, join(PRODUCTS_DIR, key, folder, file)),
              file,
            });
          }
          bySlug.set(slug, product);
        }
      }
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/* --------------------------------------------------------- collections */

function collectionsSql(): string {
  const rows: string[] = [];
  const walk = (nodes: CollectionSeed[], parent: string | null) =>
    nodes.forEach((node, index) => {
      rows.push(
        `  (${lit(collectionId(node.slug))}, ${parent ? lit(collectionId(parent)) : "null"}, ` +
          `${lit(node.name)}, ${lit(node.slug)}, ${lit(node.description)}, ` +
          `${node.showInMenu ?? true}, ${node.showViewAll ?? false}, ${index}, ${node.isSystem ?? false})`,
      );
      if (node.children) walk(node.children, node.slug);
    });
  walk(COLLECTION_TREE, null);

  const menuRows: string[] = [
    // Extra header link after the collection menus.
    `  (${lit(stableUuid("menu:header:retail-store"))}, 'header', null, 'Retail Store', null, '/retail-store', true, 100)`,
  ];
  FOOTER_COLUMNS.forEach((column, columnIndex) => {
    const columnId = stableUuid(`menu:footer:${column.label}`);
    menuRows.push(
      `  (${lit(columnId)}, 'footer', null, ${lit(column.label)}, ` +
        `${column.slug ? lit(collectionId(column.slug)) : "null"}, null, ${Boolean(column.slug)}, ${columnIndex})`,
    );
    column.links.forEach((link, linkIndex) => {
      menuRows.push(
        `  (${lit(stableUuid(`menu:footer:${column.label}:${link.label}`))}, 'footer', ${lit(columnId)}, ` +
          `${lit(link.label)}, ${link.slug ? lit(collectionId(link.slug)) : "null"}, ${lit(link.url)}, true, ${linkIndex})`,
      );
    });
  });

  return `-- Generated by scripts/generate-seed.ts — do not edit by hand.
-- Collection tree (parents before children) and navigation menus.

insert into public.collections
  (id, parent_id, name, slug, description, show_in_menu, show_view_all, menu_order, is_system)
values
${rows.join(",\n")}
on conflict (slug) do nothing;

insert into public.menu_items
  (id, menu, parent_id, label, collection_id, url, is_link, sort_order)
values
${menuRows.join(",\n")}
on conflict (id) do nothing;
`;
}

/* ------------------------------------------------------------ products */

function productsSql(products: ScannedProduct[]) {
  const productRows: string[] = [];
  const imageRows: string[] = [];
  const assignmentRows: string[] = [];
  const manifest: { local: string; path: string }[] = [];
  const mirror: { source: string; path: string }[] = [];
  const skuCounters = new Map<string, number>();
  const collectionCounters = new Map<string, number>();

  products.forEach((product, index) => {
    const primary = product.collections[0];
    const rules = CATEGORY_RULES[primary];
    const id = stableUuid(`product:${product.slug}`);

    const counter = (skuCounters.get(rules.code) ?? 0) + 1;
    skuCounters.set(rules.code, counter);
    const sku = `DN-${rules.code}-${String(counter).padStart(3, "0")}`;

    const price = placeholderPrice(product.slug, primary);
    const compareAt =
      stableFraction(`compare:${product.slug}`) < 0.6
        ? retailPrice(price * 1.3)
        : null;
    // A few low/out-of-stock items so those states can be tested.
    const stock = index % 13 === 6 ? 0 : index % 7 === 4 ? 3 : 20;
    const badges =
      index % 9 === 0
        ? ["Bestseller"]
        : index % 11 === 5
          ? ["Limited Edition"]
          : [];
    const daysAgo = Math.floor(stableFraction(`age:${product.slug}`) * 58) + 1;
    // Products without photos stay as drafts until an image is uploaded.
    const status = product.images.length ? "active" : "draft";

    productRows.push(
      `  (${lit(id)}, ${lit(product.name)}, ${lit(product.slug)}, ${lit(rules.description(product.name))}, ` +
        `${lit(sku)}, ${textArray(productTags(product.slug, primary))}, ${price.toFixed(2)}, ` +
        `${compareAt ? compareAt.toFixed(2) : "null"}, ${stock}, ${lit(status)}, ${textArray(badges)}, ` +
        `now() - interval '${daysAgo} days')`,
    );

    product.images.forEach((image, i) => {
      const path = `products/${product.slug}/${String(i + 1).padStart(2, "0")}-${storageFileName(image.file)}`;
      manifest.push({ local: `images/${path}`, path });
      mirror.push({ source: image.local, path });
      imageRows.push(
        `  (${lit(id)}, ${lit(path)}, ${lit(product.name)}, ${i})`,
      );
    });

    for (const collection of product.collections) {
      const position = collectionCounters.get(collection) ?? 0;
      collectionCounters.set(collection, position + 1);
      assignmentRows.push(
        `  (${lit(id)}, ${lit(collectionId(collection))}, ${position})`,
      );
    }
  });

  const sql = `-- Generated by scripts/generate-seed.ts — do not edit by hand.
-- ${products.length} products from images/products-old. Prices, stock and copy are
-- placeholders: edit them in the admin panel.
-- Run 01_collections.sql first.

insert into public.products
  (id, name, slug, description, sku, tags, price, compare_at_price, stock, status, badges, created_at)
values
${productRows.join(",\n")}
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt, sort_order)
values
${imageRows.join(",\n")}
on conflict (product_id, storage_path) do nothing;

insert into public.product_collections (product_id, collection_id, sort_order)
values
${assignmentRows.join(",\n")}
on conflict (product_id, collection_id) do nothing;
`;
  return { sql, manifest, mirror };
}

/* ---------------------------------------------------------------- main */

const products = scanProducts();
const { sql, manifest, mirror } = productsSql(products);
mkdirSync(SEED_DIR, { recursive: true });
writeFileSync(join(SEED_DIR, "01_collections.sql"), collectionsSql());
writeFileSync(join(SEED_DIR, "02_products.sql"), sql);
writeFileSync(
  join(SEED_DIR, "image-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

// Keep images/products/<slug>/ in sync with the storage paths (copies only
// what's missing, never overwrites or deletes).
let mirrored = 0;
for (const { source, path } of mirror) {
  const target = join(FLAT_DIR, path);
  if (existsSync(target)) continue;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, source), target);
  mirrored += 1;
}
if (mirrored) console.log(`Copied ${mirrored} image(s) into images/products/`);

const multi = products
  .filter((p) => p.collections.length > 1)
  .map((p) => p.slug);
const noImages = products.filter((p) => !p.images.length).map((p) => p.slug);
console.log(`Products: ${products.length} · images: ${manifest.length}`);
if (multi.length) console.log(`In several collections: ${multi.join(", ")}`);
if (noImages.length)
  console.log(`No images (seeded as draft): ${noImages.join(", ")}`);
