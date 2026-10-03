import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const crimeUi=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine-ui.js"),"utf8");

const start=crime.indexOf("const STRADA_INTEL_TIPI");
const end=crime.indexOf("/* Attività di provincia",start);
if(start<0 || end<0) throw new Error("blocco intel punto 24 non trovato");
const intelCode=crime.slice(start,end);

function runtime({day=100,ferro=false,squadra=[]}={}){
  const G={strada:{ferro}};
  const ctx={
    G,Object,Array,Number,Math,String,
    stradaAbsDay:()=>ctx.day,
    stradaPersoneSquadra:()=>squadra,
    day
  };
  vm.createContext(ctx);
  vm.runInContext(intelCode,ctx);
  return {ctx,G};
}

describe("Strada · punto 24 conoscenza, sotterfugio e informazione",()=>{
  it("l'intel è specifico del colpo e del giorno",()=>{
    const {ctx}=runtime({day:100});
    const colpo={id:"cassa"};
    ctx.colpo=colpo;
    const a=vm.runInContext('stradaIntelCrea(colpo,"informazioni",null)',ctx);
    const b=vm.runInContext('stradaIntelPerColpo("cassa")',ctx);
    expect(b.intelId).toBe(a.intelId);
    expect(b.colpoId).toBe("cassa");

    ctx.day=101;
    expect(vm.runInContext('stradaIntelPerColpo("cassa")',ctx)).toBeNull();
  });

  it("non consiglia approcci che il giocatore non può usare",()=>{
    const a=runtime({ferro:false,squadra:[]});
    a.ctx.colpo={id:"consegne"};
    const only=vm.runInContext('stradaIntelCrea(colpo,"informazioni",null)',a.ctx);
    expect(only.approachId).toBe("pulito");

    const b=runtime({ferro:true,squadra:[{id:"p1"}]});
    b.ctx.colpo={id:"chiavi"};
    const richer=vm.runInContext('stradaIntelCrea(colpo,"finestra",null)',b.ctx);
    expect(["pulito","squadra","ferro"]).toContain(richer.approachId);
  });

  it("sfruttare la dritta conserva il bonus, ignorarla ne lascia solo una parte",()=>{
    const {ctx}=runtime();
    ctx.colpo={id:"retrobottega"};
    vm.runInContext('stradaIntelCrea(colpo,"informazioni",null)',ctx);
    vm.runInContext(
      'var STRADA_PREPARAZIONI=['+
      '{id:"subito",n:"Vai",chance:0,heat:1},'+
      '{id:"informazioni",n:"Info",chance:.05,heat:.90}'+
      '];'+
      'function stradaPreparazioneDaId(id){return STRADA_PREPARAZIONI.find(x=>x.id===id)||STRADA_PREPARAZIONI[0];}'+
      'function stradaPreparazioneContesto(x){return x;}',
      ctx
    );
    const intel=vm.runInContext('stradaIntelPerColpo("retrobottega")',ctx);
    ctx.match={id:intel.approachId};
    ctx.other={id:intel.approachId==="pulito"?"squadra":"pulito"};
    ctx.prep={id:"informazioni",pagata:true,intelColpoId:"retrobottega"};
    const effectFn=crime.slice(
      crime.indexOf("function stradaPreparazioneEffetti("),
      crime.indexOf("function stradaPreparazioneEtichetta",crime.indexOf("function stradaPreparazioneEffetti("))
    );
    vm.runInContext(effectFn,ctx);
    const good=vm.runInContext("stradaPreparazioneEffetti(prep,match)",ctx);
    const bad=vm.runInContext("stradaPreparazioneEffetti(prep,other)",ctx);
    expect(good.chance).toBe(.05);
    expect(good.heat).toBe(.90);
    expect(bad.chance).toBeLessThan(good.chance);
    expect(bad.heat).toBeGreaterThan(good.heat);
  });

  it("un contatto reale diventa la fonte leggibile dell'informazione",()=>{
    const {ctx}=runtime();
    ctx.colpo={id:"deposito"};
    ctx.p={id:"p7",n:"Nina"};
    const intel=vm.runInContext('stradaIntelCrea(colpo,"contatto",p)',ctx);
    expect(intel.sourcePersonId).toBe("p7");
    expect(intel.sourceLabel).toBe("Dritta di Nina");
  });

  it("la UI V2 rende davvero visibili intel, stima e metadati delle scelte",()=>{
    expect(crime).toContain('...(intel?[{t:"Intel: "+(typeof stradaIntelDescrizione==="function"');
    expect(crime).toContain('"Stima "+stima+"% · "+(usaIntel?"sfrutta la dritta":baseDx)');
    expect(crimeUi).toContain("const stats=(STRADA_SCENA.stats||[])");
    expect(crimeUi).toContain("const meta=[o.sx,o.dx].filter(Boolean)");
    expect(crimeUi).toContain('typeof stradaOpportunitaAttiva==="function"');
    expect(crimeUi).toContain('typeof ADF_WORK_EVENTS.crimeLeadActive==="function"');
  });

  it("l'informazione viene consumata quando il colpo viene tentato",()=>{
    expect(crime).toContain("stradaIntelConsuma(colpo.id);");
    expect(crime.indexOf("stradaIntelConsuma(colpo.id);"))
      .toBeGreaterThan(crime.indexOf("function stradaTenta("));
  });
});
