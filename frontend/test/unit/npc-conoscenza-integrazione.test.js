import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const conoscenza=fs.readFileSync(path.join(ROOT,"js/game/npc-conoscenza.js"),"utf8");
const legami=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const posto=fs.readFileSync(path.join(ROOT,"js/game/posto.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function blocco(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}
function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legami,ctx);
  vm.runInContext(conoscenza,ctx);
  return window;
}

describe("NPC · punto 12 integrazione discovery",()=>{
  it("il dialogo Sala conserva scoperto e registra il carattere legacy nel nuovo layer",()=>{
    expect(posto).toContain("p.scoperto = true");
    expect(posto).toContain("window.ADF_NPC_CONOSCENZA");
    expect(posto).toContain('{tipo:"carattere-legacy",id:p.car}');
    expect(posto).toContain('fonte:"circolo:dialogo-carattere"');
  });

  it("una presentazione Strada scopre esistenza e tipo in entrambe le direzioni",()=>{
    const window=runtime();
    const code=blocco(strada,"function stradaNpcTipoLegame(reason)","function stradaNpcGruppiPersona");
    const api=new Function(
      "window","stradaNpcAdapter","stradaAbsDay","postoCollegaPersone","Object","String","Array",
      code+"\nreturn stradaNpcCollega;"
    )(
      window,
      ()=>null,
      ()=>15,
      (a,b,reason,cfg)=>{
        window.ADF_NPC_LEGAMI.collega(a,b,{
          tipo:cfg.tipo,percezioneA:"positiva",percezioneB:"ambivalente",
          reason,sinceWeek:3
        });
        return true;
      },
      Object,String,Array
    );

    const a={id:"a"},b={id:"b"};
    expect(api(a,b,"strada-referral")).toBe(true);

    expect(window.ADF_NPC_CONOSCENZA.legamiConosciuti(a)).toEqual([
      {personId:"b",tipo:"conoscenza"}
    ]);
    expect(window.ADF_NPC_CONOSCENZA.legamiConosciuti(b)).toEqual([
      {personId:"a",tipo:"conoscenza"}
    ]);
    expect(window.ADF_NPC_CONOSCENZA.sa(a,{
      tipo:"legame-percezione",id:"b",valore:"positiva"
    })).toBe(false);
    expect(window.ADF_NPC_CONOSCENZA.prove(a).map(x=>x.key).sort()).toEqual([
      "legame-esistenza:b","legame-tipo:b:conoscenza"
    ]);
  });

  it("una collaborazione vissuta viene scoperta come collaborazione, non amicizia",()=>{
    const window=runtime();
    const code=blocco(strada,"function stradaNpcTipoLegame(reason)","function stradaNpcGruppiPersona");
    const api=new Function(
      "window","stradaNpcAdapter","stradaAbsDay","postoCollegaPersone","Object","String","Array",
      code+"\nreturn stradaNpcCollega;"
    )(
      window,()=>null,()=>20,
      (a,b,reason,cfg)=>{
        window.ADF_NPC_LEGAMI.collega(a,b,{tipo:cfg.tipo,reason,sinceWeek:4});
        return true;
      },
      Object,String,Array
    );
    const a={id:"a"},b={id:"b"};
    api(a,b,"attivita-lavoro");
    expect(window.ADF_NPC_CONOSCENZA.legamiConosciuti(a)).toEqual([
      {personId:"b",tipo:"collaborazione"}
    ]);
  });

  it("se un adapter esterno non materializza il grafo locale non inventiamo discovery",()=>{
    const window=runtime();
    const code=blocco(strada,"function stradaNpcTipoLegame(reason)","function stradaNpcGruppiPersona");
    const api=new Function(
      "window","stradaNpcAdapter","stradaAbsDay","postoCollegaPersone","Object","String","Array",
      code+"\nreturn stradaNpcCollega;"
    )(
      window,
      ()=>({linkPeople:()=>true}),
      ()=>25,
      ()=>{throw new Error("fallback non atteso");},
      Object,String,Array
    );
    const a={id:"a"},b={id:"b"};
    expect(api(a,b,"strada-ponte")).toBe(true);
    expect(a).not.toHaveProperty("conoscenza");
    expect(b).not.toHaveProperty("conoscenza");
  });
});
