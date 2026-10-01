import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperCartellino(){
  const source = leggi("js/game/actions.js");
  const start = source.indexOf("/* ================= CARTELLINO PRESENZE FABBRICA =================");
  const end = source.indexOf("/* Cosa determina davvero la qualità", start);
  if(start < 0 || end < 0) throw new Error("helper cartellino Fabbrica non trovato");
  return source.slice(start, end);
}

describe("cartellino presenze Fabbrica", () => {
  it("conta i turni reali, anche due nello stesso giorno", () => {
    const ctx = { G:{year:1,week:2,day:3}, Number, Math, Array, Object };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperCartellino(), ctx);

    vm.runInContext("fabbricaRegistraPresenza(); fabbricaRegistraPresenza();", ctx);
    const out = vm.runInContext("fabbricaCartellino()", ctx);

    expect(out.totale).toBe(2);
    expect(out.settimana).toBe(2);
    expect(out.giorno).toBe(3);
    expect(out.conteggi[out.posOggi]).toBe(2);
  });

  it("azzera automaticamente il registro all'inizio del ciclo successivo", () => {
    const ctx = { G:{year:1,week:4,day:7}, Number, Math, Array, Object };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperCartellino(), ctx);

    vm.runInContext("fabbricaRegistraPresenza()", ctx);
    expect(vm.runInContext("fabbricaCartellino().totale", ctx)).toBe(1);

    ctx.G.week = 5;
    ctx.G.day = 1;
    const nuovo = vm.runInContext("fabbricaCartellino()", ctx);

    expect(nuovo.totale).toBe(0);
    expect(nuovo.settimana).toBe(1);
    expect(nuovo.giorno).toBe(1);
  });

  it("timbra solo il turno da operaio e la UI usa il nuovo pannello", () => {
    const actions = leggi("js/game/actions.js");
    const luoghi = leggi("js/game/luoghi-foto.js");

    expect(actions).toContain('if(j && j.id === "operaio") fabbricaRegistraPresenza();');
    expect(luoghi).toContain('lfPan("Cartellino presenze", lfFabbricaCartellino(), "orologio")');

    const start = luoghi.indexOf("function lfFabbrica(){");
    const end = luoghi.indexOf("/* ---------- LA PIZZERIA ----------", start);
    const fabbrica = luoghi.slice(start, end);
    expect(fabbrica).not.toContain('lfPan("Oggi"');
  });
});
