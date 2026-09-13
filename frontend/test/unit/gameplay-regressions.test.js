import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");

function leggi(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

describe("nuovo giorno", () => {
  it.each([100, 130])(
    "riporta l'energia al massimo disponibile: %i",
    massimo => {
      const ctx = {
        console,
        Math,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Date,
        Set,
        Map,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        clamp: (v, min, max) => Math.max(min, Math.min(max, v))
      };

      ctx.window = ctx;

      vm.createContext(ctx);

      vm.runInContext(`
        function syncEnergy(){
          G.maxEnergy = G.__testMax;
        }
      `, ctx);

      vm.runInContext(
        leggi("js/game/sim.js"),
        ctx,
        { filename: "js/game/sim.js" }
      );

      ctx.massimo = massimo;

      const risultato = vm.runInContext(`
        G = {
          ended:false,
          energy:3,
          maxEnergy:massimo,
          __testMax:massimo,
          wellbeing:80,
          day:1,
          strada:null
        };

        avanzaGiorno();

        ({
          energy:G.energy,
          maxEnergy:G.maxEnergy,
          day:G.day
        });
      `, ctx);

      expect(risultato.energy).toBe(massimo);
      expect(risultato.maxEnergy).toBe(massimo);
      expect(risultato.day).toBe(2);
    }
  );
});

describe("ingresso gameplay", () => {
  it("riabilita i beat a ogni ingresso", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only"
    });

    const { window } = dom;

    window.eval(`
      var SET = {
        audio:{
          on:true,
          musicMenuOn:true,
          master:80,
          music:70,
          sfx:80,
          beat:85,
          ui:80,
          ambient:70
        }
      };

      var G = {log:[]};

      function syncEnergy(){}
      function openWeek(){}
      function pushLog(){}
      function renderGioco(){}
      function renderHub(){}
      function goto(s){ window.__schermata = s; }
    `);

    window.eval(leggi("js/audio/engine.js"));

    window.ADF_AUDIO.music = {
      stopForGameplay() {}
    };

    window.eval(leggi("js/game/entry.js"));

    for (let i = 0; i < 3; i++) {
      window.ADF_AUDIO.setMode("pregame");

      expect(window.ADF_AUDIO.canPlay("beat")).toBe(false);

      window.GAME.enter();

      expect(window.ADF_AUDIO.mode).toBe("gameplay");
      expect(window.ADF_AUDIO.canPlay("beat")).toBe(true);
      expect(window.__schermata).toBe("hub");
    }

    dom.window.close();
  });
});
