const { defineConfig, devices } = require("@playwright/test");
const serverLifecycle = require("./test/e2e/server-lifecycle");

module.exports = defineConfig({
  testDir: "./test/e2e",

  globalSetup: "./test/e2e/server-lifecycle.js",

  timeout: 30000,

  retries: process.env.CI ? 1 : 0,

  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: serverLifecycle.BASE_URL,
    trace: "on-first-retry"
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
