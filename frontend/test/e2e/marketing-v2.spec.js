"use strict";

const { test, expect } = require("@playwright/test");

test("Marketing V2: una preview alza sia l'hype artista sia l'attesa del singolo", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => typeof window.studioDaAnticipare === "function");

  const r = await page.evaluate(() => {
    const pezzo = {
      t:"Attesa separata", q:70, mixed:true, released:false,
      week:0, streams:0, seed:1101
    };
    G.songs = [pezzo];
    G.studio = {spingi:pezzo.seed, banco:null};
    G.hype = 10;
    G.fans = 100;

    const hypePrima = G.hype;
    const anteprima = ACTIONS.find(a => a.id === "anteprima");
    const attesaPrima = typeof marketingReleaseHype === "function"
      ? marketingReleaseHype(pezzo) : null;
    anteprima.run();

    return {
      helper:typeof window.marketingReleaseHype,
      hypePrima,
      hypeDopo:G.hype,
      attesaPrima,
      attesaDopo:pezzo.releaseHype,
      anteprime:pezzo.anteprime
    };
  });

  expect(r.helper).toBe("function");
  expect(r.attesaPrima).toBe(0);
  expect(r.attesaDopo).toBe(12);
  expect(r.anteprime).toBe(1);
  expect(r.hypeDopo).toBeGreaterThan(r.hypePrima);
});

test("Marketing V2: LaFamegram mostra attesa corrente, prossima e partenza", async ({ page }) => {
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() => typeof window.telPromo === "function");

  const html = await page.evaluate(() => {
    const pezzo = {
      t:"Due preview", q:74, mixed:true, released:false,
      week:0, streams:0, seed:1102, anteprime:2, releaseHype:24
    };
    G.songs = [pezzo];
    G.studio = {spingi:pezzo.seed, banco:null};
    G.energy = 100;
    return telPromo();
  });

  expect(html).toContain("attesa pezzo: <b>24/100</b>");
  expect(html).toContain("dopo questa: <b>36/100</b>");
  expect(html).toContain("partenza <b>136%</b>");
});
