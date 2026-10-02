import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("navigazione globale verso la mappa", () => {
  it("tratta Abilità come host sopra l'hub e usa un solo ritorno globale", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <section id="s-hub" class="screen on"><header class="pbarra"><button id="hb-logo"></button></header></section>
      <div id="abilita" class="on"><aside id="leftSidebar"><button id="returnToMap"></button></aside></div>
    </body></html>`, {
      url:"http://localhost/",
      runScripts:"outside-only"
    });

    const { window } = dom;
    window.requestAnimationFrame = cb => { cb(); return 1; };
    window.cancelAnimationFrame = () => {};

    let hubOpen = 0;
    window.HUB = {
      apri(){
        hubOpen += 1;
        window.document.querySelector("#s-hub").classList.add("on");
      }
    };
    window.ADF_ABILITA_API = {
      close(){
        window.document.querySelector("#abilita").classList.remove("on");
      }
    };

    window.eval(leggi("js/menu-sistema.js"));

    const nav = window.document.querySelector("#adf-global-nav");
    const map = nav.querySelector('[data-adf-global="mappa"]');

    expect(window.ADF_NAVIGATION.currentHost()).toBe("abilita");
    expect(nav.parentElement).toBe(window.document.body);
    expect(nav.dataset.host).toBe("abilita");
    expect(nav.hidden).toBe(false);
    expect(map.hidden).toBe(false);

    expect(window.ADF_NAVIGATION.toMap()).not.toBe(false);
    expect(window.document.querySelector("#abilita").classList.contains("on")).toBe(false);
    expect(hubOpen).toBe(1);
  });

  it("non mostra MAPPA nell'hub", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <section id="s-hub" class="screen on"><header class="pbarra"><button id="hb-logo"></button></header></section>
    </body></html>`, {
      url:"http://localhost/",
      runScripts:"outside-only"
    });

    const { window } = dom;
    window.requestAnimationFrame = cb => { cb(); return 1; };
    window.cancelAnimationFrame = () => {};

    window.eval(leggi("js/menu-sistema.js"));

    expect(window.ADF_NAVIGATION.currentHost()).toBe("hub");
    expect(window.document.querySelector('[data-adf-global="mappa"]').hidden).toBe(true);
  });

  it("al cambio giorno chiude il pannello tempo e riallinea il luogo alla mappa", () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <section id="s-hub" class="screen on"><header class="pbarra"></header></section>
      <div id="luogo" class="on"></div>
      <div id="adf-time-controls" class="adf-tc-open"></div>
    </body></html>`, {
      url:"http://localhost/",
      runScripts:"outside-only"
    });

    const { window } = dom;
    window.requestAnimationFrame = cb => { cb(); return 1; };
    window.cancelAnimationFrame = () => {};

    let tempoChiuso = 0;
    let hubOpen = 0;

    window.ADF_TIME_CONTROLS = {
      close(){
        tempoChiuso += 1;
        window.document.querySelector("#adf-time-controls").classList.remove("adf-tc-open");
      }
    };
    window.chiudiLuogo = () => window.document.querySelector("#luogo").classList.remove("on");
    window.HUB = {
      apri(){
        hubOpen += 1;
        window.document.querySelector("#s-hub").classList.add("on");
      }
    };

    window.eval(leggi("js/menu-sistema.js"));

    expect(window.ADF_NAVIGATION.currentHost()).toBe("luogo");
    expect(window.ADF_NAVIGATION.toMap({nuovoGiorno:true})).toBe(true);
    expect(tempoChiuso).toBe(1);
    expect(window.document.querySelector("#luogo").classList.contains("on")).toBe(false);
    expect(hubOpen).toBe(1);

    window.close();
  });

});
