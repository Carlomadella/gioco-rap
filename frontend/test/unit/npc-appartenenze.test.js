import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/npc-appartenenze.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Infinity,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return window.ADF_NPC_APPARTENENZE;
}

function persona(extra={}){
  return {id:"p1",n:"Luca",ruolo:"collega",origineLuogo:"fabbrica",...extra};
}

describe("NPC · punto 7 appartenenze agli ambienti",()=>{
  it("il caricamento pubblica solo l'API e non deduce dati legacy",()=>{
    const api=runtime();
    const p=persona({circoloSbloccato:true,citta:"milano",fuori:true});
    expect(api.perPersona(p)).toEqual([]);
    expect(p.appartenenze).toBeUndefined();
  });

  it("registra più ambienti sulla stessa persona senza duplicarne l'identità",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"fabbrica:provincia",tipo:"lavoro",fonte:"assunzione-1",dalGiorno:10});
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"invito-sala",dalGiorno:20});
    expect(p.id).toBe("p1");
    expect(api.perPersona(p).map(x=>x.ambienteId)).toEqual([
      "fabbrica:provincia","sala:provincia"
    ]);
  });

  it("ripetere la stessa registrazione è idempotente",()=>{
    const api=runtime();
    const p=persona();
    const e={ambienteId:"sala:provincia",tipo:"musica",fonte:"evento-7",dalGiorno:12};
    const a=api.registra(p,e);
    const b=api.registra(p,e);
    expect(a).toEqual(b);
    expect(p.appartenenze).toHaveLength(1);
  });

  it("la stessa registrazione resta idempotente anche dopo una chiusura",()=>{
    const api=runtime();
    const p=persona();
    const e={ambienteId:"sala:provincia",tipo:"musica",fonte:"evento-7",dalGiorno:12};
    api.registra(p,e);
    api.chiudi(p,"sala:provincia",20,"uscita-sala");
    expect(api.registra(p,e)).toMatchObject({dalGiorno:12,alGiorno:20,fonteFine:"uscita-sala"});
    expect(p.appartenenze).toHaveLength(1);
  });

  it("chiude soltanto l'ambiente indicato e conserva gli altri",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"fabbrica:provincia",tipo:"lavoro",fonte:"job",dalGiorno:2});
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"sala",dalGiorno:3});
    api.chiudi(p,"fabbrica:provincia",8,"fine-lavoro");
    expect(api.attive(p,8).map(x=>x.ambienteId)).toEqual(["sala:provincia"]);
    expect(api.perPersona(p)).toHaveLength(2);
  });

  it("usa intervalli [dalGiorno, alGiorno) e consente un rientro successivo",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"prima",dalGiorno:5,alGiorno:10});
    expect(api.attive(p,5)).toHaveLength(1);
    expect(api.attive(p,9)).toHaveLength(1);
    expect(api.attive(p,10)).toHaveLength(0);
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"rientro",dalGiorno:10});
    expect(api.attive(p,10)).toHaveLength(1);
    expect(p.appartenenze).toHaveLength(2);
  });

  it("una chiusura esplicita può anticipare una scadenza prevista",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"evento:tour",tipo:"evento",fonte:"tour",dalGiorno:20,alGiorno:40});
    const out=api.chiudi(p,"evento:tour",30,"tour-interrotto");
    expect(out).toMatchObject({dalGiorno:20,alGiorno:30,fonteFine:"tour-interrotto"});
    expect(api.attive(p,31)).toHaveLength(0);
  });

  it("distingue ambienti omologhi di città diverse",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"locale",dalGiorno:1});
    api.registra(p,{ambienteId:"sala:milano",tipo:"musica",fonte:"trasferta-mi",dalGiorno:10,alGiorno:12});
    expect(api.attive(p,10).map(x=>x.ambienteId).sort()).toEqual([
      "sala:milano","sala:provincia"
    ]);
  });

  it("le letture restituiscono copie e non permettono di mutare il salvataggio",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"sala",dalGiorno:1});
    const letta=api.perPersona(p);
    letta[0].ambienteId="alterato";
    letta.push({ambienteId:"falso"});
    expect(p.appartenenze).toHaveLength(1);
    expect(p.appartenenze[0].ambienteId).toBe("sala:provincia");
  });

  it("sopravvive a un roundtrip JSON senza cambiare semantica",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"fabbrica:provincia",tipo:"lavoro",fonte:"job",dalGiorno:3});
    api.chiudi(p,"fabbrica:provincia",9,"dimissioni");
    const copy=JSON.parse(JSON.stringify(p));
    expect(api.perPersona(copy)).toEqual(api.perPersona(p));
    expect(api.attive(copy,8)).toHaveLength(1);
    expect(api.attive(copy,9)).toHaveLength(0);
  });

  it("rifiuta tipo incoerente per lo stesso ambiente",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"a",dalGiorno:1,alGiorno:5});
    expect(()=>api.registra(p,{
      ambienteId:"sala:provincia",tipo:"lavoro",fonte:"b",dalGiorno:6
    })).toThrow(/tipo incoerente/);
  });

  it("rifiuta episodi sovrapposti e chiusure non valide",()=>{
    const api=runtime();
    const p=persona();
    api.registra(p,{ambienteId:"sala:provincia",tipo:"musica",fonte:"a",dalGiorno:10,alGiorno:20});
    expect(()=>api.registra(p,{
      ambienteId:"sala:provincia",tipo:"musica",fonte:"b",dalGiorno:19
    })).toThrow(/sovrapposti/);
    expect(api.chiudi(p,"sala:provincia",10,"troppo-presto")).toBeNull();
    expect(()=>api.registra(p,{
      ambienteId:"evento:x",tipo:"evento",fonte:"x",dalGiorno:20,alGiorno:20
    })).toThrow(/successivo/);
  });

  it("rifiuta strutture esplicite incoerenti invece di correggerle",()=>{
    const api=runtime();
    const p=persona({appartenenze:[{
      ambienteId:"sala:provincia",tipo:"musica",fonte:"x",
      dalGiorno:5,alGiorno:null,fonteFine:"inventata"
    }]});
    expect(()=>api.perPersona(p)).toThrow(/fonteFine senza alGiorno/);
  });
});
