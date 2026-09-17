"use strict";

const { test, expect } = require("@playwright/test");

async function apriGioco(page){
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() =>
    typeof window.marketingReleaseHype === "function" &&
    typeof window.telPromo === "function" &&
    typeof window.studioDaAnticipare === "function"
  );
}

test("Marketing V3: la campagna segue teaser, annuncio, snippet, drop e post-release", async ({ page }) => {
  await apriGioco(page);

  const r = await page.evaluate(() => {
    const nuovo = {t:"Nuovo", q:70, mixed:true, released:false, seed:2101, streams:0};
    const legacyPreview = {t:"Legacy preview", q:60, mixed:true, released:false, seed:2102, anteprime:2};
    const legacyFuori = {t:"Legacy fuori", q:65, mixed:true, released:true, seed:2103, streams:100};

    const api = {
      campagna: typeof window.marketingCampagna,
      fase: typeof window.marketingFase,
      avanza: typeof window.marketingAvanza
    };

    const fasi = [];
    if(typeof marketingFase === "function" && typeof marketingAvanza === "function"){
      fasi.push(marketingFase(nuovo));
      fasi.push(marketingAvanza(nuovo, "teaser") && marketingFase(nuovo));
      fasi.push(marketingAvanza(nuovo, "annuncio") && marketingFase(nuovo));
      const fuoriOrdine = marketingAvanza(nuovo, "post-release");
      fasi.push(marketingAvanza(nuovo, "snippet") && marketingFase(nuovo));
      nuovo.released = true;
      fasi.push(marketingAvanza(nuovo, "drop") && marketingFase(nuovo));
      fasi.push(marketingAvanza(nuovo, "post-release") && marketingFase(nuovo));
      return {
        api,
        fasi,
        fuoriOrdine,
        legacyPreview:marketingFase(legacyPreview),
        legacyFuori:marketingFase(legacyFuori)
      };
    }

    return {api, fasi, fuoriOrdine:null, legacyPreview:null, legacyFuori:null};
  });

  expect(r.api.campagna).toBe("function");
  expect(r.api.fase).toBe("function");
  expect(r.api.avanza).toBe("function");
  expect(r.fasi).toEqual(["teaser", "annuncio", "snippet", "drop", "post-release", "completa"]);
  expect(r.fuoriOrdine).toBe(false);
  expect(r.legacyPreview).toBe("drop");
  expect(r.legacyFuori).toBe("post-release");
});

test("Marketing V3: il telefono guida tutta la campagna senza mescolare hype artista e attesa pezzo", async ({ page }) => {
  await apriGioco(page);

  const r = await page.evaluate(() => {
    const seed = 2201;
    const pezzo = {t:"Campagna V3", q:72, mixed:true, released:false, seed, streams:0, week:0};
    G.songs = [pezzo];
    G.studio = {spingi:seed, banco:null};
    G.hype = 10;
    G.fans = 100;
    G.energy = 100;
    G.skills.rete = 0;
    G.adfDailyActions = null;
    G.promoSaturation = null;

    const teaser = ACTIONS.find(a => a.id === "mkt_teaser");
    const annuncio = ACTIONS.find(a => a.id === "mkt_annuncio");
    const snippet = ACTIONS.find(a => a.id === "anteprima");
    const promo = ACTIONS.find(a => a.id === "promo");

    const html0 = telPromo();
    const hype0 = G.hype;

    const teaserEsito = teaser ? teaser.run() : null;
    const dopoTeaser = {
      fase:typeof marketingFase === "function" ? marketingFase(pezzo) : null,
      attesa:pezzo.releaseHype,
      hype:G.hype,
      html:telPromo()
    };

    const annuncioEsito = annuncio ? annuncio.run() : null;
    const dopoAnnuncio = {
      fase:typeof marketingFase === "function" ? marketingFase(pezzo) : null,
      attesa:pezzo.releaseHype,
      hype:G.hype,
      html:telPromo()
    };

    const snippetEsito = snippet.run();
    const dopoSnippet = {
      fase:typeof marketingFase === "function" ? marketingFase(pezzo) : null,
      attesa:pezzo.releaseHype,
      hype:G.hype,
      html:telPromo()
    };

    pezzo.released = true;
    pezzo.week = totalWeeks();
    anteprimeAllUscita(pezzo);
    const dopoDrop = {
      fase:typeof marketingFase === "function" ? marketingFase(pezzo) : null,
      spinta:pezzo.spinta,
      html:telPromo()
    };

    const promoEsito = promo.run();
    const dopoPost = {
      fase:typeof marketingFase === "function" ? marketingFase(pezzo) : null,
      html:telPromo()
    };

    return {
      azioni:{teaser:!!teaser, annuncio:!!annuncio},
      html0,
      hype0,
      teaserEsito,
      dopoTeaser,
      annuncioEsito,
      dopoAnnuncio,
      snippetEsito,
      dopoSnippet,
      dopoDrop,
      promoEsito,
      dopoPost
    };
  });

  expect(r.azioni).toEqual({teaser:true, annuncio:true});
  expect(r.html0).toContain("Pubblica teaser");
  expect(r.dopoTeaser.fase).toBe("annuncio");
  expect(r.dopoTeaser.attesa).toBe(4);
  expect(r.dopoTeaser.hype).toBe(r.hype0);
  expect(r.dopoTeaser.html).toContain("Annuncia il pezzo");

  expect(r.dopoAnnuncio.fase).toBe("snippet");
  expect(r.dopoAnnuncio.attesa).toBe(12);
  expect(r.dopoAnnuncio.hype).toBe(r.hype0);
  expect(r.dopoAnnuncio.html).toContain("Fai uscire una preview");

  expect(r.dopoSnippet.fase).toBe("drop");
  expect(r.dopoSnippet.attesa).toBe(24);
  expect(r.dopoSnippet.hype).toBeGreaterThan(r.hype0);
  expect(r.dopoSnippet.html).toContain("Pronto al drop");

  expect(r.dopoDrop.fase).toBe("post-release");
  expect(r.dopoDrop.spinta).toBeCloseTo(1.24, 5);
  expect(r.dopoDrop.html).toContain("Post-release");

  expect(r.dopoPost.fase).toBe("completa");
  expect(r.dopoPost.html).toContain("Campagna completata");
});
