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

test("crime V2 usa quattro offerte, 24/7 e una sola spesa di tempo", async ({ page }) => {
  const errori=[];
  page.on("pageerror",e=>errori.push(e.message));
  await preparaCrime(page);

  await expect(page.locator("#strada")).toHaveClass(/on/);
  await expect(page.locator("#crimes [data-crime]")).toHaveCount(4);

  const orari=await page.evaluate(() => ({
    mattina:GAME_HOURS.placeStatus("crimin",9*60),
    notte:GAME_HOURS.placeStatus("crimin",26*60)
  }));
  expect(orari.mattina.open).toBe(true);
  expect(orari.mattina.allDay).toBe(true);
  expect(orari.notte.open).toBe(true);
  expect(orari.notte.allDay).toBe(true);

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
