import { defineConfig, devices } from "@playwright/test"

/**
 * 🔱 Playwright config for Vedic Ghaḍī
 * Default: runs against local `npm run dev` on http://localhost:3030
 * CI / against deploy: set BASE_URL env to a deployed URL
 *
 * Usage:
 *   npm run e2e              — headless, runs dev server
 *   npm run e2e:ui           — Playwright UI mode
 *   BASE_URL=https://… npm run e2e   — against deployed Vercel URL (no webServer)
 */
const PORT = 3030
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,           // single page, sequential is fine
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],

  // Only start a dev server if BASE_URL is local
  webServer: BASE_URL.includes("localhost")
    ? {
        command: "npm run dev",
        port: PORT,
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
})
