import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperLavoro(){
  const source = leggi("js/game/actions.js");
  const start = source.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end = source.indexOf("/* Cosa determina davvero la qualità", start);
  if(start < 0 || end < 0) throw new Error("helper lavoro per luogo non trovato");
  return source.slice(start, end);
}

describe("cartellino presenze Fabbrica", () => {
  it("conta i turni reali, anche due nello stesso giorno", () => {
    const ctx = { G:{year:1,week:2,day:3}, Number, Math, Array, Object };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroRegistraPresenza("fabbrica"); lavoroRegistraPresenza("fabbrica");', ctx);
    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);

    expect(out.totale).toBe(2);
    expect(out.settimana).toBe(2);
    expect(out.giorno).toBe(3);
    expect(out.conteggi[out.posOggi]).toBe(2);
  });

  it("azzera automaticamente il registro all'inizio del ciclo successivo", () => {
    const ctx = { G:{year:1,week:4,day:7}, Number, Math, Array, Object };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroRegistraPresenza("fabbrica")', ctx);
    expect(vm.runInContext('lavoroCartellino("fabbrica").totale', ctx)).toBe(1);

    ctx.G.week = 5;
    ctx.G.day = 1;
    const nuovo = vm.runInContext('lavoroCartellino("fabbrica")', ctx);

    expect(nuovo.totale).toBe(0);
    expect(nuovo.settimana).toBe(1);
    expect(nuovo.giorno).toBe(1);
  });

  it("lega la presenza alla Fabbrica anche se cambia la mansione", () => {
    const ctx = {
      G:{year:1,week:2,day:3,job:{id:"capoturno",place:"fabbrica"}},
      Number, Math, Array, Object
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out = vm.runInContext(`
      const luogo = lavoroLuogo(G.job);
      lavoroRegistraPresenza(luogo);
      ({luogo, totale:lavoroCartellino("fabbrica").totale});
    `, ctx);

    expect(out.luogo).toBe("fabbrica");
    expect(out.totale).toBe(1);
  });

  it("migra il vecchio fabbricaPresenze senza perdere i turni", () => {
    const ctx = {
      G:{year:1,week:2,day:3,fabbricaPresenze:{ciclo:0,turni:[0,1,1]}},
      Number, Math, Array, Object
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);
    expect(out.totale).toBe(3);
    expect(ctx.G.workplaces.fabbrica.attendance.turni).toEqual([0,1,1]);
  });

  it("il turno usa il luogo e la UI Fabbrica non dipende dall'id operaio", () => {
    const actions = leggi("js/game/actions.js");
    const luoghi = leggi("js/game/luoghi-foto.js");
    const tempo = leggi("js/game/tempo.js");
    const orari = leggi("js/game/orari.js");

    expect(actions).toContain("const luogoLavoro = lavoroLuogo(j);");
    expect(actions).not.toContain('if(j && j.id === "operaio") fabbricaRegistraPresenza();');
    expect(luoghi).toContain('lavoroLuogo(G.job) === "fabbrica"');
    expect(luoghi).toContain('lfPan("Cartellino presenze", lfFabbricaCartellino(), "orologio")');
    expect(tempo).toContain("DURATE_LUOGO_LAVORO[luogo]");
    expect(orari).toContain("currentPlace !== place");

    const start = luoghi.indexOf("function lfFabbrica(){");
    const end = luoghi.indexOf("/* ---------- LA PIZZERIA ----------", start);
    const fabbrica = luoghi.slice(start, end);
    expect(fabbrica).not.toContain('G.job.id === def.id');
    expect(fabbrica).not.toContain('lfPan("Oggi"');
  });
});
