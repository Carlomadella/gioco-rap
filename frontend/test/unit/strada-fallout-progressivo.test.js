import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

const start=crime.indexOf("const STRADA_CADUTA_FASCE");
const end=crime.indexOf("function stradaHeatBruciaOpportunita",start);
if(start<0 || end<0) throw new Error("blocco fallout punto 23 non trovato");
const falloutCode=crime.slice(start,end);

function runtime(overrides={}){
  const activityState={
    pressione:30,issue:null,history:[],blockedUntilAbsoluteDay:null
  };
  const p={
    id:"lead",n:"Rami",via:false,
    strada:{fiducia:45,tensione:0,conseguenzeEventi:[],streetStatus:"active"}
  };
  const G={
    money:2000,
    strada:{
      heat:80,precedenti:2,sporchi:1500,
      attivita:{lavanderia:true},
      falloutStato:{history:[]}
    }
  };
  Object.assign(G,overrides.G||{});
  if(overrides.strada) Object.assign(G.strada,overrides.strada);

  const ctx={
    G,Object,Array,Number,Math,String,
    STRADA_ATTIVITA:[
      {id:"lavanderia",n:"Lavanderia",rischio:.05}
    ],
    stradaHeatCostoErrore:()=>1.35,
    stradaAttivitaStato:()=>activityState,
    stradaAttivitaWeekIndex:()=>10,
    stradaAbsDay:()=>100,
    stradaModificaFiducia:(x,d)=>{x.strada.fiducia+=d;},
    stradaModificaTensionePersona:(x,d)=>{x.strada.tensione+=d;return {delta:d,rivalitaNata:false};},
    stradaRelazioneTransizione:(x,status)=>{x.strada.streetStatus=status;return x.strada;},
    stradaRegistraConseguenzaPersona:()=>null,
    stradaEcoMondo:()=>null,
    fmt:n=>String(Math.round(Number(n)||0))
  };
  vm.createContext(ctx);
  vm.runInContext(falloutCode,ctx);
  return {ctx,G,p,activityState};
}

describe("Strada · punto 23 soldi facili, cadute progressive",()=>{
  it("il peso della caduta cresce col colpo e con il contesto, senza rango persistente",()=>{
    const {ctx}=runtime({strada:{heat:0,precedenti:0}});
    const low=vm.runInContext(
      'stradaCadutaProfilo({id:"consegne",difficolta:.15,minRep:0,pena:2,max:280},0,0)',
      ctx
    );
    const mid=vm.runInContext(
      'stradaCadutaProfilo({id:"cassa",difficolta:.50,minRep:4,pena:5,max:950},0,0)',
      ctx
    );
    const high=vm.runInContext(
      'stradaCadutaProfilo({id:"chiavi",difficolta:.76,minRep:42,pena:10,max:1650},80,2)',
      ctx
    );

    expect(low.id).toBe("contenuta");
    expect(mid.id).toBe("seria");
    expect(high.id).toBe("devastante");
    expect(high.score).toBeGreaterThan(mid.score);
    expect(crime).not.toMatch(/falloutRank|criminalRank|livelloCaduta/);
  });

  it("le perdite extra non colpiscono i lavori piccoli ma possono superare i mille sui colpi grossi",()=>{
    const {ctx}=runtime();
    expect(vm.runInContext(
      'stradaFalloutPerditaTarget({max:500},54,true,false,1.35)',ctx
    )).toBe(0);

    const loss=vm.runInContext(
      'stradaFalloutPerditaTarget({max:1650},90,true,false,1.35)',ctx
    );
    expect(loss).toBeGreaterThan(2000);
  });

  it("una caduta devastante può propagarsi su soldi, persona e attività",()=>{
    const {ctx,G,p,activityState}=runtime();
    ctx.p=p;
    const out=vm.runInContext(
      'stradaApplicaFalloutFallimento('+
        '{id:"chiavi-giuste",difficolta:.76,minRep:42,pena:10,max:1650},'+
        '{arrested:true,personaLead:p,rollPersona:0,rollAttivita:0})',
      ctx
    );

    expect(out.profilo.id).toBe("devastante");
    expect(out.dettagli.denaro.totale).toBeGreaterThan(1000);
    expect(p.strada.streetStatus).toBe("unreachable");
    expect(activityState.blockedUntilAbsoluteDay).toBe(114);
    expect(activityState.issue.id).toBe("controllo");
    expect(G.strada.falloutStato.history.at(-1)).toMatchObject({
      type:"crime-failure-fallout",
      colpoId:"chiavi-giuste",
      band:"devastante",
      arrested:true,
      businessId:"lavanderia"
    });
  });

  it("il rischio di perdere il contratto in carcere dipende dalla gravità, i save legacy restano al 20%",()=>{
    const {ctx}=runtime();
    const legacy=vm.runInContext(
      'stradaRischioContrattoCarcere({settimane:4})',ctx
    );
    const low=vm.runInContext(
      'stradaRischioContrattoCarcere({falloutScore:20,settimaneIniziali:2,settimane:2})',ctx
    );
    const high=vm.runInContext(
      'stradaRischioContrattoCarcere({falloutScore:90,settimaneIniziali:12,settimane:12})',ctx
    );
    expect(legacy).toBe(.20);
    expect(low).toBeLessThan(high);
    expect(high).toBeLessThanOrEqual(.24);
  });

  it("la UI distingue probabilità di fallire e costo della caduta",()=>{
    expect(crime).toContain("Rischio ' + stRischio(c).toLowerCase()");
    expect(crime).toContain("Caduta ' + stradaCadutaProfilo(c).label");
    expect(crime).toContain("stradaCadutaClasse(c)");
  });

  it("l'arresto conserva il peso iniziale e il carcere lo usa per il contratto",()=>{
    expect(crime).toContain("settimaneIniziali:settimane");
    expect(crime).toContain("falloutScore:null");
    expect(crime).toContain("s.arresto.falloutScore=fallout.score");
    expect(crime).toContain("Math.random() < stradaRischioContrattoCarcere(s.arresto)");
  });
});
