/* Mixtape e album (progetti.js, CARLO «Studio (16/09/2026)»: «fai in modo
   che si possano creare mixtape e album»). Girano progetti.js, seguiti.js,
   sim.js e studio-elementi.js veri, con un `G` finto e il dado seminato. */
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
  MathSeminato.random = dado(11);
  const ctx = {
    console, Math: MathSeminato, Number, Array, Object, Set, String, JSON, Date,
    window: {}, document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 1000, fans: 2000, hype: 20, week: 30, year: 1, day: 3, goals: {}, songs: [], gente: [], rivals: [], log: [],
         studio: {}, skills: { flow: 30, rete: 10, scrittura: 30, presenza: 10 }, energy: 100, maxEnergy: 100, best: { chart: 99 } },
    fmt: n => String(n), short: n => String(n), $: () => null, pushLog(t){ ctx.G.log.push(t); }, save(){},
    renderGioco(){}, renderHub(){}, renderStudio(){}, toast(){}, SFX: { tap(){}, fail(){}, publish(){}, rec(){} },
    totalWeeks: () => (ctx.G.year - 1) * 52 + ctx.G.week,
    hypeCap: () => 100, title: () => "Notti lunghe"
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/core.js"), ctx, { filename: "js/core.js" });
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);", ctx);
  for(const f of ["js/game/actions.js", "js/game/sim.js", "js/game/studio.js", "js/game/studio-elementi.js",
                  "js/game/seguiti.js", "js/game/progetti.js"]){
    try{ vm.runInContext(leggi(f), ctx, { filename: f }); }
    catch(e){ /* i file fanno cose col DOM in coda: le funzioni che servono sono gia' definite */ }
  }
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, G: ctx.G };
}

/* un pezzo inciso e non uscito */
function inciso(G, t, seed, q, tema = "strada", extra = {}){
  const s = { t, q, mixed: true, released: false, week: 0, streams: 0, last: 0, seed, img: "", tema, parti: {}, ...extra };
  G.songs.push(s);
  return s;
}
/* un singolo uscito `eta` settimane fa */
function singolo(G, t, seed, eta){
  const s = { t, q: 70, mixed: true, released: true, week: G.week - eta, streams: 5000, last: 100, seed, img: "", storia: [], parti: {} };
  G.songs.push(s);
  return s;
}

