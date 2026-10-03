import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const relazioni=fs.readFileSync(path.join(ROOT,"js/game/npc-relazioni.js"),"utf8");
const posto=fs.readFileSync(path.join(ROOT,"js/game/posto.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function blocco(source,start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  if(a<0 || b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(relazioni,ctx);
  return window;
}

describe("NPC · punto 10 integrazione relazioni",()=>{
  it("Posto usa solo la dimensione sociale per nome e soglia",()=>{
    const window=runtime();
    const code=blocco(posto,"function postoRelazioniApi()","function nuovaPersona");
    const make=new Function(
      "window","REL_NOMI","clamp",
      code+"\nreturn {livello:postoRelazioneSocialeLivello,carcere:postoRapportoCarcere,relNome,relSoglia};"
    );
    const api=make(window,["conoscenza","contatto","amico","collaboratore","fidato","partner"],
      (v,a,b)=>Math.max(a,Math.min(b,v)));

    const p={
      id:"p1",rel:1,pt:2,
      strada:{known:true,fiducia:95,streetStatus:"active"},
      carcere:{rapporto:8}
    };

    expect(api.livello(p)).toBe(1);
    expect(api.relNome(p)).toBe("contatto");
    expect(api.relSoglia(p)).toBe(4);

    p.strada.fiducia=5;
    p.carcere.rapporto=-8;
    expect(api.relNome(p)).toBe("contatto");
    expect(api.relSoglia(p)).toBe(4);
  });

  it("il lettore Strada usa fiducia criminale e ignora rel sociale/carcere",()=>{
    const window=runtime();
    const code=blocco(strada,"function stradaFiduciaValore(p)","function stradaFiduciaEtichetta");
    const fn=new Function(
      "window","stradaPersonaMeta",
      code+"\nreturn stradaFiduciaValore;"
    )(window,p=>p.strada||null);

    const p={
      id:"p1",rel:5,
      strada:{known:true,fiducia:22,streetStatus:"active"},
      carcere:{rapporto:10}
    };
    expect(fn(p)).toBe(22);

    p.rel=0;
    p.carcere.rapporto=-10;
    expect(fn(p)).toBe(22);
  });

  it("il lettore carcere usa solo il rapporto carcerario",()=>{
    const window=runtime();
    const code=blocco(strada,"function carcereRapportoValore(p)","function carcereScarcerazioneRelazioni");
    const make=new Function(
      "window","carcerePersonaMeta",
      code+"\nreturn {valore:carcereRapportoValore,etichetta:carcereRelazioneEtichetta};"
    );
    const api=make(window,p=>p.carcere||null);

    const p={
      id:"p1",rel:5,
      strada:{known:true,fiducia:100,streetStatus:"active"},
      carcere:{rapporto:-5}
    };
    expect(api.valore(p)).toBe(-5);
    expect(api.etichetta(p)).toBe("conto aperto");

    p.rel=0;
    p.strada.fiducia=0;
    expect(api.valore(p)).toBe(-5);
    expect(api.etichetta(p)).toBe("conto aperto");
  });

  it("una stessa persona può avere tre esiti relazionali divergenti",()=>{
    const window=runtime();
    const p={
      id:"p1",rel:4,pt:0,numero:true,
      strada:{
        known:true,fiducia:12,streetStatus:"inactive",
        favori:0,colpiInsieme:0,tensione:2,rivalita:false
      },
      carcere:{conosciuto:true,rapporto:-4,currentJailId:null}
    };

    const v=window.ADF_NPC_RELAZIONI.vista(p);
    expect(v.sociale.livello).toBe(4);
    expect(v.strada.fiducia).toBe(12);
    expect(v.strada.stato).toBe("inactive");
    expect(v.carcere.rapporto).toBe(-4);
  });

  it("nessun consumer integrato richiede un relationshipScore aggregato",()=>{
    expect(posto).toContain("postoRelazioneSocialeLivello");
    expect(strada).toContain("stradaFiduciaValore");
    expect(strada).toContain("carcereRapportoValore");
    expect(posto).not.toContain("relationshipScore");
    expect(strada).not.toContain("relationshipScore");
  });
});
