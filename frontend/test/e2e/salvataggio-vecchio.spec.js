const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026: il caricamento fondeva solo il primo livello, e una
   `strada` salvata senza `attivita` faceva scoppiare la chiusura della
   settimana a ogni lunedì. */
test("un salvataggio con gli oggetti annidati a metà gioca le sue settimane", async ({ page }) => {
  /* ricarica la pagina del gioco e ci passa un lunedì: con le altre prove
     in parallelo i 30 secondi di serie non bastano sempre */
  test.setTimeout(90000);
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(CHIAVE_PARTITA(), JSON.stringify({
      week:10, year:1, day:3, money:100, fans:50, hype:5, wellbeing:60,
      skills:{scrittura:5, flow:5, presenza:5, rete:5},
      songs:[{t:"Vecchio", q:40, released:true, week:2, streams:100, last:10}],
      bars:[], beats:[], strada:{rep:4, heat:2, precedenti:2}, life:{casa:1}, log:[]
    }));
  });
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  const r = await page.evaluate(async () => {
    GAME.enter();
    const caricata = {rep:G.strada.rep, attivita:typeof G.strada.attivita, casa:G.life.casa, auto:G.life.auto,
      /* una carriera con dei precedenti, salvata prima del flag, resta nel giro */
      nelGiro:stradaGiroAvviato()};
    const bloccati = [];
    /* si parte dal mercoledì: sei giorni passano un lunedì, dove scoppiava */
    /* le finestre che si aprono (anche all'ingresso) si chiudono prima del
       «+1», come farebbe uno che gioca: una decisione può tirarne fuori un'altra */
    const chiudi = async () => {
      for(let k = 0; k < 6; k++){
        await new Promise(res => setTimeout(res, 120));
        const b = document.querySelector("#modal.on #m-opts button"); if(b){ b.click(); continue; }
        /* «recap»: la finestra di fine giornata, dal 02/10/2026 */
        for(const id of ["report", "recap", "scena", "adf-result-overlay"]){
          const el = document.getElementById(id); if(el) el.classList.remove("on");
        }
      }
    };
    for(let i = 0; i < 6; i++){
      await chiudi();
      if(!ADF_TIME_SKIP(1)) bloccati.push(i);
    }
    return {caricata, bloccati, settimana:G.week};
  });

  /* quello che era salvato resta, quello che mancava arriva dai valori iniziali */
  expect(r.caricata).toEqual({rep:4, attivita:"object", casa:1, auto:0, nelGiro:true});
  expect(r.bloccati).toEqual([]);
  expect(r.settimana).toBe(11);
  expect(errori).toEqual([]);
});
