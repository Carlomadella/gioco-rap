const { test, expect } = require("@playwright/test");

/* Non carica i 145 MB: intercetta il relay appena il creator lo sceglie.
   Verifica in Chromium touch vero che il telefono entri DAVVERO nel percorso
   mobile prima del bootstrap MakeHuman. */
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});

test("l'avvio rapido mobile seleziona davvero il relay MakeHuman mobile", async ({ page }) => {
  let richiestaRelay = "";

  await page.route(
    /\/media\/makehuman-mobile-v1\/index\.html(?:\?.*)?$/,
    async route => {
      richiestaRelay = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: "<!doctype html><html><body>relay mobile intercettato dal test</body></html>"
      });
    }
  );

  await page.goto("/pagine/gioco.html?nuova=rapido");

  await page.waitForFunction(() =>
    window.ADF_MAKEHUMAN_MOBILE?.attivo === true &&
    window.ADF_MAKEHUMAN_MOBILE?.quick === true &&
    window.ADF_MAKEHUMAN_MOBILE?.watchdog === "top-level-v3"
  );

  const creator = page.frameLocator("#adf-rpg-v24-frame");
  const editor = creator.locator("#localEditorFrame");

  await expect(editor).toHaveAttribute("data-makehuman-mobile", "1");
  await expect(editor).toHaveAttribute("data-makehuman-mobile-quick", "1");
  await expect(editor).toHaveAttribute(
    "data-makehuman-src",
    "../makehuman-mobile-v1/index.html?v=3"
  );

  await expect.poll(() => richiestaRelay, { timeout: 10000 })
    .toContain("/media/makehuman-mobile-v1/index.html?v=3");

  const srcReale = await editor.evaluate(el => el.src);
  expect(srcReale).toContain("/media/makehuman-mobile-v1/index.html?v=3");
});
