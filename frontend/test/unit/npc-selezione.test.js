import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const appartenenze=fs.readFileSync(path.join(ROOT,"js/game/npc-appartenenze.js"),"utf8");
const selezione=fs.readFileSync(path.join(ROOT,"js/game/npc-selezione.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Infinity,TypeError,RangeError,Error};
  vm.createContext(ctx);
  vm.runInContext(appartenenze,ctx);
  vm.runInContext(selezione,ctx);
  return window;
}

function p(id,extra={}){
  return {id,n:id,via:false,rel:0,pt:0,...extra};
}

function req(extra={}){
  return {
    ambienteId:"sala:provincia",
    giorno:20,
    periodo:"w3",
    quanti:3,
    verifica:()=>true,
    legacy:()=>true,
    punteggio:x=>Number(x.rel||0),
    legami:()=>[],
    ...extra
  };
}

describe("NPC · punto 8 selezione e ricomparsa",()=>{
  it("applica i vincoli prima di punteggi e legami",()=>{
    const w=runtime();
    const a=p("a",{rel:1});
    const b=p("b",{rel:999,bloccato:true});
    const out=w.ADF_NPC_SELEZIONE.seleziona([a,b],req({
      verifica:x=>!x.bloccato,
      legami:x=>x===a?[b]:[]
    }));
    expect(out.persone).toEqual([a]);
    expect(out.memoria.ids).toEqual(["a"]);
  });

  it("un'appartenenza esplicita scaduta o vuota non usa il fallback legacy",()=>{
    const w=runtime();
    const a=p("a");
    const b=p("b",{appartenenze:[]});
    const c=p("c");
    w.ADF_NPC_APPARTENENZE.registra(c,{
      ambienteId:"sala:provincia",tipo:"musica",fonte:"vecchia",dalGiorno:1,alGiorno:10
    });
    const out=w.ADF_NPC_SELEZIONE.seleziona([a,b,c],req({giorno:20}));
    expect(out.persone).toEqual([a]);
  });

  it("ammette appartenenza attiva all'ambiente esatto e distingue città",()=>{
    const w=runtime();
    const provincia=p("provincia");
    const milano=p("milano");
    w.ADF_NPC_APPARTENENZE.registra(provincia,{
      ambienteId:"sala:provincia",tipo:"musica",fonte:"a",dalGiorno:1
    });
    w.ADF_NPC_APPARTENENZE.registra(milano,{
      ambienteId:"sala:milano",tipo:"musica",fonte:"b",dalGiorno:1
    });
    const out=w.ADF_NPC_SELEZIONE.seleziona([milano,provincia],req({legacy:()=>false}));
    expect(out.persone).toEqual([provincia]);
  });

  it("l'ordine non dipende dall'ordine dell'anagrafe",()=>{
    const w=runtime();
    const persone=[p("z"),p("a"),p("m"),p("q")];
    const a=w.ADF_NPC_SELEZIONE.seleziona(persone,req({quanti:4}));
    const b=w.ADF_NPC_SELEZIONE.seleziona([...persone].reverse(),req({quanti:4}));
    expect(a.memoria.ids).toEqual(b.memoria.ids);
  });

  it("budget zero non crea persone e non modifica i candidati",()=>{
    const w=runtime();
    const a=p("a",{numero:false});
    const prima=JSON.stringify(a);
    const out=w.ADF_NPC_SELEZIONE.seleziona([a],req({quanti:0}));
    expect(out.persone).toEqual([]);
    expect(JSON.stringify(a)).toBe(prima);
    expect(out.memoria.ids).toEqual(["a"]);
  });

  it("la memoria mantiene l'ordine anche se cambiano i punteggi",()=>{
    const w=runtime();
    const a=p("a",{rel:10});
    const b=p("b",{rel:1});
    const c=p("c",{rel:0});
    const prima=w.ADF_NPC_SELEZIONE.seleziona([a,b,c],req({quanti:3}));
    a.rel=0; b.rel=100; c.rel=200;
    const seconda=w.ADF_NPC_SELEZIONE.seleziona([a,b,c],req({
      quanti:3,memoria:prima.memoria
    }));
    expect(seconda.memoria.ids).toEqual(prima.memoria.ids);
  });

  it("rimuove dalla memoria chi non è più ammesso e aggiunge i nuovi in coda",()=>{
    const w=runtime();
    const a=p("a",{rel:9});
    const b=p("b",{rel:5});
    const prima=w.ADF_NPC_SELEZIONE.seleziona([a,b],req({quanti:2}));
    const c=p("c",{rel:999});
    b.bloccato=true;
    const seconda=w.ADF_NPC_SELEZIONE.seleziona([a,b,c],req({
      quanti:3,
      memoria:prima.memoria,
      verifica:x=>!x.bloccato
    }));
    expect(seconda.memoria.ids).toEqual(["a","c"]);
    expect(seconda.persone).toEqual([a,c]);
  });

  it("un budget maggiore conserva il prefisso della lista corta",()=>{
    const w=runtime();
    const persone=[p("a",{rel:5}),p("b",{rel:4}),p("c",{rel:3}),p("d",{rel:2})];
    const corta=w.ADF_NPC_SELEZIONE.seleziona(persone,req({quanti:2}));
    const lunga=w.ADF_NPC_SELEZIONE.seleziona(persone,req({
      quanti:4,memoria:corta.memoria
    }));
    expect(lunga.persone.slice(0,2)).toEqual(corta.persone);
  });

  it("un legame può affiancare due persone solo se entrambe sono ammesse",()=>{
    const w=runtime();
    const a=p("a",{rel:10});
    const b=p("b",{rel:0});
    const c=p("c",{rel:9,bloccato:true});
    const out=w.ADF_NPC_SELEZIONE.seleziona([a,b,c],req({
      quanti:3,
      verifica:x=>!x.bloccato,
      legami:x=>x===a?[b,c,b]:[]
    }));
    expect(out.persone.slice(0,2)).toEqual([a,b]);
    expect(out.memoria.ids.filter(id=>id==="b")).toHaveLength(1);
    expect(out.memoria.ids).not.toContain("c");
  });

  it("una memoria di ambiente o periodo diverso non forza l'ordine",()=>{
    const w=runtime();
    const persone=[p("a",{rel:10}),p("b",{rel:0})];
    const out=w.ADF_NPC_SELEZIONE.seleziona(persone,req({
      memoria:{ambienteId:"sala:milano",periodo:"w3",ids:["b","a"]}
    }));
    expect(out.memoria.ids[0]).toBe("a");
  });

  it("rifiuta ID duplicati invece di fondere persone",()=>{
    const w=runtime();
    expect(()=>w.ADF_NPC_SELEZIONE.seleziona([p("x"),p("x")],req()))
      .toThrow(/duplicato/);
  });

  it("rifiuta punteggi non finiti",()=>{
    const w=runtime();
    expect(()=>w.ADF_NPC_SELEZIONE.seleziona([p("x")],req({punteggio:()=>Infinity})))
      .toThrow(/finito/);
  });
});
