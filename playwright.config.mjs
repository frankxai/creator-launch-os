import { defineConfig } from "@playwright/test"

// Local QA may use a separately supervised, TTL-bound server. CI owns its server.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseURL || "http://127.0.0.1:3106",
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseURL ? undefined : {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 3106",
    url: "http://127.0.0.1:3106/studio/templates",
    reuseExistingServer: false,
    timeout: 60000,
  },
})
