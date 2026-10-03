import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const html=fs.readFileSync(path.join(ROOT,"pagine/gioco.html"),"utf8");
const legami=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const cerchie=fs.readFileSync(path.join(ROOT,"js/game/npc-cerchie.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legami,ctx);
  vm.runInContext(cerchie,ctx);
  return window;
}
function blocco(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

describe("NPC · punto 13 integrazione cerchie",()=>{
  it("gioco.html carica cerchie dopo il grafo e prima della discovery",()=>{
    const iLegami=html.indexOf("js/game/npc-legami.js?v=1");
    const iCerchie=html.indexOf("js/game/npc-cerchie.js?v=1");
    const iConoscenza=html.indexOf("js/game/npc-conoscenza.js?v=1");
    expect(iLegami).toBeGreaterThanOrEqual(0);
    expect(iCerchie).toBeGreaterThan(iLegami);
    expect(iConoscenza).toBeGreaterThan(iCerchie);
  });

  it("le cerchie non vengono spacciate per groupsForPerson della Strada",()=>{
    const window=runtime();
    const [a,b,c]=["a","b","c"].map(id=>({id,n:id}));
    window.ADF_NPC_LEGAMI.collega(a,b,{tipo:"amicizia"});
    window.ADF_NPC_LEGAMI.collega(b,c,{tipo:"amicizia"});
    window.ADF_NPC_LEGAMI.collega(c,a,{tipo:"amicizia"});
    expect(window.ADF_NPC_CERCHIE.cerchie([a,b,c])).toHaveLength(1);

    const code=blocco(
      strada,
      "function stradaNpcGruppiPersona(p)",
      "function stradaNpcContestoPersona"
    );
    const groups=new Function(
      "window","stradaNpcAdapter",
      code+"\nreturn stradaNpcGruppiPersona;"
    )(window,()=>null);

    expect(groups(a)).toEqual([]);
  });

  it("solo un adapter esplicito può fornire gruppi formali alla Strada",()=>{
    const window=runtime();
    const code=blocco(
      strada,
      "function stradaNpcGruppiPersona(p)",
      "function stradaNpcContestoPersona"
    );
    const groups=new Function(
      "window","stradaNpcAdapter",
      code+"\nreturn stradaNpcGruppiPersona;"
    )(
      window,
      ()=>({groupsForPerson:id=>id==="a"?[{groupId:"crew-1"}]:[]})
    );

    expect(groups({id:"a"})).toEqual([{groupId:"crew-1"}]);
    expect(groups({id:"b"})).toEqual([]);
  });

  it("una persona può appartenere a due cerchie senza acquisire un groupId",()=>{
    const window=runtime();
    const ps=["a","b","c","d","e"].map(id=>({id,n:id}));
    const [a,b,c,d,e]=ps;
    for(const [x,y] of [[a,b],[b,c],[c,a],[c,d],[d,e],[e,c]])
      window.ADF_NPC_LEGAMI.collega(x,y,{tipo:"conoscenza"});

    const mine=window.ADF_NPC_CERCHIE.perPersona(c,ps);
    expect(mine).toHaveLength(2);
    expect(c).not.toHaveProperty("groupId");
    expect(c).not.toHaveProperty("groupIds");
    expect(c).not.toHaveProperty("cerchie");
  });
});
