import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const eventi=fs.readFileSync(path.join(ROOT,"js/game/eventi-v2.js"),"utf8");

function blocco(startText,endText){
  const a=crime.indexOf(startText);
  const b=crime.indexOf(endText,a);
  if(a<0 || b<0) throw new Error("blocco non trovato: "+startText);
  return crime.slice(a,b);
}

function runtimeCapacita(G){
  const code=blocco("const STRADA_CAPACITA_RETE","function stradaRelazioneTransizione");
  return new Function(
    "G","STRADA_FIDUCIA_SQUADRA","stradaAggiornaRelazioniCriminali",
    "stradaRelazioneDisponibile","stradaFiduciaValore","stradaReputazioneGlobale",
    code+"\nreturn {STRADA_CAPACITA_RETE,stradaCapacitaRete};"
  )(
    G,25,()=>{},
    p=>!!p.available,
    p=>Number(p.trust||0),
    ()=>Math.max(0,Math.min(100,Number(G.strada&&G.strada.rep||0)))
  );
}

function persona(id,trust=10){
  return {id,n:"P"+id,available:true,trust};
}

describe("Strada · punto 11 peso e capacità senza ranghi",()=>{
  it("sblocca capacità da rete reale e reputazione senza creare un livello criminale",()=>{
    const G={strada:{rep:11},gente:[persona("a"),persona("b"),persona("c"),persona("d"),persona("e")]};
    let r=runtimeCapacita(G).stradaCapacitaRete();
    expect(r.piuChiamate).toBe(false);

    G.strada.rep=12;
    G.gente=G.gente.slice(0,2);
    r=runtimeCapacita(G).stradaCapacitaRete();
    expect(r.piuChiamate).toBe(true);
    expect(r.sceltaOpportunita).toBe(false);

    G.strada.rep=25;
    G.gente=[persona("a",10),persona("b",10),persona("c",10)];
    r=runtimeCapacita(G).stradaCapacitaRete();
    expect(r.sceltaOpportunita).toBe(true);

    G.strada.rep=40;
    G.gente=[persona("a",30),persona("b"),persona("c"),persona("d")];
    r=runtimeCapacita(G).stradaCapacitaRete();
    expect(r.richiestaNome).toBe(true);
    expect(r.creaPonte).toBe(false);

    G.strada.rep=60;
    G.gente=[persona("a",40),persona("b",35),persona("c"),persona("d"),persona("e")];
    r=runtimeCapacita(G).stradaCapacitaRete();
    expect(r.creaPonte).toBe(true);

    expect(crime).not.toMatch(/criminalRank|streetRank|gradoCriminale|livelloCriminale/);
  });

  it("più peso aumenta le chiamate ma non introduce una promozione formale",()=>{
    const code=blocco("function stradaOpportunitaTriggerConfig","/* Pool di opportunità criminali.");
    const base={
      fabbrica:{chance:.12,cooldownGiorni:14,durataGiorni:7,trigger:"fabbrica"},
      mondo:{chance:.05,cooldownGiorni:10,durataGiorni:7,trigger:"mondo"}
    };
    const make=cap=>new Function(
      "STRADA_OPPORTUNITA_TRIGGER","stradaCapacitaRete",
      code+"\nreturn stradaOpportunitaTriggerConfig;"
    )(base,()=>cap);

    expect(make({piuChiamate:false,richiestaNome:false})("mondo"))
      .toMatchObject({chance:.05,cooldownGiorni:10});
    expect(make({piuChiamate:true,richiestaNome:false})("mondo"))
      .toMatchObject({chance:.085,cooldownGiorni:8});
    expect(make({piuChiamate:true,richiestaNome:true})("mondo"))
      .toMatchObject({chance:.10,cooldownGiorni:7});
    expect(make({piuChiamate:true,richiestaNome:true})("fabbrica"))
      .toMatchObject({chance:.12,cooldownGiorni:14});
  });

  it("scegliere una delle due opportunità risponde all'altra senza ghosting",()=>{
    const code=blocco("function stradaOpportunitaPendenti","function stradaTentaOpportunita");
    const state={
      pending:null,
      pendingChoices:[
        {id:"a",personId:"p1",trigger:"mondo",colpoId:"consegne"},
        {id:"b",personId:"p2",trigger:"mondo",colpoId:"cassa"}
      ],
      history:[]
    };
    const interactions=[];
    const people={p1:{id:"p1"},p2:{id:"p2"}};
    const api=new Function(
      "stradaOpportunitaStato","stradaPersonaDaId","stradaRegistraInterazione","stradaAbsDay",
      code+"\nreturn {stradaOpportunitaPendenti,stradaSelezionaOpportunita};"
    )(
      ()=>state,id=>people[id]||null,
      (p,reason)=>interactions.push({id:p.id,reason}),
      ()=>100
    );

    const selected=api.stradaSelezionaOpportunita("b");
    expect(selected.id).toBe("b");
    expect(state.pending.id).toBe("b");
    expect(state.pendingChoices).toEqual([]);
    expect(state.history.at(-1)).toMatchObject({type:"not-selected",opportunityId:"a"});
    expect(interactions).toEqual([{id:"p1",reason:"opportunity-not-selected"}]);
  });

  it("la richiesta di un nome premia due relazioni reali e crea un favore",()=>{
    const code=blocco("function stradaRisolviEventoRete","function stradaRifiutaEventoRete");
    const people={
      req:{id:"req",n:"Rami",available:true},
      cand:{id:"cand",n:"Nina",available:true}
    };
    const state={
      pending:{mode:"ask-name",requesterId:"req",candidateIds:["cand"]},
      history:[],connectionsMade:0
    };
    const trust=[],fav=[];
    const api=new Function(
      "stradaEventoReteStato","stradaPersonaDaId","stradaRelazioneDisponibile",
      "stradaModificaFiducia","stradaAggiungiFavore","stradaAbsDay",
      code+"\nreturn stradaRisolviEventoRete;"
    )(
      ()=>state,id=>people[id]||null,p=>!!p.available,
      (p,d,r)=>trust.push({id:p.id,d,r}),
      (p,d,r)=>fav.push({id:p.id,d,r}),
      ()=>200
    );

    const out=api("cand");
    expect(out).toMatchObject({ok:true,mode:"ask-name",requester:"Rami",persona:"Nina"});
    expect(state.connectionsMade).toBe(1);
    expect(state.pending).toBeNull();
    expect(trust.map(x=>[x.id,x.d])).toEqual([["req",2],["cand",2]]);
    expect(fav.map(x=>[x.id,x.d])).toEqual([["req",1]]);
  });

  it("fare da ponte rafforza entrambi i contatti e lascia traccia persistente",()=>{
    const code=blocco("function stradaRisolviEventoRete","function stradaRifiutaEventoRete");
    const people={
      a:{id:"a",n:"Moro",available:true},
      b:{id:"b",n:"Vale",available:true}
    };
    const state={
      pending:{mode:"bridge",personAId:"a",personBId:"b"},
      history:[],connectionsMade:2
    };
    const trust=[],fav=[];
    const api=new Function(
      "stradaEventoReteStato","stradaPersonaDaId","stradaRelazioneDisponibile",
      "stradaModificaFiducia","stradaAggiungiFavore","stradaAbsDay",
      code+"\nreturn stradaRisolviEventoRete;"
    )(
      ()=>state,id=>people[id]||null,p=>!!p.available,
      (p,d,r)=>trust.push({id:p.id,d,r}),
      (p,d,r)=>fav.push({id:p.id,d,r}),
      ()=>300
    );

    const out=api();
    expect(out).toMatchObject({ok:true,mode:"bridge",personaA:"Moro",personaB:"Vale"});
    expect(state.connectionsMade).toBe(3);
    expect(state.history.at(-1)).toMatchObject({type:"bridge-made",personAId:"a",personBId:"b"});
    expect(trust.map(x=>[x.id,x.d])).toEqual([["a",3],["b",3]]);
    expect(fav.map(x=>[x.id,x.d])).toEqual([["a",1],["b",1]]);
  });

  it("la UI racconta capacità e rete, non titoli o promozioni",()=>{
    expect(eventi).toContain("Più di una persona si fa viva");
    expect(eventi).toContain("ti chiede un nome");
    expect(eventi).toContain("Questa volta il ponte sei tu");
    expect(eventi).toContain("Non è una promozione");
    expect(eventi).not.toMatch(/Sei diventato (boss|capo)|Promozione criminale/i);
  });
});
