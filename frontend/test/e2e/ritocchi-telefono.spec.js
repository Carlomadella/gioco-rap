const { test, expect } = require("@playwright/test");

/* Prova sul telefono del 27/09/2026: la conferma dello spostamento a 844 × 390
   si apriva già tagliata in alto, e le Notifiche dicevano «1 eventi · 1 nuovi». */
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

test("in orizzontale la conferma del viaggio si apre dal titolo", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => GAME.enter());
  /* la strada vera: il cartello dello Studio sulla mappa */
  await page.locator('.pspot[data-l="studio"]').dispatchEvent("click");
  await expect(page.locator("#modal")).toHaveClass(/travel-confirm/);
  await page.waitForTimeout(300);
  const scorsa = await page.evaluate(() => document.querySelector("#modal .sheet2").scrollTop);
  expect(scorsa).toBe(0);
  /* dal 28/09 è più piccola e di traverso ci sta tutta, senza scorrere */
  const scorre = await page.evaluate(() => {
    const s = document.querySelector("#modal .sheet2");
    return s.scrollHeight - s.clientHeight;
  });
  expect(scorre).toBeLessThanOrEqual(1);
  /* e il tasto «Resta qui» ha comunque il fuoco */
  expect(await page.evaluate(() => document.activeElement.classList.contains("travel-cancel"))).toBe(true);
});

test("le Notifiche contano al singolare", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_EVENTI && ADF_EVENTI.addNotification);
  const testo = await page.evaluate(() => {
    GAME.enter();
    ADF_EVENTI.addNotification({title:"Prova", tier:"basso", read:false});
    /* l'app si apre col suo cartello, come dal telefono (eventi-v2.js) */
    const app = document.createElement("button"); app.dataset.app = "notifiche";
    document.body.appendChild(app); app.click(); app.remove();
    return document.querySelector(".adf-ntool div").textContent;
  });
  expect(testo).toContain("1 evento dagli skip");
  expect(testo).toContain("1 nuovo");
});
