/* Il Circolo, le quattro stanze (01/10/2026): Bancone, Sala, Palco,
   Backstage al posto dei quattro riquadri di sotto. Qui le regole delle
   mosse nuove (circolo-incontri.js) — una volta per sera, col loro tempo,
   l'hype che non passa il tetto, i fan che parlano dei pezzi veri — e che
   le quattro stanze si disegnino senza buchi. Girano posto.js, circolo.js,
   circolo-incontri.js e circolo-stanze.js veri, con un `G` e un orologio
   finti, come in circolo.test.js. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const ORA = t => { const [h, m] = t.split(":").map(Number); let v = h * 60 + m; if(v < 480) v += 1440; return v; };

function circolo(){
  const ctx = {
    console, Math: Object.create(Math), Number, Array, Object, Set, String, JSON, Date,
    document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 500, fans: 0, hype: 0, energy: 100, wellbeing: 80, week: 1, year: 1, day: 1,
         skills: { presenza: 10, flow: 10, rete: 1, scrittura: 5 }, songs: [], gente: [], rivals: [], log: [], market: [], beats: [] },
    ora: ORA("21:30"), giorno: "1:1:1", tetto: 100, speso: 0,
    fmt: n => String(n), $: () => null, pushLog(){}, save(){}, renderGioco(){}, renderHub(){}, renderLuogo(){},
    toast(){}, gain(){}, addLuc(){}, SFX: { tap(){}, fail(){}, fanfare(){} },
    totalWeeks: () => ctx.G.week,
    adfGiornoKey: () => ctx.giorno,
    hypeCap: () => ctx.tetto,
    LUOGHI_FOTO_DIR: "media/", LUOGHI_FOTO: { circolo: { f: "il_circolo.png" } }, lfCosto: () => "42 energie"
  };
  /* il dado sempre dalla parte buona, ma mai due volte uguale: gli id della
     gente nascono da Math.random, e con un numero fisso si scontrano */
  let k = 0;
  ctx.Math.random = () => (k = (k + 0.137) % 1) * 0.05;
  ctx.GAME_TIME = { now: () => ctx.ora, canSpend: () => ({ ok: true }), spend: m => { ctx.speso += m; }, formatDuration: m => m + " min" };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/core.js"), ctx, { filename: "js/core.js" });
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);" +
    /* le tabelle di beats.js e rivals.js che posto.js usa per far nascere la gente */
    "const BEAT_IDS = ['trap','boombap']; const RIV_NOMI = ['Ossa','Lince','Doppio Zero','Sabbia','Tara','Kalla']; const RIV_SKIN = ['#8d5524'];", ctx);
  for(const f of ["js/game/posto.js", "js/game/circolo.js", "js/game/circolo-incontri.js", "js/game/circolo-stanze.js"])
    vm.runInContext(leggi(f), ctx, { filename: f });
  return { ctx, run: c => vm.runInContext(c, ctx) };
}

