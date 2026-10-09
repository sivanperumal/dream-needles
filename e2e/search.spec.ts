import { expect, test } from "@playwright/test";

/** Behaviour tests for the live search popup and /search page. */
test.describe("live search", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "tablet",
      "covered by desktop and mobile",
    );
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger =
      testInfo.project.name === "mobile"
        ? page
            .getByRole("navigation", { name: "Quick links" })
            .getByRole("button", { name: "Search" })
        : page.getByRole("button", { name: "Search", exact: true });
    await trigger.click();
  });

  test("finds products despite a typo and opens one with the keyboard", async ({
    page,
  }) => {
    const input = page.getByRole("combobox", {
      name: "Search products and collections",
    });
    await expect(input).toBeFocused();
    await input.fill("crochte");
    const results = page.getByRole("listbox", { name: "Search results" });
    await expect(results.getByRole("option").first()).toBeVisible();
    await expect(results).toContainText(/crochet/i);

    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /opt-0$/);
    await input.press("Enter");
    await expect(page).toHaveURL(/\/(products|collections)\//);
    await expect(
      page.getByRole("dialog", { name: "Search the store" }),
    ).toHaveCount(0);
  });

  test("shows collections with their parent", async ({ page }) => {
    await page.getByRole("combobox").fill("bags");
    await expect(page.getByRole("listbox")).toContainText("Accessories ›");
  });

  test("shows a helpful empty state", async ({ page }) => {
    await page.getByRole("combobox").fill("zzzqqq");
    await expect(page.getByText("No results for “zzzqqq”")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Browse What's New/ }),
    ).toBeVisible();
  });

  test("Enter without a highlighted result opens the full results page", async ({
    page,
  }) => {
    const input = page.getByRole("combobox");
    await input.fill("hook");
    await expect(page.getByRole("option").first()).toBeVisible();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=hook/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("hook");
  });

  test("Escape and clicking outside close the popup", async ({
    page,
  }, testInfo) => {
    await page.getByRole("combobox").press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Search the store" }),
    ).toHaveCount(0);
    if (testInfo.project.name === "desktop") {
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await page.mouse.click(20, 800);
      await expect(
        page.getByRole("dialog", { name: "Search the store" }),
      ).toHaveCount(0);
    }
  });
});
