const { test, expect } = require("@playwright/test");

/* Prova sul telefono del 27/09/2026: l'orologio del tempo (z-index 142) stava
   sopra la modale (60) e le Impostazioni (120). In orizzontale copriva la X
   della modale, e dalle Impostazioni un tocco apriva il pannello del «+1». */
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

test("l'orologio non sta sopra la modale né sopra le Impostazioni", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP && document.getElementById("adf-time-dock"));
  await page.evaluate(() => GAME.enter());

  const visibile = () => page.evaluate(() => getComputedStyle(document.getElementById("adf-time-dock")).visibility);
  expect(await visibile()).toBe("visible");

  /* una modale alta, con la X: quella che in orizzontale finiva sotto l'orologio */
  await page.evaluate(() => showEvent({k:"Prova", t:"Un titolo lungo abbastanza da andare su tre righe in orizzontale",
    d:"", annulla(){}, opts:[1, 2, 3].map(n => ({n:"Opzione " + n, d:"", run(){ return null; }}))}));
  expect(await visibile()).toBe("hidden");
  await page.locator("#m-x").tap();
  await expect(page.locator("#modal")).not.toHaveClass(/\bon\b/);
  expect(await visibile()).toBe("visible");

  await page.evaluate(() => apriImpostazioni());
  await expect(page.locator("#setts")).toHaveClass(/\bon\b/);
  expect(await visibile()).toBe("hidden");
  expect(errori).toEqual([]);
});
