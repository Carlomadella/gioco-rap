import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperLavoro(){
  const source=leggi("js/game/actions.js");
  const start=source.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end=source.indexOf("/* Cosa determina davvero la qualità",start);
  if(start<0 || end<0) throw new Error("helper lavoro per luogo non trovato");
  return source.slice(start,end);
}

function ambiente(){
  const G={
    year:1,week:1,day:7,
    job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
    workplaces:{
      pizzeria:{
        contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
        attendance:{ciclo:0,turni:[]}
      }
    }
  };
  const ctx={G,Number,Math,Array,Object,Set};
  ctx.totalWeeks=()=> (ctx.G.year-1)*52+ctx.G.week;
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(),ctx);
  return ctx;
}

describe("disciplina Pizzeria part-time", () => {
  it("una singola assenza costa solo 2 affidabilità e non crea un richiamo", () => {
    const ctx=ambiente();
    ctx.G.workplaces.pizzeria.attendance.turni=[1,2,3];
    const out=vm.runInContext(
      'lavoroValutaDisciplinaSettimana("pizzeria",1,0,0,G.workplaces.pizzeria.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.absences).toBe(1);
    expect(out.warningAdded).toBe(0);
    expect(out.reliabilityDelta).toBe(-2);
    expect(out.dismissed).toBe(false);
  });

  it("due assenze generano un richiamo ma non un licenziamento immediato", () => {
    const ctx=ambiente();
    ctx.G.workplaces.pizzeria.attendance.turni=[1,2];
    const out=vm.runInContext(
      'lavoroValutaDisciplinaSettimana("pizzeria",1,0,0,G.workplaces.pizzeria.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.absences).toBe(2);
    expect(out.warningAdded).toBe(1);
    expect(out.reliabilityDelta).toBe(-6);
    expect(out.dismissed).toBe(false);
    expect(vm.runInContext('lavoroCarriera("pizzeria").warnings',ctx)).toBe(1);
  });

  it("tollera tre richiami e licenzia solo alla quarta settimana grave", () => {
    const ctx=ambiente();
    const severe=(week,cycle,weekInCycle)=>{
      ctx.G.week=week;
      ctx.G.day=7;
      ctx.G.workplaces.pizzeria.attendance.turni=[];
      return vm.runInContext(
        `lavoroValutaDisciplinaSettimana("pizzeria",${week},${cycle},${weekInCycle},[],{silent:true})`,
        ctx
      );
    };

    const a=severe(1,0,0);
    const b=severe(2,0,1);
    const c=severe(3,0,2);
    expect([a.warningAdded,b.warningAdded,c.warningAdded]).toEqual([1,1,1]);
    expect([a.dismissed,b.dismissed,c.dismissed]).toEqual([false,false,false]);
    expect(vm.runInContext('lavoroCarriera("pizzeria").warnings',ctx)).toBe(3);

    const d=severe(4,0,3);
    expect(d.dismissed).toBe(true);
    expect(ctx.G.job).toBeNull();
    expect(vm.runInContext('lavoroBloccoRiassunzione("pizzeria").active',ctx)).toBe(true);
  });

  it("resta più permissiva della Fabbrica nei malus e nella recidiva", () => {
    const ctx=ambiente();
    const p=vm.runInContext("ADF_PIZZERIA_CARRIERA.disciplina",ctx);
    const f=vm.runInContext("ADF_FABBRICA_CARRIERA.disciplina",ctx);
    expect(p.malusLieveAffidabilita).toBeLessThan(f.malusLieveAffidabilita);
    expect(p.malusRichiamoAffidabilita).toBeLessThan(f.malusRichiamoAffidabilita);
    expect(p.richiamiPrimaLicenziamento).toBeGreaterThan(f.richiamiPrimaLicenziamento);
    expect(p.recuperoRichiamoCicliPerfetti).toBeLessThan(f.recuperoRichiamoCicliPerfetti);
  });
});
