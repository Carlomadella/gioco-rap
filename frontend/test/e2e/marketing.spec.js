"use strict";

const { test, expect } = require("@playwright/test");

async function apriGioco(page){
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() =>
    typeof window.telPromo === "function" &&
    typeof window.studioDaSpingere === "function" &&
    typeof window.renderTelefono === "function"
  );
}

async function statoPromo(page, songs, spingi){
  return page.evaluate(({ songs, spingi }) => {
    G.songs = songs;
    G.studio = { spingi, banco:null };
    G.energy = 100;
    G.week = 20;

    const host = document.createElement("div");
    host.style.width = "280px";
    host.innerHTML = telPromo();
    document.body.appendChild(host);

    const righe = [...host.querySelectorAll(".tli")].map(r => ({
      titolo:r.querySelector(".tlitx b")?.textContent || "",
      tag:r.tagName,
      azione:r.getAttribute("data-spingi"),
      accesa:r.classList.contains("on"),
      sotto:r.querySelector(".tlitx i")?.textContent || "",
      statoSpinta:!!r.querySelector('[data-marketing-state="spinta"]')
    }));

    const motivo = [...host.querySelectorAll(".tnote")]
      .find(n => /sentito|anteprima|LaFamegram/i.test(n.textContent || ""));
    const misuraMotivo = motivo ? {
      scrollWidth:motivo.scrollWidth,
      clientWidth:motivo.clientWidth,
      whiteSpace:getComputedStyle(motivo).whiteSpace,
      text:motivo.textContent
    } : null;

    host.remove();
    return { righe, misuraMotivo, html:telPromo() };
  }, { songs, spingi });
}

test("Marketing: un pezzo legacy senza seed non finge di essere cliccabile", async ({ page }) => {
  await apriGioco(page);
  const r = await statoPromo(page, [
    { t:"Legacy", q:51, mixed:true, released:true, week:18, streams:120 },
    { t:"Nuovo", q:62, mixed:true, released:true, week:19, streams:240, seed:202 }
  ], null);

  const legacy = r.righe.find(x => x.titolo === "Legacy");
  expect(legacy).toBeTruthy();
  expect(legacy.azione).toBeNull();
  expect(legacy.tag).not.toBe("BUTTON");
});

test("Marketing: il pezzo scelto resta visibile anche se e' fuori dagli ultimi sei", async ({ page }) => {
  await apriGioco(page);
  const songs = Array.from({ length:8 }, (_, i) => ({
    t:"Pezzo " + (i + 1), q:50 + i, mixed:true, released:true,
    week:i + 1, streams:100 * (i + 1), seed:301 + i
  }));
  const r = await statoPromo(page, songs, 301);

  const vecchio = r.righe.find(x => x.azione === "301");
  expect(vecchio).toBeTruthy();
  expect(vecchio.accesa).toBe(true);
});

test("Marketing: 'in spinta' e' uno stato compatto, non una seconda riga del sottotitolo", async ({ page }) => {
  await apriGioco(page);
  const r = await statoPromo(page, [
    { t:"Spinto", q:70, mixed:true, released:true, week:19, streams:900, seed:401, spinta:1.2 }
  ], 401);

  const spinto = r.righe.find(x => x.titolo === "Spinto");
  expect(spinto).toBeTruthy();
  expect(spinto.sotto.toLowerCase()).not.toContain("in spinta");
  expect(spinto.statoSpinta).toBe(true);
});

test("Marketing: il motivo dell'anteprima spenta resta leggibile nella larghezza telefono", async ({ page }) => {
  await apriGioco(page);
  const r = await statoPromo(page, [
    { t:"Preview", q:68, mixed:true, released:false, week:19, streams:0, seed:501, anteprime:3 }
  ], 501);

  expect(r.html).toContain("Fai uscire una preview");
  expect(r.misuraMotivo).toBeTruthy();
  expect(r.misuraMotivo.whiteSpace).not.toBe("nowrap");
  expect(r.misuraMotivo.scrollWidth).toBeLessThanOrEqual(r.misuraMotivo.clientWidth + 1);
});

