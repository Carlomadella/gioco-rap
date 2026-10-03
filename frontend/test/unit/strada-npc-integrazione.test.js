import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

/* Esegue il file completo: le funzioni del bridge e del gameplay restano reali.
   Sono sostituiti solo DOM, persistenza e gli altri moduli del gioco. */
function runtime({people=[],managed=true,listOnly=false}={}){
  let seq=0;
  const registry=new Map(people.map(p=>[p.id,p]));
  const marks=[],links=[],nodes=new Map();
  const node=id=>{
    if(!nodes.has(id)) nodes.set(id,{innerHTML:"",style:{},addEventListener(){},classList:{add(){},remove(){},toggle(){}}});
    return nodes.get(id);
  };
  const G={
    year:1,week:15,day:3,gente:managed?[]:people,
    money:10000,wellbeing:80,energy:100,diario:{colpi:0},skills:{},
    strada:{rep:60,heat:0,precedenti:0,prot:0,sporchi:0,
      giroAvviato:true,badgeSbloccato:true,attivita:{lavanderia:true}}
  };
  const adapter={
    people:()=>[...registry.values()],
    createPerson:q=>{
      const p={id:"managed-"+(++seq),n:"Persona "+seq,ruolo:q.roleHint,
        origine:"manager",origineLuogo:"manager",storia:"Identità canonica",
        rel:0,pt:0,via:false};
      registry.set(p.id,p);return p;
    },
    markContext:q=>marks.push(q),
    linkPeople:q=>{links.push(q);return true;}
  };
  if(!listOnly) adapter.personById=id=>registry.get(id)||null;
  const ctx={
    G,window:{addEventListener(){},...(managed?{ADF_CRIME_NPC:adapter}:{})},
    document:{querySelectorAll:()=>[]},$:node,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    fmt:String,save(){},renderGioco(){},pushLog(){},
    rnd:(a,b)=>(a+b)/2,weeklyCosts:()=>0,
    nuovaPersona:role=>({id:"legacy-"+(++seq),n:"Legacy "+seq,ruolo:role,rel:0,pt:0,via:false})
  };
  vm.createContext(ctx);
  vm.runInContext(crime,ctx);
  const run=code=>vm.runInContext(code,ctx);
  return {G,ctx,registry,marks,links,nodes,run};
}

function contact(id="p1",trust=80){
  return {id,n:"Nina",rel:4,pt:20,via:false,visto:true,origine:"circolo",
    strada:{known:true,fiducia:trust,favori:2,colpiInsieme:3}};
}

