const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 64: sotto i 900 px la mappa scorre di lato, ma
   niente lo diceva e «LIVE CLUB» sembrava la fine della città. */
async function plancia(page){
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => GAME.enter());
}

test.describe("sul telefono", () => {
  /* con «riduci movimento» la freccia sta ferma: si tocca, e si prova anche quella regola */
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  test("la freccia dice che la città continua, e sparisce in fondo", async ({ page }) => {
    const errori = [];
    page.on("pageerror", e => errori.push(e.message));
    await plancia(page);
    const freccia = page.locator(".pmappa-freccia");
    await expect(freccia).toBeVisible();
    const box = await freccia.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.width).toBeGreaterThanOrEqual(44);

    await freccia.tap();
    await expect.poll(() => page.evaluate(() => document.querySelector(".pmappa").scrollLeft)).toBeGreaterThan(0);
    /* e dopo lo scorrimento la freccia è ancora sul bordo destro, non a metà città */
    await page.waitForTimeout(600);
    const dopo = await freccia.boundingBox();
    expect(dopo.x + dopo.width).toBeLessThanOrEqual(390);
    expect(dopo.x).toBeGreaterThan(390 - 70);
    /* anche a metà di una trascinata */
    await page.evaluate(() => { const m = document.querySelector(".pmappa"); m.scrollLeft = Math.round((m.scrollWidth - m.clientWidth) / 2); });
    await page.waitForTimeout(200);
    const meta = await freccia.boundingBox();
    expect(meta.x).toBeGreaterThan(390 - 70);

    await page.evaluate(() => { const m = document.querySelector(".pmappa"); m.scrollLeft = m.scrollWidth; });
    await expect(freccia).toBeHidden();
    expect(errori).toEqual([]);
  });
});

test("sul monitor la mappa non scorre e la freccia non c'è", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await plancia(page);
  await expect(page.locator(".pmappa-freccia")).toBeHidden();
});
