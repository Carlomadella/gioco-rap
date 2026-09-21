/* Lo Shop che cresce con la carriera (21/09/2026): i capi che si sbloccano
   (shFitRequisito, negozio.js) e le offerte della settimana (negozio-offerte.js).
   L'audit guarda che le righe ci siano; qui il codice gira davvero, con un `G`
   finto e senza DOM — le tre funzioni non lo toccano. */
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
    console, Math, Number, Array, Object, Set, String, JSON,
    window: {},
    G: { money: 5000, fans: 0, goals: {}, contract: null, year: 1, week: 1, vestiti: {}, log: [] },
    fmt: n => Math.round(n).toLocaleString("it-IT"),
    $: () => null, hubTap(){}, renderGioco(){},
    stileAddosso: () => [], stileRiga: () => "", stileLookManca: () => null,
    salvataggi: 0
  };
  ctx.save = () => { ctx.salvataggi++; };
  ctx.pushLog = t => ctx.G.log.push(t);
  ctx.window.G = ctx.G;
  ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
  vm.createContext(ctx);
  for(const f of ["js/creator/guardaroba.js", "js/game/negozio-offerte.js", "js/game/negozio.js"])
    vm.runInContext(leggi(f), ctx, { filename: f });
  const run = code => vm.runInContext(code, ctx);
  const capo = id => run(`VETRINA_VESTITI.find(v => v.id === "${id}")`);
  return { ctx, run, capo, G: ctx.G };
}

describe("i capi che si sbloccano con la carriera", () => {
  let p;
  beforeEach(() => { p = partita(); });

  it("la giacca elegante aspetta il primo contratto, e resta sbloccata anche dopo una rescissione", () => {
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "elegante"))')).toBe("dopo il primo contratto");
    p.G.goals.g6 = true;                       // firmato una volta, G.contract di nuovo null
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "elegante"))')).toBeNull();
  });

  it("l'anello di diamanti aspetta 10.000 fan", () => {
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "diamante"))')).toBe("a 10.000 fan");
    p.G.fans = 10000;
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "diamante"))')).toBeNull();
  });

  it("i capi «di Milano» aspettano una trasferta là, contata come la conta trasferte.js", () => {
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "cappotto"))')).toBe("dopo una trasferta a Milano");
    p.G.trasferte = { citta: { milano: { visite: 0 } } };
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "cappotto"))')).toBe("dopo una trasferta a Milano");
    p.G.trasferte.citta.milano.visite = 1;
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "cappotto"))')).toBeNull();
  });

  it("un capo senza requisito e' sempre in vendita, e i bloccati al primo giorno sono sette", () => {
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === "beanie"))')).toBeNull();
    expect(p.run("VETRINA_VESTITI.filter(v => shFitRequisito(v)).length")).toBe(7);
  });

  it("la card bloccata e' spenta e dice cosa serve; il clic non compra", () => {
    const html = p.run('shFitCard(VETRINA_VESTITI.find(v => v.id === "diamante"))');
    expect(html).toContain(" locked");
    expect(html).toContain(" disabled");
    expect(html).toContain("Bloccato · a 10.000 fan");
  });
});

