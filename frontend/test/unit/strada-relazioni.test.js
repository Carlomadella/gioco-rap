import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const eventi=fs.readFileSync(path.join(ROOT,"js/game/eventi-v2.js"),"utf8");

function creaRuntime(dayRef, gente){
  const start=crime.indexOf("const STRADA_FIDUCIA_SQUADRA = 25;");
  const end=crime.indexOf("const STRADA_PROTEZIONE_REQ",start);
  if(start<0 || end<0) throw new Error("blocco relazioni Strada non trovato");
  const code=crime.slice(start,end);
  const G={gente};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const stradaAbsDay=()=>dayRef.value;
  const pushLog=()=>{};
  return new Function("G","clamp","stradaAbsDay","pushLog",
    code+"\nreturn {STRADA_RELAZIONI,stradaPersonaMeta,stradaRelazioneDisponibile,"+
    "stradaIgnoraContatto,stradaRegistraInterazione,stradaAggiornaRelazioniCriminali};"
  )(G,clamp,stradaAbsDay,pushLog);
}

function persona(overrides={}){
  return Object.assign({
    id:"p1",n:"Rami",via:false,
    strada:{
      known:true,key:"street:rami",sources:["opportunity"],opportunityIds:[],
      fiducia:20,fiduciaEventi:[],favori:0,favoriEventi:[],colpiInsieme:0
    }
  },overrides);
}

describe("Strada · punto 10 relazioni criminali",()=>{
  it("migra i vecchi contatti senza punirli retroattivamente",()=>{
    const day={value:400};
    const p=persona();
    const r=creaRuntime(day,[p]);
    r.stradaPersonaMeta(p);
    expect(p.strada.streetStatus).toBe("active");
    expect(p.strada.lastPlayerStreetInteractionAbsoluteDay).toBe(400);
    expect(p.strada.ignoredStreetOffers).toBe(0);
  });

  it("tre offerte ignorate rendono il contatto inattivo senza cancellarlo da G.gente",()=>{
    const day={value:20};
    const p=persona();
    const r=creaRuntime(day,[p]);
    r.stradaPersonaMeta(p);
    r.stradaIgnoraContatto(p,"test-1");
    r.stradaIgnoraContatto(p,"test-2");
    expect(p.strada.streetStatus).toBe("active");
    r.stradaIgnoraContatto(p,"test-3");
    expect(p.strada.streetStatus).toBe("inactive");
    expect(r.stradaRelazioneDisponibile(p)).toBe(false);
    expect(p.via).toBe(false);
  });

  it("una risposta o collaborazione reale riattiva il rapporto e azzera gli ignore",()=>{
    const day={value:30};
    const p=persona();
    const r=creaRuntime(day,[p]);
    r.stradaPersonaMeta(p);
    r.stradaIgnoraContatto(p,"1");
    r.stradaIgnoraContatto(p,"2");
    r.stradaIgnoraContatto(p,"3");
    expect(p.strada.streetStatus).toBe("inactive");
    day.value=31;
    r.stradaRegistraInterazione(p,"accepted");
    expect(p.strada.streetStatus).toBe("active");
    expect(p.strada.ignoredStreetOffers).toBe(0);
    expect(p.strada.lastPlayerStreetInteractionAbsoluteDay).toBe(31);
  });

  it("dopo circa sei mesi di silenzio il contatto può diventare non raggiungibile",()=>{
    const day={value:169};
    const p=persona();
    p.strada.lastPlayerStreetInteractionAbsoluteDay=1;
    const r=creaRuntime(day,[p]);
    r.stradaAggiornaRelazioniCriminali(true);
    expect(p.strada.streetStatus).toBe("unreachable");
    expect(r.stradaRelazioneDisponibile(p)).toBe(false);
    expect(p.via).toBe(false);
  });

  it("una storia forte può far riemergere il contatto più avanti, ma più freddo",()=>{
    const day={value:169};
    const p=persona();
    p.strada.fiducia=60;
    p.strada.colpiInsieme=2;
    p.strada.lastPlayerStreetInteractionAbsoluteDay=1;
    const r=creaRuntime(day,[p]);
    r.stradaAggiornaRelazioniCriminali(true);
    expect(p.strada.streetStatus).toBe("unreachable");
    expect(p.strada.returnAfterAbsoluteDay).toBe(253);

    day.value=253;
    r.stradaAggiornaRelazioniCriminali(true);
    expect(p.strada.streetStatus).toBe("cold");
    expect(p.strada.fiducia).toBe(45);
    expect(r.stradaRelazioneDisponibile(p)).toBe(true);
  });

  it("una relazione debole non viene fatta riapparire automaticamente",()=>{
    const day={value:169};
    const p=persona();
    p.strada.fiducia=12;
    p.strada.colpiInsieme=0;
    p.strada.favori=0;
    p.strada.lastPlayerStreetInteractionAbsoluteDay=1;
    const r=creaRuntime(day,[p]);
    r.stradaAggiornaRelazioniCriminali(true);
    expect(p.strada.streetStatus).toBe("unreachable");
    expect(p.strada.returnAfterAbsoluteDay).toBeNull();
    day.value=400;
    r.stradaAggiornaRelazioniCriminali(true);
    expect(p.strada.streetStatus).toBe("unreachable");
  });

  it("separa ghosting, rifiuto esplicito e cancellazione tecnica",()=>{
    expect(crime).toContain("function stradaIgnoraOpportunita()");
    expect(crime).toContain('stradaIgnoraContatto(persona,"opportunity-ignored")');
    expect(crime).toContain("Cancellazione tecnica");
    expect(eventi).toContain('typeof stradaIgnoraOpportunita==="function"');
    expect(eventi).toContain('typeof stradaIgnoraPropostaFabbrica==="function"');
    expect(eventi).toContain('{n:"Taglia corto"');
    expect(eventi).toContain('typeof stradaRifiutaPropostaFabbrica==="function"');
  });

  it("i contatti inattivi restano persone del mondo ma non risorse del giro",()=>{
    expect(crime).toContain(".filter(p=>stradaRelazioneDisponibile(p) && stradaFavoriValore(p)>0)");
    expect(crime).toContain(".filter(p=>stradaRelazioneDisponibile(p) &&\n      stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA)");
    expect(crime).toContain(".filter(stradaRelazioneDisponibile)");
    expect(crime).toContain("dormienti=tuttiContatti.filter");
    expect(crime).not.toContain("p.via=true");
  });
});
