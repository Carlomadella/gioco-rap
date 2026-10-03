import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return window.ADF_NPC_LEGAMI;
}

function p(id,extra={}){
  return {id,n:id,...extra};
}

describe("NPC · punto 11 legami tra persone",()=>{
  it("legge un record legacy come conoscenza senza mutarlo",()=>{
    const api=runtime();
    const a=p("a",{reteLegami:[{personId:"b",reason:"strada-nome",sinceWeek:9}]});
    const prima=JSON.stringify(a);

    expect(api.legami(a)).toEqual([{
      personId:"b",
      tipi:["conoscenza"],
      tipo:"conoscenza",
      percezione:null,
      sottotipo:null,
      reason:"strada-nome",
      sinceWeek:9,
      tipoEsplicito:false,
      percezioneEsplicita:false,
      coPresenza:true
    }]);
    expect(JSON.stringify(a)).toBe(prima);
  });

  it("crea un'amicizia reciproca esplicita",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"amicizia",
      percezione:"positiva",
      reason:"storia-comune",
      sinceWeek:12
    });

    expect(api.tra(a,b)).toMatchObject({
      reciproco:true,
      simmetrico:true,
      aVersoB:{tipi:["amicizia"],tipo:"amicizia",percezione:"positiva"},
      bVersoA:{tipi:["amicizia"],tipo:"amicizia",percezione:"positiva"}
    });
    expect(a.reteLegami).toEqual([{
      personId:"b",tipi:["amicizia"],percezione:"positiva",
      reason:"storia-comune",sinceWeek:12
    }]);
    expect(b.reteLegami).toEqual([{
      personId:"a",tipi:["amicizia"],percezione:"positiva",
      reason:"storia-comune",sinceWeek:12
    }]);
  });

  it("supporta percezioni e tipi asimmetrici nello stesso rapporto reciproco",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"conoscenza",
      tipoA:"amicizia",
      tipoB:"conoscenza",
      percezioneA:"positiva",
      percezioneB:"ambivalente",
      reason:"quartiere",
      sinceWeek:4
    });

    const tra=api.tra(a,b);
    expect(tra.reciproco).toBe(true);
    expect(tra.simmetrico).toBe(false);
    expect(tra.aVersoB).toMatchObject({tipi:["amicizia"],tipo:"amicizia",percezione:"positiva"});
    expect(tra.bVersoA).toMatchObject({tipi:["conoscenza"],tipo:"conoscenza",percezione:"ambivalente"});
  });

  it("supporta un legame direzionale senza inventare reciprocità",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"rivalita",
      percezioneA:"negativa",
      reason:"competizione",
      sinceWeek:7,
      reciproco:false
    });

    expect(api.legame(a,"b")).toMatchObject({
      tipi:["rivalita"],tipo:"rivalita",percezione:"negativa",coPresenza:false
    });
    expect(api.legame(b,"a")).toBeNull();
    expect(api.tra(a,b)).toMatchObject({reciproco:false,simmetrico:false});
  });

  it("parentela può conservare un sottotipo esplicito",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"parentela",
      sottotipoA:"fratello",
      sottotipoB:"sorella",
      reason:"anagrafica",
      sinceWeek:1
    });

    expect(api.legame(a,"b").sottotipo).toBe("fratello");
    expect(api.legame(b,"a").sottotipo).toBe("sorella");
    expect(api.tra(a,b).reciproco).toBe(true);
    expect(api.tra(a,b).simmetrico).toBe(false);
  });

  it("più tipi specifici possono coesistere sulla stessa coppia",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{tipo:"parentela",sottotipoA:"fratello",sottotipoB:"sorella",sinceWeek:1});
    api.collega(a,b,{tipo:"collaborazione",reason:"impresa",sinceWeek:8});

    expect(api.legame(a,"b")).toMatchObject({
      tipi:["parentela","collaborazione"],
      tipo:null,
      sottotipo:"fratello",
      sinceWeek:1,
      coPresenza:true
    });
    expect(api.legame(b,"a")).toMatchObject({
      tipi:["parentela","collaborazione"],
      tipo:null,
      sottotipo:"sorella",
      sinceWeek:1
    });
    expect(a.reteLegami).toHaveLength(1);
    expect(b.reteLegami).toHaveLength(1);
  });

  it("una conoscenza generica viene sostituita quando emerge un tipo specifico",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{tipo:"conoscenza",reason:"presentazione",sinceWeek:3});
    api.collega(a,b,{tipo:"collaborazione",reason:"progetto",sinceWeek:9});

    expect(a.reteLegami).toHaveLength(1);
    expect(b.reteLegami).toHaveLength(1);
    expect(a.reteLegami[0]).toMatchObject({
      personId:"b",tipi:["collaborazione"],reason:"progetto",sinceWeek:3
    });
    expect(b.reteLegami[0]).toMatchObject({
      personId:"a",tipi:["collaborazione"],reason:"progetto",sinceWeek:3
    });
  });

  it("aggiornare i tipi senza nuova percezione conserva quella già nota",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"amicizia",percezioneA:"positiva",percezioneB:"ambivalente",sinceWeek:2
    });
    api.collega(a,b,{tipo:"collaborazione",reason:"progetto",sinceWeek:8});

    expect(api.legame(a,"b")).toMatchObject({
      tipi:["amicizia","collaborazione"],percezione:"positiva",sinceWeek:2
    });
    expect(api.legame(b,"a")).toMatchObject({
      tipi:["amicizia","collaborazione"],percezione:"ambivalente",sinceWeek:2
    });
  });

  it("arricchisce un record legacy solo quando un evento lo tocca",()=>{
    const api=runtime();
    const a=p("a",{reteLegami:[{personId:"b",reason:"vecchio",sinceWeek:2}]});
    const b=p("b",{reteLegami:[{personId:"a",reason:"vecchio",sinceWeek:2}]});

    api.collega(a,b,{tipo:"amicizia",percezione:"positiva",reason:"evento-nuovo",sinceWeek:20});

    expect(a.reteLegami[0]).toEqual({
      personId:"b",reason:"evento-nuovo",sinceWeek:2,
      tipi:["amicizia"],percezione:"positiva"
    });
    expect(b.reteLegami[0]).toEqual({
      personId:"a",reason:"evento-nuovo",sinceWeek:2,
      tipi:["amicizia"],percezione:"positiva"
    });
  });

  it("può rimuovere un solo tipo senza distruggere gli altri",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{tipo:"parentela",sinceWeek:1});
    api.collega(a,b,{tipo:"collaborazione",sinceWeek:2});

    expect(api.rimuoviTipo(a,b,"collaborazione")).toBe(true);
    expect(api.legame(a,"b").tipi).toEqual(["parentela"]);
    expect(api.legame(b,"a").tipi).toEqual(["parentela","collaborazione"]);

    expect(api.rimuoviTipo(a,b,"parentela")).toBe(true);
    expect(api.legame(a,"b")).toBeNull();
    expect(api.legame(b,"a")).not.toBeNull();
  });

  it("filtra i legami plausibili per co-presenza senza trascinare rivalità isolate",()=>{
    const api=runtime();
    const a=p("a"),amico=p("b"),rivale=p("c"),collab=p("d"),via=p("e",{via:true});
    api.collega(a,amico,{tipo:"amicizia",sinceWeek:1});
    api.collega(a,rivale,{tipo:"rivalita",sinceWeek:1});
    api.collega(a,collab,{tipo:"collaborazione",sinceWeek:1});
    api.collega(a,via,{tipo:"conoscenza",sinceWeek:1});

    expect(api.personeCollegate(a,[a,amico,rivale,collab,via],{coPresenza:true}))
      .toEqual([amico,collab]);
    expect(api.personeCollegate(a,[a,amico,rivale,collab,via],{coPresenza:false}))
      .toEqual([rivale]);
  });

  it("rivalità e parentela possono coesistere senza perdere la parentela",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{tipo:"parentela",sinceWeek:1});
    api.collega(a,b,{tipo:"rivalita",percezioneA:"negativa",percezioneB:"ambivalente",sinceWeek:4});

    expect(api.legame(a,"b").tipi).toEqual(["parentela","rivalita"]);
    expect(api.legame(a,"b").coPresenza).toBe(true);
    expect(api.legame(b,"a").tipi).toEqual(["parentela","rivalita"]);
  });

  it("non crea una matrice: senza legame non salva nulla",()=>{
    const api=runtime();
    const persone=Array.from({length:800},(_,i)=>p("p"+i));
    api.collega(persone[0],persone[1],{tipo:"conoscenza",sinceWeek:1});
    expect(persone.filter(x=>Array.isArray(x.reteLegami)).length).toBe(2);
    expect(persone[799]).not.toHaveProperty("reteLegami");
  });

  it("rifiuta tipi, percezioni e self-link invalidi",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    expect(()=>api.collega(a,b,{tipo:"nemico"})).toThrow(/tipo legame sconosciuto/);
    expect(()=>api.collega(a,b,{tipo:"conoscenza",percezione:"boh"}))
      .toThrow(/percezione legame sconosciuta/);
    expect(()=>api.collega(a,a,{tipo:"amicizia"})).toThrow(/se stesso/);
  });

  it("sopravvive al roundtrip JSON",()=>{
    const api=runtime();
    const a=p("a"),b=p("b");
    api.collega(a,b,{
      tipo:"collaborazione",
      percezioneA:"positiva",
      percezioneB:"neutra",
      reason:"studio",
      sinceWeek:5
    });

    const aa=JSON.parse(JSON.stringify(a));
    const bb=JSON.parse(JSON.stringify(b));
    expect(api.tra(aa,bb)).toEqual(api.tra(a,b));
  });
});
