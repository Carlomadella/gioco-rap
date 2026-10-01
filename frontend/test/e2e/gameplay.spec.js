const { test, expect } = require("@playwright/test");

test("GAME.enter riabilita i beat a ogni ingresso nel gameplay", async ({ page }) => {
  const errori = [];

  page.on("pageerror", errore => {
    errori.push(errore.message);
  });

  await page.goto("/pagine/gioco.html");

  await page.waitForFunction(() =>
    window.GAME &&
    window.ADF_AUDIO
  );

  const risultati = await page.evaluate(() => {
    const stati = [];

    for (let i = 0; i < 3; i++) {
      ADF_AUDIO.setMode("pregame");
      GAME.enter();

      stati.push({
        mode: ADF_AUDIO.mode,
        beat: ADF_AUDIO.canPlay("beat")
      });
    }

    return stati;
  });

  expect(risultati).toEqual([
    { mode: "gameplay", beat: true },
    { mode: "gameplay", beat: true },
    { mode: "gameplay", beat: true }
  ]);

  expect(errori).toEqual([]);
});

/* Il flusso di gioco non deve dipendere dalle prestazioni del motore MakeHuman
   sul runner GitHub. Qui sostituiamo SOLO l'iframe MakeHuman con un doppio di
   test che parla lo stesso protocollo del camerino reale: il creator, la
   cinematic, il salvataggio, l'audio e l'ingresso nell'hub restano quelli
   veri. Il MakeHuman completo ha una prova separata @makehuman. */

async function avviaRapido(page){
  await page.goto("/pagine/landing.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator("#m-play").click();
  await page.locator('[data-avvio="rapido"]').click();
  await page
    .locator('[data-avvio="difficolta"][data-arg="anni-di-fame"]')
    .click();

  await expect(page.locator("#adf-app-frame")).toHaveAttribute(
    "src",
    /pagine\/gioco\.html\?nuova=rapido&slot=1$/
  );
}

async function fasePreparo(page){
  const gioco = page.frames().find(frame =>
    frame.url().includes("/pagine/gioco.html")
  );
  if(!gioco) return null;

  try{
    return await gioco.evaluate(() => {
      const el = document.getElementById("preparo");
      return el && !el.hidden && !el.classList.contains("via") && !el.classList.contains("rotto")
        ? document.getElementById("preparo-fase").textContent
        : null;
    });
  }catch(e){
    if(/execution context was destroyed|frame was detached|target closed|navigation/i.test(e.message))
      return null;
    throw e;
  }
}

async function statoAvvioRapido(page){
  const gioco = page.frames().find(frame =>
    frame.url().includes("/pagine/gioco.html")
  );
  if(!gioco) return null;

  try{
    return await gioco.evaluate(() => {
      let artistaPersistito = null;

      try{
        artistaPersistito = JSON.parse(
          localStorage.getItem(CHIAVE_ARTISTA()) || "null"
        );
      }catch(e){}

      return {
        modalitaAudio: window.ADF_AUDIO && window.ADF_AUDIO.mode,
        beatDisponibile:
          !!window.ADF_AUDIO && window.ADF_AUDIO.canPlay("beat"),
        hubVisibile:
          !!document.querySelector("#s-hub.screen.on"),
        creatorChiuso:
          !document.getElementById("adf-rpg-v24-host"),
        preparoVia:
          document.getElementById("preparo").hidden,
        artistaSalvato:
          !!(
            window.ARTIST &&
            artistaPersistito &&
            ARTIST.name &&
            ARTIST.name === artistaPersistito.name &&
            ARTIST.city === artistaPersistito.city &&
            ARTIST.genre === artistaPersistito.genre
          )
      };
    });
  }catch(e){
    if(/execution context was destroyed|frame was detached|target closed|navigation/i.test(e.message))
      return null;
    throw e;
  }
}

async function aspettaIngressoHub(page, timeout){
  await expect.poll(
    () => statoAvvioRapido(page),
    { timeout }
  ).toEqual({
    modalitaAudio: "gameplay",
    beatDisponibile: true,
    hubVisibile: true,
    creatorChiuso: true,
    preparoVia: true,
    artistaSalvato: true
  });
}

test("avvio rapido conclude la cinematic ed entra nell'hub", async ({ page }) => {
  test.setTimeout(90000);

  const errori = [];
  page.on("pageerror", errore => errori.push(errore.message));

  /* Doppio confinato al test. Risponde esattamente ai due messaggi che il
     creator manda al camerino reale: init + richiesta preset. Nessun hook nel
     codice di produzione e nessun ramo CI nel gameplay. */
  await page.route("**/media/makehuman-camerino-v1/index.html", async route => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><meta charset="utf-8"><script>
        const preview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23222'/%3E%3C/svg%3E";
        addEventListener("message", e => {
          const msg = e.data || {};
          if(msg.type === "adf-makehuman-init") return;
          if(msg.type === "adf-makehuman-quick-preset"){
            parent.postMessage({
              type:"adf-makehuman-progress",
              message:"Scelgo il look e scatto la foto"
            },"*");
            parent.postMessage({
              type:"adf-makehuman-quick-preset-result",
              state:{ gender:"male", modifiers:{}, slots:{} },
              previewImage:preview,
              presetId:"ci-male"
            },"*");
          }
        });
        parent.postMessage({
          type:"adf-makehuman-progress",
          message:"Camerino CI pronto"
        },"*");
        parent.postMessage({
          type:"adf-makehuman-ready",
          state:{}
        },"*");
      <\/script>`
    });
  });

  await avviaRapido(page);

  await expect.poll(
    () => fasePreparo(page),
    { timeout: 30000 }
  ).toMatch(/camerino|modello|personaggio|look|CI/i);

  await aspettaIngressoHub(page, 60000);
  expect(errori).toEqual([]);
});

/* Integrazione completa col MakeHuman vero. Non e' un gate di ogni push:
   GitHub Actions headless non e' l'ambiente in cui giochiamo e il caricamento
   di targets.bin (~145 MB) puo' non terminare su quel runner. Resta una prova
   reale, esplicita e lanciabile con npm run test:e2e:makehuman oppure dal
   workflow manuale "Verifica gioco". */
test("avvio rapido con MakeHuman reale conclude la cinematic ed entra nell'hub @makehuman", async ({ page }) => {
  test.setTimeout(660000);

  const errori = [];
  page.on("pageerror", errore => errori.push(errore.message));

  await avviaRapido(page);

  await expect.poll(
    () => fasePreparo(page),
    { timeout: 30000 }
  ).toMatch(/camerino|modello|personaggio|look/i);

  await aspettaIngressoHub(page, 600000);
  expect(errori).toEqual([]);
});
