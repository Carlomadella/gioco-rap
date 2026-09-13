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

/* Il marchio @lento serve solo a poterla lanciare da sola
   (`npm run test:e2e:lento`): sta **dentro** alla catena `npm run verifica`,
   perche' e' il percorso dove il bug si era nascosto.

   Dura fra uno e due minuti e mezzo: l'avvio rapido carica MakeHuman vero — il
   log del browser dice «targets.bin (~145 MB)», 269 modifier e 19158 vertici.

   **Attenzione a leggere i suoi rossi.** Il 13/09/2026 ha fallito cinque volte
   di fila e la diagnosi era sbagliata due volte: prima «e' lenta, alziamo il
   tetto», poi «e' pesante, il computer e' occupato». Non era ne' l'una ne'
   l'altra: era il **watcher del server di sviluppo** che ricaricava la landing
   in mezzo alla partita, perche' MakeHuman legge i suoi dati e su Windows
   fs.watch scambia le letture per salvataggi (il perche' per esteso sta in
   strumenti/dev.js, sopra a fs.watch). Sistemato quello, tre giri su tre
   verdi. Se un giorno torna rossa: guarda **prima** se il server sta mandando
   ricariche — ci si mette un minuto, basta ascoltare /__ricarica mentre gira —
   e solo dopo sospetta del gioco. Il tetto qui sotto e' largo apposta, ma
   allargarlo ancora non ha mai sistemato niente. */
test("avvio rapido conclude la cinematic ed entra nell'hub @lento", async ({ page }) => {
  test.setTimeout(660000);

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

      /* Mentre il gioco si accende la sua cornice naviga, e un `evaluate`
         partito un attimo prima muore con «Execution context was destroyed».
         Non e' un esito della prova: e' una domanda fatta nel momento
         sbagliato, e la risposta giusta e' richiedere al giro dopo. Senza
         questo la prova andava rossa per una navigazione riuscita. */
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
        /* La «F» di «Frame was detached» e' maiuscola: senza la /i questo
           controllo non prendeva proprio l'errore piu' frequente. */
        if(/execution context was destroyed|frame was detached|target closed|navigation/i.test(e.message))
          return null;
        throw e;
      }
    },
    { timeout: 600000 }
  ).toEqual({
    modalitaAudio: "gameplay",
    beatDisponibile: true,
    hubVisibile: true,
    creatorChiuso: true,
    artistaSalvato: true
  });

  expect(errori).toEqual([]);
});