describe("Strada · bridge completo con persone canoniche fuori da G.gente",()=>{
  it("squadra, favori, protezione e ferro riconoscono lo stesso oggetto del manager",()=>{
    const p=contact();
    const {G,run}=runtime({people:[p]});
    expect(run("stradaPersoneSquadra()")[0]).toBe(p);
    expect(run('stradaPersonaSquadra("p1")')).toBe(p);
    expect(run("stradaPersoneConFavore()")[0]).toBe(p);
    expect(run("stradaProtezioneProvider(3)")).toBe(p);
    expect(run("stradaPersonaFerro()")).toBe(p);
    expect(run('stradaConsumaFavore(stradaNpcPersonaDaId("p1"),"test")')).toBe(true);
    expect(p.strada.favori).toBe(1);
    run('stImpostaProtezione(1,"p1")');
    expect(G.strada.protezioneStato.providerPersonId).toBe(p.id);
    expect(G.gente).toEqual([]);
  });

  it("l'avvocato viene incaricato usando l'identità canonica del manager",()=>{
    const p={id:"lawyer",n:"Ada",ruolo:"avvocato",rel:3,via:false};
    const {G,run}=runtime({people:[p]});
    expect(run("stradaAvvocatiConosciuti()")[0]).toBe(p);
    expect(run('stIncaricaAvvocato("lawyer")')).toContain("Ada è diventato");
    expect(G.strada.avvocatoStato.personId).toBe(p.id);
    expect(p.numero).toBe(true);
    expect(G.gente).toEqual([]);
  });

  it("il mancato pagamento in carcere modifica il legale del manager",()=>{
    const p={id:"lawyer",n:"Ada",ruolo:"avvocato",rel:3,via:false};
    const {G,run}=runtime({people:[p]});
    run('stIncaricaAvvocato("lawyer")');
    G.money=0;G.week++;
    G.strada.arresto={settimane:4,colpo:"test"};
    run("stradaSettimana()");
    expect(p.rel).toBe(2);
    expect(G.strada.avvocatoStato.retained).toBe(false);
    expect(G.strada.avvocatoStato.history.at(-1).status).toBe("unpaid-in-jail");
    expect(G.gente).toEqual([]);
  });

  it("le attività creano due persone nel manager e le ritrovano senza duplicarle",()=>{
    const {G,registry,marks,links,run}=runtime();
    const first=run('stradaAttivitaPersone("lavanderia")');
    const second=run('stradaAttivitaPersone("lavanderia")');
    expect(first.partner).toBe(second.partner);
    expect(first.employee).toBe(second.employee);
    expect(first.partner).toBe(registry.get(first.partner.id));
    expect(first.partner.attivita).toEqual({id:"lavanderia",ruolo:"socio"});
    expect(first.employee.attivita.ruolo).toBe("dipendente");
    expect(first.partner.origineLuogo).toBe("manager");
    expect(first.partner.storia).toBe("Identità canonica");
    expect(registry.size).toBe(2);
    expect(marks).toHaveLength(2);
    expect(links[0]).toMatchObject({aId:first.partner.id,bId:first.employee.id,reason:"attivita-lavoro"});
    expect(G.gente).toEqual([]);
  });

  it("le persone del carcere restano canoniche fino alla scarcerazione",()=>{
    const {G,registry,marks,run}=runtime();
    G.strada.arresto={settimane:4,colpo:"test"};
    const first=run('carcerePersonaProfilo("giro",true)');
    expect(run('carcerePersonaProfilo("giro",true)')).toBe(first);
    expect(run("carcerePersone()")[0]).toBe(first);
    run('carcereModificaRapporto("giro",6,"legame")');
    const released=run("carcereScarcerazioneRelazioni(carcereStato())");
    expect(released.contatti[0]).toBe(first);
    expect(first.strada.known).toBe(true);
    expect(first.carcere.linkedStreet).toBe(true);
    expect(first.carcere.currentJailId).toBeNull();
    expect(first.origineLuogo).toBe("manager");
    expect(registry.size).toBe(1);
    expect(marks.some(m=>m.source==="carcere")).toBe(true);
    expect(G.gente).toEqual([]);
  });

  it("il passato dopo l'uscita continua a trovare favori e rivalità del manager",()=>{
    const p=contact();
    const {G,run}=runtime({people:[p]});
    expect(run("stradaProfonditaUscita()")).toBeGreaterThan(0);
    G.strada.uscitaGiro={mollato:true,leftAbsoluteDay:1,memoryUntilAbsoluteDay:500,history:[]};
    expect(run("stradaPassatoCandidati()")[0].p).toBe(p);
    p.strada.rivalita=true;
    expect(run("stradaPassatoCandidati()")[0].kind).toBe("rival");
    expect(G.gente).toEqual([]);
  });

  it("heat e decadimento modificano la persona canonica anche senza G.gente",()=>{
    const p=contact("weak",10);
    const {G,run}=runtime({people:[p]});
    run("stradaPersonaMeta(stradaNpcPersonaDaId('weak'))");
    G.strada.heat=65;
    expect(run("stradaHeatSincronizzaPersone()")[0]).toBe(p);
    expect(p.strada.heatCaution).toBe(true);
    G.strada.heat=0;
    run("stradaHeatSincronizzaPersone()");
    expect(p.strada.heatCaution).toBe(false);
    p.strada.lastPlayerStreetInteractionAbsoluteDay=1;
    G.year=2;
    run("stradaAggiornaRelazioniCriminali(true)");
    expect(p.strada.streetStatus).toBe("unreachable");
    expect(G.gente).toEqual([]);
  });

  it("l'introduzione e i contatti renderizzati vedono le persone del manager",()=>{
    const p=contact();
    const {G,nodes,run}=runtime({people:[p]});
    G.strada.ingressoPersonaId=p.id;
    expect(run('stradaPersonaIngresso(0,"mondo")')).toBe(p);
    G.strada.ingressoPersonaId=null;
    expect(run('stradaPersonaIngresso(0,"mondo")')).toBe(p);
    run("renderStCopre()");
    expect(nodes.get("st-tab-copre").innerHTML).toContain(p.n);
    expect(G.gente).toEqual([]);
  });

  it("un adapter con il solo elenco permette anche lookup e riuso del carcere",()=>{
    const p=contact();
    const {G,run,registry}=runtime({people:[p],listOnly:true});
    expect(run('stradaNpcPersonaDaId("p1")')).toBe(p);
    G.strada.arresto={settimane:4,colpo:"test"};
    const first=run('carcerePersonaProfilo("compagno",true)');
    expect(run('carcerePersonaProfilo("compagno",true)')).toBe(first);
    expect(registry.size).toBe(2);
    expect(G.gente).toEqual([]);
  });

  it("il fallback legacy continua a creare una sola persona per ruolo e detenzione",()=>{
    const {G,run}=runtime({managed:false});
    run('stradaAttivitaPersone("lavanderia")');
    run('stradaAttivitaPersone("lavanderia")');
    G.strada.arresto={settimane:4,colpo:"test"};
    run('carcerePersonaProfilo("giro",true)');
    run('carcerePersonaProfilo("giro",true)');
    expect(G.gente).toHaveLength(3);
    expect(G.gente[0].origineLuogo).toBe("attivita-lavanderia");
    expect(G.gente[2].origineLuogo).toBe("carcere");
  });

  it("il fallback sintetico conserva nomi distinti quando manca nuovaPersona",()=>{
    const {G,ctx,run}=runtime({managed:false});
    delete ctx.nuovaPersona;
    const a=run('stradaNpcCreaPersona({roleHint:"strada",name:"Rami"}).person');
    const b=run('stradaNpcCreaPersona({roleHint:"strada",name:"Rami"}).person');
    expect(a.n).toBe("Rami");
    expect(b.n).toBe("Rami 2");
    expect(G.gente).toHaveLength(2);
  });

  it("G.gente e nuovaPersona sono usati solo dentro il fallback del bridge",()=>{
    const start=crime.indexOf("const STRADA_NPC_CONTRACT_VERSION = 1;");
    const end=crime.indexOf("/* Punto 14:",start);
    const gameplay=(crime.slice(0,start)+crime.slice(end))
      .replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/[^\n]*/g,"");
    expect(gameplay).not.toMatch(/\bG\.gente\b|\bnuovaPersona\s*\(/);
  });

  it("le persone rimosse dal manager non sono candidati a squadra o favori",()=>{
    const p=contact();p.via=true;
    const {run}=runtime({people:[p]});
    expect(run('stradaNpcPersonaDaId("p1")')).toBeNull();
    expect(run("stradaPersoneSquadra()")).toHaveLength(0);
    expect(run("stradaPersoneConFavore()")).toHaveLength(0);
  });
});
