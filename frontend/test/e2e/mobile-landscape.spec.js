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

test("portrait mobile: Inizia nasconde la coda FAMEpedia", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pagine/landing.html");
  await page.evaluate(() => document.querySelector("#m-play").click());

  await expect(page.locator("#mhero")).toHaveClass(/avvio-aperto/);
  await expect(page.locator("#s-menu > .menu")).toBeHidden();
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
  const vh = await page.evaluate(() => innerHeight);
  expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);

  /* Regressione #57: Playwright puo' auto-scrollare una voce prima di
     verificarne la visibilita'. Qui invece controlliamo che il menu iniziale
     stia davvero tutto insieme nel viewport, senza essere tagliato dal dock. */
  const misure = await pannello.evaluate(el => {
    const rett = el.getBoundingClientRect();
    const controlli = [...el.querySelectorAll(".avv-close-mobile,.avv-riga,.avv-importa")]
      .map(n => n.getBoundingClientRect());
    return {
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      pannelloBottom: rett.bottom,
      ultimoBottom: Math.max(...controlli.map(r => r.bottom))
    };
  });
  expect(misure.scrollHeight).toBeLessThanOrEqual(misure.clientHeight + 1);
  expect(misure.ultimoBottom).toBeLessThanOrEqual(misure.pannelloBottom + 1);
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

test("landscape mobile: scelta Avaturn/MakeHuman si ridimensiona e scorre davvero", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.ADF_RPG_V24);
  await page.evaluate(() => ADF_RPG_V24.open());

  const frame = page.frameLocator("#adf-rpg-v24-frame");
  const area = frame.locator("#pageAppearance .layout");
  await expect(area).toBeVisible();
  await expect(frame.getByRole("button", { name: /Avaturn/i })).toBeVisible();
  await expect(frame.getByRole("button", { name: /MakeHuman/i })).toBeVisible();

  const misure = await area.evaluate(el => {
    const content = el.querySelector(".content");
    const griglia = el.querySelector(".avatar-method-grid");
    const cards = [...el.querySelectorAll(".avatar-method")];
    const topbar = document.querySelector(".topbar").getBoundingClientRect();
    const viewport = document.querySelector(".viewport").getBoundingClientRect();
    const cs = getComputedStyle(griglia);
    return {
      innerHeight,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      overflowY: getComputedStyle(el).overflowY,
      touchAction: getComputedStyle(el).touchAction,
      contentWidth: content.getBoundingClientRect().width,
      colonne: cs.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
      cardMaxHeight: Math.max(...cards.map(card => card.getBoundingClientRect().height)),
      topbarBottom: topbar.bottom,
      viewportTop: viewport.top,
      viewportBottom: viewport.bottom
    };
  });

  expect(misure.overflowY).toBe("auto");
  expect(misure.touchAction).toContain("pan-y");
  expect(misure.scrollWidth).toBeLessThanOrEqual(misure.clientWidth + 1);
  expect(misure.contentWidth).toBeLessThanOrEqual(misure.clientWidth + 1);
  expect(misure.colonne).toBe(2);
  expect(misure.cardMaxHeight).toBeLessThanOrEqual(132);
  expect(Math.abs(misure.viewportTop - misure.topbarBottom)).toBeLessThanOrEqual(1);
  expect(misure.viewportBottom).toBeLessThanOrEqual(misure.innerHeight + 1);

  /* Regressione reale: su un viewport landscape piu' basso il contenuto deve
     poter scorrere con un gesto touch nativo dentro l'iframe, non solo con
     scrollTop assegnato da JavaScript. */
  await page.setViewportSize({ width: 740, height: 260 });
  await expect(area).toBeVisible();

  const prima = await area.evaluate(el => ({
    top: el.scrollTop,
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight
  }));
  expect(prima.scrollHeight).toBeGreaterThan(prima.clientHeight + 1);

  const iframeBox = await page.locator("#adf-rpg-v24-frame").boundingBox();
  expect(iframeBox).not.toBeNull();

  const cdp = await page.context().newCDPSession(page);
  const x = iframeBox.x + iframeBox.width * 0.52;
  const y0 = iframeBox.y + iframeBox.height * 0.78;
  const y1 = iframeBox.y + iframeBox.height * 0.28;

  await cdp.send("Input.dispatchTouchEvent", {
    type:"touchStart",
    touchPoints:[{x,y:y0,radiusX:1,radiusY:1,force:1}]
  });
  for(let i=1;i<=5;i++){
    const y = y0 + (y1-y0)*(i/5);
    await cdp.send("Input.dispatchTouchEvent", {
      type:"touchMove",
      touchPoints:[{x,y,radiusX:1,radiusY:1,force:1}]
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] });
  await page.waitForTimeout(180);

  const dopo = await area.evaluate(el => el.scrollTop);
  expect(dopo).toBeGreaterThan(prima.top);

  await frame.locator("#avatarSelectionNote").scrollIntoViewIfNeeded();
  await expect(frame.locator("#avatarSelectionNote")).toBeVisible();
});

