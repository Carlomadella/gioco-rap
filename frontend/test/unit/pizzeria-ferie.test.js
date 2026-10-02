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

function contesto(overrides = {}){
  const G = Object.assign({
    year:1,week:1,day:2,
    job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
    workplaces:{
      pizzeria:{
        contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
        attendance:{ciclo:0,turni:[]}
      }
    }
  },overrides);
  const ctx={G,Number,Math,Array,Object,Set};
  ctx.totalWeeks=()=> (ctx.G.year-1)*52+ctx.G.week;
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(),ctx);
  return ctx;
}

describe("ferie Pizzeria", () => {
  it("prevede un solo giorno ogni ciclo di quattro settimane", () => {
    const ctx=contesto();
    const def=vm.runInContext('lavoroContrattoDef("pizzeria")',ctx);
    expect(def.ferieGiorniPerCiclo).toBe(1);
    expect(def.ferieAnticipoMinimoGiorni).toBe(1);

    expect(vm.runInContext('lavoroFerieDisponibili("pizzeria",0)',ctx)).toBe(1);
    const prima=vm.runInContext('lavoroFerieRichiedi("pizzeria",3)',ctx);
    expect(prima.ok).toBe(true);
    expect(prima.remaining).toBe(0);

    const seconda=vm.runInContext('lavoroFerieRichiedi("pizzeria",4)',ctx);
    expect(seconda.ok).toBe(false);
    expect(seconda.reason).toContain("1 giorno");
  });

  it("una ferie copre uno dei quattro servizi senza inventare un turno", () => {
    const ctx=contesto({
      week:1,day:2,
      workplaces:{
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          attendance:{ciclo:0,turni:[1,2,3]}
        }
      }
    });

    expect(vm.runInContext('lavoroFerieRichiedi("pizzeria",5).ok',ctx)).toBe(true);
    ctx.G.day=7;

    const out=vm.runInContext(
      'lavoroValutaDisciplinaSettimana("pizzeria",1,0,0,G.workplaces.pizzeria.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.workedDays).toBe(3);
    expect(out.vacationDays).toBe(1);
    expect(out.coveredDays).toBe(4);
    expect(out.absences).toBe(0);
    expect(out.warningAdded).toBe(0);
  });

  it("nel giorno di ferie il turno è bloccato e non viene pagato", () => {
    const ctx=contesto({day:2});
    expect(vm.runInContext('lavoroFerieRichiedi("pizzeria",3).ok',ctx)).toBe(true);
    ctx.G.day=3;

    const gate=vm.runInContext('lavoroTurnoConsentitoOggi("pizzeria")',ctx);
    expect(gate.ok).toBe(false);
    expect(gate.phase).toBe("vacation");
    expect(gate.reason).toContain("Ferie");
  });

  it("non permette ferie sul lunedì di riposo o sopra una copertura extra", () => {
    const ctx=contesto({day:5});
    const lunediAssoluto=8;
    const lunedi=vm.runInContext('lavoroFerieRichiedi("pizzeria",8)',ctx);
    expect(lunedi.ok).toBe(false);
    expect(lunedi.reason).toContain("giorno ordinario");

    vm.runInContext(`
      G.workplaces.pizzeria.overtime={
        lastCheckAbsoluteDay:null,lastOfferWeek:1,pendingOffer:null,
        accepted:{targetAbsoluteDay:6,tipo:"giorno-extra"},history:[]
      };
    `,ctx);
    const extra=vm.runInContext('lavoroFerieRichiedi("pizzeria",6)',ctx);
    expect(extra.ok).toBe(false);
    expect(extra.reason).toContain("straordinario");
  });

  it("la pagina Pizzeria mostra il pannello ferie con la quota propria", () => {
    const luoghi=leggi("js/game/luoghi-foto.js");
    expect(luoghi).toContain('function lfPizzeriaFerie(){ return lfFerieLavoro("pizzeria","Pizzeria"); }');
    expect(luoghi).toContain('lfPan("Ferie", lfPizzeriaFerie(), "orologio")');
    expect(luoghi).toContain('const quota=max===1 ? "1 giorno ogni 4 settimane"');
    expect(luoghi).toContain('luogoFerie==="fabbrica" || luogoFerie==="pizzeria"');
  });
});
