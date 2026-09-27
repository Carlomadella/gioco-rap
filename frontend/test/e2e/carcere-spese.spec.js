const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 61: in carcere si pagano 1,6 volte le spese e il
   diario non lo diceva. */
test("in carcere il diario dice quanto costa stare dentro", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  const r = await page.evaluate(() => {
    GAME.enter();
    G.money = 1000;
    G.strada.arresto = {settimane:3, colpo:"prova"};
    const extra = Math.round(weeklyCosts() * .6);
    stradaSettimana();
    const riga = G.log.map(l => l.t.replace(/<[^>]+>/g, "")).find(t => /Da dentro costa/.test(t));
    return {riga, extra, soldi:G.money};
  });

  expect(r.riga).toContain("−" + r.extra + " €");
  expect(r.soldi).toBe(1000 - r.extra);
  expect(errori).toEqual([]);
});
