import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const posto=fs.readFileSync(path.join(ROOT,"js/game/posto.js"),"utf8");

function helper(){
  const start=posto.indexOf("function postoGiornoAssolutoValido");
  const end=posto.indexOf("function postoSoloLavoro",start);
  if(start<0 || end<0) throw new Error("helper rientro carcere non trovato");
  return posto.slice(start,end);
}

function runtime({oggi=100}={}){
  let saves=0;
  const logs=[];
  const G={year:1,week:1,day:1};
  const ctx={
    G,Math,Number,Object,String,Array,RegExp,
    stradaAbsDay:()=>oggi,
    save:()=>{saves++;},
    pushLog:(msg,cls)=>logs.push({msg,cls})
  };
  vm.createContext(ctx);
  vm.runInContext(helper(),ctx);
  return {ctx,G,logs,get saves(){return saves;}};
}

function persona(carcere={}){
  return {
    id:"p1",n:"Test",via:false,origineLuogo:"carcere",
    circoloSbloccato:false,rel:2,pt:3,numero:false,
    carcere:{
      currentJailId:null,
      linkedStreet:false,
      outsideFollowupDone:false,
      rapporto:0,
      releasedAbsoluteDay:null,
      returnAfterAbsoluteDay:null,
      ...carcere
    }
  };
}

describe("NPC · punto 6 stati dinamici / rientro carcere",()=>{
  it("null non diventa giorno zero e senza uscita valida non sblocca",()=>{
    const r=runtime({oggi:500});
    const p=persona();
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",Object.assign(r.ctx,{p}))).toBe(false);
    expect(p.circoloSbloccato).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBeNull();
    expect(r.saves).toBe(0);
  });

  it.each([null,undefined,"","   ",false,0,-1,1.5,"1.5","abc"])(
    "rifiuta giorno assoluto non valido %#",
    valore=>{
      const r=runtime();
      Object.assign(r.ctx,{valore});
      expect(vm.runInContext("postoGiornoAssolutoValido(valore)",r.ctx)).toBeNull();
    }
  );

  it("accetta numero intero positivo e stringa numerica positiva",()=>{
    const r=runtime();
    Object.assign(r.ctx,{a:42,b:" 142 "});
    expect(vm.runInContext("postoGiornoAssolutoValido(a)",r.ctx)).toBe(42);
    expect(vm.runInContext("postoGiornoAssolutoValido(b)",r.ctx)).toBe(142);
  });

  it("ricostruisce il ritardo legacy di 42 giorni per rapporto >=2",()=>{
    const r=runtime({oggi:141});
    const p=persona({rapporto:2,releasedAbsoluteDay:100});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBe(142);
    expect(p.circoloSbloccato).toBe(false);
  });

  it("ricostruisce 56 giorni per rapporto 1",()=>{
    const r=runtime({oggi:155});
    const p=persona({rapporto:1,releasedAbsoluteDay:100});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBe(156);
  });

  it("ricostruisce 84 giorni per rapporto 0",()=>{
    const r=runtime({oggi:183});
    const p=persona({rapporto:0,releasedAbsoluteDay:100});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBe(184);
  });

  it("ricostruisce 63 giorni per rapporto negativo",()=>{
    const r=runtime({oggi:162});
    const p=persona({rapporto:-2,releasedAbsoluteDay:100});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBe(163);
  });

  it("una releasedAbsoluteDay numerica salvata come stringa è compatibile",()=>{
    const r=runtime({oggi:142});
    const p=persona({rapporto:2,releasedAbsoluteDay:"100"});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(true);
    expect(p.circoloSbloccato).toBe(true);
  });

  it("una scadenza esplicita valida prevale sulla ricostruzione legacy",()=>{
    const r=runtime({oggi:150});
    const p=persona({rapporto:2,releasedAbsoluteDay:100,returnAfterAbsoluteDay:200});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBe(200);
  });

  it("il confine della scadenza è incluso",()=>{
    const r=runtime({oggi:142});
    const p=persona({returnAfterAbsoluteDay:142});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(true);
    expect(p.circoloSbloccato).toBe(true);
    expect(p.carcere.returnAfterAbsoluteDay).toBeNull();
    expect(r.saves).toBe(1);
    expect(r.logs).toHaveLength(1);
  });

  it("non rientra se è ancora fisicamente collegato a un carcere",()=>{
    const r=runtime({oggi:500});
    const p=persona({currentJailId:"J:2",returnAfterAbsoluteDay:100});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.circoloSbloccato).toBe(false);
  });

  it("non riattiva persone escluse o nate fuori dal carcere",()=>{
    const r=runtime({oggi:500});
    const via=persona({returnAfterAbsoluteDay:100}); via.via=true;
    const lavoro=persona({returnAfterAbsoluteDay:100}); lavoro.origineLuogo="fabbrica";
    Object.assign(r.ctx,{via,lavoro});
    expect(vm.runInContext("postoRientroCarcereDisponibile(via)",r.ctx)).toBe(false);
    expect(vm.runInContext("postoRientroCarcereDisponibile(lavoro)",r.ctx)).toBe(false);
  });

  it("non ricostruisce una scadenza se il rapporto è già passato alla Strada",()=>{
    const r=runtime({oggi:500});
    const p=persona({releasedAbsoluteDay:100,linkedStreet:true});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBeNull();
  });

  it("non ricostruisce una scadenza dopo il follow-up già completato",()=>{
    const r=runtime({oggi:500});
    const p=persona({releasedAbsoluteDay:100,outsideFollowupDone:true});
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(p.carcere.returnAfterAbsoluteDay).toBeNull();
  });

  it("il rientro non regala rapporto, punti o numero ed è idempotente",()=>{
    const r=runtime({oggi:142});
    const p=persona({returnAfterAbsoluteDay:"142"});
    const prima={rel:p.rel,pt:p.pt,numero:p.numero};
    Object.assign(r.ctx,{p});
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(true);
    expect({rel:p.rel,pt:p.pt,numero:p.numero}).toEqual(prima);
    expect(vm.runInContext("postoRientroCarcereDisponibile(p)",r.ctx)).toBe(false);
    expect(r.saves).toBe(1);
  });
});
