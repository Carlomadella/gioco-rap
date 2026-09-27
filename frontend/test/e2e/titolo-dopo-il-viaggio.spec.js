const { test, expect } = require("@playwright/test");

/* 27/09/2026: la conferma dello spostamento (PR #2) nasconde il testo normale
   della modale, e chi la scrive a mano non lo rimetteva: andando allo Studio e
   registrando, il titolo del pezzo si apriva senza testo e senza campo. */
test("dopo la conferma di un viaggio il titolo del pezzo si scrive", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => {
    GAME.enter();
    showEvent({k:"Spostamento", t:"Vai lì?", d:"",
      travel:{departure:"10:00", arrival:"10:30", duration:"30 min"}, annulla(){},
      opts:[{n:"Resta qui", d:"", run(){ return null; }}, {n:"Vai", d:"", run(){ return null; }}]});
  });
  await page.locator("#m-opts .travel-cancel").click();

  let titolo = null;
  await page.evaluate(() => chiediTitolo("Prova", t => { window.__titolo = t; }));
  await expect(page.locator("#tt-in")).toBeVisible();
  await expect(page.locator("#modal")).not.toHaveClass(/travel-confirm/);
  await page.locator("#tt-in").fill("Asfalto");
  await page.locator("#m-opts button").first().click();
  titolo = await page.evaluate(() => window.__titolo);
  expect(titolo).toBe("Asfalto");

  /* e la stessa cosa per la scelta del salto e la scheda di un rivale */
  await page.evaluate(() => scegliSalto([{n:"Resta", d:"", run(){}}]));
  await expect(page.locator("#m-d")).toBeVisible();
  await page.locator("#m-opts button").first().click();
  /* la scheda di un rivale, dopo un altro viaggio */
  await page.evaluate(() => {
    showEvent({k:"Spostamento", t:"Vai lì?", d:"", travel:{departure:"11:00", arrival:"11:20", duration:"20 min"},
      annulla(){}, opts:[{n:"Resta qui", d:"", run(){ return null; }}, {n:"Vai", d:"", run(){ return null; }}]});
  });
  await page.locator("#m-opts .travel-cancel").click();
  await page.evaluate(() => { sistemaRivali(); schedaRivale(G.rivals[0].n); });
  await expect(page.locator("#m-d .rcard2")).toBeVisible();
  await expect(page.locator("#modal")).not.toHaveClass(/travel-confirm/);
  expect(errori).toEqual([]);
});
