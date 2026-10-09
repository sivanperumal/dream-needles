import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";
config({ path: ".env.local", quiet: true });
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
test("admin + account pages have no console errors", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  test.setTimeout(120_000);
  const email = `e2e-console-${Date.now()}@dreamneedles.test`;
  const { data } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user!.id);
  const errors: string[] = [];
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      errors.push(`${page.url()} :: ${m.text().slice(0, 600)}`),
  );
  page.on("pageerror", (e) =>
    errors.push(`${page.url()} :: ${e.message.slice(0, 200)}`),
  );
  try {
    await page.goto(
      `/login/verify?email=${encodeURIComponent(email)}&next=/admin`,
      { waitUntil: "networkidle" },
    );
    await page.getByLabel("Digit 1").fill(data.properties!.email_otp);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 20_000,
    });
    const { data: p } = await admin
      .from("products")
      .select("id")
      .eq("slug", "tomato-keychain-red")
      .single();
    for (const path of [
      "/admin",
      `/admin/products/${p!.id}`,
      "/admin/products",
      "/admin/collections",
      "/admin/orders",
      "/admin/home",
      "/admin/navigation",
      "/admin/pages/faq",
      "/admin/settings",
      "/admin/coupons",
      "/admin/reviews",
      "/admin/contact",
      "/account",
      "/account/addresses",
      "/account/orders",
      "/checkout",
      "/contact",
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
    }
  } finally {
    await admin.auth.admin.deleteUser(data.user!.id);
  }
  expect(errors, errors.join("\n")).toEqual([]);
});
