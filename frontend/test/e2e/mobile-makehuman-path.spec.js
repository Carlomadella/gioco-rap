const { test, expect } = require("@playwright/test");

/* Non carica i 145 MB: intercetta il relay appena il creator lo sceglie.
   Verifica in Chromium touch vero che il telefono entri DAVVERO nel percorso
   mobile prima del bootstrap MakeHuman. */
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});

test("l'avvio rapido mobile seleziona davvero il relay MakeHuman mobile", async ({ page }) => {
  let richiestaRelay = "";

  page.on("request", request => {
    if(request.url().includes("/media/makehuman-mobile-v1/index.html?v=3")){
      richiestaRelay = request.url();
    }
  });

  /* Il relay mobile gira davvero; blocchiamo soltanto il camerino pesante che
     il relay contiene, così il test non scarica il modello/targets. */
  await page.route(
    /\/media\/makehuman-camerino-v1\/index\.html(?:\?.*)?$/,
    route => route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: "<!doctype html><html><body>MakeHuman pesante sostituito dal test</body></html>"
    })
  );

  await page.goto("/pagine/gioco.html?nuova=rapido");

  await page.waitForFunction(() =>
    window.ADF_MAKEHUMAN_MOBILE?.attivo === true &&
    window.ADF_MAKEHUMAN_MOBILE?.quick === true &&
    window.ADF_MAKEHUMAN_MOBILE?.watchdog === "top-level-v5-relay-ping"
  );

  const creator = page.frameLocator("#adf-rpg-v24-frame");
  const editor = creator.locator("#localEditorFrame");

  await expect(editor).toHaveAttribute("data-makehuman-mobile", "1");
  await expect(editor).toHaveAttribute("data-makehuman-mobile-quick", "1");
  await expect(editor).toHaveAttribute(
    "data-makehuman-src",
    "../makehuman-mobile-v1/index.html?v=3"
  );

  await expect.poll(() => richiestaRelay, { timeout: 10000 })
    .toContain("/media/makehuman-mobile-v1/index.html?v=3");

  await expect.poll(
    () => page.frames().some(frame =>
      frame.url().includes("/media/makehuman-mobile-v1/index.html?v=3")
    ),
    { timeout: 10000 }
  ).toBe(true);

  const relayFrame = page.frames().find(frame =>
    frame.url().includes("/media/makehuman-mobile-v1/index.html?v=3")
  );
  expect(relayFrame).toBeTruthy();
  await expect.poll(() => relayFrame.evaluate(() => document.readyState))
    .toBe("complete");

  const srcReale = await editor.evaluate(el => el.src);
  expect(srcReale).toContain("/media/makehuman-mobile-v1/index.html?v=3");

  /* Il relay finto non manda alcuna fase: se dopo 10 s compare questa frase,
     il keepalive del documento principale ha attraversato DAVVERO lo stesso
     listener usato dal watchdog di gioco-ingresso.js. */
  await page.waitForTimeout(12000);

  const diag = await page.evaluate(() => ADF_MAKEHUMAN_MOBILE.diagnostica());
  const faseAutomatica = await page.locator("#preparo-fase").textContent();
  console.log("ADF_MOBILE_DIAG", JSON.stringify(diag), "FASE", faseAutomatica);

  expect(diag.relayLoads, "il relay mobile deve aver completato almeno un load")
    .toBeGreaterThanOrEqual(1);
  expect(diag.heartbeatCount, "il timer top-level deve aver inviato almeno un ping")
    .toBeGreaterThanOrEqual(1);
  expect(diag.watchdogAttivo).toBe(true);

  /* Prova separata del tratto relay -> creator -> gioco. Se questa arriva ma
     quella automatica no, il guasto e' nel timing; se non arriva neppure
     questa, il guasto e' nell'inoltro fra iframe. */
  await page.evaluate(() => {
    const creator = document.getElementById("adf-rpg-v24-frame");
    const editor = creator?.contentDocument?.getElementById("localEditorFrame");
    editor?.contentWindow?.postMessage({
      type:"adf-mobile-watchdog-ping",
      kind:"progress",
      message:"PING DIRETTO TEST"
    },"*");
  });

  await expect(page.locator("#preparo-fase")).toContainText(
    "PING DIRETTO TEST",
    { timeout: 3000 }
  );

  expect(
    faseAutomatica,
    "il keepalive automatico deve arrivare allo stesso listener del watchdog"
  ).toContain("caricamento ancora in corso");
});
