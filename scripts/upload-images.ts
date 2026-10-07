/**
 * Uploads every product image listed in supabase/seed/image-manifest.json to
 * the `product-images` storage bucket, at the exact paths the seed SQL uses.
 * Safe to re-run: existing files are overwritten (upsert).
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local,
 * and migrations 0001–0009 already run (they create the bucket).
 *
 * Run: npm run upload-images
 */
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const BUCKET = "product-images";
const CONCURRENCY = 5;
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
const root = join(__dirname, "..");
const manifest: { local: string; path: string }[] = JSON.parse(
  readFileSync(join(root, "supabase", "seed", "image-manifest.json"), "utf8"),
);

async function upload({ local, path }: { local: string; path: string }) {
  const contentType = CONTENT_TYPES[extname(local).toLowerCase()];
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, readFileSync(join(root, local)), {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) throw new Error(`${local} → ${path}: ${error.message}`);
}

async function main() {
  const { error: bucketError } = await supabase.storage.getBucket(BUCKET);
  if (bucketError) {
    console.error(
      `Bucket "${BUCKET}" not found. Run migration 0009_storage_and_settings.sql first.`,
    );
    process.exit(1);
  }

  const failures: string[] = [];
  let done = 0;
  const queue = [...manifest];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        try {
          await upload(item);
        } catch (error) {
          failures.push((error as Error).message);
        }
        done += 1;
        process.stdout.write(`\rUploaded ${done}/${manifest.length}`);
      }
    }),
  );
  process.stdout.write("\n");

  if (failures.length) {
    console.error(
      `${failures.length} upload(s) failed:\n${failures.join("\n")}`,
    );
    process.exit(1);
  }
  console.log(`All ${manifest.length} images are in the "${BUCKET}" bucket.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
