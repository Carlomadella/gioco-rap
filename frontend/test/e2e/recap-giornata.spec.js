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
    const soldiStamattina = G.money;
    G.money += 120;
    recapMossa({n:"Scrivi barre"}); recapMossa({n:"Scrivi barre"}); recapMossa({n:"Promo sui social"});
    pushLog("<b>Una serata che ricorderai.</b>", "big");
    pushLog("Una riga qualunque.", "");
    ADF_TIME_SKIP(1);
    await new Promise(res => setTimeout(res, 300));
    const el = document.getElementById("recap");
    /* il recap conta anche la notte, e nella notte un evento risolto da solo
       può muovere i soldi: il confronto si fa con la differenza vera */
    const d = Math.round(G.money - soldiStamattina);
    const soldi = (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d).toLocaleString("it-IT") + " €";
    return {aperto:el.classList.contains("on"), testo:el.innerText, giorno:G.day, soldi, d};
  });

  expect(r.giorno).toBe(3);
  expect(r.aperto).toBe(true);
  expect(r.testo).toMatch(/Martedì/);
  expect(r.testo).toContain(r.soldi);
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

/* Voce 106: un giorno a fare colpi usciva «una giornata ferma», coi soldi
   cambiati senza un perché. Il colpo è una mossa, com'è andata è una riga del
   diario, e i soldi sporchi si vedono. */
test("un colpo in Strada entra nel recap, coi soldi sporchi", async ({ page }) => {
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
    G.day = 2; recapFoto();
    const sporchiPrima = G.strada.sporchi;
    const caso = Math.random; Math.random = () => 0.001;     // il colpo va bene
    try{ stradaTenta(STRADA_COLPI[0].id, STRADA_APPROCCI[0].id); } finally { Math.random = caso; }
    const esito = STRADA_SCENA && STRADA_SCENA.titolo;
    STRADA_SCENA.opts[0].run();                              // «Continua», come il giocatore
    const scena = document.getElementById("crimeModal"); if(scena) scena.classList.remove("on");
    const sporchi = Math.round(G.strada.sporchi - sporchiPrima);
    ADF_TIME_SKIP(1);
    await new Promise(res => setTimeout(res, 300));
    const el = document.getElementById("recap");
    return {esito, sporchi, colpo:STRADA_COLPI[0].n, aperto:el.classList.contains("on"), testo:el.innerText};
  });

  expect(r.esito).toBe("Andata bene");
  expect(r.aperto).toBe(true);
  expect(r.testo).toContain("Colpo: " + r.colpo);
  expect(r.testo).toContain("Soldi sporchi +" + r.sporchi.toLocaleString("it-IT") + " €");
  expect(r.testo).toContain(r.colpo + " — andata bene.");
  expect(r.testo).not.toContain("Una giornata ferma");
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