test("landscape mobile: Avaturn e MakeHuman si aprono direttamente al tap", async ({ page }) => {
  await page.goto("/media/creator-rpg-v24/creator.html");

  const conferma = page.locator("#pageAppearance .bottom");
  await expect(conferma).toBeHidden();

  const makeHuman = page.getByRole("button", { name: /MakeHuman/i });
  await makeHuman.tap();
  await expect(page.locator("#localEditorOverlay")).toHaveClass(/on/);

  await page.reload();
  const avaturn = page.getByRole("button", { name: /Avaturn/i });
  await avaturn.tap();
  await expect(page.locator("#pageDressingRoom")).toHaveClass(/on/);
});

test("landscape mobile: landing instrada MakeHuman nel relay mobile", async ({ page }) => {
  await page.goto("/pagine/landing.html");
  await page.waitForFunction(() => window.ADF_RPG_V24);
  await page.evaluate(() => ADF_RPG_V24.open());

  const creator=page.frameLocator("#adf-rpg-v24-frame");
  await creator.getByRole("button",{name:/MakeHuman/i}).tap();

  const src=await creator.locator("#localEditorFrame").getAttribute("src");
  expect(src).toContain("makehuman-mobile-v1/index.html?v=4");
  await expect(creator.locator("#creatorExitGame")).toBeHidden();
});

test("landscape mobile: MakeHuman separa avatar e controlli senza coprirli", async ({ page }) => {
  await page.goto("/media/makehuman-camerino-v1/index.html?v=mobile-4&mobile=1");

  const sidebar=page.locator("#editorSidebar");
  const camera=page.locator(".camera-switcher");
  const actions=page.locator(".bottom-bar");

  await expect(sidebar).toBeVisible();
  await expect(camera).toBeVisible();
  await expect(actions).toBeVisible();

  const layout=await page.evaluate(() => {
    const sidebar=document.querySelector("#editorSidebar").getBoundingClientRect();
    const camera=document.querySelector(".camera-switcher").getBoundingClientRect();
    const actions=document.querySelector(".bottom-bar").getBoundingClientRect();
    const scroll=document.querySelector(".editor-scroll");
    const stage=getComputedStyle(document.querySelector("#stage"));
    return {
      vw:innerWidth,vh:innerHeight,
      mobile:document.documentElement.classList.contains("adf-mobile"),
      sidebar:{left:sidebar.left,right:sidebar.right,top:sidebar.top,bottom:sidebar.bottom},
      camera:{left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom},
      actions:{left:actions.left,right:actions.right,top:actions.top,bottom:actions.bottom},
      scrollOverflow:getComputedStyle(scroll).overflowY,
      scrollTouch:getComputedStyle(scroll).touchAction,
      stageTransform:stage.transform,
      stageClip:stage.clipPath
    };
  });

  expect(layout.mobile).toBe(true);
  expect(layout.sidebar.left).toBeGreaterThanOrEqual(layout.vw*.44);
  expect(layout.sidebar.right).toBeLessThanOrEqual(layout.vw+1);
  expect(layout.actions.top-layout.sidebar.bottom).toBeGreaterThanOrEqual(6);
  expect(layout.camera.right).toBeLessThanOrEqual(layout.vw*.45+2);
  expect(layout.actions.left).toBeGreaterThanOrEqual(layout.vw*.44);
  expect(layout.actions.right).toBeLessThanOrEqual(layout.vw+1);
  expect(layout.actions.bottom).toBeLessThanOrEqual(layout.vh+1);
  expect(layout.scrollOverflow).toBe("auto");
  expect(layout.scrollTouch).toBe("pan-y");
  expect(layout.stageTransform).toBe("none");
  expect(layout.stageClip).not.toBe("none");
});

