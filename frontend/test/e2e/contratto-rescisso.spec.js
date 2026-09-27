const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026: se l'etichetta rescinde mentre sei in carcere e c'è
   una consegna aperta, alla scadenza advanceWeek() leggeva la penale su un
   contratto che non c'era più. La settimana non si chiudeva, e non si
   chiudeva mai più. */
async function partitaNuova(page, errori){
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => GAME.enter());
}

test("la rescissione in carcere porta via anche la consegna", async ({ page }) => {
  const errori = [];
  await partitaNuova(page, errori);

  const r = await page.evaluate(() => {
    const o = OFFERS.find(x => x.deliver);
    G.contract = o;
    G.obligation = {need:o.deliver, left:5, from:totalWeeks()};
    G.strada.arresto = {settimane:3, colpo:"prova"};
    const dado = Math.random;
    Math.random = () => 0.01;   /* il 20% della rescissione esce di sicuro */
    try{ stradaSettimana(); }finally{ Math.random = dado; }
    return {contratto:G.contract, consegna:G.obligation};
  });

  expect(r).toEqual({contratto:null, consegna:null});
  expect(errori).toEqual([]);
});

test("una consegna rimasta senza contratto non blocca più la settimana", async ({ page }) => {
  const errori = [];
  await partitaNuova(page, errori);

  const r = await page.evaluate(() => {
    /* il salvataggio rotto di prima: la consegna c'è, il contratto no */
    const o = OFFERS.find(x => x.deliver);
    G.obligation = {need:o.deliver, left:1, from:totalWeeks()};
    G.contract = null;
    const prima = G.week;
    G.day = 7; avanzaGiorno();
    return {prima, dopo:G.week, consegna:G.obligation};
  });

  expect(r.dopo).toBe(r.prima + 1);
  expect(r.consegna).toBeNull();
  expect(errori).toEqual([]);
});
