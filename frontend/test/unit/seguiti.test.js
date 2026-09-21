/* Remastered e parti 2 (seguiti.js, la coda del punto «Non e' piu': "Faccio un
   pezzo → +10 fama"», 21/09/2026): dalla Discografia si prenotano, in Studio
   si fanno. Girano seguiti.js, sim.js, actions.js e studio.js veri, con un
   `G` finto e il dado seminato. */
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
  MathSeminato.random = dado(7);
  const ctx = {
    console, Math: MathSeminato, Number, Array, Object, Set, String, JSON, Date,
    window: {}, document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 5000, fans: 2000, hype: 20, week: 30, year: 1, goals: {}, songs: [], gente: [], rivals: [], log: [],
         studio: {}, skills: { flow: 30, rete: 10, testo: 30 }, energy: 100, maxEnergy: 100, best: { chart: 99 } },
    fmt: n => String(n), short: n => String(n), $: () => null, pushLog(t){ ctx.G.log.push(t); }, save(){},
    renderGioco(){}, renderHub(){}, renderStudio(){}, toast(){}, SFX: { tap(){}, fail(){}, publish(){}, rec(){} },
    totalWeeks: () => (ctx.G.year - 1) * 52 + ctx.G.week,
    hypeCap: () => 100
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/core.js"), ctx, { filename: "js/core.js" });
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);", ctx);
  for(const f of ["js/game/actions.js", "js/game/beats.js", "js/game/sim.js", "js/game/studio.js", "js/game/seguiti.js"]){
    try{ vm.runInContext(leggi(f), ctx, { filename: f }); }
    catch(e){ /* i file fanno cose col DOM in coda: le funzioni che servono sono gia' definite */ }
  }
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, G: ctx.G };
}

/* un pezzo uscito `eta` settimane fa, con i suoi ascolti */
function pezzo(G, t, seed, eta, streams){
  const s = { t, q: 70, mixed: true, released: true, week: G.week - eta, streams, last: 10, seed, img: "", storia: [], parti: {} };
  G.songs.push(s);
  return s;
}

