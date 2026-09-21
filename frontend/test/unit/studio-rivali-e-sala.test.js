/* Le code dello Studio a cinque linguette (problemi-riscontrati 15/09, chiuse
   il 21/09/2026): un rivale della classifica con lo stesso nome di uno della
   Sala si deve poter chiamare (il legame e' l'id del rivale, non il nome), e chi
   accetta dalla classifica non prende un posto di quelli che la Sala fa
   arrivare. Girano studio.js, posto.js e rivals.js veri, con un `G` finto. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function dado(seme){
  let x = seme >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
}

function partita(){
  const MathSeminato = Object.create(Math);
  MathSeminato.random = dado(3);
  const ctx = {
    console, Math: MathSeminato, Number, Array, Object, Set, String, JSON, Date,
    window: {}, document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 5000, fans: 0, hype: 0, week: 1, year: 1, goals: {}, songs: [], gente: [], rivals: [], log: [], studio: {} },
    fmt: n => String(n), $: () => null, pushLog(t){ ctx.G.log.push(t); }, save(){}, renderGioco(){}, renderHub(){}, renderPosto(){},
    toast(){}, SFX: { tap(){}, fail(){}, publish(){} }, hubTap(){},
    totalWeeks: () => (ctx.G.year - 1) * 52 + ctx.G.week,
    streamSettimana: () => 0
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/core.js"), ctx, { filename: "js/core.js" });
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);", ctx);
  for(const f of ["js/game/actions.js", "js/game/beats.js", "js/game/rivals.js", "js/game/posto.js", "js/game/studio.js"]){
    try{ vm.runInContext(leggi(f), ctx, { filename: f }); }
    catch(e){ /* i file fanno cose col DOM in coda: le funzioni che servono sono gia' definite */ }
  }
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, G: ctx.G };
}

describe("un rivale della classifica e il suo omonimo alla Sala", () => {
  let p;
  beforeEach(() => {
    p = partita();
    p.run("sistemaRivali()");
    // alla Sala gira un rapper con lo stesso nome del primo rivale, ma e' un'altra persona
    p.run('G.gente.push({id:"p1", ruolo:"rapper", n:G.rivals[0].n, rel:1, pt:0, ult:-1, feat:-99, fama:20})');
  });

  it("l'omonimo della Sala non nasconde il rivale in «Dalla classifica»", () => {
    const nomi = p.run("studioRivaliChiamabili().map(r => r.n)");
    expect(nomi).toContain(p.G.rivals[0].n);
    expect(nomi.length).toBe(p.G.rivals.length);
  });

  it("chi accetta entra fra i contatti con l'id del rivale, e da li' non si richiama — nemmeno dopo che e' uscito con un pezzo nuovo", () => {
    const r = p.G.rivals[0];
    p.run("studioRivaleInGente(G.rivals[0])");
    const c = p.G.gente.find(x => x.rivale);
    expect(c.rivaleId).toBe(r.id);
    expect(p.run("studioRivaliChiamabili().map(r => r.n)")).not.toContain(r.n);
    expect(p.run("studioRivaliChiamabili().length")).toBe(p.G.rivals.length - 1);
    r.seed = 12345;                                  // e' uscito: la copertina cambia (vitaRivali), lui no
    expect(p.run("studioRivaliChiamabili().map(r => r.n)")).not.toContain(r.n);
  });

  it("i rivali di un salvataggio vecchio prendono un id a sistemaRivali, e ognuno ha il suo", () => {
    p.G.rivals.forEach(r => { delete r.id; });
    p.run("sistemaRivali()");
    expect(p.G.rivals.every(r => typeof r.id === "string" && r.id.startsWith("r"))).toBe(true);
    expect(new Set(p.G.rivals.map(r => r.id)).size).toBe(p.G.rivals.length);
  });

  it("un contatto venuto dalla classifica prima del 21/09 (senza id) vale ancora per nome", () => {
    p.run('G.gente.push({id:"p2", ruolo:"rapper", n:G.rivals[1].n, rivale:true, rel:1})');
    expect(p.run("studioRivaliChiamabili().map(r => r.n)")).not.toContain(p.G.rivals[1].n);
  });

  it("se l'opp era gia' in classifica non ne nasce un secondo con lo stesso nome", () => {
    p.run("studioRivaleInGente(G.rivals[0])");
    const quanti = p.G.rivals.length;
    p.run("diventaOpp(G.gente.find(x => x.rivale))");
    expect(p.G.rivals.length).toBe(quanti);
    expect(p.G.rivals.filter(r => r.n === p.G.rivals[0].n).length).toBe(1);
    expect(p.G.rivals[0].storia).toContain("feat");
  });

  it("uno della Sala che diventa opp entra in classifica come prima", () => {
    const quanti = p.G.rivals.length;
    p.run("diventaOpp(G.gente[0])");
    expect(p.G.rivals.length).toBe(quanti + 1);
  });

  it("la Sala non pesca piu' un nome che sta in classifica, e la classifica non pesca uno della Sala", () => {
    for(let i = 0; i < 20; i++){
      const n = p.run('nuovaPersona("rapper").n');
      expect(p.G.rivals.some(r => r.n === n)).toBe(false);
    }
    p.run('G.gente.push({id:"p9", ruolo:"rapper", n:"Kobra"})');
    p.G.rivals = p.G.rivals.filter(r => r.n !== "Kobra");
    for(let i = 0; i < 20; i++) expect(p.run("nuovoRivale(500).n")).not.toBe("Kobra");
  });
});

describe("chi accetta dalla classifica non ruba un posto alla Sala", () => {
  it("con due rivali fra i contatti la Sala fa arrivare la stessa gente di prima", () => {
    const p = partita();
    p.run("sistemaRivali()");
    p.G.week = 6;                                   // quante = 3 + 3 = 6
    p.run("sistemaGente()");
    const senza = p.run("genteDellaSala().length");
    expect(senza).toBe(6);
    const q = partita();
    q.run("sistemaRivali(); studioRivaleInGente(G.rivals[0]); studioRivaleInGente(G.rivals[1])");
    q.G.week = 6;
    q.run("sistemaGente()");
    expect(q.run("genteDellaSala().length")).toBe(6);
    expect(q.G.gente.length).toBe(8);
    expect(q.G.gente.filter(x => x.rivale).length).toBe(2);
  });

  it("il videomaker e il giornalista arrivano lo stesso, contando solo la gente della Sala", () => {
    const p = partita();
    p.run("sistemaRivali(); studioRivaleInGente(G.rivals[0]); studioRivaleInGente(G.rivals[1]); studioRivaleInGente(G.rivals[2])");
    p.G.songs.push({ released: true });
    p.G.fans = 5000;
    p.G.week = 10;                                  // quante = 8, il tetto
    p.run("sistemaGente()");
    expect(p.G.gente.some(x => x.ruolo === "videomaker")).toBe(true);
    expect(p.G.gente.some(x => x.ruolo === "giornalista")).toBe(true);
    expect(p.run("genteDellaSala().length")).toBe(8);
  });
});
