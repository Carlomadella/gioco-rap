import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const posto=leggi("js/game/posto.js");
const strada=leggi("js/game/strada-crimine.js");

function blocco(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return src.slice(a,b);
}

describe("Strada · punto 17 conseguenze tra sistemi",()=>{
  it("una conseguenza della Strada modifica la relazione generale della stessa persona",()=>{
    const p={id:"p1",n:"Mauro",rel:0,pt:2,origine:"lavoro",origineLuogo:"fabbrica"};
    const G={week:4,gente:[p]};
    const ctx={
      G,Number,Array,Object,Math,
      totalWeeks:()=>11,
      stradaAbsDay:()=>74,
      relSoglia:x=>3+Number(x.rel||0)
    };
    vm.createContext(ctx);
    vm.runInContext(
      blocco(posto,"function postoConseguenzeMondo","/* Quanta gente gira"),
      ctx
    );

    const out=vm.runInContext(
      "postoRegistraConseguenzaMondo(G.gente[0],'street-opportunity-success',2,{source:'strada',reason:'success'})",
      ctx
    );

    expect(p.origineLuogo).toBe("fabbrica");
    expect(p.rel).toBe(1);
    expect(p.pt).toBe(1);
    expect(out.relChanged).toBe(true);
    expect(p.conseguenzeMondo).toHaveLength(1);
    expect(p.conseguenzeMondo[0]).toMatchObject({
      type:"street-opportunity-success",
      source:"strada",
      week:11,
      absoluteDay:74,
      points:2,
      relBefore:0,
      relAfter:1
    });
  });

  it("una conseguenza negativa non crea di nascosto un Opp musicale",()=>{
    const p={id:"p2",n:"Nina",rel:0,pt:0};
    const G={week:1,gente:[p]};
    const ctx={
      G,Number,Array,Object,Math,
      totalWeeks:()=>1,
      stradaAbsDay:()=>1,
      relSoglia:x=>3+Number(x.rel||0)
    };
    vm.createContext(ctx);
    vm.runInContext(
      blocco(posto,"function postoConseguenzeMondo","/* Quanta gente gira"),
      ctx
    );

    vm.runInContext(
      "postoRegistraConseguenzaMondo(G.gente[0],'street-opportunity-failure',-9,{source:'strada'})",
      ctx
    );

    expect(p.rel).toBe(0);
    expect(p.pt).toBe(-2);
    expect(p.opp).toBeUndefined();
    expect(p.conseguenzeMondo[0].points).toBe(-9);
  });

  it("il passaparola raggiunge davvero chi aveva presentato il contatto",()=>{
    const intro={id:"p1",n:"Mauro",rel:2,pt:0,strada:{known:true,fiducia:40}};
    const target={id:"p2",n:"Nina",rel:1,pt:0,strada:{known:true,introducedByPersonId:"p1"}};
    const G={gente:[intro,target]};
    const calls=[],fiducia=[];
    const ctx={
      G,Number,Object,
      postoRegistraConseguenzaMondo:(p,tipo,punti,meta)=>{
        calls.push({id:p.id,tipo,punti,meta});
        return {persona:p,relChanged:false};
      },
      stradaPersonaMeta:p=>p.strada,
      stradaPersonaDaId:id=>G.gente.find(p=>p.id===id)||null,
      stradaModificaFiducia:(p,delta,reason)=>fiducia.push({id:p.id,delta,reason}),
      pushLog:()=>{},
      relNome:()=>"",
    };
    vm.createContext(ctx);
    vm.runInContext(
      blocco(strada,"function stradaEcoMondo","function stradaModificaDebitoPersona"),
      ctx
    );

    const out=vm.runInContext(
      "stradaEcoMondo(G.gente[1],'street-opportunity-success',2,{reason:'success'})",
      ctx
    );

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({id:"p2",punti:2});
    expect(calls[1]).toMatchObject({
      id:"p1",
      tipo:"street-hearsay-street-opportunity-success",
      punti:1
    });
    expect(calls[1].meta.relatedPersonId).toBe("p2");
    expect(fiducia).toEqual([{id:"p1",delta:1,reason:"passaparola-street-opportunity-success"}]);
    expect(out.hearsay).toBeTruthy();
  });

  it("dire no e ignorare non hanno la stessa conseguenza sociale",()=>{
    const rifiuta=blocco(strada,"function stradaRifiutaOpportunita","function stradaRifiutaPropostaFabbrica");
    const ignora=blocco(strada,"function stradaIgnoraOpportunita","function stradaIgnoraPropostaFabbrica");
    expect(rifiuta).toContain('stradaEcoMondo(persona,"street-opportunity-declined",0');
    expect(ignora).toContain('stradaEcoMondo(persona,"street-opportunity-ignored",-1');
  });

  it("successo, fallimento, arresto e rete usano lo stesso ponte tra sistemi",()=>{
    expect(strada).toContain('successo?"crime-together-success":"crime-together-failure"');
    expect(strada).toContain('successo?"street-opportunity-success":"street-opportunity-failure"');
    expect(strada).toContain('stradaEcoMondo(personaLead,"street-arrest",0');
    expect(strada).toContain('stradaEcoMondo(requester,"street-network-favor",1');
    expect(strada).toContain('stradaEcoMondo(a,"street-network-bridge",1');
    expect(posto).toContain("postoUltimaConseguenzaMondo(p)");
    expect(posto).toContain("eco&&etaEco<=4");
  });
});