test("landscape mobile: camerino parte su Volto e Centra non torna a Intero", async ({ page }) => {
  await page.goto("/media/creator-rpg-v24/camerino.html");

  const volto=page.locator('[data-view="face"]');
  const intero=page.locator('[data-view="full"]');

  await expect(volto).toHaveClass(/on/);
  await expect(intero).not.toHaveClass(/on/);

  await page.locator("#resetCamera").tap();

  await expect(volto).toHaveClass(/on/);
  await expect(intero).not.toHaveClass(/on/);

  const viewer=await page.locator("#viewer").evaluate(el=>{
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    return {transform:cs.transform,left:r.left,width:r.width,vw:innerWidth};
  });

  expect(viewer.transform).toBe("none");
  expect(viewer.left).toBeLessThanOrEqual(1);
  expect(viewer.width).toBeLessThan(viewer.vw*.65);
});

test("landscape mobile: camerino Avaturn usa tutto lo schermo e apre l'editor senza scroll", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.ADF_RPG_V24);
  await page.evaluate(() => ADF_RPG_V24.open());

  const creator = page.frameLocator("#adf-rpg-v24-frame");
  await creator.getByRole("button", { name: /Avaturn/i }).tap();

  await expect(creator.locator("#pageDressingRoom")).toHaveClass(/on/);
  await expect(creator.locator(".topbar")).toBeHidden();
  await expect(creator.locator("#creatorExitGame")).toBeHidden();

  const room = creator.frameLocator("#dressingRoomFrame");
  const back = room.locator("#roomExit");
  const openAvaturn = room.locator("#openAvaturn");
  const tools = room.locator(".room-tools");
  const progress = room.locator(".room-progress");

  await expect(back).toBeVisible();
  await expect(openAvaturn).toBeVisible();
  await expect(progress).toBeVisible();

  const misure = await tools.evaluate(el => {
    const r = el.getBoundingClientRect();
    const button = document.querySelector("#openAvaturn").getBoundingClientRect();
    const progress = document.querySelector(".room-progress").getBoundingClientRect();
    return {
      vw:innerWidth,
      vh:innerHeight,
      left:r.left,
      right:r.right,
      top:r.top,
      bottom:r.bottom,
      scrollTop:el.scrollTop,
      buttonTop:button.top,
      buttonBottom:button.bottom,
      progressBottom:progress.bottom
    };
  });

  expect(misure.left).toBeGreaterThan(misure.vw * .50);
  expect(misure.right).toBeLessThanOrEqual(misure.vw + 1);
  expect(misure.top).toBeGreaterThanOrEqual(40);
  expect(misure.bottom).toBeLessThanOrEqual(misure.vh - 45);
  expect(misure.scrollTop).toBe(0);
  expect(misure.buttonTop).toBeGreaterThanOrEqual(misure.top);
  expect(misure.buttonBottom).toBeLessThanOrEqual(misure.bottom + 1);
  expect(misure.progressBottom).toBeLessThanOrEqual(misure.vh + 1);

  await room.locator("body").evaluate(() => {
    window.__adfOpenedAvaturn = null;
    window.open = (url,name) => {
      window.__adfOpenedAvaturn = {url:String(url),name};
      return {closed:false,focus(){},close(){this.closed=true;}};
    };
  });

  await openAvaturn.tap();

  /* Il window.open nasce direttamente nel camerino, nello stesso handler del tap. */
  await expect.poll(async () => room.locator("body").evaluate(() => window.__adfOpenedAvaturn)).not.toBeNull();

  const opened=await room.locator("body").evaluate(() => window.__adfOpenedAvaturn);
  expect(opened.url).toContain("/media/creator-rpg-v24/avaturn-mobile.html?v=3");
  expect(opened.name).toBe("adf-avaturn-mobile");
  await expect(room.locator("#avaturnOverlay")).not.toHaveClass(/open/);
  await expect(page.locator("#adf-rpg-v24-avaturn-mobile-host")).toHaveCount(0);
});