describe("il disco si mette in fila nello Studio", () => {
  let p;
  beforeEach(() => {
    p = partita();
    for(let i = 0; i < 9; i++) inciso(p.G, "Pezzo " + i, 100 + i, 60 + i);
    singolo(p.G, "Primo singolo", 900, 3);
    singolo(p.G, "Secondo singolo", 901, 5);
    singolo(p.G, "Terzo singolo", 902, 7);
  });

  it("un mixtape vuole almeno quattro tracce, e non più di due singoli già fuori", () => {
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102)");
    expect(p.run("discoManca()")).toContain("almeno 4");
    p.run("discoAggiungi(900); discoAggiungi(901)");
    expect(p.run("discoAggiungi(902)")).toBe(false);
    expect(p.run("discoTracce().length")).toBe(5);
    expect(p.run("discoManca()")).toBe(null);
  });

  it("l'album costa il mastering e vuole otto tracce", () => {
    p.run("discoScegliTipo('album')");
    for(let i = 0; i < 8; i++) p.run("discoAggiungi(" + (100 + i) + ")");
    expect(p.run("discoManca()")).toBe(null);
    p.G.money = 100;
    expect(p.run("discoManca()")).toContain("350");
  });

  it("l'ordine si sposta e una traccia si toglie", () => {
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102)");
    p.run("discoSposta(102, -1)");
    expect(p.run("discoBozza().tracce")).toEqual([100, 102, 101]);
    p.run("discoTogli(100)");
    expect(p.run("discoBozza().tracce")).toEqual([102, 101]);
  });

  it("i riempitivi abbassano il voto, e se metà delle tracce parla della stessa cosa il disco è coeso", () => {
    p.G.songs[0].q = 30;  // un riempitivo
    const v = p.run("discoVoto([G.songs[0], G.songs[1], G.songs[2], G.songs[3]])");
    expect(v.riempitivi).toBe(1);
    expect(v.voto).toBe(v.media - 3);
    expect(p.run("discoCoesione([G.songs[0], G.songs[1], G.songs[2]]).ok")).toBe(true);
    p.G.songs[1].tema = "amore"; p.G.songs[2].tema = "soldi";
    expect(p.run("discoCoesione([G.songs[0], G.songs[1], G.songs[2]]).ok")).toBe(false);
  });

  it("stanotte: le tracce nuove escono tutte, i singoli tornano a girare, l'hype e la gente arrivano", () => {
    const hype = p.G.hype, fans = p.G.fans;
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102); discoAggiungi(103); discoAggiungi(900)");
    p.G.studio.disco.t = "Fame vera";
    const d = p.run("discoChiudi()");
    expect(d.released).toBe(true);
    expect(d.t).toBe("Fame vera");
    for(const seed of [100, 101, 102, 103]){
      const s = p.G.songs.find(x => x.seed === seed);
      expect(s.released).toBe(true);
      expect(s.week).toBe(30);
      expect(s.progetto).toBe(d.id);
    }
    const sing = p.G.songs.find(x => x.seed === 900);
    expect(sing.week).toBe(27);           // resta uscito quando era uscito
    expect(sing.rilancio).toBe(30);       // ma torna a girare
    expect(p.G.hype).toBeGreaterThan(hype);
    expect(p.G.fans).toBeGreaterThan(fans);
    expect(p.G.studio.disco).toBe(null);
    /* un pezzo che sta in un disco non entra in un altro */
    expect(p.run("discoAggiungi(100)")).toBe(false);
    /* e il disco spinge le sue tracce, sempre meno */
    expect(p.run("progettoSpinta(G.songs[0])")).toBeCloseTo(1.15 + 0.1, 5);
    p.G.week = 38;
    expect(p.run("progettoSpinta(G.songs[0])")).toBeLessThan(1.1);
    expect(p.run("progettoSpinta(G.songs[8])")).toBe(1);
  });

  it("venerdì: il disco aspetta in coda con le tracce ferme, ed esce da solo quando arriva il giorno", () => {
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102); discoAggiungi(103)");
    p.run("discoBozza().quando = 'venerdi'");
    const d = p.run("discoChiudi()");
    expect(d.released).toBe(false);
    expect(d.esce).toBeGreaterThan(p.run("studioOggiAssoluto()"));
    /* le tracce in coda non si ritirano dalla cassaforte una a una, e non escono da sole */
    expect(p.run("studioTenuti().some(s => s.progetto != null)")).toBe(false);
    expect(p.run("studioListaBanco().some(s => s.progetto != null)")).toBe(false);
    expect(p.run("discoManca()")).toContain("in coda");
    /* arriva venerdì */
    p.G.day = 5;
    p.run("progettiUscitePronti()");
    expect(d.released).toBe(true);
    expect(p.G.songs.find(x => x.seed === 100).released).toBe(true);
  });

  it("ritirato dalla coda torna bozza, e le tracce tornano libere", () => {
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102); discoAggiungi(103)");
    p.run("discoBozza().quando = 'venerdi'");
    p.run("discoChiudi()");
    p.run("discoRitira()");
    expect(p.G.progetti.length).toBe(0);
    expect(p.run("discoBozza().tracce")).toEqual([100, 101, 102, 103]);
    expect(p.G.songs.find(x => x.seed === 100).progetto).toBe(undefined);
    expect(p.run("studioTenuti().length")).toBe(4);
  });

  it("un singolo rimasterizzato da poco, messo in un mixtape, non gira di meno; e il feat porta il suo hype", () => {
    const vecchio = p.G.songs.find(x => x.seed === 900);
    vecchio.rilancio = 28; vecchio.rilancioForza = 0.8;     // remastered due settimane fa
    p.G.songs[0].featFama = 50;                            // un nome grosso su una traccia nuova
    p.run("discoAggiungi(100); discoAggiungi(101); discoAggiungi(102); discoAggiungi(900)");
    const senzaFeat = p.run("discoHype('mixtape', discoVoto(discoTracce()).voto, discoCoesione(discoTracce()), false, 0)");
    const conFeat = p.run("discoHype('mixtape', discoVoto(discoTracce()).voto, discoCoesione(discoTracce()), false, discoFeatHype(discoTracce()))");
    expect(conFeat).toBe(senzaFeat + 4);
    p.run("discoChiudi()");
    expect(vecchio.rilancio).toBe(30);
    expect(vecchio.rilancioForza).toBeCloseTo(0.8 * Math.exp(-2 / 7.5), 5);
    expect(JSON.stringify(p.G.log)).toContain("il mixtape");
  });

  it("un album ritirato dalla coda non ripaga il mastering, e di venerdì esce stanotte", () => {
    p.run("discoScegliTipo('album')");
    for(let i = 0; i < 8; i++) p.run("discoAggiungi(" + (100 + i) + ")");
    p.run("discoBozza().quando = 'venerdi'");
    p.run("discoChiudi()");
    expect(p.G.money).toBe(650);
    p.run("discoRitira()");
    expect(p.run("discoCosto()")).toBe(0);
    /* oggi è venerdì: non esce subito, esce quando la giornata gira */
    p.G.day = 5;
    const d = p.run("discoChiudi()");
    expect(p.G.money).toBe(650);
    expect(d.released).toBe(false);
    p.G.day = 6;
    p.run("progettiUscitePronti()");
    expect(d.released).toBe(true);
  });
});
