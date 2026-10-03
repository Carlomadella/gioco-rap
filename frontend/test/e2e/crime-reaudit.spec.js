const { test, expect } = require("@playwright/test");

async function preparaCrime(page, timeMinutes=18*60){
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() =>
    window.GAME &&
    window.GAME_TIME &&
    window.GAME_HOURS &&
    typeof window.apriStrada === "function" &&
    typeof window.stradaColpiDisponibili === "function"
  );

  await page.evaluate(async (minuti) => {
    GAME.enter();
    await new Promise(res => setTimeout(res, 180));
    for(const id of ["modal","report","recap","adf-result-overlay"]){
      const el=document.getElementById(id);
      if(el) el.classList.remove("on");
    }

    G.strada.badgeSbloccato=true;
    G.strada.ingressoFase="unlocked";
    G.strada.giroAvviato=true;
    if(!G.strada.uscitaGiro) G.strada.uscitaGiro={
      mollato:false,leftAbsoluteDay:null,profondita:0,
      memoryUntilAbsoluteDay:null,lastKnockAbsoluteDay:null,history:[]
    };
    G.strada.uscitaGiro.mollato=false;
    G.strada.traphone={owned:true,source:"test"};
    G.strada.arresto=null;
    G.energy=100;
    G.maxEnergy=100;
    G.timeMinutes=minuti;
    apriStrada();
  }, timeMinutes);
}

test("crime V2 conserva quattro offerte giornaliere ma mostra solo quelle narrative dell'ora", async ({ page }) => {
  const errori=[];
  page.on("pageerror",e=>errori.push(e.message));
  await preparaCrime(page);

  await expect(page.locator("#strada")).toHaveClass(/on/);

  const stato=await page.evaluate(() => {
    const daily=stradaColpiDisponibili().map(c=>c.id);
    const visible=[...document.querySelectorAll("#crimes [data-crime]")].map(x=>x.dataset.crime);
    return {
      daily,
      visible,
      coherent:visible.every(id=>stradaFinestraColpoStato(STRADA_COLPI.find(c=>c.id===id)).ok)
    };
  });
  expect(stato.daily).toHaveLength(4);
  expect(stato.visible.length).toBeLessThanOrEqual(4);
  expect(stato.visible.every(id=>stato.daily.includes(id))).toBe(true);
  expect(stato.coherent).toBe(true);

  const orari=await page.evaluate(() => ({
    mattina:GAME_HOURS.placeStatus("crimin",9*60),
    notte:GAME_HOURS.placeStatus("crimin",26*60)
  }));
  expect(orari.mattina.open).toBe(true);
  expect(orari.mattina.allDay).toBe(true);
  expect(orari.notte.open).toBe(true);
  expect(orari.notte.allDay).toBe(true);

  await page.evaluate(() => {
    G.day=1;
    G.timeMinutes=9*60;
    const st=stradaOfferteColpiStato();
    st.absoluteDay=stradaAbsDay();
    st.ids=["cassa","incasso-notte","giro-notturno","chiavi-giuste"];
    st.previousIds=[];
    renderStrada();
  });
  await expect(page.locator("#crimes [data-crime]")).toHaveCount(0);
  await expect(page.locator("#crimes")).toContainText("Nessun lavoro gira adesso");

  await page.evaluate(() => {
    G.timeMinutes=23*60;
    renderStrada();
  });
  await expect(page.locator("#crimes [data-crime]")).toHaveCount(4);

  const tempo=await page.evaluate(() => {
    G.timeMinutes=18*60;
    G.energy=100;
    const colpo=STRADA_COLPI.find(c=>c.id==="consegne");
    const durata=stradaDurataColpo(colpo);
    const prima=GAME_TIME.now();
    const random=Math.random;
    Math.random=()=>0.001;
    try{
      stradaTenta(colpo.id,"pulito",null,{id:"subito",pagata:true});
    }finally{
      Math.random=random;
    }
    return {prima,dopo:GAME_TIME.now(),durata};
  });

  expect(tempo.dopo-tempo.prima).toBe(tempo.durata);
  expect(errori).toEqual([]);
});

test("crime V2 usa scene core relazionali e non salta i gate", async ({ page }) => {
  await preparaCrime(page,20*60);

  await expect(page.locator("#tab-cover")).toContainText("Persone del giro");
  await expect(page.locator("#tab-cover")).not.toContainText("500 € all'ingresso");
  await expect(page.locator("#tab-cover")).not.toContainText("900 €");
  await expect(page.locator("#lawyer")).not.toHaveText("Prendilo");

  await page.evaluate(() => {
    G.strada.sporchi=1000;
    G.money=0;
    renderStrada();
  });

  await page.locator("#launder").click();
  await expect(page.locator("#crimeModal")).toHaveClass(/on/);
  await expect(page.locator("#mTitle")).toContainText("Come li fai passare");

  await page.locator("#crimeOptions [data-scene-opt]").first().click();
  await expect(page.locator("#crimeModal")).toHaveClass(/on/);
  await expect(page.locator("#mTitle")).toContainText(/Giri piccoli|Riciclaggio/);

  await page.locator("#closeCrimeModal").click();
  await page.locator("#prot").click();
  await expect(page.locator("#mTitle")).toContainText("Protezione");
  await page.locator("#closeCrimeModal").click();

  await page.evaluate(() => {
    G.strada.sporchi=0;
    G.money=0;
    renderStrada();
  });
  await page.locator("#quit").click();
  const prima=page.locator('#crimeOptions [data-scene-opt]').first();
  await expect(prima).toBeDisabled();
  await expect(prima).toContainText("Ti mancano");
});

test("crime V2 mostra rischio, caduta, pressione, lifestyle e chiude davvero lo stato ex-giro", async ({ page }) => {
  await preparaCrime(page,22*60);

  await page.evaluate(() => {
    G.day=1;
    G.strada.heat=60;
    G.timeMinutes=22*60;
    const st=stradaOfferteColpiStato();
    st.absoluteDay=stradaAbsDay();
    st.ids=["giro-notturno","consegne","cassa","conto-aperto"];
    st.previousIds=[];
    renderStrada();
  });

  const primo=page.locator("#crimes [data-crime]").first();
  await expect(primo).toContainText("Rischio");
  await expect(primo).toContainText("Caduta");
  await expect(page.locator("#pressureDetail")).not.toHaveText("");
  await expect(page.locator("#lifestyleRisk")).not.toHaveText("");
  await expect(page.locator("#lifestyleDetail")).toContainText("€/sett.");

  const uscita=await page.evaluate(() => {
    G.money=2500;
    G.strada.sporchi=0;
    const msg=stMollaIlGiro();
    renderStrada();
    return {
      msg,
      lawyer:stIncaricaAvvocato("qualunque"),
      partecipa:stradaPartecipazioneAttiva()
    };
  });
  expect(uscita.partecipa).toBe(false);
  expect(uscita.msg).toContain("Hai mollato il giro");
  expect(uscita.lawyer).toContain("Hai mollato il giro");

  await expect(page.locator("#crimes")).toContainText("Hai mollato il giro");
  await expect(page.locator("#crimes [data-crime]")).toHaveCount(0);
  await expect(page.locator("#quit")).toBeDisabled();
  await expect(page.locator("#quit")).toHaveText("Fuori dal giro");
  await expect(page.locator("#launder")).toBeDisabled();
  await expect(page.locator("#prot")).toBeDisabled();
  await expect(page.locator("#lawyer")).toBeDisabled();
});
