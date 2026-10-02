const { test, expect } = require("@playwright/test");

/* Dal 02/10/2026 il gameplay mobile e' supportato in landscape.
   Il portrait ha un solo compito: mostrare l'invito a ruotare il dispositivo. */
test.use({
  viewport: { width: 844, height: 390 },
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

test("landscape mobile: landing e hub restano utilizzabili al tocco", async ({ page }) => {
  await page.goto("/pagine/landing.html");

  const avvio = page.locator("#m-play");
  await expect(avvio).toBeVisible();
  const box = await avvio.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(43.9);

  await entraNellaPlancia(page);
  await expect(page.locator("#s-hub")).toHaveClass(/on/);
  await expect(page.locator(".pspot").first()).toBeVisible();
});

test("landscape mobile: parte alta scorre e barra 01-06 resta fissa", async ({ page }) => {
  await page.goto("/pagine/landing.html");

  await expect(page.locator("#s-menu > .menu")).toBeHidden();
  const copyright = await page.locator(".land-dock").evaluate(el => getComputedStyle(el, "::after").content);
  expect(copyright).toContain("© 2026 La Fame Studio");

  const hero = page.locator(".land-hero");
  const dock = page.locator(".land-dock");
  const continua = page.locator("#m-play");

  await expect(hero).toHaveCSS("overflow-y", "auto");

  const areaScroll = await hero.evaluate(el => {
    const r = el.getBoundingClientRect();
    const punto = document.elementFromPoint(innerWidth - 20, r.top + Math.min(r.height / 2, 80));
    return {
      larghezza: r.width,
      viewport: innerWidth,
      prendeDestra: punto === el || el.contains(punto)
    };
  });
  expect(areaScroll.larghezza).toBeGreaterThanOrEqual(areaScroll.viewport - 1);
  expect(areaScroll.prendeDestra).toBe(true);

  const dockPrima = await dock.boundingBox();
  expect(dockPrima).not.toBeNull();

  await hero.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const dockDopo = await dock.boundingBox();
  expect(dockDopo).not.toBeNull();
  expect(Math.abs(dockDopo.y - dockPrima.y)).toBeLessThanOrEqual(1);

  await continua.scrollIntoViewIfNeeded();
  const [continuaBox, dockBox] = await Promise.all([continua.boundingBox(), dock.boundingBox()]);
  expect(continuaBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(continuaBox.y + continuaBox.height).toBeLessThanOrEqual(dockBox.y + 1);
});

test("landscape mobile: il suggerimento di rotazione non copre il gioco", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.waitForFunction(() => window.ADF_MOBILE_ORIENTATION_HINT);

  const hint = page.locator("#adf-mobile-orientation-hint");
  await expect(hint).toBeHidden();
  await expect(page.locator("#m-play")).toBeVisible();
});


test("landscape mobile: Inizia mostra tutte le voci senza blocco nero", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.locator("#m-play").tap();

  const pannello = page.locator(".land-avvio");
  await expect(pannello).toBeVisible();
  await expect(pannello).toHaveCSS("transform", "none");
  await expect(pannello.getByText("Nuova partita", { exact: true })).toBeVisible();
  await expect(pannello.getByText("Avvio rapido", { exact: true })).toBeVisible();
  await expect(pannello.getByText("Carica partita", { exact: true })).toBeVisible();
  await expect(pannello.getByText("Importa partita", { exact: true })).toBeVisible();

  const box = await pannello.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(-1);
  const vh = await page.evaluate(() => innerHeight);\n  expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);
});

test("landscape mobile: Inizia ha sempre un Chiudi che riporta alla landing", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.locator("#m-play").tap();

  const chiudi = page.locator(".avv-close-mobile");
  await expect(chiudi).toBeVisible();
  const box = await chiudi.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(43.9);

  await chiudi.tap();
  await expect(page.locator("#mhero")).not.toHaveClass(/avvio-aperto/);
  await expect(page.locator("#m-play")).toBeVisible();
});

test("landscape mobile: il camerino mostra Indietro in alto e toccabile", async ({ page }) => {
  await page.goto("/media/creator-rpg-v24/creator.html");

  const indietro = page.locator("#creatorExitGame");
  await expect(indietro).toBeVisible();

  const dati = await indietro.evaluate(el => {
    const r = el.getBoundingClientRect();
    const pseudo = getComputedStyle(el, "::after").content;
    return {
      top: r.top,
      height: r.height,
      width: r.width,
      pseudo
    };
  });

  expect(dati.top).toBeLessThan(80);
  expect(dati.height).toBeGreaterThanOrEqual(43.9);
  expect(dati.width).toBeGreaterThanOrEqual(95);
  expect(dati.pseudo).toContain("Indietro");
});


test("landscape mobile: le Impostazioni restano leggibili", async ({ page }) => {
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
        const ctrl = controllo.getBoundingClientRect();
        return {
          testoLargo: t.width,
          testoBasso: t.bottom,
          controlloAlto: ctrl.top,
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

test("landscape mobile: i comandi principali mantengono una presa di almeno 44 punti", async ({ page }) => {
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
  expect.soft(filtro.height, "Filtro Shop").toBeGreaterThanOrEqual(43.9);
});


test("landscape mobile: landing non scala oltre il viewport", async ({ page }) => {
  await page.goto("/pagine/landing.html");

  const misure = await page.evaluate(() => {
    const land = document.querySelector(".land").getBoundingClientRect();
    const titolo = document.querySelector(".land-hero h1").getBoundingClientRect();
    const dock = document.querySelector(".land-dock").getBoundingClientRect();
    return {
      vw: innerWidth,
      vh: innerHeight,
      landW: land.width,
      landH: land.height,
      titoloW: titolo.width,
      titoloH: titolo.height,
      dockRight: dock.right,
      dockBottom: dock.bottom
    };
  });

  expect(misure.landW).toBeLessThanOrEqual(misure.vw + 1);
  expect(misure.landH).toBeLessThanOrEqual(misure.vh + 1);
  expect(misure.titoloW).toBeLessThan(misure.vw * 0.7);
  expect(misure.titoloH).toBeLessThan(misure.vh * 0.45);
  expect(misure.dockRight).toBeLessThanOrEqual(misure.vw + 1);
  expect(misure.dockBottom).toBeLessThanOrEqual(misure.vh + 1);
});

test("landscape mobile: la plancia resta dentro allo schermo", async ({ page }) => {
  await entraNellaPlancia(page);

  const misure = await page.evaluate(() => {
    const plancia = document.querySelector(".plancia").getBoundingClientRect();
    const stile = getComputedStyle(document.querySelector(".plancia"));
    return {
      vw: innerWidth,
      vh: innerHeight,
      left: plancia.left,
      top: plancia.top,
      right: plancia.right,
      bottom: plancia.bottom,
      colonne: stile.gridTemplateColumns
    };
  });

  expect(misure.left).toBeGreaterThanOrEqual(-1);
  expect(misure.top).toBeGreaterThanOrEqual(-1);
  expect(misure.right).toBeLessThanOrEqual(misure.vw + 1);
  expect(misure.bottom).toBeLessThanOrEqual(misure.vh + 1);
  expect(misure.colonne.split(" ").length).toBeGreaterThanOrEqual(2);
});
