import { defineConfig } from "@playwright/test"

if (!process.env.PORTFOLIO_PROJECT) throw new Error("Set PORTFOLIO_PROJECT to the freshly exported project")

export default defineConfig({
  testDir: "./tests/standalone",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3107", browserName: "chromium" },
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 3107",
    cwd: process.env.PORTFOLIO_PROJECT,
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 60000,
  },
})
