import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

function blocco(a,b){
  const i=crime.indexOf(a),j=crime.indexOf(b,i);
  if(i<0||j<0) throw new Error("blocco non trovato: "+a);
  return crime.slice(i,j);
}

describe("Strada · punto 13 conseguenze attraverso le persone",()=>{
  it("un compagno può diventare qualcuno a cui devi davvero un favore",()=>{
    const p={via:false,strada:{debitiGiocatore:0,tensione:0,rivalita:false,conseguenzeEventi:[]}};
    const code=blocco("function stradaConseguenzePersona","function stradaRelazioneDisponibile");
    const api=new Function(
      "stradaPersonaMeta","stradaAbsDay","stradaFiduciaValore",
      code+"\nreturn {stradaConseguenzePersona,stradaModificaDebitoPersona};"
    )(x=>x.strada,()=>10,()=>50);

    expect(api.stradaModificaDebitoPersona(p,1,"si-prende-il-casino")).toBe(1);
    expect(api.stradaConseguenzePersona(p).debiti).toBe(1);
    expect(p.strada.conseguenzeEventi.at(-1)).toMatchObject({
      type:"debt-created",
      meta:{delta:1,reason:"si-prende-il-casino"}
    });

    expect(api.stradaModificaDebitoPersona(p,-1,"colpo-insieme-success")).toBe(-1);
    expect(api.stradaConseguenzePersona(p).debiti).toBe(0);
    expect(p.strada.conseguenzeEventi.at(-1).type).toBe("debt-repaid");
  });

  it("fallimenti ripetuti con fiducia bassa possono trasformare tensione in rivalità",()=>{
    const p={via:false,strada:{fiducia:15,debitiGiocatore:0,tensione:0,rivalita:false,conseguenzeEventi:[]}};
    const code=blocco("function stradaConseguenzePersona","function stradaRelazioneDisponibile");
    const api=new Function(
      "stradaPersonaMeta","stradaAbsDay","stradaFiduciaValore",
      code+"\nreturn {stradaModificaTensionePersona,stradaRivalitaAttiva};"
    )(x=>x.strada,()=>20,x=>x.strada.fiducia);

    expect(api.stradaModificaTensionePersona(p,1,"opportunita-failure").rivalitaNata).toBe(false);
    const secondo=api.stradaModificaTensionePersona(p,1,"opportunita-failure");
    expect(secondo.rivalitaNata).toBe(true);
    expect(api.stradaRivalitaAttiva(p)).toBe(true);
    expect(p.strada.conseguenzeEventi.some(e=>e.type==="rivalry-start")).toBe(true);
  });

  it("una relazione forte regge la tensione senza diventare automaticamente rivalità",()=>{
    const p={via:false,strada:{fiducia:70,debitiGiocatore:0,tensione:0,rivalita:false,conseguenzeEventi:[]}};
    const code=blocco("function stradaConseguenzePersona","function stradaRelazioneDisponibile");
    const fn=new Function(
      "stradaPersonaMeta","stradaAbsDay","stradaFiduciaValore",
      code+"\nreturn stradaModificaTensionePersona;"
    )(x=>x.strada,()=>20,x=>x.strada.fiducia);

    fn(p,1,"fail-1");
    const out=fn(p,1,"fail-2");
    expect(out.rivalitaNata).toBe(false);
    expect(p.strada.rivalita).toBe(false);
    expect(p.strada.tensione).toBe(2);
  });

  it("un successo con un committente fidato può introdurre una nuova persona reale",()=>{
    const introducer={
      id:"lead",n:"Rami",via:false,
      strada:{fiducia:60,rivalita:false,lastReferralAbsoluteDay:null,conseguenzeEventi:[]}
    };
    const G={gente:[introducer],strada:{rep:50}};
    let seq=0;
    const nuove=[];
    const code=blocco("function stradaPresentazioneDopoSuccesso","/* ==================== LA SCENA IN CORSO");
    const fn=new Function(
      "G","STRADA_OPPORTUNITA","stradaRivalitaAttiva","stradaPersonaMeta",
      "stradaFiduciaValore","stradaAbsDay","stradaReputazioneGlobale",
      "stradaContattoKey","stradaCreaContatto","stradaModificaFiducia",
      "stradaRegistraConseguenzaPersona","Math",
      code+"\nreturn stradaPresentazioneDopoSuccesso;"
    )(
      G,
      [
        {id:"a",persona:"Rami",minRep:0},
        {id:"b",persona:"Nina",minRep:0},
        {id:"c",persona:"Moro",minRep:10}
      ],
      p=>!!p.strada.rivalita,
      p=>p.strada,
      p=>p.strada.fiducia,
      ()=>100,
      ()=>50,
      n=>"street:"+n.toLowerCase(),
      (nome,key,meta)=>{
        const p={id:"new-"+(++seq),n:nome,via:false,strada:{known:true,key,fiducia:5,rivalita:false,conseguenzeEventi:[],introducedByPersonId:meta.introducedByPersonId}};
        G.gente.push(p);nuove.push({p,meta});return p;
      },
      (p,d)=>{p.strada.fiducia+=d;},
      (p,type,meta)=>{p.strada.conseguenzeEventi.push({type,meta});},
      Math
    );

    const out=fn(introducer,0,.1);
    expect(out).not.toBeNull();
    expect(out.nuovo.n).toBe("Nina");
    expect(G.gente).toHaveLength(2);
    expect(out.nuovo.strada.introducedByPersonId).toBe("lead");
    expect(nuove[0].meta.source).toBe("referral-after-success");
    expect(introducer.strada.lastReferralAbsoluteDay).toBe(100);
    expect(introducer.strada.conseguenzeEventi.at(-1).type).toBe("introduced-contact");
  });

  it("una rivalità rende la persona indisponibile come risorsa alleata ma non la cancella dal mondo",()=>{
    const p={id:"x",n:"Toni",via:false,strada:{known:true,streetStatus:"active",rivalita:true}};
    const code=blocco("function stradaRelazioneDisponibile","/* Punto 11:");
    const fn=new Function("stradaPersonaMeta",code+"\nreturn stradaRelazioneDisponibile;")(x=>x.strada);
    expect(fn(p)).toBe(false);
    expect(p.via).toBe(false);
  });

  it("il risultato del colpo collega debito rivalità e presentazione alla storia mostrata",()=>{
    expect(crime).toContain('stradaModificaDebitoPersona(personaSquadra,1,"si-prende-il-casino")');
    expect(crime).toContain('stradaModificaTensionePersona(personaLead,1,"opportunita-failure")');
    expect(crime).toContain("stradaPresentazioneDopoSuccesso(personaLead,Math.random(),Math.random())");
    expect(crime).toContain("adesso gli devi un favore");
    expect(crime).toContain("la cosa è diventata personale");
    expect(crime).toContain("ti apre un'altra porta e ti presenta");
  });
});
