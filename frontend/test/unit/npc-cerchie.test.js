import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const legami=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const cerchie=fs.readFileSync(path.join(ROOT,"js/game/npc-cerchie.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legami,ctx);
  vm.runInContext(cerchie,ctx);
  return window;
}
function p(id){ return {id,n:id}; }
function collega(api,a,b,tipo="conoscenza",opts={}){
  return api.collega(a,b,{tipo,...opts});
}

describe("NPC · punto 13 cerchie sociali",()=>{
  it("riconosce un triangolo reciproco come una cerchia",()=>{
    const w=runtime();
    const [a,b,c]=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,a,b,"amicizia");
    collega(w.ADF_NPC_LEGAMI,b,c,"conoscenza");
    collega(w.ADF_NPC_LEGAMI,c,a,"collaborazione");

    const out=w.ADF_NPC_CERCHIE.cerchie([a,b,c]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      memberIds:["a","b","c"],
      size:3,
      edgeCount:3,
      density:1
    });
  });

  it("una semplice catena di conoscenti non diventa una cerchia",()=>{
    const w=runtime();
    const [a,b,c]=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,a,b);
    collega(w.ADF_NPC_LEGAMI,b,c);
    expect(w.ADF_NPC_CERCHIE.cerchie([a,b,c])).toEqual([]);
  });

  it("due cerchie con una persona ponte restano distinte",()=>{
    const w=runtime();
    const [a,b,c,d,e]=["a","b","c","d","e"].map(p);
    // triangolo a-b-c
    collega(w.ADF_NPC_LEGAMI,a,b,"amicizia");
    collega(w.ADF_NPC_LEGAMI,b,c,"amicizia");
    collega(w.ADF_NPC_LEGAMI,c,a,"amicizia");
    // triangolo c-d-e: c appartiene a entrambe
    collega(w.ADF_NPC_LEGAMI,c,d,"collaborazione");
    collega(w.ADF_NPC_LEGAMI,d,e,"collaborazione");
    collega(w.ADF_NPC_LEGAMI,e,c,"collaborazione");

    const out=w.ADF_NPC_CERCHIE.cerchie([a,b,c,d,e]);
    expect(out).toHaveLength(2);
    expect(out.map(x=>x.memberIds)).toEqual([
      ["a","b","c"],["c","d","e"]
    ]);
    expect(w.ADF_NPC_CERCHIE.perPersona(c,[a,b,c,d,e])).toHaveLength(2);
  });

  it("un solo arco ponte fra due cerchie non crea un mega-cluster",()=>{
    const w=runtime();
    const ps=["a","b","c","d","e","f"].map(p);
    const [a,b,c,d,e,f]=ps;
    for(const [x,y] of [[a,b],[b,c],[c,a],[d,e],[e,f],[f,d]])
      collega(w.ADF_NPC_LEGAMI,x,y,"amicizia");
    collega(w.ADF_NPC_LEGAMI,c,d,"conoscenza");

    const out=w.ADF_NPC_CERCHIE.cerchie(ps);
    expect(out).toHaveLength(2);
    expect(out.map(x=>x.memberIds)).toEqual([
      ["a","b","c"],["d","e","f"]
    ]);
  });

  it("un legame solo direzionale non vale come arco di cerchia",()=>{
    const w=runtime();
    const [a,b,c]=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,a,b,"amicizia");
    collega(w.ADF_NPC_LEGAMI,b,c,"amicizia");
    collega(w.ADF_NPC_LEGAMI,c,a,"amicizia",{reciproco:false});

    expect(w.ADF_NPC_CERCHIE.cerchie([a,b,c])).toEqual([]);
  });

  it("la rivalità pura non costruisce cerchie di co-presenza",()=>{
    const w=runtime();
    const [a,b,c]=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,a,b,"rivalita");
    collega(w.ADF_NPC_LEGAMI,b,c,"rivalita");
    collega(w.ADF_NPC_LEGAMI,c,a,"rivalita");
    expect(w.ADF_NPC_CERCHIE.cerchie([a,b,c])).toEqual([]);
  });

  it("un ciclo di quattro persone è una sola cerchia robusta",()=>{
    const w=runtime();
    const [a,b,c,d]=["a","b","c","d"].map(p);
    for(const [x,y] of [[a,b],[b,c],[c,d],[d,a]])
      collega(w.ADF_NPC_LEGAMI,x,y);
    const out=w.ADF_NPC_CERCHIE.cerchie([a,b,c,d]);
    expect(out).toHaveLength(1);
    expect(out[0].memberIds).toEqual(["a","b","c","d"]);
    expect(out[0].edgeCount).toBe(4);
    expect(out[0].density).toBeCloseTo(4/6);
  });

  it("più tipi sullo stesso arco contano come un solo collegamento sociale",()=>{
    const w=runtime();
    const [a,b,c]=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,a,b,"amicizia");
    collega(w.ADF_NPC_LEGAMI,a,b,"collaborazione");
    collega(w.ADF_NPC_LEGAMI,b,c,"amicizia");
    collega(w.ADF_NPC_LEGAMI,c,a,"amicizia");
    const out=w.ADF_NPC_CERCHIE.cerchie([a,b,c]);
    expect(out[0].edgeCount).toBe(3);
  });

  it("i record legacy reciproci senza tipo restano conoscenze sociali valide",()=>{
    const w=runtime();
    const a={id:"a",reteLegami:[{personId:"b"},{personId:"c"}]};
    const b={id:"b",reteLegami:[{personId:"a"},{personId:"c"}]};
    const c={id:"c",reteLegami:[{personId:"a"},{personId:"b"}]};
    expect(w.ADF_NPC_CERCHIE.cerchie([a,b,c])).toHaveLength(1);
  });

  it("compagniDiCerchia non include conoscenti collegati soltanto da un ponte",()=>{
    const w=runtime();
    const ps=["a","b","c","d","e","f"].map(p);
    const [a,b,c,d,e,f]=ps;
    for(const [x,y] of [[a,b],[b,c],[c,a],[d,e],[e,f],[f,d]])
      collega(w.ADF_NPC_LEGAMI,x,y);
    collega(w.ADF_NPC_LEGAMI,c,d);

    expect(
      w.ADF_NPC_CERCHIE.compagniDiCerchia(a,ps).map(x=>x.id)
    ).toEqual(["b","c"]);
    expect(
      w.ADF_NPC_CERCHIE.compagniDiCerchia(c,ps).map(x=>x.id)
    ).toEqual(["a","b"]);
  });

  it("una persona condivisa fra due cerchie vede i membri di entrambe",()=>{
    const w=runtime();
    const ps=["a","b","c","d","e"].map(p);
    const [a,b,c,d,e]=ps;
    for(const [x,y] of [[a,b],[b,c],[c,a],[c,d],[d,e],[e,c]])
      collega(w.ADF_NPC_LEGAMI,x,y);

    expect(
      w.ADF_NPC_CERCHIE.compagniDiCerchia(c,ps).map(x=>x.id)
    ).toEqual(["a","b","d","e"]);
  });

  it("le appartenenze sono derivate e deterministiche",()=>{
    const w=runtime();
    const ps=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,ps[0],ps[1]);
    collega(w.ADF_NPC_LEGAMI,ps[1],ps[2]);
    collega(w.ADF_NPC_LEGAMI,ps[2],ps[0]);

    const first=w.ADF_NPC_CERCHIE.appartenenze(ps);
    const second=w.ADF_NPC_CERCHIE.appartenenze([...ps].reverse());
    expect(first).toEqual(second);
    expect(first).toEqual([
      {personId:"a",circleKeys:["cerchia:a|b|c"]},
      {personId:"b",circleKeys:["cerchia:a|b|c"]},
      {personId:"c",circleKeys:["cerchia:a|b|c"]}
    ]);
  });

  it("non scrive campi di gruppo o cerchia dentro le PERSONA",()=>{
    const w=runtime();
    const ps=["a","b","c"].map(p);
    collega(w.ADF_NPC_LEGAMI,ps[0],ps[1]);
    collega(w.ADF_NPC_LEGAMI,ps[1],ps[2]);
    collega(w.ADF_NPC_LEGAMI,ps[2],ps[0]);
    const before=JSON.stringify(ps);

    w.ADF_NPC_CERCHIE.cerchie(ps);
    w.ADF_NPC_CERCHIE.perPersona(ps[0],ps);
    w.ADF_NPC_CERCHIE.appartenenze(ps);

    expect(JSON.stringify(ps)).toBe(before);
    for(const x of ps){
      expect(x).not.toHaveProperty("cerchie");
      expect(x).not.toHaveProperty("gruppi");
      expect(x).not.toHaveProperty("groupIds");
    }
  });

  it("gestisce 800 PERSONA senza creare una matrice o profili aggiuntivi",()=>{
    const w=runtime();
    const ps=Array.from({length:800},(_,i)=>p("p"+String(i).padStart(3,"0")));
    for(let base=0;base<30;base+=3){
      collega(w.ADF_NPC_LEGAMI,ps[base],ps[base+1]);
      collega(w.ADF_NPC_LEGAMI,ps[base+1],ps[base+2]);
      collega(w.ADF_NPC_LEGAMI,ps[base+2],ps[base]);
    }
    const beforeFields=ps.reduce((n,x)=>n+Object.keys(x).length,0);
    const out=w.ADF_NPC_CERCHIE.cerchie(ps);
    expect(out).toHaveLength(10);
    expect(ps.reduce((n,x)=>n+Object.keys(x).length,0)).toBe(beforeFields);
  });

  it("rifiuta ID duplicati invece di fondere due persone omonime/duplicate",()=>{
    const w=runtime();
    expect(()=>w.ADF_NPC_CERCHIE.cerchie([{id:"x"},{id:"x"}]))
      .toThrow(/duplicato/);
  });
});
