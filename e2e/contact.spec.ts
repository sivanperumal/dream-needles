import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";

config({ path: ".env.local", quiet: true });
const admin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      )
    : null;
const email = `e2e-contact-${Date.now()}@dreamneedles.test`;

test.afterAll(async () => {
  await admin?.from("contact_submissions").delete().eq("email", email);
});

test("contact form validates and saves the message", async ({
  page,
}, testInfo) => {
  test.skip(
    !admin || testInfo.project.name !== "desktop",
    "needs Supabase; runs once",
  );
  await page.goto("/contact", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /Send Message/ }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please choose a topic.")).toBeVisible();

  await page.getByLabel("Full name").fill("Test Maker");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Inquiry topic").selectOption("Custom order");
  await page
    .getByLabel(/Your message/)
    .fill("Could you crochet a lavender elephant?");
  await page.getByRole("button", { name: /Send Message/ }).click();
  await expect(page.getByText(/Your message has been sent/)).toBeVisible();

  // Saved in Supabase; the Google Sheet copy runs after the response.
  await expect
    .poll(
      async () =>
        (
          await admin!
            .from("contact_submissions")
            .select("subject, sheet_synced, sheet_error")
            .eq("email", email)
        ).data,
      { timeout: 15_000 },
    )
    .toEqual([expect.objectContaining({ subject: "Custom order" })]);
  // Wait for the background Google Sheet copy (success or a recorded error).
  const sync = async () =>
    (
      await admin!
        .from("contact_submissions")
        .select("sheet_synced, sheet_error")
        .eq("email", email)
        .single()
    ).data;
  await expect
    .poll(
      async () => {
        const d = await sync();
        return Boolean(d?.sheet_synced || d?.sheet_error);
      },
      { timeout: 25_000 },
    )
    .toBe(true);
  const data = await sync();
  console.log("Google Sheet sync:", data);
  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL)
    expect(data).toEqual({ sheet_synced: true, sheet_error: null });
});
