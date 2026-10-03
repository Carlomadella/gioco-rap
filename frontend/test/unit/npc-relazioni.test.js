import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/npc-relazioni.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return window.ADF_NPC_RELAZIONI;
}

function p(extra={}){
  return {id:"p1",...extra};
}

describe("NPC · punto 10 relazioni col giocatore",()=>{
  it("non inventa dimensioni assenti",()=>{
    const api=runtime();
    expect(api.vista(p())).toEqual({
      personId:"p1",sociale:null,strada:null,carcere:null
    });
  });

  it("legge il rapporto sociale senza trasformarlo in fiducia",()=>{
    const api=runtime();
    const x=p({rel:3,pt:2,numero:true,numDa:8});
    expect(api.sociale(x)).toEqual({
      livello:3,progresso:2,numero:true,numeroDa:8
    });
    expect(api.strada(x)).toBeNull();
    expect(api.carcere(x)).toBeNull();
  });

  it("mantiene indipendenti sociale, Strada e carcere",()=>{
    const api=runtime();
    const x=p({
      rel:4,pt:1,
      strada:{known:true,fiducia:72,streetStatus:"active",favori:2,colpiInsieme:3,tensione:1},
      carcere:{conosciuto:true,rapporto:-5,currentJailId:null}
    });

    expect(api.sociale(x).livello).toBe(4);
    expect(api.strada(x).fiducia).toBe(72);
    expect(api.carcere(x).rapporto).toBe(-5);

    x.rel=1;
    expect(api.strada(x).fiducia).toBe(72);
    expect(api.carcere(x).rapporto).toBe(-5);

    x.strada.fiducia=15;
    expect(api.sociale(x).livello).toBe(1);
    expect(api.carcere(x).rapporto).toBe(-5);

    x.carcere.rapporto=7;
    expect(api.sociale(x).livello).toBe(1);
    expect(api.strada(x).fiducia).toBe(15);
  });

  it("ammette fiducia Strada alta con rapporto sociale basso",()=>{
    const api=runtime();
    const x=p({rel:0,pt:0,strada:{known:true,fiducia:85,streetStatus:"active"}});
    expect(api.vista(x)).toMatchObject({
      sociale:{livello:0},
      strada:{fiducia:85}
    });
  });

  it("ammette rapporto carcerario negativo con relazione sociale positiva",()=>{
    const api=runtime();
    const x=p({rel:3,carcere:{conosciuto:true,rapporto:-8}});
    expect(api.sociale(x).livello).toBe(3);
    expect(api.carcere(x).rapporto).toBe(-8);
  });

  it("non espone un punteggio aggregato",()=>{
    const api=runtime();
    const out=api.vista(p({
      rel:5,
      strada:{known:true,fiducia:100,streetStatus:"active"},
      carcere:{conosciuto:true,rapporto:10}
    }));
    expect(out).not.toHaveProperty("score");
    expect(out).not.toHaveProperty("totale");
    expect(out).not.toHaveProperty("fiducia");
    expect(Object.keys(out).sort()).toEqual(["carcere","personId","sociale","strada"]);
  });

  it("i fatti per i tratti restano dimensionati e non creano relazione",()=>{
    const api=runtime();
    const x=p({
      rel:1,numero:false,
      strada:{known:true,fiducia:40,streetStatus:"cold",tensione:2,rivalita:true},
      carcere:{conosciuto:true,rapporto:-3}
    });
    expect(api.fatti(x)).toEqual({
      socialeAvviato:true,
      stradaConosciuta:true,
      stradaFiducia:40,
      stradaTensione:2,
      stradaRivalita:true,
      carcereConosciuto:true,
      carcereRapporto:-3,
      carcereTensione:true
    });
    expect(x).not.toHaveProperty("fiducia");
  });

  it("accetta numeri legacy serializzati come stringhe senza mutare il save",()=>{
    const api=runtime();
    const x=p({
      rel:"2",pt:"1",
      strada:{known:true,fiducia:"55",streetStatus:"active"},
      carcere:{rapporto:"4"}
    });
    const prima=JSON.stringify(x);
    expect(api.sociale(x).livello).toBe(2);
    expect(api.strada(x).fiducia).toBe(55);
    expect(api.carcere(x).rapporto).toBe(4);
    expect(JSON.stringify(x)).toBe(prima);
  });

  it("normalizza soltanto nella vista, senza riscrivere valori fuori scala",()=>{
    const api=runtime();
    const x=p({
      rel:99,
      strada:{known:true,fiducia:140,streetStatus:"active"},
      carcere:{rapporto:-99}
    });
    expect(api.sociale(x).livello).toBe(5);
    expect(api.strada(x).fiducia).toBe(100);
    expect(api.carcere(x).rapporto).toBe(-10);
    expect(x.rel).toBe(99);
    expect(x.strada.fiducia).toBe(140);
    expect(x.carcere.rapporto).toBe(-99);
  });

  it("rifiuta una dimensione generica inesistente invece di scegliere da solo",()=>{
    const api=runtime();
    expect(()=>api.dimensione(p({rel:2}),"fiducia")).toThrow(/sconosciuta/);
    expect(()=>api.dimensione(p({rel:2}),"relazione")).toThrow(/sconosciuta/);
  });

  it("le viste restituite sono immutabili",()=>{
    const api=runtime();
    const out=api.vista(p({rel:2,strada:{known:true,fiducia:30}}));
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.sociale)).toBe(true);
    expect(Object.isFrozen(out.strada)).toBe(true);
    expect(()=>{ out.sociale.livello=5; }).toThrow(TypeError);
  });

  it("sopravvive al roundtrip JSON senza introdurre campi nuovi",()=>{
    const api=runtime();
    const x=p({
      rel:2,pt:1,numero:true,
      strada:{known:true,fiducia:60,streetStatus:"inactive",favori:1},
      carcere:{conosciuto:true,rapporto:4,currentJailId:"j-1"}
    });
    const copy=JSON.parse(JSON.stringify(x));
    expect(api.vista(copy)).toEqual(api.vista(x));
    expect(copy).not.toHaveProperty("relazioni");
  });
});
