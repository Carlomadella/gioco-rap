import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require=createRequire(import.meta.url);
const behavior=require("../../strumenti/npc/contratti-comportamento.cjs");

const {
  ACTIVE_TRAITS,SUSPENDED_TRAITS,ACTIVE_INTERESTS,SUSPENDED_INTERESTS,
  REACTION_CONTRACTS,validateTraitSet,reactionSignals,
  validateInterests,prioritizeTopics
}=behavior;

describe("NPC · punto 4 contratti comportamento",()=>{
  it("espone 18 tratti operativi e lascia disciplinato/incostante sospesi",()=>{
    expect(ACTIVE_TRAITS).toHaveLength(18);
    expect(SUSPENDED_TRAITS).toEqual(["disciplinato","incostante"]);
    expect(Object.keys(REACTION_CONTRACTS).sort()).toEqual([...ACTIVE_TRAITS].sort());
  });

  it("distingue rischio dell'azione da affidamento alla persona",()=>{
    expect(reactionSignals({
      traits:["prudente","diffidente"],event:"proposta-rischiosa"
    }).signals).toEqual([{trait:"prudente",signal:"chiede-garanzie"}]);
    expect(reactionSignals({
      traits:["prudente","diffidente"],event:"affidamento-persona"
    }).signals).toEqual([{trait:"diffidente",signal:"chiede-riscontri"}]);
  });

  it("leale richiede un legame reale mentre generoso non inventa la relazione",()=>{
    const senza=reactionSignals({traits:["leale","generoso"],event:"richiesta-aiuto"});
    expect(senza.signals).toEqual([
      {trait:"generoso",signal:"considera-aiuto-senza-contropartita"}
    ]);
    const con=reactionSignals({
      traits:["leale","generoso"],event:"richiesta-aiuto",
      context:{legameAccertato:true}
    });
    expect(con.signals).toEqual([
      {trait:"generoso",signal:"considera-aiuto-senza-contropartita"},
      {trait:"leale",signal:"privilegia-legame"}
    ]);
  });

  it("rancoroso non inventa torti e si compone con conciliante solo su fatti accertati",()=>{
    expect(reactionSignals({
      traits:["rancoroso","conciliante"],event:"tentativo-riparazione"
    })).toEqual({signals:[],composition:null});

    const out=reactionSignals({
      traits:["conciliante","rancoroso"],event:"tentativo-riparazione",
      context:{tortoAccertato:true,conflittoAccertato:true}
    });
    expect(out.signals).toEqual([
      {trait:"conciliante",signal:"cerca-ricomposizione"},
      {trait:"rancoroso",signal:"richiede-riparazione"}
    ]);
    expect(out.composition).toBe("ricomposizione-condizionata-riparazione");
  });

  it("l'ordine dei tratti non cambia l'esito",()=>{
    const context={tortoAccertato:true,conflittoAccertato:true};
    expect(reactionSignals({
      traits:["rancoroso","conciliante"],event:"tentativo-riparazione",context
    })).toEqual(reactionSignals({
      traits:["conciliante","rancoroso"],event:"tentativo-riparazione",context
    }));
  });

  it("valida tutte le coppie operative e blocca solo il conflitto generico esplicito",()=>{
    let ammesse=0,bloccate=0;
    for(let i=0;i<ACTIVE_TRAITS.length;i++){
      for(let j=i+1;j<ACTIVE_TRAITS.length;j++){
        const out=validateTraitSet([ACTIVE_TRAITS[i],ACTIVE_TRAITS[j]]);
        if(out.ok) ammesse++; else bloccate++;
      }
    }
    expect(ammesse).toBe(152);
    expect(bloccate).toBe(1);
    expect(validateTraitSet(["flessibile","ostinato"]).errors)
      .toContain("forbidden-generic-pair:flessibile|ostinato");
  });

  it("rifiuta duplicati, sconosciuti, sospesi e terzo tratto non motivato",()=>{
    expect(validateTraitSet(["prudente","prudente"]).ok).toBe(false);
    expect(validateTraitSet(["prudente","inesistente"]).ok).toBe(false);
    expect(validateTraitSet(["prudente","disciplinato"]).ok).toBe(false);
    expect(validateTraitSet(["prudente","ambizioso","socievole"]).ok).toBe(false);
    expect(validateTraitSet(
      ["prudente","ambizioso","socievole"],{allowThird:true}
    ).ok).toBe(true);
  });

  it("mantiene tre interessi attivi e tre candidati sospesi",()=>{
    expect(ACTIVE_INTERESTS).toEqual(["musica","audio","quartiere"]);
    expect(SUSPENDED_INTERESTS).toEqual(["cucina","sport","cinema"]);
    expect(validateInterests([], {forNewNpc:false}).ok).toBe(true);
    expect(validateInterests([], {forNewNpc:true}).ok).toBe(false);
    expect(validateInterests(["musica","quartiere"], {forNewNpc:true}).ok).toBe(true);
    expect(validateInterests(["cucina"], {forNewNpc:true}).errors)
      .toContain("suspended-interest:cucina");
  });

  it("gli interessi danno priorità al contenuto senza creare ricompense o mutare gli input",()=>{
    const interests=Object.freeze(["audio"]);
    const topics=Object.freeze([
      Object.freeze({id:"film",interest:"cinema"}),
      Object.freeze({id:"microfono",interest:"audio"}),
      Object.freeze({id:"neutro"})
    ]);
    const out=prioritizeTopics(interests,topics);
    expect(out.map(x=>x.id)).toEqual(["microfono","film","neutro"]);
    expect(out[0]).toBe(topics[1]);
    expect(topics.map(x=>x.id)).toEqual(["film","microfono","neutro"]);
    expect(Object.keys(out[0])).toEqual(["id","interest"]);
  });
});
