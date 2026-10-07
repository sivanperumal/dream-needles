import { defineConfig } from "@playwright/test";

/**
 * Visual QA: `npm run screenshots` captures pages at the three Figma widths
 * into e2e/__screenshots__/ for side-by-side comparison with the designs.
 * Set BASE_URL to use an already-running server (default starts `next dev`).
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3100";

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
        command: "npm run dev -- --port 3100",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
