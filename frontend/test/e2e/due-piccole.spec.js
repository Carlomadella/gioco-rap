const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 60: «Ancora 1 settimane così», e «Vivi di musica —
   senza aver lavorato altrove» che arrivava anche col posto di lavoro. */
test("il plurale del licenziamento e il traguardo «Vivi di musica»", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  const r = await page.evaluate(() => {
    GAME.enter();
    G.job = {id:"barista", n:"Barista", pay:130, e:18, missed:1};
    G.shifts = 0; G.money = 5000;
    G.day = 7; avanzaGiorno();
    const avviso = G.log.map(l => l.t).find(t => /Non ti sei presentato/.test(t));
    const conLavoro = !!G.goals.g4;
    G.job = null; checkGoals();
    return {avviso, conLavoro, senzaLavoro:!!G.goals.g4};
  });

  expect(r.avviso).toContain("Ancora 1 settimana così");
  expect(r.conLavoro).toBe(false);
  expect(r.senzaLavoro).toBe(true);
  expect(errori).toEqual([]);
});
