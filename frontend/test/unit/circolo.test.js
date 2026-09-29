/* Il Circolo (29/09/2026): la Sala e il Live Club diventati un posto solo.
   Qui le regole che non si vedono guardando la pagina: le fasce dell'ora, il
   dopo-serata (una risposta buona vale di più per due ore dopo il palco, ma
   il tetto «già visto oggi» resta), la gente che guarda (sale o scende di
   un pezzo, mai di un gradino) e il feat che nasce solo sul palco, la sera.
   Girano posto.js e circolo.js veri, con un `G` e un orologio finti. */
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
    console, Math, Number, Array, Object, Set, String, JSON, Date,
    document: { addEventListener(){}, querySelector: () => null, getElementById: () => null },
    G: { money: 500, fans: 0, hype: 0, energy: 100, wellbeing: 80, week: 1, year: 1, day: 1,
         skills: { presenza: 10, flow: 10, rete: 1 }, songs: [], gente: [], rivals: [], log: [] },
    ora: ORA("21:30"), giorno: "1:1:1",
    fmt: n => String(n), $: () => null, pushLog(){}, save(){}, renderGioco(){}, renderHub(){},
    toast(){}, gain(){}, addLuc(){}, SFX: { tap(){}, fail(){}, fanfare(){} },
    totalWeeks: () => 1,
    adfGiornoKey: () => ctx.giorno
  };
  ctx.GAME_TIME = { now: () => ctx.ora, canSpend: () => ({ ok: true }), spend(){}, formatDuration: m => m + " min" };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/core.js"), ctx, { filename: "js/core.js" });
  vm.runInContext("const clamp = (v,a,b) => Math.max(a, Math.min(b, v)); const rnd = (a,b) => a + Math.random()*(b-a);", ctx);
  for(const f of ["js/game/posto.js", "js/game/circolo.js"]) vm.runInContext(leggi(f), ctx, { filename: f });
  return { ctx, run: c => vm.runInContext(c, ctx) };
}

describe("Il Circolo", () => {
  let c;
  beforeEach(() => { c = circolo(); });

  it("le fasce del riferimento: networking, soundcheck, open mic e live, aftershow; chiuso dalle 03 alle 13", () => {
    const fascia = t => c.run("(circoloFascia(" + ORA(t) + ") || {id:'chiuso'}).id");
    expect(fascia("15:00")).toBe("networking");
    expect(fascia("20:00")).toBe("soundcheck");
    expect(fascia("21:30")).toBe("serata");
    expect(fascia("01:00")).toBe("aftershow");
    expect(fascia("05:00")).toBe("chiuso");
    expect(fascia("10:00")).toBe("chiuso");
  });

  it("il dopo-serata dura due ore, lo stesso giorno", () => {
    c.run("G.circolo = {suonato:{key:'1:1:1', min:" + ORA("22:00") + "}}");
    c.ctx.ora = ORA("23:30");
    expect(c.run("circoloDopoSerata()")).toBe(true);
    c.ctx.ora = ORA("00:30");
    expect(c.run("circoloDopoSerata()")).toBe(false);
    c.ctx.ora = ORA("22:30"); c.ctx.giorno = "1:1:2";
    expect(c.run("circoloDopoSerata()")).toBe(false);
  });

  it("nel dopo-serata una risposta buona vale un punto in più, ma il «già visto oggi» resta il tetto", () => {
    /* una risposta da 1 senza carattere: da sola vale 1 */
    const parla = ult => {
      c.run(`G.gente = [{id:"x", n:"Tizio", ruolo:"fonico", car:"aperto", rel:1, pt:0, ult:${ult}, fama:20, via:false}];
             POSTO_PARLA = {p:G.gente[0], sit:{t:"?", o:[["Una risposta tiepida", 1, null]]}};
             poRispondi(0);`);
      return c.run("G.gente[0].pt");
    };
    expect(parla(-1)).toBe(1);
    c.run("G.circolo = {suonato:{key:'1:1:1', min:" + ORA("21:00") + "}}");
    expect(parla(-1)).toBe(2);
    expect(parla(1)).toBe(1);                 /* già visto oggi: il dopo-serata non lo scavalca */
  });

  it("la gente guarda: chi è collaboratore sale di un pezzo se va bene, ne perde uno se va male, ma non scende di gradino", () => {
    c.run(`G.gente = [{id:"p1", n:"Zeta", ruolo:"rapper", car:"aperto", rel:3, pt:0, ult:0, fama:20, via:false},
                      {id:"p2", n:"Bit", ruolo:"beatmaker", car:"aperto", rel:1, pt:0, ult:0, fama:20, via:false},
                      {id:"p3", n:"Nico", ruolo:"fonico", car:"aperto", rel:2, pt:0, ult:0, fama:20, via:false}]`);
    expect(c.run("circoloGenteGuarda(1.2)")).toContain("Zeta");
    expect(c.run("G.gente[0].pt")).toBe(1);
    expect(c.run("G.gente[1].pt")).toBe(0);   /* un contatto non conta: guarda solo chi è collaboratore o più */
    c.run("circoloGenteGuarda(0.7); circoloGenteGuarda(0.7)");
    expect(c.run("G.gente[0].pt")).toBe(0);
    expect(c.run("G.gente[0].rel")).toBe(3);
  });

  it("il feat nasce sul palco: di pomeriggio è spento anche con un collaboratore, la sera si accende", () => {
    c.run(`G.gente = [{id:"p1", n:"Zeta", ruolo:"rapper", car:"aperto", rel:3, pt:0, ult:0, fama:20, via:false, feat:-99}]`);
    const feat = () => c.run("ccVoci(G.gente[0]).find(h => h.includes('data-cc-az=\"feat\"'))");
    c.ctx.ora = ORA("15:00");
    expect(feat()).toContain("disabled");
    expect(feat()).toContain("nasce sul palco");
    c.ctx.ora = ORA("21:30");
    expect(feat()).not.toContain("disabled");
  });

  it("sul palco si sale solo stando al Circolo, e una serata a metà muore se te ne vai o si spegne il palco", () => {
    c.run('G.currentPlace = "vita"');
    expect(c.run("ccPalcoStato('openmic').ok")).toBe(false);
    expect(c.run("ccPalcoStato('openmic').perche")).toContain("lontano");
    c.run('G.currentPlace = "beat"');
    expect(c.run("ccPalcoStato('openmic').ok")).toBe(true);
    c.run("G.circolo = {serata:{key:'1:1:1', tipo:'openmic', passo:1, pubblico:50, ids:['freddi','sopra','base']}}");
    expect(c.run("!!circoloStato().serata")).toBe(true);
    c.run('G.currentPlace = "vita"');
    expect(c.run("circoloStato().serata")).toBe(null);
    c.run('G.currentPlace = "beat"; G.circolo.serata = {key:"1:1:1", tipo:"openmic", passo:1, pubblico:50, ids:["freddi"]}');
    c.ctx.ora = ORA("01:00");
    expect(c.run("circoloStato().serata")).toBe(null);
  });

  it("la resa della serata si legge una volta sola e torna a 1: un live partito da fuori vale come sempre", () => {
    expect(c.run("circoloResaSerata()")).toBe(1);
    c.run("CIRCOLO_RESA = 1.3");
    expect(c.run("circoloResaSerata()")).toBe(1.3);
    expect(c.run("circoloResaSerata()")).toBe(1);
  });
});
