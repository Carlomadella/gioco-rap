"use strict";

const ACTIVE_TRAITS = Object.freeze([
  "prudente","diffidente","ambizioso","impulsivo","leale","socievole",
  "opportunista","generoso","competitivo","riservato","pratico","idealista",
  "permaloso","irascibile","rancoroso","conciliante","flessibile","ostinato"
]);

const SUSPENDED_TRAITS = Object.freeze(["disciplinato","incostante"]);
const ACTIVE_INTERESTS = Object.freeze(["musica","audio","quartiere"]);
const SUSPENDED_INTERESTS = Object.freeze(["cucina","sport","cinema"]);

const REACTION_CONTRACTS = Object.freeze({
  prudente:Object.freeze({trigger:"proposta-rischiosa",signal:"chiede-garanzie"}),
  diffidente:Object.freeze({trigger:"affidamento-persona",signal:"chiede-riscontri"}),
  ambizioso:Object.freeze({trigger:"opportunita-crescita",signal:"valuta-prospettive"}),
  impulsivo:Object.freeze({trigger:"decisione-urgente",signal:"preferisce-decidere-subito"}),
  leale:Object.freeze({trigger:"richiesta-aiuto",requires:Object.freeze(["legameAccertato"]),signal:"privilegia-legame"}),
  socievole:Object.freeze({trigger:"conversazione-aperta",signal:"allarga-scambio"}),
  opportunista:Object.freeze({trigger:"scambio-vantaggioso",signal:"negozia-vantaggio"}),
  generoso:Object.freeze({trigger:"richiesta-aiuto",signal:"considera-aiuto-senza-contropartita"}),
  competitivo:Object.freeze({trigger:"confronto-pari",signal:"cerca-confronto"}),
  riservato:Object.freeze({trigger:"domanda-personale",signal:"limita-confidenza"}),
  pratico:Object.freeze({trigger:"problema-concreto",signal:"propone-soluzione-attuabile"}),
  idealista:Object.freeze({trigger:"compromesso-valori",signal:"difende-principio"}),
  permaloso:Object.freeze({trigger:"critica-personale",signal:"percepisce-svalutazione"}),
  irascibile:Object.freeze({trigger:"provocazione",signal:"reagisce-irritato"}),
  rancoroso:Object.freeze({trigger:"tentativo-riparazione",requires:Object.freeze(["tortoAccertato"]),signal:"richiede-riparazione"}),
  conciliante:Object.freeze({trigger:"tentativo-riparazione",requires:Object.freeze(["conflittoAccertato"]),signal:"cerca-ricomposizione"}),
  flessibile:Object.freeze({trigger:"revisione-piano",signal:"considera-alternativa"}),
  ostinato:Object.freeze({trigger:"revisione-piano",signal:"difende-piano-attuale"})
});

const FORBIDDEN_GENERIC_PAIRS = Object.freeze([
  Object.freeze(["flessibile","ostinato"])
]);

function uniqueSorted(values){
  return [...new Set(Array.isArray(values)?values:[])].sort();
}

function pairKey(a,b){ return [a,b].sort().join("|"); }
const FORBIDDEN_PAIR_KEYS = new Set(FORBIDDEN_GENERIC_PAIRS.map(x=>pairKey(x[0],x[1])));

function validateTraitSet(traits,{allowThird=false}={}){
  const raw=Array.isArray(traits)?traits:[];
  const unique=uniqueSorted(raw);
  const errors=[];
  if(raw.length!==unique.length) errors.push("duplicate-trait");
  if(unique.length<2) errors.push("needs-two-traits");
  if(unique.length>(allowThird?3:2)) errors.push("too-many-traits");
  for(const id of unique){
    if(SUSPENDED_TRAITS.includes(id)) errors.push("suspended-trait:"+id);
    else if(!ACTIVE_TRAITS.includes(id)) errors.push("unknown-trait:"+id);
  }
  if(unique.length===2 && FORBIDDEN_PAIR_KEYS.has(pairKey(unique[0],unique[1])))
    errors.push("forbidden-generic-pair:"+pairKey(unique[0],unique[1]));
  return Object.freeze({ok:errors.length===0,traits:Object.freeze(unique),errors:Object.freeze(errors)});
}

function requirementsMet(contract,context){
  const req=contract.requires||[];
  return req.every(key=>context&&context[key]===true);
}

function reactionSignals({traits,event,context={}}={}){
  const ids=uniqueSorted(traits).filter(id=>ACTIVE_TRAITS.includes(id));
  const signals=[];
  for(const id of ids){
    const contract=REACTION_CONTRACTS[id];
    if(!contract || contract.trigger!==event || !requirementsMet(contract,context)) continue;
    signals.push(Object.freeze({trait:id,signal:contract.signal}));
  }
  let composition=null;
  if(event==="tentativo-riparazione" &&
     signals.some(x=>x.trait==="rancoroso") &&
     signals.some(x=>x.trait==="conciliante")){
    composition="ricomposizione-condizionata-riparazione";
  }
  return Object.freeze({signals:Object.freeze(signals),composition});
}

function validateInterests(interests,{forNewNpc=false}={}){
  const raw=Array.isArray(interests)?interests:[];
  const unique=uniqueSorted(raw);
  const errors=[];
  if(raw.length!==unique.length) errors.push("duplicate-interest");
  if(unique.length>2) errors.push("too-many-interests");
  if(forNewNpc && unique.length<1) errors.push("new-npc-needs-interest");
  for(const id of unique){
    if(SUSPENDED_INTERESTS.includes(id)) errors.push("suspended-interest:"+id);
    else if(!ACTIVE_INTERESTS.includes(id)) errors.push("unknown-interest:"+id);
  }
  return Object.freeze({ok:errors.length===0,interests:Object.freeze(unique),errors:Object.freeze(errors)});
}

function prioritizeTopics(interests,topics){
  const active=new Set(uniqueSorted(interests).filter(id=>ACTIVE_INTERESTS.includes(id)));
  const list=Array.isArray(topics)?topics.slice():[];
  return list
    .map((topic,index)=>({topic,index,match:!!(topic&&topic.interest&&active.has(topic.interest))}))
    .sort((a,b)=>Number(b.match)-Number(a.match)||a.index-b.index)
    .map(x=>x.topic);
}

module.exports=Object.freeze({
  ACTIVE_TRAITS,SUSPENDED_TRAITS,ACTIVE_INTERESTS,SUSPENDED_INTERESTS,
  REACTION_CONTRACTS,FORBIDDEN_GENERIC_PAIRS,
  validateTraitSet,reactionSignals,validateInterests,prioritizeTopics
});
