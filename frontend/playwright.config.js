const { defineConfig, devices } = require("@playwright/test");
const serverLifecycle = require("./test/e2e/server-lifecycle");

module.exports = defineConfig({
  testDir: "./test/e2e",

  globalSetup: "./test/e2e/server-lifecycle.js",

  /* 60 e non 30 (27/09/2026): le prove sono più di venti, quasi tutte caricano
     la pagina del gioco due volte (pulizia del salvataggio e ricarica), e con
     quattro in parallelo un ricaricamento può passare i 30 secondi senza che
     niente sia rotto. Una prova vera che si pianta resta rossa lo stesso. */
  timeout: 60000,

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
