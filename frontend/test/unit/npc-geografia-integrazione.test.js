import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const geoSource=fs.readFileSync(path.join(ROOT,"js/game/npc-geografia.js"),"utf8");
const trasferte=fs.readFileSync(path.join(ROOT,"js/game/trasferte.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function blocco(source,start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  if(a<0 || b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

function geoRuntime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Map,Set,Infinity,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(geoSource,ctx);
  return window;
}

describe("NPC · punto 9 integrazione geografia",()=>{
  it("Trasferte usa la posizione corrente senza trasformarla in provenienza",()=>{
    const w=geoRuntime();
    const p={id:"f1",fuori:true,citta:"milano"};
    w.ADF_NPC_GEOGRAFIA.sposta(p,{
      cittaId:"provincia",dalGiorno:10,fonte:"evento:rientro"
    });

    const cittaPersona=new Function(
      "window","assoluto",
      blocco(trasferte,"function cittaPersona(p)","function cittaPersonaInfo")+
      "\nreturn cittaPersona;"
    )(w,()=>10);

    expect(cittaPersona(p)).toBe("provincia");
    expect(p.citta).toBe("milano");
    expect(w.ADF_NPC_GEOGRAFIA.origine(p)).toBeNull();
    expect(trasferte).not.toContain("impostaOrigine(");
  });

  it("la rete Trasferte filtra per città corrente ma conserva il marker fuori",()=>{
    const w=geoRuntime();
    const a={id:"a",fuori:true,citta:"milano",rel:2};
    const b={id:"b",fuori:true,citta:"roma",rel:2};
    w.ADF_NPC_GEOGRAFIA.sposta(a,{
      cittaId:"roma",dalGiorno:12,fonte:"evento:move"
    });
    const G={gente:[a,b]};
    const cittaPersona=new Function(
      "window","assoluto",
      blocco(trasferte,"function cittaPersona(p)","function cittaPersonaInfo")+
      "\nreturn cittaPersona;"
    )(w,()=>12);
    const rete=new Function(
      "G","cittaPersona",
      blocco(trasferte,"function rete(cittaId)","function conosciuti")+
      "\nreturn rete;"
    )(G,cittaPersona);

    expect(rete("milano")).toEqual([]);
    expect(rete("roma")).toEqual([a,b]);
    expect(a.fuori).toBe(true);
  });

  it("l'innesto Sala ammette un contatto Trasferte realmente rientrato in provincia",()=>{
    const w=geoRuntime();
    const p={id:"a",fuori:true,citta:"milano"};
    w.ADF_NPC_GEOGRAFIA.sposta(p,{
      cittaId:"provincia",dalGiorno:12,fonte:"evento:rientro"
    });
    const cittaPersona=new Function(
      "window","assoluto",
      blocco(trasferte,"function cittaPersona(p)","function cittaPersonaInfo")+
      "\nreturn cittaPersona;"
    )(w,()=>12);
    const personaInProvincia=new Function(
      "cittaPersona",
      blocco(trasferte,"function personaInProvincia(p)","function soloProvincia")+
      "\nreturn personaInProvincia;"
    )(cittaPersona);

    expect(personaInProvincia(p)).toBe(true);
    expect(p.fuori).toBe(true);
  });

  it("il bridge crime legge la stessa timeline prima dei campi legacy",()=>{
    const w=geoRuntime();
    const p={id:"a",citta:"milano"};
    w.ADF_NPC_GEOGRAFIA.sposta(p,{
      cittaId:"roma",dalGiorno:20,fonte:"evento:move"
    });
    const fn=new Function(
      "window","stradaNpcAdapter","stradaAbsDay",
      blocco(strada,"function stradaNpcCittaPersona(p)","function stradaNpcPersonaDaId")+
      "\nreturn stradaNpcCittaPersona;"
    )(w,()=>null,()=>20);

    expect(fn(p)).toBe("roma");
    expect(p.citta).toBe("milano");
  });

  it("un adapter crime esplicito continua ad avere priorità sul layer comune",()=>{
    const w=geoRuntime();
    const p={id:"a",citta:"milano"};
    w.ADF_NPC_GEOGRAFIA.sposta(p,{
      cittaId:"roma",dalGiorno:20,fonte:"evento:move"
    });
    const fn=new Function(
      "window","stradaNpcAdapter","stradaAbsDay",
      blocco(strada,"function stradaNpcCittaPersona(p)","function stradaNpcPersonaDaId")+
      "\nreturn stradaNpcCittaPersona;"
    )(w,()=>({cityOf:()=> "torino"}),()=>20);

    expect(fn(p)).toBe("torino");
  });
});
