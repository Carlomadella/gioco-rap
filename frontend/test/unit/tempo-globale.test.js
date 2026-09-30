import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function ambiente(){
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <div id="adf-jail"><div class="adf-jail-top"><div class="adf-jail-meta"></div></div></div>
    <div id="abilita"></div>
    <div id="strada"><div class="topbar"><div class="session"><button class="exit"></button></div></div></div>
    <div id="negozio"><div class="nghead"><button class="ngx"></button></div></div>
    <div id="piazza"><div class="phead"><button class="px"></button></div></div>
    <div id="writer"><div class="whead"><button class="wx"></button></div></div>
    <div id="studio"><div class="sthead"><div class="strisorse"></div></div></div>
    <div id="pannello"><div class="pnhead"><button class="pnx"></button></div></div>
    <div id="luogo"><div class="lfhead"><div class="strisorse"></div></div></div>
    <section id="s-hub" class="screen"><header class="pbarra"><div class="psett"></div><div class="pora"></div></header></section>
  </body></html>`, {
    url:"http://localhost/",
    runScripts:"outside-only",
    pretendToBeVisual:true
  });

  const { window } = dom;
  window.requestAnimationFrame = cb => { cb(); return 1; };
  window.cancelAnimationFrame = () => {};
  window.G = {day:1, week:1, year:1, energy:100, money:0, strada:null};
  window.GAME_TIME = {
    SLOT:15,
    DAY_END:1680,
    now:()=>600,
    format:m => String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"),
    formatDuration:m => m+" min",
    text:()=>"10:00",
    pending:()=>false
  };
  window.GAME_WEATHER = {
    current:()=>({type:"clear",label:"Sereno",intensity:.5})
  };

  window.eval(leggi("js/game/tempo-controlli.js"));
  return window;
}

describe("widget tempo globale", () => {
  it("esiste e apre il pannello in ogni schermata di gameplay", () => {
    const window = ambiente();
    const doc = window.document;
    const casi = [
      ["jail", "#adf-jail", ".adf-jail-meta"],
      ["abilita", "#abilita", "body"],
      ["strada", "#strada", ".session"],
      ["negozio", "#negozio", ".nghead"],
      ["piazza", "#piazza", ".phead"],
      ["writer", "#writer", ".whead"],
      ["studio", "#studio", ".sthead"],
      ["pannello", "#pannello", ".pnhead"],
      ["luogo", "#luogo", ".lfhead"],
      ["hub", "#s-hub", ".pbarra"]
    ];

    for(const [id, rootSel, parentSel] of casi){
      for(const [, sel] of casi) doc.querySelector(sel).classList.remove("on");
      doc.querySelector(rootSel).classList.add("on");

      window.ADF_TIME_CONTROLS.sync();

      const dock = doc.querySelector("#adf-time-dock");
      const widget = doc.querySelector("#adf-time-widget");
      const pannello = doc.querySelector("#adf-time-controls");

      expect(dock.hidden, id).toBe(false);
      expect(widget.hidden, id).toBe(false);
      expect(pannello.hidden, id).toBe(false);
      expect(dock.dataset.host, id).toBe(id);

      const parent = parentSel === "body" ? doc.body : doc.querySelector(rootSel).querySelector(parentSel);
      expect(dock.parentElement, id).toBe(parent);
      if(parentSel !== "body") expect(parent.lastElementChild, id + " · widget sul bordo destro").toBe(dock);

      window.ADF_TIME_CONTROLS.open();
      expect(pannello.classList.contains("adf-tc-open"), id).toBe(true);
      window.ADF_TIME_CONTROLS.close();
    }
  });
});