describe("Il Circolo, le quattro stanze", () => {
  let c;
  beforeEach(() => { c = circolo(); c.run("sistemaGente()"); });

  it("al bancone offrire da bere costa 6 €, avvicina di un pezzo e vale una volta per sera", () => {
    const r = c.run(`(() => {
      const p = circoloPresenti().find(circoloSconosciuto);
      const soldi = G.money, pt = p.pt;
      const prima = circoloBancone("bevi", p.id);
      const seconda = circoloBancone("bevi", p.id);
      return {prima, seconda, speso: soldi - G.money, pt: p.pt - pt, rel: p.rel, visto: !circoloSconosciuto(p)};
    })()`);
    expect(r.prima).toBe(true);
    expect(r.seconda).toBe(false);
    expect(r.speso).toBe(6);
    expect(r.pt).toBe(1);
    expect(r.rel).toBe(0);
    expect(r.visto).toBe(true);
    expect(c.ctx.speso).toBe(15);
  });

  it("il giorno dopo la sera ricomincia: si può offrire di nuovo", () => {
    const r = c.run(`(() => {
      const p = circoloPresenti()[0];
      circoloBancone("bevi", p.id);
      const stessa = circoloBanconeMosse(p).find(m => m.id === "bevi").puo;
      return {stessa, p: p.id};
    })()`);
    expect(r.stessa).toBe(false);
    c.ctx.giorno = "1:1:2";
    expect(c.run(`circoloBanconeMosse(G.gente.find(x => x.id === "${r.p}")).find(m => m.id === "bevi").puo`)).toBe(true);
  });

  it("presentarsi si fa solo con chi non conosci, e da lì il nome lo sai", () => {
    const r = c.run(`(() => {
      const p = circoloPresenti().find(circoloSconosciuto);
      const ok = circoloBancone("presentati", p.id);
      const ancora = circoloBanconeMosse(p).find(m => m.id === "presentati");
      return {ok, ancora: ancora.puo, perche: ancora.perche};
    })()`);
    expect(r.ok).toBe(true);
    expect(r.ancora).toBe(false);
    expect(r.perche).toBe("Vi conoscete già");
  });

  it("da lontano al bancone non si fa niente", () => {
    c.ctx.G.currentPlace = "casa";
    expect(c.run(`circoloBanconeMosse(circoloPresenti()[0]).every(m => !m.puo)`)).toBe(true);
  });

  it("il backstage apre con la serata: prima delle 21 non c'è nessuno", () => {
    c.ctx.ora = ORA("18:00");
    expect(c.run("circoloBackstageAperto()")).toBe(false);
    expect(c.run("circoloOspite()")).toBe(null);
    c.ctx.ora = ORA("00:30");
    expect(c.run("circoloBackstageAperto()")).toBe(true);
  });

  it("l'artista della serata: prima ti deve notare, poi ti presenta qualcuno che diventa un tuo contatto", () => {
    const r = c.run(`(() => {
      const prima = circoloBackstageMosse("ospite").find(m => m.id === "contatto").puo;
      circoloBackstage("presentati", "ospite");
      const quanti = G.gente.length;
      const ok = circoloBackstage("contatto", "ospite");
      const nuovo = G.gente[G.gente.length - 1];
      return {prima, ok, piu: G.gente.length - quanti, rel: nuovo.rel, noto: !circoloSconosciuto(nuovo),
        ancora: circoloBackstageMosse("ospite").find(m => m.id === "contatto").puo};
    })()`);
    expect(r.prima).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.piu).toBe(1);
    expect(r.rel).toBe(1);
    expect(r.noto).toBe(true);
    expect(r.ancora).toBe(false);
  });

  it("una collaborazione all'artista si propone una volta ogni quattro settimane, e serve un pezzo fuori", () => {
    c.run(`circoloBackstage("presentati", "ospite")`);
    expect(c.run(`circoloBackstageMosse("ospite").find(m => m.id === "collab").perche`)).toBe("Serve almeno un pezzo fuori");
    c.ctx.G.songs.push({ t: "Neve", q: 60, mixed: true, released: true });
    expect(c.run(`circoloBackstage("collab", "ospite")`)).toBe(true);
    c.ctx.giorno = "1:2:1"; c.ctx.G.week = 3;
    c.run(`circoloBackstage("presentati", "ospite")`);
    expect(c.run(`circoloBackstageMosse("ospite").find(m => m.id === "collab").perche`)).toBe("Ne hai proposta una da poco");
    c.ctx.giorno = "1:5:1"; c.ctx.G.week = 5;
    c.run(`circoloBackstage("presentati", "ospite")`);
    expect(c.run(`circoloBackstageMosse("ospite").find(m => m.id === "collab").puo`)).toBe(true);
  });

  it("i fan arrivano solo con un pezzo fuori, e parlano dei pezzi veri", () => {
    expect(c.run("circoloFan().length")).toBe(0);
    c.ctx.G.songs.push({ t: "Neve Sporca", q: 72, mixed: true, released: true, video: 1.2 },
                       { t: "Vetro", q: 41, mixed: false, released: true });
    const fans = c.run("circoloFan()");
    expect(fans.length).toBeGreaterThan(0);
    for(const f of fans){
      expect(f.si + f.no).toMatch(/Neve Sporca|Vetro|pezzi/);
      /* chi ti dice cosa gli è piaciuto parla di un altro pezzo da quello che critica */
      expect(f.si.includes("Vetro") && f.no.includes("Vetro")).toBe(false);
    }
  });

  it("con un fan una cosa sola per sera; la foto non passa il tetto dell'hype", () => {
    c.ctx.G.songs.push({ t: "Neve Sporca", q: 72, mixed: true, released: true });
    c.ctx.G.hype = 20; c.ctx.tetto = 20;
    expect(c.run(`circoloFanMossa("f0", "foto")`)).toBe(true);
    expect(c.run(`circoloFanMossa("f0", "critica")`)).toBe(false);
    expect(c.ctx.G.hype).toBe(20);
    expect(c.run("CIRCOLO.detto.t")).not.toMatch(/hype/);
  });

  it("le quattro stanze si disegnano, col tasto per tornare al Circolo e senza buchi", () => {
    c.ctx.G.songs.push({ t: "Neve Sporca", q: 72, mixed: true, released: true });
    for(const s of ["bancone", "sala", "palco", "backstage"]){
      const html = c.run(`circoloStanza("${s}", circoloFascia())`);
      expect(html).toContain('data-cc-esci="1"');
      expect(html).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it("l'artista ti presenta qualcuno una volta sola, anche le sere dopo", () => {
    c.run(`circoloBackstage("presentati", "ospite"); circoloBackstage("contatto", "ospite")`);
    const ospite = c.run("circoloOspite().n");
    const quanti = c.ctx.G.gente.length;
    /* la stessa sera dopo, e un'altra sera con lo stesso artista */
    c.ctx.giorno = "1:1:9"; c.ctx.G.day = 1;
    c.run(`circoloBackstage("presentati", "ospite")`);
    expect(c.run("circoloOspite().n")).toBe(ospite);
    expect(c.run(`circoloBackstage("contatto", "ospite")`)).toBe(false);
    expect(c.ctx.G.gente.length).toBe(quanti);
  });

  it("con la Sala piena l'artista non porta gente nuova: parla bene di te a uno che conosci", () => {
    c.run(`while(genteDellaSala().length < POSTO_MAX) G.gente.push(nuovaPersona("fonico")); G.gente.forEach(p => { p.visto = true; })`);
    const quanti = c.ctx.G.gente.length;
    c.run(`circoloBackstage("presentati", "ospite")`);
    expect(c.run(`circoloBackstage("contatto", "ospite")`)).toBe(true);
    expect(c.ctx.G.gente.length).toBe(quanti);
    expect(c.run("CIRCOLO.detto.t")).toMatch(/parla bene di te/);
  });

  it("una sera al Circolo dà al massimo due punti di hype, comunque li prendi", () => {
    c.ctx.G.songs.push({ t: "Neve Sporca", q: 72, mixed: true, released: true });
    c.ctx.G.fans = 2000;
    c.run(`circoloBackstage("presentati", "ospite"); circoloBackstage("networking", "ospite");
      ["f0", "f1", "f2"].forEach(f => circoloFanMossa(f, "foto"))`);
    expect(c.ctx.G.hype).toBe(2);
  });

  it("chi apriva il riquadro della gente (l'agenda) apre la Sala", () => {
    c.run(`circoloApri({pannello:"gente"})`);
    expect(c.run("CIRCOLO.stanza")).toBe("sala");
    c.run(`circoloApri({})`);
    expect(c.run("CIRCOLO.stanza")).toBe(null);
  });
});
