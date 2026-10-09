import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, type Page, test } from "@playwright/test";

/**
 * Sign-in → account → guest-cart merge, against the real Supabase project.
 * Uses a throwaway user and the admin API to mint a login code (no email is
 * sent). The user is deleted afterwards.
 */
config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;

test.describe.configure({ mode: "serial" });
test.skip(!admin, "Needs Supabase keys in .env.local");

const email = `e2e-${Date.now()}@dreamneedles.test`;
let userId: string | undefined;

async function loginCode() {
  const { data, error } = await admin!.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw error;
  userId = data.user.id;
  return data.properties.email_otp;
}

async function signIn(page: Page, next = "/account") {
  const code = await loginCode();
  await page.goto(
    `/login/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
    { waitUntil: "networkidle" },
  );
  await page.getByLabel("Digit 1").fill(code); // fills all six boxes and auto-submits
  await page.waitForURL(`**${next}`);
}

test.afterAll(async () => {
  if (userId) await admin!.auth.admin.deleteUser(userId);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/account/addresses");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Faddresses/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a wrong code shows an error", async ({ page }) => {
  await loginCode();
  await page.goto(`/login/verify?email=${encodeURIComponent(email)}`, {
    waitUntil: "networkidle",
  });
  await page.getByLabel("Digit 1").fill("000000");
  await expect(page.getByText(/wrong or has expired/)).toBeVisible();
});

test("guest cart merges into the account after sign-in", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "account flow runs once");
  await page.goto("/products/tomato-keychain-red", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await expect(
    page.getByRole("button", { name: "Cart, 1 items" }),
  ).toBeVisible();

  await signIn(page);
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();

  // The guest item is now stored on the account.
  await expect(
    page.getByRole("button", { name: "Cart, 1 items" }),
  ).toBeVisible();
  const { data: rows } = await admin!
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId!);
  expect(rows).toEqual([{ quantity: 1 }]);
});

test("profile and address book", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "account flow runs once");
  await signIn(page);

  await page.getByRole("button", { name: "Edit Profile" }).click();
  await page.getByLabel("Full name").fill("Test Maker");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile updated.")).toBeVisible();
  await expect(page.getByText("Test Maker").first()).toBeVisible();

  await page.goto("/account/addresses", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add address" }).click();
  await page.getByLabel("Full name").fill("Test Maker");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByLabel(/Flat \/ house no/).fill("12 Main Road");
  await page.getByLabel("Pincode").fill("600017");
  await expect(page.getByLabel("City / district")).toHaveValue(/Chennai/); // filled from the pincode
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("Address added.")).toBeVisible();
  await expect(page.getByText("Default address")).toBeVisible();

  await page.getByRole("button", { name: "Add address" }).click();
  await page.getByLabel("Full name").fill("x");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(
    page.getByText("Enter a valid 10-digit mobile number."),
  ).toBeVisible();
});
