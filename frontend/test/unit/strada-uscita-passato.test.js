import { crimeNpcBridge } from "../helpers/crime-npc-bridge.js";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
/* Su Windows i file escono in CRLF: senza i \r i toContain con dentro un a capo combaciano */
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8").replace(/\r\n/g,"\n");
const crimeUi=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine-ui.js"),"utf8").replace(/\r\n/g,"\n");
const state=fs.readFileSync(path.join(ROOT,"js/game/state.js"),"utf8");
const lifestyle=fs.readFileSync(path.join(ROOT,"js/game/lifestyle.js"),"utf8");
const lavoroEventi=fs.readFileSync(path.join(ROOT,"js/game/lavoro-eventi.js"),"utf8");

const helpers=crime.slice(
  crime.indexOf("/* ==================== USCIRE DAL GIRO · PUNTO 21"),
  crime.indexOf("function stradaAbsDay(){")
);

function runtime(mollato=false){
  const G={
    year:1,week:1,day:1,wellbeing:80,diario:{colpi:0},gente:[],
    strada:{
      heat:0,rep:0,precedenti:0,attivita:{},badgeSbloccato:true,
      uscitaGiro:{
        mollato,leftAbsoluteDay:mollato?10:null,profondita:mollato?40:0,
        memoryUntilAbsoluteDay:mollato?375:null,lastKnockAbsoluteDay:null,history:[]
      }
    }
  };
  const ctx={
    G,Math,Number,Object,Array,String,Set,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    stradaAttivitaSbloccate:()=>true,
    stradaAbsDay:()=>20,
    stradaFiduciaValore:p=>Number(p?.strada?.fiducia||0),
    stradaRivalitaAttiva:p=>!!p?.strada?.rivalita,
    stradaConseguenzePersona:p=>({debiti:Number(p?.strada?.debitiGiocatore||0)}),
    stradaFavoriValore:p=>Math.max(0,Number(p?.strada?.favori||0)),
    stradaRelazioneForte:p=>Number(p?.strada?.fiducia||0)>=50 ||
      Number(p?.strada?.colpiInsieme||0)>=2 || Number(p?.strada?.favori||0)>0,
    stradaPersonaMeta:p=>p.strada,
    stradaRegistraConseguenzaPersona:()=>null,
    STRADA_FIDUCIA_SQUADRA:25,
    pushLog:()=>null
  };
  vm.createContext(ctx);
    vm.runInContext(crimeNpcBridge(crime),ctx);
  vm.runInContext(helpers,ctx);
  return {ctx,G};
}

