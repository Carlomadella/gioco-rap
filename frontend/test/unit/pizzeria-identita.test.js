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

function contesto(G, extra = {}){
  const ctx = {
    G, Number, Math, Array, Object, Set,
    clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0)),
    ...extra
  };
  ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(), ctx);
  return ctx;
}

describe("identità gameplay Pizzeria", () => {
  it("resta part-time: i quattro ruoli pesano molto meno della Fabbrica", () => {
    const ctx = contesto({
      year:1,week:1,day:2,
      job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18}
    });

    const lavapiatti = vm.runInContext('lavoroEffettiTurno("pizzeria",G.job)',ctx);
    expect(lavapiatti).toMatchObject({
      energia:18,benessere:-1,lucidita:0,fisico:"medio-alto",stress:"basso"
    });

    ctx.G.job.id="aiuto_cucina"; ctx.G.job.n="Aiuto cucina";
    const cucina = vm.runInContext('lavoroEffettiTurno("pizzeria",G.job)',ctx);
    expect(cucina).toMatchObject({
      energia:17,benessere:-1,lucidita:0,fisico:"medio",stress:"medio"
    });

    ctx.G.job.id="aiuto_pizzaiolo"; ctx.G.job.n="Aiuto pizzaiolo";
    const aiuto = vm.runInContext('lavoroEffettiTurno("pizzeria",G.job)',ctx);
    expect(aiuto).toMatchObject({
      energia:16,benessere:0,lucidita:-1,fisico:"medio-basso",stress:"medio"
    });

    ctx.G.job.id="pizzaiolo"; ctx.G.job.n="Pizzaiolo";
    const pizzaiolo = vm.runInContext('lavoroEffettiTurno("pizzeria",G.job)',ctx);
    expect(pizzaiolo).toMatchObject({
      energia:15,benessere:0,lucidita:-1,fisico:"basso",stress:"medio-alto"
    });

    const fabbrica = vm.runInContext('ADF_FABBRICA_CARRIERA.ruoli[0]',ctx);
    expect(lavapiatti.energia).toBeLessThan(fabbrica.energia);
    expect(Math.abs(lavapiatti.benessere)).toBeLessThan(Math.abs(fabbrica.benessereTurno));
  });

  it("rende la carriera lavorativa più lenta e le coperture extra meno invasive della Fabbrica", () => {
    const ctx = contesto({year:1,week:1,day:2});
    const pizzeria = vm.runInContext("ADF_PIZZERIA_CARRIERA",ctx);
    const fabbrica = vm.runInContext("ADF_FABBRICA_CARRIERA",ctx);

    expect(pizzeria.aumento.cicliNelRuolo).toBe(2);
    expect(pizzeria.promozione.cicliNelRuolo).toBe(4);
    expect(pizzeria.promozione.cicliNelRuolo).toBeGreaterThan(fabbrica.promozione.cicliNelRuolo);
    expect(pizzeria.straordinari.chanceSestoGiorno).toBeLessThan(fabbrica.straordinari.chanceSestoGiorno);
    expect(pizzeria.straordinari.chanceDomenica).toBeLessThan(fabbrica.straordinari.chanceDomenica);
  });

  it("aumenta gradualmente l'esposizione sociale senza perdere la rete della sede", () => {
    const ctx = contesto({
      year:1,week:1,day:2,
      job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
      strada:{giroAvviato:false}
    });

    const base = vm.runInContext("lavoroReteDef(G.job)",ctx);
    expect(base.roleId).toBe("lavapiatti");
    expect(base.maxContatti).toBe(5);
    expect(base.chanceIncontro).toBe(.22);
    expect(base.chanceIncontro).toBeGreaterThan(vm.runInContext("ADF_LAVORO_RETE.fabbrica.chanceIncontro",ctx));

    ctx.G.job.id="pizzaiolo"; ctx.G.job.n="Pizzaiolo";
    const top = vm.runInContext("lavoroReteDef(G.job)",ctx);
    expect(vm.runInContext("lavoroReteChiave(G.job)",ctx)).toBe("pizzeria");
    expect(top.roleId).toBe("pizzaiolo");
    expect(top.maxContatti).toBe(8);
    expect(top.chanceIncontro).toBe(.28);
    expect(top.reteBonusIncontro).toBeGreaterThan(base.reteBonusIncontro);
  });

  it("dà un piccolo bonus rete solo quando nasce davvero una persona nuova", () => {
    const persone = [];
    const G = {
      year:1,week:1,day:2,
      job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
      workplaces:{},gente:persone,skills:{rete:0},
      strada:{giroAvviato:false}
    };
    let seq=0;
    const ctx = contesto(G,{
      gain:(skill,v)=>{ G.skills[skill]=Number(G.skills[skill]||0)+Number(v||0); },
      postoContattoLavoroCandidato:(luogo,daRiprendere,max,ruoli,meta)=>{
        const p={id:"p"+(++seq),ruolo:ruoli[0],origineLuogo:luogo,numero:false,via:false};
        persone.push(p);
        return p;
      }
    });

    const niente = vm.runInContext('lavoroTentaIncontroContatto("pizzeria",0.99,G.job)',ctx);
    expect(niente).toBeNull();
    expect(G.skills.rete).toBe(0);

    G.day=3;
    const nuovo = vm.runInContext('lavoroTentaIncontroContatto("pizzeria",0,G.job)',ctx);
    expect(nuovo).not.toBeNull();
    expect(G.skills.rete).toBeCloseTo(.10);
    expect(G.workplaces.pizzeria.network.history[0].networkBonus).toBeCloseTo(.10);

    G.week=2;
    G.day=3;
    ctx.postoContattoLavoroCandidato=()=>persone[0];
    const ripreso = vm.runInContext('lavoroTentaIncontroContatto("pizzeria",0,G.job)',ctx);
    expect(ripreso.id).toBe(nuovo.id);
    expect(G.skills.rete).toBeCloseTo(.10);
    expect(G.workplaces.pizzeria.network.history.at(-1).networkBonus).toBe(0);
  });
});