test("Avaturn mobile: in orizzontale mostra l'avviso verticale e non ha Conferma custom", async ({ page }) => {
  await page.goto("/media/creator-rpg-v24/avaturn-mobile.html?v=3");

  const gate=page.locator("#orientationGate");
  await expect(gate).toBeVisible();
  await expect(gate).toContainText("Ruota il telefono in verticale");
  await expect(page.locator("#confirm")).toHaveCount(0);
  await expect(page.locator("#loading")).toBeHidden();
});

test("landscape mobile: popup Avaturn bloccato non ricade nel vecchio portal", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.ADF_RPG_V24);
  await page.evaluate(() => ADF_RPG_V24.open());

  const creator = page.frameLocator("#adf-rpg-v24-frame");
  await creator.getByRole("button", { name: /Avaturn/i }).tap();
  const room = creator.frameLocator("#dressingRoomFrame");

  await room.locator("body").evaluate(() => {
    window.open=()=>null;
  });

  await room.locator("#openAvaturn").tap();

  await expect(page.locator("#adf-rpg-v24-avaturn-mobile-host")).toHaveCount(0);
  await expect(room.locator("#avaturnOverlay")).not.toHaveClass(/open/);
  await expect(room.locator("#avToast")).toContainText(/bloccato Avaturn/i);
});

test("landscape mobile: nella scelta avatar Indietro e' compatto e integrato a destra", async ({ page }) => {
  await page.goto("/media/creator-rpg-v24/creator.html");

  const indietro = page.locator("#creatorExitGame");
  await expect(indietro).toBeVisible();

  const dati = await indietro.evaluate(el => {
    const r = el.getBoundingClientRect();
    const before = getComputedStyle(el, "::before");
    const after = getComputedStyle(el, "::after");
    const topbar = document.querySelector(".topbar").getBoundingClientRect();
    return {
      vw: innerWidth,
      topbarTop: topbar.top,
      topbarBottom: topbar.bottom,
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      height: r.height,
      width: r.width,
      hitTop: parseFloat(before.top),
      hitRight: parseFloat(before.right),
      hitBottom: parseFloat(before.bottom),
      hitLeft: parseFloat(before.left),
      pseudo: after.content
    };
  });

  expect(dati.right).toBeLessThanOrEqual(dati.vw - 10);
  expect(dati.left).toBeGreaterThan(dati.vw * .75);
  expect(dati.top).toBeGreaterThanOrEqual(dati.topbarTop);
  expect(dati.bottom).toBeLessThanOrEqual(dati.topbarBottom + 1);
  expect(dati.height).toBeGreaterThanOrEqual(37);
  expect(dati.height).toBeLessThanOrEqual(40);
  expect(dati.width).toBeGreaterThanOrEqual(77);
  expect(dati.width).toBeLessThanOrEqual(94);
  expect(dati.hitTop).toBeLessThanOrEqual(-3);
  expect(dati.hitRight).toBeLessThanOrEqual(-3);
  expect(dati.hitBottom).toBeLessThanOrEqual(-3);
  expect(dati.hitLeft).toBeLessThanOrEqual(-3);
  expect(dati.pseudo).toContain("Indietro");

  await indietro.tap();
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
