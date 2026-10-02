const { test, expect } = require("@playwright/test");

/* Il recap di fine giornata (recap-giornata.js, 02/10/2026): CARLO, «mettere un
   recap giornaliero con in aggiunta gli highlights di cosa è successo durante
   il giorno». Si chiude la giornata col «+1 giorno» vero (ADF_TIME_SKIP). */
test("chiusa la giornata esce il recap coi numeri, le mosse e gli highlights, e si spegne", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  const r = await page.evaluate(async () => {
    GAME.enter();
    await new Promise(res => setTimeout(res, 200));
    for(const id of ["modal", "report", "recap", "adf-result-overlay"]){ const el = document.getElementById(id); if(el) el.classList.remove("on"); }
    G.day = 2;                         // un martedì: il settimo giorno esce il rapporto della settimana, non il recap
    recapFoto();
    G.money += 120;
    recapMossa({n:"Scrivi barre"}); recapMossa({n:"Scrivi barre"}); recapMossa({n:"Promo sui social"});
    pushLog("<b>Una serata che ricorderai.</b>", "big");
    pushLog("Una riga qualunque.", "");
    ADF_TIME_SKIP(1);
    await new Promise(res => setTimeout(res, 300));
    const el = document.getElementById("recap");
    return {aperto:el.classList.contains("on"), testo:el.innerText, giorno:G.day};
  });

  expect(r.giorno).toBe(3);
  expect(r.aperto).toBe(true);
  expect(r.testo).toMatch(/Martedì/);
  expect(r.testo).toMatch(/\+120 €/);
  expect(r.testo).toMatch(/3 mosse/);
  expect(r.testo).toMatch(/Scrivi barre ×2/);
  expect(r.testo).toMatch(/Una serata che ricorderai/);

  /* «Non mostrarlo più»: si chiude, e la sera dopo non esce */
  await page.locator('#recap [data-recap="spegni"]').click();
  const dopo = await page.evaluate(async () => {
    const chiuso = !document.getElementById("recap").classList.contains("on");
    ADF_TIME_SKIP(1);
    await new Promise(res => setTimeout(res, 300));
    return {chiuso, riaperto:document.getElementById("recap").classList.contains("on"), spento:SET.gioco.recap};
  });
  expect(dopo).toEqual({chiuso:true, riaperto:false, spento:false});
  expect(errori).toEqual([]);
});

test("il recap sta dentro allo schermo del telefono in orizzontale", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  const m = await page.evaluate(async () => {
    GAME.enter();
    await new Promise(res => setTimeout(res, 200));
    for(const id of ["modal", "report", "recap", "adf-result-overlay"]){ const el = document.getElementById(id); if(el) el.classList.remove("on"); }
    G.day = 2; recapFoto();
    for(let i = 0; i < 6; i++) pushLog("<b>Riga " + i + "</b> di una giornata piena.", i % 2 ? "good" : "bad");
    recapMossa({n:"Scrivi barre"});
    ADF_TIME_SKIP(1);
    await new Promise(res => setTimeout(res, 300));
    const card = document.getElementById("recap-card").getBoundingClientRect();
    const tasto = document.querySelector('#recap [data-recap="avanti"]').getBoundingClientRect();
    return {aperto:document.getElementById("recap").classList.contains("on"),
      dentro:card.top >= 0 && card.bottom <= innerHeight + 1, tasto:tasto.height};
  });
  expect(m.aperto).toBe(true);
  expect(m.dentro).toBe(true);
  expect(m.tasto).toBeGreaterThanOrEqual(44);
  await ctx.close();
});
