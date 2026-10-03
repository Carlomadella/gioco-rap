const { test, expect } = require("@playwright/test");

test("la UI crime reale usa quattro offerte e non consuma il tempo due volte", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));

  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() =>
    window.GAME &&
    window.GAME_TIME &&
    typeof window.apriStrada === "function" &&
    typeof window.stradaColpiDisponibili === "function"
  );

  await page.evaluate(async () => {
    GAME.enter();
    await new Promise(res => setTimeout(res, 120));

    for(const id of ["modal","report","recap","adf-result-overlay"]){
      const el=document.getElementById(id);
      if(el) el.classList.remove("on");
    }

    G.strada.badgeSbloccato=true;
    G.strada.ingressoFase="unlocked";
    G.strada.giroAvviato=true;
    G.strada.traphone={
      owned:true,
      sourcePersonId:null,
      sourceName:"Test",
      acquiredAbsoluteDay:1,
      source:"test"
    };
    G.strada.uscitaGiro={
      mollato:false,
      leftAbsoluteDay:null,
      profondita:0,
      memoryUntilAbsoluteDay:null,
      lastKnockAbsoluteDay:null,
      history:[]
    };
    G.energy=100;
    G.maxEnergy=100;
    G.timeMinutes=18*60;
    renderGioco();
    apriStrada();
  });

  await expect(page.locator("#strada")).toHaveClass(/on/);
  await expect(page.locator("#crimes [data-crime]")).toHaveCount(4);
  await expect(page.locator("#tab-cover")).toContainText("Persone del giro");
  await expect(page.locator("#gun")).toHaveText(/Via contatto|Proposta aperta|Ce l'hai/);
  await expect(page.locator("#lawyer")).not.toHaveText("Prendilo");

  const tempo = await page.evaluate(() => {
    const colpo=stradaColpiDisponibili()[0];
    const durata=stradaDurataColpo(colpo);
    const prima=GAME_TIME.now();
    const casuale=Math.random;
    Math.random=()=>0.001;
    try{
      stradaTenta(colpo.id,"pulito",null,{id:"subito",pagata:true});
    }finally{
      Math.random=casuale;
    }
    return {
      prima,
      dopo:GAME_TIME.now(),
      durata,
      scena:STRADA_SCENA&&STRADA_SCENA.titolo
    };
  });

  expect(tempo.dopo-tempo.prima).toBe(tempo.durata);
  expect(tempo.scena).toMatch(/Andata bene|È andata male|Così no/);
  expect(errori).toEqual([]);
});

test("la UI crime espone il feedback del nuovo sistema senza i controlli legacy", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() =>
    window.GAME &&
    typeof window.apriStrada === "function"
  );

  await page.evaluate(() => {
    G.strada.badgeSbloccato=true;
    G.strada.ingressoFase="unlocked";
    G.strada.giroAvviato=true;
    G.strada.traphone={owned:true,source:"test"};
    G.strada.heat=58;
    G.strada.sporchi=900;
    G.timeMinutes=19*60;
    apriStrada();
  });

  await expect(page.locator("#heatWorld")).not.toHaveText("");
  await expect(page.locator("#heatBand")).toContainText(/Alto|Medio|Molto alto|Basso/);
  await expect(page.locator("#lifestyleRisk")).not.toHaveText("");
  await expect(page.locator("#tab-cover")).not.toContainText("500 € all'ingresso");
  await expect(page.locator("#tab-cover")).not.toContainText("900 €");
});
