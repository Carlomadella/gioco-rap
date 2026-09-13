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

/* Questa prova e' lunga, e deve esserlo: l'avvio rapido non mette piu' un
   avatar finto come quando e' stata scritta, carica MakeHuman vero — il log
   del browser dice «targets.bin (~145 MB)», 269 modifier e 19158 vertici — e
   solo dopo fa partire la cinematic. Misurata il 13/09/2026 su una macchina
   calda col server gia' acceso: 115 secondi dal clic all'hub. I 25 secondi di
   prima erano tarati sul vecchio avatar finto e qui farebbero rosso un gioco
   che invece funziona. Il margine e' largo apposta, perche' in CI il browser
   parte freddo: se un giorno diventa stretto, il problema da guardare e'
   quanto ci mette l'avvio rapido, non il numero qui sotto. */
test("avvio rapido conclude la cinematic ed entra nell'hub", async ({ page }) => {
  test.setTimeout(300000);

  const errori = [];

  page.on("pageerror", errore => {
    errori.push(errore.message);
  });

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

  await expect.poll(
    async () => {
      const gioco = page.frames().find(frame =>
        frame.url().includes("/pagine/gioco.html")
      );

      if(!gioco) return null;

      return gioco.evaluate(() => {
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
    },
    { timeout: 240000 }
  ).toEqual({
    modalitaAudio: "gameplay",
    beatDisponibile: true,
    hubVisibile: true,
    creatorChiuso: true,
    artistaSalvato: true
  });

  expect(errori).toEqual([]);
});
