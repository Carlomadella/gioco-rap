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
