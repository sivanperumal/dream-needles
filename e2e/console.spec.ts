import { expect, test } from "@playwright/test";

/** Fails if a page logs errors in the browser console (hydration, React, network). */
const PAGES = (process.env.PAGES ?? "/").split(",");

for (const path of PAGES) {
  test(`no console errors: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on(
      "console",
      (msg) => msg.type() === "error" && errors.push(msg.text()),
    );
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    expect(errors, errors.join("\n")).toEqual([]);
  });
}
