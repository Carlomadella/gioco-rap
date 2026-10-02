const { test, expect } = require("@playwright/test");

/* Dal 02/10/2026 il landscape e' il riferimento del gameplay mobile.
   Il portrait resta coperto da mobile-touch.spec.js come compatibilita'. */
test.use({
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true
});

async function entraNellaPlancia(page) {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.GAME && window.HUB && window.__G);
  await page.evaluate(() => {
    GAME.enter();
    HUB.apri();
  });
}

test("landscape mobile: landing e hub restano utilizzabili al tocco", async ({ page }) => {
  await page.goto("/pagine/landing.html");

  const avvio = page.locator("#m-play");
  await expect(avvio).toBeVisible();
  const box = await avvio.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(43.9);

  await entraNellaPlancia(page);
  await expect(page.locator("#s-hub")).toHaveClass(/on/);
  await expect(page.locator(".pspot").first()).toBeVisible();
});

test("landscape mobile: il suggerimento di rotazione non copre il gioco", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.waitForFunction(() => window.ADF_MOBILE_ORIENTATION_HINT);

  const hint = page.locator("#adf-mobile-orientation-hint");
  await expect(hint).toBeHidden();
  await expect(page.locator("#m-play")).toBeVisible();
});
