/* Il recap di fine giornata (recap-giornata.js, 02/10/2026). Girano sim.js
   (pushLog) e recap-giornata.js veri, con un `G` finto. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function partita(){
  const ctx = {
    console, Math, Number, Array, Object, Set, Map, String, JSON, Date,
    document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 100, fans: 50, hype: 10, wellbeing: 80, lucidita: 80, energy: 100, maxEnergy: 100,
         week: 4, year: 1, day: 2, log: [], songs: [], goals: {}, skills: {} },
    SET: { gioco: {} },
    $: () => null, fmt: n => String(n), short: n => String(n)
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);", ctx);
  for(const f of ["js/game/sim.js", "js/game/recap-giornata.js"]){
    try{ vm.runInContext(leggi(f), ctx, { filename: f }); }
    catch(e){ /* sim.js in coda tocca cose del gioco: le funzioni che servono sono gia' definite */ }
  }
  return { run: code => vm.runInContext(code, ctx), G: ctx.G, ctx };
}

describe("il recap racconta la giornata", () => {
  let p;
  beforeEach(() => { p = partita(); });

  it("conta le righe del diario di oggi, anche oltre le 80 che il diario tiene", () => {
    p.run('pushLog("di ieri", "")');
    p.run("recapFoto()");
    for(let i = 0; i < 3; i++) p.run('pushLog("oggi ' + i + '", "")');
    const prep = p.run("recapPrepara()");
    expect(p.run("recapRighe(" + JSON.stringify(prep) + ").map(r => r.t)")).toEqual(["oggi 0", "oggi 1", "oggi 2"]);
    expect(p.G.logN).toBe(4);
  });

  it("gli highlights sono le righe più pesanti, rimesse in ordine di tempo; la riga del cambio giorno non conta", () => {
    p.run("recapFoto()");
    p.run('pushLog("uno", ""); pushLog("due", "good"); pushLog("tre", ""); pushLog("quattro", "big");' +
          'pushLog("cinque", "bad"); pushLog("sei", ""); pushLog("sette", ""); pushLog("<b>Nuovo giorno.</b> · 1 evento", "")');
    const r = p.run("recapDati(recapPrepara())");
    expect(r.highlights.map(x => x.t)).toEqual(["due", "quattro", "cinque", "sei", "sette"]);
    expect(r.altre).toBe(2);
  });

  it("i numeri sono la differenza da stamattina, e le mosse si contano", () => {
    p.run("recapFoto()");
    p.G.money += 60; p.G.fans += 5; p.G.hype -= 2; p.G.energy = 35;
    p.run('recapMossa({n:"Scrivi barre"}); recapMossa({n:"Scrivi barre"}); recapMossa({n:"Promo sui social"})');
    const r = p.run("recapDati(recapPrepara())");
    expect([r.soldi, r.fan, r.hype, r.energia]).toEqual([60, 5, -2, 65]);
    expect(r.titolo).toBe("Martedì · Settimana 4");
    expect(p.run("recapMosseTesto(" + JSON.stringify(r.mosse) + ")")).toBe("Scrivi barre ×2 · Promo sui social");
  });

  it("una fotografia di un altro giorno non racconta niente: se ne fa una nuova", () => {
    p.run("recapFoto()");
    p.run('recapMossa({n:"Scrivi barre"})');
    p.G.day = 5;                                   // i giorni sono passati per un'altra strada
    expect(p.run("recapGiornata().mosse.length")).toBe(0);
    expect(p.run("recapGiornata().day")).toBe(5);
  });

  it("si spegne dalle impostazioni", () => {
    expect(p.run("recapAcceso()")).toBe(true);
    p.ctx.SET.gioco.recap = false;
    expect(p.run("recapAcceso()")).toBe(false);
  });
});
