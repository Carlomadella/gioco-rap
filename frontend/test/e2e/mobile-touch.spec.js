const { test, expect } = require("@playwright/test");

/* Dal 02/10/2026 il gameplay mobile ha come orientamento supportato il landscape.
   In portrait non si mantiene un secondo layout di gioco: si verifica soltanto
   che l'utente riceva l'indicazione di ruotare il dispositivo. */
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});

test("in portrait viene chiesto di ruotare il telefono", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.waitForFunction(() => window.ADF_MOBILE_ORIENTATION_HINT);

  const hint = page.locator("#adf-mobile-orientation-hint");
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("ruota il telefono in orizzontale");
});