describe("le offerte della settimana", () => {
  let p;
  beforeEach(() => { p = partita(); });

  it("alla prima apertura tira a sorte un capo comprabile a meta' prezzo, ai 5 euro, e salva", () => {
    const off = p.run("offertaDi(VETRINA_VESTITI.find(v => v.id === G.offerte?.capo) || VETRINA_VESTITI[0]); G.offerte");
    expect(off.sett).toBe(1);
    expect(off.capo).toBeTruthy();
    expect(p.ctx.salvataggi).toBe(1);
    const capo = p.capo(off.capo);
    expect(p.run('shFitRequisito(VETRINA_VESTITI.find(v => v.id === G.offerte.capo))')).toBeNull();
    expect(p.run("shFitPrezzo(VETRINA_VESTITI.find(v => v.id === G.offerte.capo))")).toBe(Math.max(5, Math.round(capo.p / 2 / 5) * 5));
  });

  it("nella stessa settimana non ricambia, e la card in offerta ha il listino barrato", () => {
    p.run("offerteSettimana(false)");
    const prima = JSON.stringify(p.G.offerte);
    expect(p.run("offerteSettimana(false)")).toBe(false);
    expect(JSON.stringify(p.G.offerte)).toBe(prima);
    const html = p.run("shFitCard(VETRINA_VESTITI.find(v => v.id === G.offerte.capo))");
    expect(html).toContain('<span class="shprice off"><s>');
    expect(html).toContain("Offerta del lunedì");
  });

  it("l'usato: da uno a tre capi, sconto vero ai 5 punti, scadenza da una a tre settimane, mai il capo del lunedi'", () => {
    p.run("offerteSettimana(false)");
    const s = p.G.offerte;
    expect(s.usato.length).toBeGreaterThanOrEqual(1);
    expect(s.usato.length).toBeLessThanOrEqual(3);
    for(const u of s.usato){
      expect(u.id).not.toBe(s.capo);
      expect(u.fino).toBeGreaterThanOrEqual(2);
      expect(u.fino).toBeLessThanOrEqual(4);
      const v = p.capo(u.id);
      expect(u.p).toBeLessThan(v.p);
      const off = p.run(`offertaDi(VETRINA_VESTITI.find(v => v.id === "${u.id}"))`);
      expect(off.tipo).toBe("usato");
      expect(off.sconto).toBe(Math.round((1 - u.p / v.p) * 100 / 5) * 5);
      expect(off.riga).toContain("−" + off.sconto + "%");
    }
  });

  it("un capo comprato o bloccato non ha offerta, e un bloccato non finisce mai in offerta", () => {
    p.run("offerteSettimana(false)");
    p.run("G.vestiti[VETRINA_VESTITI.find(v => v.id === G.offerte.capo).raw] = true");
    expect(p.run("offertaDi(VETRINA_VESTITI.find(v => v.id === G.offerte.capo))")).toBeNull();
    expect(p.run("VETRINA_VESTITI.filter(v => shFitRequisito(v) && offertaDi(v)).length")).toBe(0);
    const html = p.run("offerteSezione()");
    expect(html).not.toContain("L'offerta del lunedì");
  });

  it("al lunedi' (settimana nuova) cambia il capo, l'usato scaduto esce e il diario lo dice", () => {
    p.run("offerteSettimana(false)");
    const prima = p.G.offerte.capo;
    p.G.week = 2;
    expect(p.run("offerteSettimana(true)")).toBe(true);
    expect(p.G.offerte.sett).toBe(2);
    expect(p.G.offerte.capo).not.toBe(prima);
    expect(p.G.log.some(t => t.startsWith("Allo Shop: "))).toBe(true);
    p.G.week = 40;
    p.run("offerteSettimana(false)");
    expect(p.G.offerte.usato.every(u => u.fino > 40)).toBe(true);
  });

  it("il diario parla anche quando resta solo l'usato e niente a meta' prezzo", () => {
    p.run("VETRINA_VESTITI.forEach(v => { G.vestiti[v.raw] = true; }); offerteSettimana(false)");
    p.G.week = 2;
    // un capo solo libero: finisce sull'usato o a meta' prezzo, ma in tutti e due i casi il diario scrive
    p.run("delete G.vestiti[VETRINA_VESTITI.find(v => v.id === 'beanie').raw]; offerteSettimana(true)");
    expect(p.G.log.filter(t => t.startsWith("Allo Shop: ")).length).toBe(1);
  });

  it("comprare in offerta fa pagare il prezzo scontato", () => {
    p.run("offerteSettimana(false)");
    const capo = p.capo(p.G.offerte.capo);
    const prezzo = p.run("shFitPrezzo(VETRINA_VESTITI.find(v => v.id === G.offerte.capo))");
    expect(prezzo).toBeLessThan(capo.p);
    expect(prezzo).toBe(Math.max(5, Math.round(capo.p * 0.5 / 5) * 5));
  });

  it("un G.offerte rotto o mancante si ripara da solo", () => {
    p.G.offerte = "rotto";
    expect(() => p.run("offertaDi(VETRINA_VESTITI[0])")).not.toThrow();
    expect(typeof p.G.offerte).toBe("object");
    expect(p.G.offerte.sett).toBe(1);
  });
});
