import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for The Heuman Chef.
 *
 * The server is OURS: `next dev` and `next build` share `.next`, so running the
 * suite against a dev server on :3000 would race whatever the developer has
 * running. We build and `next start` on a dedicated port instead, with
 * `reuseExistingServer: false` so a stale process is never silently reused.
 *
 * `NEXT_PUBLIC_SITE_URL` MUST match the test origin: the payment callback builds
 * absolute redirect URLs from it (`getSiteUrl()`), so a mismatch would bounce the
 * checkout test off to :3000 mid-flow.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One retry everywhere, so `trace: "on-first-retry"` actually produces traces.
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // The stub payment provider bounces through our own callback; keep the
    // navigation budget generous for that hop.
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],

  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      // Stub mode: no credentials ⇒ the provider never touches the network and
      // completes the payment offline through our own callback route.
      PAYMENT_PROVIDER: "yeshinvoice",
      DELIVERY_PROVIDER: "stub",
      INVOICE_PROVIDER: "stub",
      ORDER_REPOSITORY: "memory",
    },
  },
});
