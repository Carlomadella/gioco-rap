const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026: un errore dentro la chiusura della settimana lasciava
   accesi ADF.skipRunning e SALTO, e «+1»/«+7» restavano bloccati fino a
   ricaricare. Poi, al giro di fine task: il salto non deve nemmeno salvare
   una settimana chiusa a metà, e l'errore deve arrivare alla schermata di
   servizio. Qui l'errore lo si provoca apposta per una chiusura sola. */
test("un errore nella chiusura della settimana non lascia niente a metà e non blocca il «+1»", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => GAME.enter());

  const r = await page.evaluate(() => {
    /* un pezzo fuori, così la chiusura muove stream, fan e soldi prima di
       arrivare al punto che scoppia */
    G.songs.push({t:"Prova", q:60, mixed:true, released:true, week:totalWeeks(), streams:0, last:0, seed:1});
    G.fans = 400; G.money = 1000; G.day = 7; save();
    const prima = {settimana:G.week, giorno:G.day, soldi:G.money, fan:G.fans, stream:G.songs[0].streams};

    const vera = window.checkGoals;
    let volte = 0;
    /* checkGoals() arriva dopo i conti della settimana: la prima volta scoppia */
    window.checkGoals = function(){ if(volte++ === 0) throw new Error("rotto apposta"); return vera.apply(this, arguments); };
    const primo = ADF_TIME_SKIP(1);
    const g = JSON.parse(localStorage.getItem(CHIAVE_PARTITA()));
    const dopoErrore = {settimana:G.week, giorno:G.day, soldi:G.money, fan:G.fans, stream:G.songs[0].streams};
    const salvato = {settimana:g.week, giorno:g.day, soldi:g.money, fan:g.fans, stream:g.songs[0].streams};
    const libero = {puo:ADF_CAN_SKIP_TIME(), salto:SALTO};

    const secondo = ADF_TIME_SKIP(1);
    window.checkGoals = vera;
    return {prima, primo, dopoErrore, salvato, libero, secondo, settimanaDopo:G.week, giornoDopo:G.day};
  });

  expect(r.primo).toBe(true);
  /* il giorno rotto è come se non ci fosse stato, in memoria e nel salvataggio */
  expect(r.dopoErrore).toEqual(r.prima);
  expect(r.salvato).toEqual(r.prima);
  expect(r.libero).toEqual({puo:true, salto:false});
  /* e al secondo giro la settimana si chiude una volta sola */
  expect(r.secondo).toBe(true);
  expect(r.settimanaDopo).toBe(r.prima.settimana + 1);
  expect(r.giornoDopo).toBe(1);
  /* l'errore non è stato ingoiato: arriva alla pagina (e alla schermata di servizio) */
  await expect.poll(() => errori).toContain("rotto apposta");
  await expect.poll(() => page.evaluate(() => window.ADF_SERVIZIO && ADF_SERVIZIO.errori().length)).toBeGreaterThan(0);
});
