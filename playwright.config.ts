import { defineConfig } from "@playwright/test";

/**
 * Visual QA: `npm run screenshots` captures pages at the three Figma widths
 * into e2e/__screenshots__/ for side-by-side comparison with the designs.
 * Uses the `npm run dev` server on port 3000 if it is running, otherwise
 * starts one (Next.js allows only one dev server per project folder).
 * Set BASE_URL to test another server, e.g. a deployed preview.
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
