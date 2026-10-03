import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const legamiSource=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const posto=fs.readFileSync(path.join(ROOT,"js/game/posto.js"),"utf8");
const strada=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function blocco(source,start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  if(a<0 || b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

function windowConLegami(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legamiSource,ctx);
  return window;
}

function postoRuntime(){
  const window=windowConLegami();
  const G={week:3,gente:[]};
  const code=blocco(posto,"function postoReteLegami(p)","/* Punto Strada 17:");
  const make=new Function(
    "window","G","totalWeeks","Number","Array","Object","Set",
    code+"\nreturn {collega:postoCollegaPersone,attivi:postoLegamiAttivi,raw:postoReteLegami};"
  );
  return {
    window,G,
    api:make(window,G,()=>9,Number,Array,Object,Set)
  };
}

describe("NPC · punto 11 integrazione grafo",()=>{
  it("Posto classifica il lavoro condiviso come collaborazione",()=>{
    const r=postoRuntime();
    const a={id:"a",n:"A"},b={id:"b",n:"B"};
    r.G.gente.push(a,b);

    expect(r.api.collega(a,b,"attivita-lavoro")).toBe(true);
    expect(r.window.ADF_NPC_LEGAMI.legame(a,"b")).toMatchObject({
      tipo:"collaborazione",reason:"attivita-lavoro",sinceWeek:9
    });
    expect(r.window.ADF_NPC_LEGAMI.legame(b,"a")).toMatchObject({
      tipo:"collaborazione"
    });
  });

  it("presentazioni e ponti Strada restano conoscenze, non amicizie inventate",()=>{
    const r=postoRuntime();
    const a={id:"a",n:"A"},b={id:"b",n:"B"};
    r.G.gente.push(a,b);

    r.api.collega(a,b,"strada-referral");
    expect(r.window.ADF_NPC_LEGAMI.legame(a,"b").tipo).toBe("conoscenza");

    r.api.collega(a,b,"strada-ponte");
    expect(r.window.ADF_NPC_LEGAMI.legame(a,"b").tipo).toBe("conoscenza");
    expect(a.reteLegami).toHaveLength(1);
    expect(b.reteLegami).toHaveLength(1);
  });

  it("una rivalità direzionale non viene usata come compagno di co-presenza",()=>{
    const r=postoRuntime();
    const a={id:"a",n:"A"},b={id:"b",n:"B"},c={id:"c",n:"C"};
    r.G.gente.push(a,b,c);

    r.api.collega(a,b,"evento-rivale",{
      tipo:"rivalita",
      percezioneA:"negativa",
      reciproco:false
    });
    r.api.collega(a,c,"contatto-comune",{tipo:"conoscenza"});

    expect(r.api.attivi(a)).toEqual([c]);
    expect(r.window.ADF_NPC_LEGAMI.legame(b,"a")).toBeNull();
  });

  it("i record legacy continuano a valere come contatti di rete",()=>{
    const r=postoRuntime();
    const a={id:"a",n:"A",reteLegami:[{
      personId:"b",reason:"strada-nome",sinceWeek:2
    }]};
    const b={id:"b",n:"B"};
    r.G.gente.push(a,b);

    expect(r.api.attivi(a)).toEqual([b]);
    expect(a.reteLegami[0]).toEqual({
      personId:"b",reason:"strada-nome",sinceWeek:2
    });
  });

  it("Strada espone al bridge il tipo di relazione senza rendere obbligatorio il nuovo adapter",()=>{
    const calls=[];
    const code=blocco(strada,"function stradaNpcTipoLegame(reason)","function stradaNpcGruppiPersona");
    const make=new Function(
      "stradaNpcAdapter","postoCollegaPersone","Object","String",
      code+"\nreturn {tipo:stradaNpcTipoLegame,collega:stradaNpcCollega};"
    );
    const api=make(
      ()=>({linkPeople:req=>{calls.push(req);return true;}}),
      ()=>{throw new Error("fallback non atteso");},
      Object,String
    );
    const a={id:"a"},b={id:"b"};

    expect(api.tipo("attivita-lavoro")).toBe("collaborazione");
    expect(api.tipo("strada-referral")).toBe("conoscenza");
    expect(api.collega(a,b,"attivita-lavoro")).toBe(true);
    expect(calls[0]).toMatchObject({
      aId:"a",bId:"b",
      reason:"attivita-lavoro",
      relationshipType:"collaborazione",
      reciprocal:true,
      context:"crime"
    });
  });

  it("Strada può inoltrare percezioni asimmetriche a un adapter futuro",()=>{
    const calls=[];
    const code=blocco(strada,"function stradaNpcTipoLegame(reason)","function stradaNpcGruppiPersona");
    const api=new Function(
      "stradaNpcAdapter","postoCollegaPersone","Object","String",
      code+"\nreturn stradaNpcCollega;"
    )(
      ()=>({linkPeople:req=>{calls.push(req);return true;}}),
      ()=>false,Object,String
    );

    api({id:"a"},{id:"b"},"evento",{
      tipo:"rivalita",
      reciproco:true,
      percezioneA:"negativa",
      percezioneB:"ambivalente"
    });

    expect(calls[0]).toMatchObject({
      relationshipType:"rivalita",
      reciprocal:true,
      perceptionA:"negativa",
      perceptionB:"ambivalente"
    });
  });
});
