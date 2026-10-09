import { test } from "@playwright/test";

/** Pages to capture; extend as pages are built. Filter with PAGES=home,menu. */
const PAGES: {
  name: string;
  path: string;
  action?: "mega-menu" | "mobile-menu" | "search" | "wishlist";
  seed?: boolean;
}[] = [
  { name: "home", path: "/" },
  { name: "search-popup", path: "/", action: "search" },
  { name: "search-page", path: "/search?q=keychain" },
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
  { name: "login", path: "/login" },
  { name: "checkout-guest", path: "/checkout", seed: true },
  { name: "verify", path: "/login/verify?email=maker%40example.com" },
  { name: "cart", path: "/cart", seed: true },
  {
    name: "cart-drawer",
    path: "/collections/key-chains",
    seed: true,
    action: "cart" as never,
  },
  { name: "wishlist", path: "/", seed: true, action: "wishlist" },
  { name: "mega-menu-tools", path: "/", action: "mega-menu" },
  { name: "mobile-menu", path: "/", action: "mobile-menu" },
];

const only = process.env.PAGES?.split(",");

for (const page of PAGES.filter((p) => !only || only.includes(p.name))) {
  test(page.name, async ({ page: browser }, testInfo) => {
    if (page.seed) {
      // Guest cart + wishlist fixtures (real product ids from the seed data).
      await browser.addInitScript(() => {
        localStorage.setItem(
          "dn:cart",
          JSON.stringify([
            {
              productId: "e73635c0-e1ed-5142-a63f-0b3f03ec8b85",
              variantId: null,
              quantity: 2,
            },
            {
              productId: "7b1ef09e-7e82-5b68-aa61-7f95cf6c049f",
              variantId: null,
              quantity: 1,
            },
          ]),
        );
        localStorage.setItem(
          "dn:wishlist",
          JSON.stringify([
            "6b225808-10ef-579a-86e2-af5c51a64606",
            "e73635c0-e1ed-5142-a63f-0b3f03ec8b85",
          ]),
        );
      });
    }
    await browser.goto(page.path, { waitUntil: "networkidle" });
    if ((page.action as string) === "cart") {
      await browser
        .getByRole("button", { name: /^Cart, / })
        .first()
        .click();
      await browser.waitForTimeout(1200);
    }
    if (page.action === "wishlist") {
      const mobile = testInfo.project.name === "mobile";
      await (
        mobile
          ? browser
              .getByRole("navigation", { name: "Quick links" })
              .getByRole("button", { name: "Wishlist" })
          : browser.getByRole("button", { name: /^Wishlist, / })
      ).click();
      await browser.waitForTimeout(1200);
    }
    if (page.action === "mega-menu") {
      if (testInfo.project.name !== "desktop") test.skip();
      await browser.getByRole("button", { name: "Tools", exact: true }).click();
    }
    if (page.action === "search") {
      const mobile = testInfo.project.name === "mobile";
      await (
        mobile
          ? browser
              .getByRole("navigation", { name: "Quick links" })
              .getByRole("button", { name: "Search" })
          : browser.getByRole("button", { name: "Search", exact: true })
      ).click();
      await browser.getByRole("combobox").fill("keychain");
      await browser.getByRole("option").first().waitFor();
      await browser.waitForTimeout(500);
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
      fullPage: !page.action && !["login", "verify"].includes(page.name),
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
