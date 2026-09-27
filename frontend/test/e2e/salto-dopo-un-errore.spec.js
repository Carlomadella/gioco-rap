const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026: un errore dentro la chiusura della settimana lasciava
   accesi ADF.skipRunning e SALTO, e «+1»/«+7» restavano bloccati fino a
   ricaricare. Qui l'errore lo si provoca apposta per una chiusura sola: dopo,
   il calendario deve ripartire. */
test("dopo un errore nella chiusura della settimana il «+1» funziona ancora", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => GAME.enter());

  const r = await page.evaluate(() => {
    const vera = window.checkGoals;
    let volte = 0;
    /* checkGoals() è chiamata da advanceWeek(): la prima volta scoppia */
    window.checkGoals = function(){ if(volte++ === 0) throw new Error("rotto apposta"); return vera.apply(this, arguments); };
    G.day = 7;
    const primo = ADF_TIME_SKIP(1);
    const dopoErrore = {puo:ADF_CAN_SKIP_TIME(), salto:SALTO};
    const giornoPrima = G.day;
    const secondo = ADF_TIME_SKIP(1);
    window.checkGoals = vera;
    return {primo, dopoErrore, secondo, avanzato:G.day !== giornoPrima};
  });

  expect(r.primo).toBe(true);
  expect(r.dopoErrore).toEqual({puo:true, salto:false});
  expect(r.secondo).toBe(true);
  expect(r.avanzato).toBe(true);
  expect(errori).toEqual([]);
});
