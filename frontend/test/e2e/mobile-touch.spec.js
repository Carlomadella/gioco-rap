const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 360, height: 640 },
  isMobile: true,
  hasTouch: true
});

async function entraNellaPlancia(page) {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.GAME && window.HUB && window.__G);
  await page.evaluate(() => {
    GAME.enter();
    HUB.apri();
  });
}

test("le righe delle Impostazioni restano leggibili sul telefono", async ({ page }) => {
  await entraNellaPlancia(page);
  await page.evaluate(() => IMPOSTAZIONI());

  const righe = await page.locator(".setts.on .srow").evaluateAll(nodi =>
    nodi
      .filter(riga => {
        const rett = riga.getBoundingClientRect();
        return rett.width > 0 && rett.height > 0;
      })
      .slice(0, 5)
      .map(riga => {
        const testo = riga.querySelector(":scope > .stx");
        const controllo = riga.querySelector(":scope > .sctl");
        const t = testo.getBoundingClientRect();
        const c = controllo.getBoundingClientRect();
        return {
          testoLargo: t.width,
          testoBasso: t.bottom,
          controlloAlto: c.top,
          contenutoAlto: testo.scrollHeight,
          scatolaAlta: testo.clientHeight
        };
      })
  );

  expect(righe.length).toBeGreaterThanOrEqual(4);
  for (const riga of righe) {
    expect(riga.testoLargo).toBeGreaterThan(120);
    expect(riga.contenutoAlto).toBeLessThanOrEqual(riga.scatolaAlta + 1);
    expect(riga.testoBasso).toBeLessThanOrEqual(riga.controlloAlto + 1);
  }
});

test("i quattro comandi segnalati hanno una presa di almeno 44 punti", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  const account = await page.locator(".navacc").boundingBox();
  expect.soft(account.height, "Account").toBeGreaterThanOrEqual(44);

  await page.locator("#m-play").tap();
  const importa = await page.locator(".avv-importa").boundingBox();
  expect.soft(importa.height, "Importa partita").toBeGreaterThanOrEqual(44);

  await entraNellaPlancia(page);
  const agenda = await page.locator(".pevseg").first().evaluate(el => {
    const presa = getComputedStyle(el, "::after");
    return {
      larghezza: parseFloat(presa.width),
      altezza: parseFloat(presa.height)
    };
  });
  expect.soft(agenda.larghezza, "Quadratino Agenda").toBeGreaterThanOrEqual(44);
  expect.soft(agenda.altezza, "Quadratino Agenda").toBeGreaterThanOrEqual(44);

  await page.evaluate(() =>
    apriPannello("Shop", "shop", "Vestiti e accessori per il tuo artista.")
  );
  await page.waitForTimeout(450);
  const filtro = await page.locator(".shtab").first().boundingBox();
  expect.soft(filtro.height, "Filtro Shop").toBeGreaterThanOrEqual(44);
});
