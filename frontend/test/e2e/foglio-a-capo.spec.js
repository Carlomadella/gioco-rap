const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 62: a 360 × 640 una barra da 90 caratteri in un
   <input> da 200 punti se ne vedevano 27. Ora la riga va a capo. */
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });

test("sul telefono una barra lunga si legge tutta e Invio passa alla dopo", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => { GAME.enter(); apriFoglio({righe:4}); });

  const lunga = "Ho contato le monete sotto la luce del lampione e sapevo già che non bastava";
  const prima = page.locator(".wline textarea").first();
  await prima.click();
  await page.keyboard.type(lunga);
  await page.keyboard.press("Enter");

  const r = await page.evaluate(() => {
    const t = document.querySelector('.wline textarea[data-i="0"]');
    return {riga:WR.righe[0], tutta:t.scrollHeight <= t.clientHeight + 1, dueRighe:t.clientHeight > 40,
      fuoco:document.activeElement && document.activeElement.dataset.i,
      scorreDiLato:document.documentElement.scrollWidth > innerWidth};
  });
  expect(r.riga).toBe(lunga);
  expect(r.tutta).toBe(true);
  expect(r.dueRighe).toBe(true);
  expect(r.fuoco).toBe("1");
  expect(r.scorreDiLato).toBe(false);

  await page.keyboard.type("E le ho messe in tasca come fossero un milione");
  await page.locator("#w-done").click();
  await expect(page.locator("#w-title")).toHaveText("Strofa chiusa");
  expect(await page.evaluate(() => G.bars.length)).toBe(1);
  expect(errori).toEqual([]);
});

test("il foglio già scritto si apre con tutte le barre intere", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  const righe = await page.evaluate(() => {
    GAME.enter(); apriFoglio({generata:true, righe:6, minimo:30});
    return [...document.querySelectorAll(".wline textarea")].map(t => ({h:t.clientHeight, dentro:t.scrollHeight <= t.clientHeight + 1}));
  });
  expect(righe.length).toBe(6);
  for(const r of righe){ expect(r.h).toBeGreaterThan(20); expect(r.dentro).toBe(true); }
  expect(errori).toEqual([]);
});

test("girando il telefono la barra si rimisura, e l'a capo della tastiera è un Invio", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.setViewportSize({ width: 800, height: 390 });
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  const lunga = "Ho contato le monete sotto la luce del lampione e sapevo già che non bastava mai";
  await page.evaluate(t => { GAME.enter(); apriFoglio({righe:4}); WR.righe[0] = t; disegnaFoglio(); }, lunga);

  /* da orizzontale a verticale: la stessa barra vuole più righe */
  await page.setViewportSize({ width: 360, height: 640 });
  await expect.poll(() => page.evaluate(() => {
    const t = document.querySelector('.wline textarea[data-i="0"]');
    return t.scrollHeight <= t.clientHeight + 1;
  })).toBe(true);

  /* una tastiera che manda l'a capo come testo (insertLineBreak) */
  const r = await page.evaluate(() => {
    const t = document.querySelector('.wline textarea[data-i="1"]');
    t.focus(); t.value = "Seconda barra\n";
    t.dispatchEvent(new InputEvent("input", {inputType:"insertLineBreak", bubbles:true}));
    return {riga:WR.righe[1], fuoco:document.activeElement && document.activeElement.dataset.i};
  });
  expect(r).toEqual({riga:"Seconda barra", fuoco:"2"});
  expect(errori).toEqual([]);
});