test("Marketing: ciclo anteprima, uscita, promo e decadimento della spinta", async ({ page }) => {
  await apriGioco(page);
  const r = await page.evaluate(() => {
    const seed = 901;
    const pezzo = {
      t:"Ciclo Marketing", q:72, mixed:true, released:false,
      week:0, streams:0, last:0, seed
    };

    G.songs = [pezzo];
    G.studio = { spingi:seed, banco:null };
    G.energy = 100;
    G.hype = 10;
    G.fans = 100;
    G.skills.rete = 0;
    G.adfDailyActions = null;
    G.promoSaturation = null;
    G.ended = false;
    G.job = null;
    G.obligation = null;
    G.shifts = 0;
    G.trialCd = 999;

    const anteprima = ACTIONS.find(a => a.id === "anteprima");
    const promo = ACTIONS.find(a => a.id === "promo");
    const hypePrima = G.hype;
    const bisognoAnteprima = anteprima.need();
    const esitoAnteprima = anteprima.run();
    const dopoAnteprima = {
      n:pezzo.anteprime || 0,
      hype:G.hype,
      released:pezzo.released,
      testo:esitoAnteprima
    };

    pezzo.released = true;
    pezzo.week = totalWeeks();
    anteprimeAllUscita(pezzo);
    const dopoUscita = {
      anteprime:pezzo.anteprime,
      spinta:pezzo.spinta
    };

    const bisognoPromo = promo.need();
    const primaPromo = pezzo.spinta;
    const esitoPromo = promo.run();
    const dopoPromo = {
      spinta:pezzo.spinta,
      contate:adfOggi("promo"),
      testo:esitoPromo
    };

    const primaDecadimento = pezzo.spinta;
    const randomPrima = Math.random;
    Math.random = () => 1;
    try{
      advanceWeek();
    } finally {
      Math.random = randomPrima;
    }

    return {
      hypePrima,
      bisognoAnteprima,
      dopoAnteprima,
      dopoUscita,
      bisognoPromo,
      primaPromo,
      dopoPromo,
      primaDecadimento,
      dopoDecadimento:pezzo.spinta || 1
    };
  });

  expect(r.bisognoAnteprima).toBeNull();
  expect(r.dopoAnteprima.n).toBe(1);
  expect(r.dopoAnteprima.hype).toBeGreaterThan(r.hypePrima);
  expect(r.dopoAnteprima.released).toBe(false);
  expect(r.dopoAnteprima.testo).toContain("Anteprima di");

  expect(r.dopoUscita.anteprime).toBeUndefined();
  expect(r.dopoUscita.spinta).toBeCloseTo(1.12, 5);

  expect(r.bisognoPromo).toBeNull();
  expect(r.dopoPromo.spinta).toBeGreaterThan(r.primaPromo);
  expect(r.dopoPromo.contate).toBe(1);
  expect(r.dopoPromo.testo).toContain("Spingi «Ciclo Marketing»");

  expect(r.dopoDecadimento).toBeGreaterThan(1);
  expect(r.dopoDecadimento).toBeLessThan(r.primaDecadimento);
});

test("Marketing V2: l'attesa appartiene al singolo e migra le anteprime vecchie", async ({ page }) => {
  await apriGioco(page);
  const r = await page.evaluate(() => {
    const nuovo = { t:"Nuovo", q:70, released:false, seed:1001 };
    const legacy = { t:"Legacy", q:70, released:false, seed:1002, anteprime:2 };
    const artistaPrima = G.hype;

    return {
      helper:typeof window.marketingReleaseHype,
      nuovo:typeof window.marketingReleaseHype === "function" ? marketingReleaseHype(nuovo) : null,
      legacy:typeof window.marketingReleaseHype === "function" ? marketingReleaseHype(legacy) : null,
      legacySalvato:legacy.releaseHype,
      artistaInvariato:G.hype === artistaPrima
    };
  });

  expect(r.helper).toBe("function");
  expect(r.nuovo).toBe(0);
  expect(r.legacy).toBe(24);
  expect(r.legacySalvato).toBe(24);
  expect(r.artistaInvariato).toBe(true);
});
