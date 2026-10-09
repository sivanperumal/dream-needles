import { readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, type Page, test } from "@playwright/test";

/** Admin panel against the real Supabase project; all test data is removed afterwards. */
config({ path: ".env.local", quiet: true });
const admin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      )
    : null;

test.describe.configure({ mode: "serial" });
const stamp = Date.now();
const adminEmail = `e2e-admin-${stamp}@dreamneedles.test`;
const customerEmail = `e2e-customer-${stamp}@dreamneedles.test`;
const productName = `E2E Test Scrunchie ${stamp}`;
const productSlug = `e2e-test-scrunchie-${stamp}`;
const collectionName = `E2E Scrunchies ${stamp}`;
const userIds: string[] = [];

async function signIn(page: Page, email: string, role: "admin" | "customer") {
  const { data } = await admin!.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  userIds.push(data.user!.id);
  if (role === "admin")
    await admin!
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user!.id);
  await page.goto(
    `/login/verify?email=${encodeURIComponent(email)}&next=/admin`,
    { waitUntil: "networkidle" },
  );
  await page.getByLabel("Digit 1").fill(data.properties!.email_otp);
}

test.beforeEach(({}, testInfo) => {
  test.skip(
    !admin || testInfo.project.name !== "desktop",
    "needs Supabase; runs once",
  );
});

test.afterAll(async () => {
  if (!admin) return;
  const { data: product } = await admin
    .from("products")
    .select("id, product_images (storage_path)")
    .eq("slug", productSlug)
    .maybeSingle();
  if (product) {
    await admin.storage
      .from("product-images")
      .remove(product.product_images.map((i) => i.storage_path));
    await admin.from("products").delete().eq("id", product.id);
  }
  await admin.from("collections").delete().eq("name", collectionName);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
});

test("customers can't open the admin panel", async ({ page }) => {
  await signIn(page, customerEmail, "customer");
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/admin/products");
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("admin manages a product end to end", async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page, adminEmail, "admin");
  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Total orders")).toBeVisible();

  // New collection under Handmade › Accessories, shown in the menu.
  await page.goto("/admin/collections/new", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill(collectionName);
  await page
    .getByLabel("Parent collection")
    .selectOption({ label: "Handmade › Accessories" });
  await page.getByRole("button", { name: "Create collection" }).click();
  await expect(page.getByText("Collection created.")).toBeVisible();

  // New product: draft → images → active, assigned to the collection.
  await page.goto("/admin/products/new", { waitUntil: "networkidle" });
  await page.getByLabel("Name", { exact: true }).fill(productName);
  await expect(page.getByLabel("URL slug")).toHaveValue(productSlug);
  await page.getByLabel("Price (₹, incl. GST)").fill("349");
  await page.getByLabel("Compare-at price (₹)").fill("299");
  await page.getByLabel("Stock").fill("7");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(
    page.getByText("Compare-at price should be higher than the price."),
  ).toBeVisible();
  await page.getByLabel("Compare-at price (₹)").fill("449");
  await page.getByLabel("Tags").fill("scrunchie, e2e-unique-tag");
  await page.getByLabel(collectionName).check();
  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/);

  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Add images/ }).click();
  await (
    await fileChooser
  ).setFiles(
    `images/products/tomato-keychain-red/${readdirSync("images/products/tomato-keychain-red").find((f) => !f.startsWith("."))}`,
  );
  await expect(page.getByText("MAIN")).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("Status").selectOption("active");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved.")).toBeVisible();

  // Storefront: product page, collection, header menu and search update at once.
  await page.goto(`/products/${productSlug}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  const { data: collection } = await admin!
    .from("collections")
    .select("slug")
    .eq("name", collectionName)
    .single();
  await page.goto(`/collections/${collection!.slug}`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByRole("link", { name: productName })).toBeVisible();
  await page.getByRole("button", { name: "Handmade", exact: true }).click();
  await expect(
    page.locator("#mega-menu").getByRole("link", { name: collectionName }),
  ).toBeVisible();
  const search = await page.request.get(`/api/search?q=e2e-unique-tag`);
  expect(
    (await search.json()).products.map((p: { slug: string }) => p.slug),
  ).toContain(productSlug);

  // Other admin pages load.
  for (const [path, heading] of [
    ["/admin/orders", "Orders"],
    ["/admin/coupons", "Coupons"],
    ["/admin/reviews", "Reviews"],
    ["/admin/contact", "Contact messages"],
    ["/admin/home", "Home page"],
    ["/admin/navigation", "Navigation"],
    ["/admin/pages/faq", "Frequently Asked Questions"],
    ["/admin/settings", "Settings"],
  ] as const) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  }

  // Soft delete hides it from the store.
  await page.goto("/admin/products", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: productName }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText(/Product hidden/)).toBeVisible();
  const gone = await page.goto(`/products/${productSlug}`);
  expect(gone?.status()).toBeLessThan(500);
  await expect(
    page.getByRole("heading", { name: "We dropped a stitch" }),
  ).toBeVisible();
});