describe("la discografia decide, lo Studio fa", () => {
  let p;
  beforeEach(() => {
    p = partita();
    pezzo(p.G, "Tutto o niente", 111, 20, 40000);   // vecchio: si puo' tutto
    pezzo(p.G, "Sottopasso", 222, 9, 8000);         // parte 2 si', remastered non ancora
    pezzo(p.G, "Ieri sera", 333, 2, 500);           // troppo giovane
  });

  it("i tasti compaiono con l'eta' giusta: parte 2 da 8 settimane, remastered da 12", () => {
    expect(p.run("discoPuoParte2(G.songs[0])")).toBe(true);
    expect(p.run("discoPuoRemaster(G.songs[0])")).toBe(true);
    expect(p.run("discoPuoParte2(G.songs[1])")).toBe(true);
    expect(p.run("discoPuoRemaster(G.songs[1])")).toBe(false);
    expect(p.run("discoPuoParte2(G.songs[2])")).toBe(false);
    expect(p.run("discoPuoRemaster(G.songs[2])")).toBe(false);
    expect(p.run("discoSeguitiRiga(G.songs[0])")).toContain('data-disco-p2="111"');
    expect(p.run("discoSeguitiRiga(G.songs[0])")).toContain('data-disco-rm="111"');
    expect(p.run("discoSeguitiRiga(G.songs[2])")).toBe("");
  });

  it("la parte 2 si prenota, porta il titolo in Cabina e il pezzo inciso resta legato al primo", () => {
    expect(p.run("discoPrenotaParte2(111)")).toBe(true);
    expect(p.G.studio.seguito).toBe(111);
    expect(p.run("seguitoTitolo()")).toBe("Tutto o niente pt. 2");
    expect(p.run("seguitoCabinaNota()")).toContain("Tutto o niente");
    expect(p.run("discoSeguitiRiga(G.songs[0])")).toContain("prenotata");
    /* il pezzo appena inciso (actions.js lo passa qui) */
    p.run('var s2 = {t: seguitoTitolo(), q: 60, released: false, seed: 444}; G.songs.push(s2); seguitoIncidi(s2);');
    expect(p.run("s2.seguitoDi")).toBe(111);
    expect(p.G.studio.seguito).toBe(null);
    /* niente due parti 2 dello stesso pezzo, e niente parte 3 */
    expect(p.run("discoPuoParte2(G.songs[0])")).toBe(false);
    p.run("s2.released = true; s2.week = G.week - 10;");
    expect(p.run("discoPuoParte2(s2)")).toBe(false);
    expect(p.run("discoSeguitiRiga(s2)")).toContain("parte 2 di «Tutto o niente»");
  });

  it("un titolo lungo si accorcia per far posto a « pt. 2», dentro ai 26 di chiediTitolo", () => {
    p.G.songs[0].t = "Ventisei lettere e anche di più";
    p.run("discoPrenotaParte2(111)");
    const t = p.run("seguitoTitolo()");
    expect(t.length).toBeLessThanOrEqual(26);
    expect(t.endsWith(" pt. 2")).toBe(true);
  });

  it("quando la parte 2 esce, il primo torna a girare: la sua curva ricomincia a meta' forza", () => {
    const primo = p.G.songs[0];
    p.run('var s2 = {t:"Tutto o niente pt. 2", q: 60, released: false, seed: 444, seguitoDi: 111}; G.songs.push(s2);');
    const prima = p.run("curvaPezzo(G.songs[0], totalWeeks() - G.songs[0].week)");
    expect(prima).toBeLessThan(0.1);                       // venti settimane: quasi spenta
    p.run("s2.released = true; s2.week = totalWeeks(); seguitoUscita(s2);");
    expect(primo.rilancio).toBe(p.run("totalWeeks()"));
    const dopo = p.run("curvaPezzo(G.songs[0], totalWeeks() - G.songs[0].week)");
    expect(dopo).toBeCloseTo(0.45, 5);
    expect(p.G.log.some(r => String(r.t || r).includes("torna a girare"))).toBe(true);   // il pushLog vero di sim.js scrive oggetti
    /* e la parte 2 ha la gente del primo che la ascolta */
    expect(p.run("seguitoAscolti(s2)")).toBeGreaterThan(0);
    expect(p.run("seguitoAscolti(G.songs[0])")).toBe(0);
  });

  it("la remastered si prenota, apre il Mix a banco vuoto e la mossa esiste solo finche' e' prenotata", () => {
    expect(p.run('ACTIONS.find(a => a.id === "remaster").avail()')).toBe(false);
    expect(p.run('studioSezAperta(STUDIO_SEZIONI.find(x => x.id === "banco"))')).toBe(false);
    expect(p.run("discoPrenotaRemaster(222)")).toBe(false);     // nove settimane: ancora no
    expect(p.run("discoPrenotaRemaster(111)")).toBe(true);
    expect(p.run('ACTIONS.find(a => a.id === "remaster").avail()')).toBe(true);
    expect(p.run('studioSezAperta(STUDIO_SEZIONI.find(x => x.id === "banco"))')).toBe(true);
    expect(p.run('studioSezAperta(STUDIO_SEZIONI.find(x => x.id === "fuori"))')).toBe(false);
    expect(p.run("remasterPannello()")).toContain('data-az="remaster"');
    expect(p.run("discoSeguitiRiga(G.songs[0])")).toContain("remastered prenotata");
  });

  it("chiudere la remastered: qualita' su, la curva riparte quasi da capo, una volta sola", () => {
    p.run("discoPrenotaRemaster(111)");
    const s = p.G.songs[0];
    const soldi = p.G.money;
    const msg = p.run('ACTIONS.find(a => a.id === "remaster").run()');
    expect(msg).toContain("rimasterizzato");
    expect(s.q).toBeGreaterThanOrEqual(73);                 // almeno +3
    expect(s.remaster).toBe(p.run("totalWeeks()"));
    expect(s.rilancioForza).toBe(0.8);
    expect(p.G.money).toBe(soldi - 80);
    expect(p.G.studio.remaster).toBe(null);
    expect(p.run("curvaPezzo(G.songs[0], totalWeeks() - G.songs[0].week)")).toBeCloseTo(0.8, 5);
    expect(p.run("discoPuoRemaster(G.songs[0])")).toBe(false);
    expect(p.run("discoSeguitiRiga(G.songs[0])")).toContain("remastered</i>");
    expect(p.run('ACTIONS.find(a => a.id === "remaster").avail()')).toBe(false);
  });

  it("la curva rilanciata scende come una curva nuova, e non e' mai sotto a quella vecchia", () => {
    const s = p.G.songs[1];                                  // nove settimane
    s.rilancio = p.run("totalWeeks()"); s.rilancioForza = 0.45;
    const eta = () => p.run("totalWeeks() - G.songs[1].week");
    expect(p.run("curvaPezzo(G.songs[1], " + eta() + ")")).toBeCloseTo(0.45, 5);
    p.G.week += 8;
    const rilanciata = p.run("curvaPezzo(G.songs[1], " + eta() + ")");
    expect(rilanciata).toBeCloseTo(Math.exp(-8 / 7.5) * 0.45, 5);
    expect(rilanciata).toBeGreaterThan(Math.exp(-17 / 7.5));
    /* un pezzo appena uscito non ha bisogno del rilancio: vince la curva sua */
    p.G.songs[2].rilancio = p.run("totalWeeks()"); p.G.songs[2].rilancioForza = 0.45;
    p.G.songs[2].week = p.run("totalWeeks()");
    expect(p.run("curvaPezzo(G.songs[2], 0)")).toBe(1);
  });

  it("una prenotazione rimasta in un salvataggio su un pezzo che non c'e' piu' cade da sola", () => {
    p.G.studio.seguito = 999; p.G.studio.remaster = 999;
    expect(p.run("seguitoPrenotato()")).toBe(null);
    expect(p.run("remasterPrenotato()")).toBe(null);
    expect(p.G.studio.seguito).toBe(null);
    expect(p.G.studio.remaster).toBe(null);
  });
});
