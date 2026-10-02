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
  /* 44 in CSS; la misura esce a volte 43,9994 per il posizionamento sotto il
     pixel, e faceva rossa la verifica a caso (giro del 27/09); il 01/10 e' uscita
     anche 43,969, una volta su cinque: un decimo di pixel non cambia la presa */
  expect.soft(filtro.height, "Filtro Shop").toBeGreaterThanOrEqual(43.9);
});


test("l'avvio rapido reale seleziona il percorso MakeHuman mobile", async ({ page }) => {
  /* Non scarichiamo MakeHuman nel CI: sostituiamo soltanto creator.html con
     un guscio minimo che espone gli stessi due punti necessari al bootstrap.
     Tutto il resto — pagina gioco, bridge RPG, adattatore mobile e
     gioco-ingresso — e' quello reale del build. */
  await page.route("**/media/creator-rpg-v24/creator.html*", async route => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html>
        <html><body>
          <iframe id="localEditorFrame"
                  data-makehuman-src="../makehuman-camerino-v1/index.html"></iframe>
          <script>
            window.playCareerIntro = function(){};
            parent.postMessage({type:"adf-rpg-v24-ready"},"*");
          <\/script>
        </body></html>`
    });
  });

  await page.goto("/pagine/gioco.html?nuova=rapido");

  await page.waitForFunction(() => {
    const host=document.getElementById("adf-rpg-v24-frame");
    const editor=host?.contentDocument?.getElementById("localEditorFrame");
    return Boolean(
      window.ADF_MAKEHUMAN_MOBILE?.attivo &&
      window.ADF_MAKEHUMAN_MOBILE?.quick &&
      window.ADF_MAKEHUMAN_MOBILE?.watchdog==="top-level-v3" &&
      editor?.dataset?.makehumanMobile==="1"
    );
  });

  const stato=await page.evaluate(() => {
    const host=document.getElementById("adf-rpg-v24-frame");
    const editor=host.contentDocument.getElementById("localEditorFrame");
    return {
      adattatore:window.ADF_MAKEHUMAN_MOBILE,
      src:editor.dataset.makehumanSrc,
      quick:editor.dataset.makehumanMobileQuick
    };
  });

  expect(stato.adattatore.attivo).toBe(true);
  expect(stato.adattatore.quick).toBe(true);
  expect(stato.adattatore.watchdog).toBe("top-level-v3");
  expect(stato.src).toBe("../makehuman-mobile-v1/index.html?v=3");
  expect(stato.quick).toBe("1");
});
