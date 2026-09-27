import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function gameWithTravelModal() {
  const html = read("pagine/gioco.html");
  const modal = html.slice(html.indexOf('<div class="modal" id="modal"'), html.indexOf("<!-- Script classici"));
  const dom = new JSDOM(`<!doctype html><html><body><div id="hb-pins"><button class="pspot" data-l="studio">Studio</button></div>${modal}</body></html>`, {
    url: "http://localhost/", runScripts: "outside-only"
  });
  const { window } = dom;
  const context = dom.getInternalVMContext();
  vm.runInContext(`
    var $ = id => document.getElementById(id);
    var G = { currentPlace: "vita", strada: null };
    var HUB_LUOGHI = [{ id: "vita", n: "Casa" }, { id: "studio", n: "Studio" }];
    var currentTime = 795;
    var GAME_TIME = {
      DAY_END: 1680,
      now: () => currentTime,
      format: value => String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0"),
      formatDuration: value => value + " min",
      travel: value => { currentTime += value; return { blocked: false }; },
      text: () => GAME_TIME.format(currentTime),
      pending: () => false
    };
    var GAME_HOURS = { placeStatus: () => ({ open: true }), directActionForPlace: () => null };
    function save() {}
    function renderGioco() {}
    function pushLog() {}
  `, context);
  vm.runInContext(read("js/game/modal.js"), context);
  vm.runInContext(read("js/game/spostamenti.js"), context);
  return dom;
}

describe("conferma spostamento", () => {
  it("presenta partenza, arrivo e durata nel pannello dedicato senza consumare tempo", () => {
    const dom = gameWithTravelModal();
    const { window } = dom;
    window.document.querySelector(".pspot").click();

    expect(window.document.querySelector("#modal").classList.contains("travel-confirm")).toBe(true);
    expect(window.document.querySelector("#m-travel").hidden).toBe(false);
    expect(window.document.querySelector("#travel-departure").textContent).toBe("13:15");
    expect(window.document.querySelector("#travel-arrival").textContent).toBe("13:45");
    expect(window.document.querySelector("#travel-duration").textContent).toBe("30 min");
    expect([...window.document.querySelectorAll("#m-opts button .n")].map(el => el.textContent)).toEqual(["Resta qui", "Vai · 30 min"]);
    expect(window.GAME_TIME.now()).toBe(795);
    dom.window.close();
  });

  it("annullare non sposta il personaggio; confermare applica il viaggio", () => {
    const dom = gameWithTravelModal();
    const { window } = dom;
    const pin = window.document.querySelector(".pspot");
    pin.click();
    window.document.querySelector("#m-opts button").click();
    expect(window.G.currentPlace).toBe("vita");
    expect(window.GAME_TIME.now()).toBe(795);

    pin.click();
    window.document.querySelectorAll("#m-opts button")[1].click();
    expect(window.G.currentPlace).toBe("studio");
    expect(window.GAME_TIME.now()).toBe(825);
    dom.window.close();
  });

  it("una modale di altro tipo non eredita lo stile viaggio", () => {
    const dom = gameWithTravelModal();
    const { window } = dom;
    window.document.querySelector(".pspot").click();
    window.showEvent({ k: "Evento", t: "Titolo", d: "Descrizione", opts: [{ n: "OK", d: "", run() {} }] });
    expect(window.document.querySelector("#modal").classList.contains("travel-confirm")).toBe(false);
    expect(window.document.querySelector("#m-travel").hidden).toBe(true);
    expect(window.document.querySelector("#m-d").hidden).toBe(false);
    dom.window.close();
  });
});
