import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const html=fs.readFileSync(path.join(ROOT,"pagine/gioco.html"),"utf8");
const state=fs.readFileSync(path.join(ROOT,"js/game/state.js"),"utf8");
const legami=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const cerchie=fs.readFileSync(path.join(ROOT,"js/game/npc-cerchie.js"),"utf8");
const gruppi=fs.readFileSync(path.join(ROOT,"js/game/npc-gruppi.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8";

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legami,ctx);
  vm.runInContext(cerchie,ctx);
  vm.runInContext(gruppi,ctx);
  return window;
}
function blocco(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

describe("NPC · punto 14 integrazione gruppi emergenti",()=>{
  it("gioco.html carica gruppi dopo cerchie e prima della discovery",()=>{
    const a=html.indexOf("js/game/npc-cerchie.js?v=1");
    const b=html.indexOf("js/game/npc-gruppi.js?v=1");
    const c=html.indexOf("js/game/npc-conoscenza.js?v=1");
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it("START contiene un registro gruppi vuoto per nuovi e vecchi save",()=>{
    expect(state).toContain("rivals:[], gente:[], npcGruppi:[]");
    expect(state).toContain("const base = START(), g = Object.assign(base, dati || {})");
  });

  it("una semplice cerchia non compare come gruppo Strada",()=>{
    const window=runtime();
    const [a,b,c]=["a","b","c"].map(id=>({id,n:id}));
    for(const [x,y] of [[a,b],[b,c],[c,a]])
      window.ADF_NPC_LEGAMI.collega(x,y,{tipo:"amicizia"});
    expect(window.ADF_NPC_CERCHIE.cerchie([a,b,c])).toHaveLength(1);

    const G={npcGruppi:[]};
    const code=blocco(
      strada,
      "function stradaNpcGruppiPersona(p)",
      "function stradaNpcContestoPersona"
    );
    const fn=new Function(
      "window","G","stradaNpcAdapter",
      code+"\nreturn stradaNpcGruppiPersona;"
    )(window,G,()=>null);
    expect(fn(a)).toEqual([]);
  });

  it("un gruppo persistente locale alimenta groupsForPerson della Strada",()=>{
    const window=runtime();
    const ps=["a","b","c"].map(id=>({id,n:id}));
    for(const [x,y] of [[ps[0],ps[1]],[ps[1],ps[2]],[ps[2],ps[0]]])
      window.ADF_NPC_LEGAMI.collega(x,y,{tipo:"amicizia"});
    const key=window.ADF_NPC_CERCHIE.cerchie(ps)[0].key;
    const G={npcGruppi:[]};
    const g=window.ADF_NPC_GRUPPI.promuoviCerchia(G.npcGruppi,ps,key,{
      groupId:"crew-1",tipo:"crew",giorno:10,fonte:"evento:fondazione"
    });

    const code=blocco(
      strada,
      "function stradaNpcGruppiPersona(p)",
      "function stradaNpcContestoPersona"
    );
    const fn=new Function(
      "window","G","stradaNpcAdapter",
      code+"\nreturn stradaNpcGruppiPersona;"
    )(window,G,()=>null);

    expect(fn(ps[0])).toEqual([g]);
    expect(fn({id:"x"})).toEqual([]);
  });

  it("un adapter esterno mantiene priorità sul registro locale",()=>{
    const window=runtime();
    const G={npcGruppi:[{
      groupId:"locale",stato:"attivo",
      membri:[{personId:"a",uscitoGiorno:null}]
    }]};
    const code=blocco(
      strada,
      "function stradaNpcGruppiPersona(p)",
      "function stradaNpcContestoPersona"
    );
    const fn=new Function(
      "window","G","stradaNpcAdapter",
      code+"\nreturn stradaNpcGruppiPersona;"
    )(
      window,G,
      ()=>({groupsForPerson:()=>[{groupId:"esterno"}]})
    );
    expect(fn({id:"a"})).toEqual([{groupId:"esterno"}]);
  });

  it("il contesto crime riceve solo groupId dei gruppi reali",()=>{
    expect(strada).toContain("groupIds:p ? stradaNpcGruppiPersona(p)");
    expect(strada).not.toContain("ADF_NPC_CERCHIE.cerchie");
  });
});
