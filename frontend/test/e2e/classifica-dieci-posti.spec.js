const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 57: la classifica ha tante righe quanti rivali più
   te (all'inizio dieci), quindi «sei in top 10» era vero da subito e il primo
   ingresso valeva un salto da 99, scritto «hype +40» anche col tetto a 20. */
async function partita(page, errori){
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => {
    GAME.enter();
    G.songs.push({t:"Prova", q:60, mixed:true, released:true, week:totalWeeks(), streams:0, last:0, seed:1});
  });
}
/* una settimana chiusa a mano, con i rivali tutti sopra o tutti sotto */
const settimana = (page, rivaliP) => page.evaluate(p => {
  sistemaRivali();
  G.rivals.forEach(r => { r.p = p; r.mom = 0; });
  const prima = G.hype;
  G.day = 7; avanzaGiorno();
  return {pos:G.best.chart, righe:G.rivals.length + 1, hype:G.hype - prima, cap:hypeCap(),
    diario:G.log.slice(0, 12).map(l => l.t.replace(/<[^>]+>/g, ""))};
}, rivaliP);

test("ultimi in classifica non si sale e la riga non è verde", async ({ page }) => {
  const errori = [];
  await partita(page, errori);
  await page.evaluate(() => { G.fans = 20; });
  const r = await settimana(page, 3e6);
  expect(r.pos).toBe(r.righe);
  expect(r.diario.some(t => /Sali in classifica/.test(t))).toBe(false);
  expect(r.diario.some(t => /in classifica$/.test(t))).toBe(false);
  expect(errori).toEqual([]);
});

test("salendo, il diario scrive l'hype che entra davvero", async ({ page }) => {
  const errori = [];
  await partita(page, errori);
  await page.evaluate(() => { G.fans = 5000; G.hype = 0; });
  const r = await settimana(page, 0);
  expect(r.pos).toBe(1);
  const riga = r.diario.find(t => /Sali in classifica/.test(t));
  const scritto = Number((riga.match(/hype \+(\d+)/) || [])[1]);
  expect(scritto).toBeLessThanOrEqual(r.cap);
  expect(errori).toEqual([]);
});
