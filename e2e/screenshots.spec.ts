import { test } from "@playwright/test";

/** Pages to capture; extend as pages are built. Filter with PAGES=home,menu. */
const PAGES: {
  name: string;
  path: string;
  action?: "mega-menu" | "mobile-menu";
}[] = [
  { name: "home", path: "/" },
  { name: "collection", path: "/collections/handmade" },
  { name: "collection-empty", path: "/collections/rakhis" },
  {
    name: "product",
    path: "/products/handmade-amigurumi-crochet-penguin-keychain-sea-blue",
  },
  { name: "retail-store", path: "/retail-store" },
  { name: "our-story", path: "/our-story" },
  { name: "faq", path: "/faq" },
  { name: "policy", path: "/shipping-policy" },
  { name: "not-found", path: "/nope-not-here" },
  { name: "mega-menu-tools", path: "/", action: "mega-menu" },
  { name: "mobile-menu", path: "/", action: "mobile-menu" },
];

const only = process.env.PAGES?.split(",");

for (const page of PAGES.filter((p) => !only || only.includes(p.name))) {
  test(page.name, async ({ page: browser }, testInfo) => {
    await browser.goto(page.path, { waitUntil: "networkidle" });
    if (page.action === "mega-menu") {
      if (testInfo.project.name !== "desktop") test.skip();
      await browser.getByRole("button", { name: "Tools", exact: true }).click();
    }
    if (page.action === "mobile-menu") {
      if (testInfo.project.name === "desktop") test.skip();
      await browser
        .getByRole("button", { name: "Open navigation menu" })
        .click();
      await browser.waitForTimeout(400);
    }
    await browser.screenshot({
      path: `e2e/__screenshots__/${testInfo.project.name}/${page.name}.png`,
      fullPage: !page.action,
    });
  });
}

/** Header (with Tools mega-menu open on desktop) and footer as separate images. */
test("layout-parts", async ({ page }, testInfo) => {
  if (only && !only.includes("layout-parts")) test.skip();
  const dir = `e2e/__screenshots__/${testInfo.project.name}`;
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("footer").screenshot({ path: `${dir}/part-footer.png` });
  if (testInfo.project.name === "desktop") {
    await page.getByRole("button", { name: "Tools", exact: true }).click();
  }
  const width = page.viewportSize()!.width;
  await page.screenshot({
    path: `${dir}/part-header.png`,
    clip: { x: 0, y: 0, width, height: 420 },
  });
});
