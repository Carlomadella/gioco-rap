const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026: un evento ALTO dell'orologio a schermo, coperto da
   un'altra finestra, spariva ma restava pendente col lucchetto globale — e
   «+1»/«+7» restavano bloccati fino a ricaricare. */
async function altoASchermo(page, errori){
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP && window.ADF_EVENTI);
  await page.evaluate(() => {
    GAME.enter();
    /* «A casa ti fermano» vuole la casa e il benessere basso; la finestra
       degli ALTO si apre subito */
    G.wellbeing = 20; G.currentPlace = "vita";
    G.eventiV2.nextHighDue = 0;
    const r = GAME_EVENTS.force("famiglia_muro");
    if(!r.ok || !r.result || !r.result.pending) throw new Error("ALTO non partito: " + JSON.stringify(r.result || r.reason));
  });
  await expect(page.locator("#m-t")).toHaveText("A casa ti fermano");
}

test("una finestra che arriva sopra un ALTO aspetta in coda", async ({ page }) => {
  const errori = [];
  await altoASchermo(page, errori);

  await page.evaluate(() => { G.job = null; offerJobs(); });
  /* l'ALTO resta lì, i colloqui no */
  await expect(page.locator("#m-t")).toHaveText("A casa ti fermano");

  await page.locator("#m-opts button").first().click();
  /* scelto l'ALTO, arrivano i colloqui */
  await expect(page.locator("#m-t")).toHaveText("Due posti liberi");
  await page.locator("#m-opts button").last().click();

  const dopo = await page.evaluate(() => ({pendente:GAME_EVENTS.pending(), lucchetto:ADF_EVENTI.globalHigh()}));
  expect(dopo).toEqual({pendente:null, lucchetto:null});
  await expect.poll(() => page.evaluate(() => ADF_CAN_SKIP_TIME())).toBe(true);
  expect(errori).toEqual([]);
});

test("un ALTO coperto da una finestra scritta a mano torna su", async ({ page }) => {
  const errori = [];
  await altoASchermo(page, errori);

  /* la scelta del salto scrive la modale a mano, senza passare da showEvent */
  await page.evaluate(() => scegliSalto([{n:"Resto qui", d:"", run(){}}]));
  await expect(page.locator("#m-t")).toHaveText("Salta avanti");
  /* nessun render a mano: deve tornare da solo appena la finestra si chiude */
  await page.locator("#m-opts button").first().click();

  await expect(page.locator("#m-t")).toHaveText("A casa ti fermano");
  await expect(page.locator("#modal")).toHaveClass(/\bon\b/);
  expect(errori).toEqual([]);
});

test("una finestra in coda si conta una volta sola, quando si apre", async ({ page }) => {
  const errori = [];
  await altoASchermo(page, errori);

  const conta = () => page.evaluate(() => (G.eventiV2.stats && G.eventiV2.stats.legacyStreet) || 0);
  const prima = await conta();
  await page.evaluate(() => showEvent({k:"Per strada", t:"Uno che ti riconosce", d:"",
    opts:[{n:"Saluti", d:"", run(){ return null; }}]}));
  /* in coda: non si è ancora aperta, non si conta */
  expect(await conta()).toBe(prima);

  await page.locator("#m-opts button").first().click();
  await expect(page.locator("#m-t")).toHaveText("Uno che ti riconosce");
  expect(await conta()).toBe(prima + 1);
  expect(errori).toEqual([]);
});