describe("Strada · punto 21 uscita dal giro e memoria del passato",()=>{
  it("salva esplicitamente l'uscita senza toccare la memoria storica del giro",()=>{
    expect(state).toContain("uscitaGiro:{mollato:false");
    expect(state).toContain("memoryUntilAbsoluteDay:null");
    expect(crime).toContain("function stradaPartecipazioneAttiva()");
    expect(crime).toContain("function stradaRischioCriminaleAttivo()");
    expect(crime).not.toContain("s.giroAvviato=false");
  });

  it("la memoria cresce da pochi mesi a più anni in base alla profondità",()=>{
    const {ctx}=runtime();
    expect(vm.runInContext("stradaMemoriaGiorni(0)",ctx)).toBe(120);
    expect(vm.runInContext("stradaMemoriaGiorni(24)",ctx)).toBe(120);
    expect(vm.runInContext("stradaMemoriaGiorni(25)",ctx)).toBe(365);
    expect(vm.runInContext("stradaMemoriaGiorni(50)",ctx)).toBe(730);
    expect(vm.runInContext("stradaMemoriaGiorni(75)",ctx)).toBe(1460);
    expect(vm.runInContext("stradaMemoriaGiorni(100)",ctx)).toBe(1460);
  });

  it("mollare spegne la partecipazione ma mantiene il rischio finché il passato è vivo",()=>{
    const {ctx,G}=runtime(true);
    expect(vm.runInContext("stradaPartecipazioneAttiva()",ctx)).toBe(false);
    expect(vm.runInContext("stradaPassatoAttivo()",ctx)).toBe(true);
    expect(vm.runInContext("stradaRischioCriminaleAttivo()",ctx)).toBe(true);
    G.strada.uscitaGiro.memoryUntilAbsoluteDay=19;
    expect(vm.runInContext("stradaPassatoAttivo()",ctx)).toBe(false);
    expect(vm.runInContext("stradaRischioCriminaleAttivo()",ctx)).toBe(false);
  });

  it("la profondità considera storia reale, non un nuovo rango",()=>{
    expect(crime).toContain("function stradaProfonditaUscita()");
    expect(crime).toContain("Number(s.precedenti||0)");
    expect(crime).toContain("Number(G.diario&&G.diario.colpi)");
    expect(crime).toContain("stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA");
    expect(crime).toContain("stradaRivalitaAttiva(p)");
    expect(crime).not.toContain("criminalRank");
  });

  it("Molla chiude accordi operativi ma non persone, precedenti o conoscenze",()=>{
    const i=crime.indexOf("function stMollaIlGiro()");
    const j=crime.indexOf("/* ==================== CARCERE EVENTI",i);
    const blocco=crime.slice(i,j);
    expect(blocco).toContain("u.mollato=true");
    expect(blocco).toContain("opp.pending=null");
    expect(blocco).toContain("rete.pending=null");
    expect(blocco).toContain("s.prot=0");
    expect(blocco).toContain("s.ferro=false");
    expect(blocco).toContain("s.avvocato=false");
    expect(blocco).not.toContain("G.gente=[]");
    expect(blocco).not.toContain("s.precedenti=0");
    expect(blocco).not.toContain("fiducia=0");
  });

  it("fuori dal giro non si possono più usare le meccaniche criminali attive",()=>{
    expect(crime).toContain('return "Hai mollato il giro: non fai più passare denaro sporco."');
    expect(crime).toContain('stToast("Hai mollato il giro: non accetti più colpi.")');
    expect(crime).toContain("if(!stradaPartecipazioneAttiva() || !stradaGiroAvviato()");
    expect(crime).toContain("function stradaOpp(){\n  if(!stradaPartecipazioneAttiva())return false;");
    expect(crime).toContain("Hai mollato il giro: l'attività resta un'impresa");
    expect(crime).toContain("Hai mollato il giro: non stai cercando un altro ferro.");
  });

  it("le attività normali continuano a rendere prima del ramo ex-giro",()=>{
    const income=crime.indexOf("redditoAttivita+=Number(esito.income||0)");
    const exit=crime.indexOf("if(!stradaPartecipazioneAttiva()){",income);
    expect(income).toBeGreaterThan(0);
    expect(exit).toBeGreaterThan(income);
    expect(crime.slice(income,exit)).toContain('lifestyleRegistraEntrata(redditoAttivita,"attivita")');
  });

  it("le attività possedute restano imprese normali senza offrire nuove funzioni criminali",()=>{
    expect(crime).toContain('return "Hai mollato il giro: le attività che possiedi restano imprese normali');
    expect(crime).toContain("if(partecipa&&!fermata&&Number(G.strada.sporchi||0)>0&&residuo>0)");
    expect(crime).toContain("if(partecipa&&!fermata&&contatto&&Number(st.lastMeetingWeek)!==week)");
    expect(crime).toContain("'lato criminale chiuso · '");
    expect(crime).toContain("(partecipa?'Rileva':'Fuori dal giro')");
  });

  it("il passato può bussare tramite persone reali e poi smette dopo la scadenza",()=>{
    expect(crime).toContain("function stradaPassatoSettimana(roll,variantRoll)");
    expect(crime).toContain('type:"past-knock"');
    expect(crime).toContain('kind=st.rivalita?"rival"');
    expect(crime).toContain('Number(cons.debiti||0)>0?"debt"');
    expect(crime).toContain('favori>0?"favor"');
    expect(crime).toContain('stradaRelazioneForte(p) || p.origine==="carcere"');
    expect(crime).toContain("if(!u.mollato || !stradaPassatoAttivo()) return null;");
    expect(crime).toContain("u.history.push(e)");
  });

  it("un favore rimasto aperto è davvero candidato alla memoria del passato",()=>{
    const {ctx,G}=runtime(true);
    G.gente=[{
      id:"p-favore",n:"Rami",via:false,
      strada:{known:true,fiducia:10,favori:1,debitiGiocatore:0,rivalita:false,colpiInsieme:0}
    }];
    expect(vm.runInContext('stradaPassatoCandidati().map(x=>x.kind).join(",")',ctx)).toBe("favor");
  });

  it("uscire blocca anche le nuove dritte criminali nate dal lavoro",()=>{
    expect(lavoroEventi).toContain('if(typeof stradaPartecipazioneAttiva==="function")');
    expect(lavoroEventi).toContain("return !!stradaPartecipazioneAttiva()");
    expect(lavoroEventi).toContain("function clearCrimeLeads(reason)");
    expect(lavoroEventi).toContain("if(!streetStarted()) return null;");
    expect(lavoroEventi).toContain("clearCrimeLeads,");
    expect(crime).toContain('ADF_WORK_EVENTS.clearCrimeLeads("left-giro")');
  });

  it("Molla richiede davvero i fondi dichiarati e non può azzerare il conto fingendo di aver pagato",()=>{
    const i=crime.indexOf("function stMollaIlGiro()");
    const j=crime.indexOf("/* ==================== CARCERE EVENTI",i);
    const blocco=crime.slice(i,j);
    expect(blocco).toContain("if(s.arresto) return");
    expect(blocco).toContain("if(disponibili<costo)");
    expect(blocco).toContain('"Per mollare il giro ti servono "');
    expect(crime).toContain('d:manca?"Ti mancano "+fmt(manca)+" €"');
    expect(crime).toContain("if(stradaPartecipazioneAttiva()){ stToast(t); return; }");
  });

  it("il lifestyle usa la memoria residua invece di considerarti criminale per sempre",()=>{
    expect(lifestyle).toContain('typeof stradaRischioCriminaleAttivo==="function"');
    expect(lifestyle).toContain("!!stradaRischioCriminaleAttivo()");
  });

  it("la UI V2 rende evidente che sei fuori dal giro e blocca le azioni criminali",()=>{
    expect(crimeUi).toContain("Hai mollato il giro");
    expect(crimeUi).toContain("Il passato può ancora tornare a bussare");
    expect(crimeUi).toContain('q("#quit").textContent=partecipa?"Molla il giro":"Fuori dal giro"');
    expect(crimeUi).toContain('q("#quit").disabled=!partecipa||!!s.arresto');
    expect(crimeUi).toContain('q("#launder").disabled=!partecipa');
    expect(crimeUi).toContain('q("#lawyer").disabled=!partecipa');
    expect(crime).toContain('if(!stradaPartecipazioneAttiva())\n    return "Hai mollato il giro: non stai più affidando incarichi criminali a un legale privato."');
  });
});
