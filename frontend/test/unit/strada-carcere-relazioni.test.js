import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const ui=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine-ui.js"),"utf8");
const posto=fs.readFileSync(path.join(ROOT,"js/game/posto.js"),"utf8");

const helpers=crime.slice(
  crime.indexOf("const CARCERE_RELAZIONI_PROFILI"),
  crime.indexOf("const CARCERE_EVENTI = [")
);

function runtime(){
  let seq=0;
  const jail={
    jailId:"J:1",persone:{},eventi:[],recenti:[],seen:{},
    daily:{key:1},weekly:{key:1}
  };
  const G={gente:[],strada:{heat:0,rep:0}};
  const ctx={
    G,Math,Number,Object,Array,String,Set,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    stradaAbsDay:()=>100,
    carcereStato:()=>jail,
    nuovaPersona:()=>({id:"p"+(++seq),ruolo:"strada",n:"Detenuto "+seq,rel:0,pt:0,ult:-1,feat:-99,via:false}),
    postoRegistraConseguenzaMondo:()=>null,
    stradaSegnaPersona:(p,meta)=>{
      p.strada=p.strada||{known:false,fiducia:0,tensione:0,rivalita:false,conseguenzeEventi:[]};
      p.strada.known=true;p.strada.source=meta.source;p.circoloSbloccato=true;return p;
    },
    stradaPersonaMeta:p=>{
      p.strada=p.strada||{known:false,fiducia:0,tensione:0,rivalita:false,conseguenzeEventi:[]};
      p.strada.conseguenzeEventi=p.strada.conseguenzeEventi||[];
      return p.strada;
    },
    stradaModificaTensionePersona:(p,d)=>{
      p.strada.tensione=(p.strada.tensione||0)+d;
      if(p.strada.tensione>=2 && Number(p.strada.fiducia||0)<=20)p.strada.rivalita=true;
      return {rivalitaNata:!!p.strada.rivalita};
    },
    stradaRegistraConseguenzaPersona:(p,type,meta)=>{
      p.strada.conseguenzeEventi.push({type,meta});return {type,meta};
    }
  };
  vm.createContext(ctx);
  vm.runInContext(helpers,ctx);
  return {ctx,G,jail};
}

describe("Strada · punto 20 carcere come fonte di relazioni",()=>{
  it("la stessa faccia ricorre nella stessa detenzione e vive in G.gente",()=>{
    const {ctx,G,jail}=runtime();
    const a=vm.runInContext('carcerePersonaProfilo("compagno",true)',ctx);
    const b=vm.runInContext('carcerePersonaProfilo("compagno",true)',ctx);
    expect(a.id).toBe(b.id);
    expect(G.gente).toHaveLength(1);
    expect(jail.persone.compagno).toBe(a.id);
    expect(a.origine).toBe("carcere");
    expect(a.origineLuogo).toBe("carcere");
    expect(a.carcere.jailIds).toContain("J:1");
  });

  it("gli eventi costruiscono un rapporto separato dalla fiducia Strada",()=>{
    const {ctx,G}=runtime();
    vm.runInContext('carcereModificaRapporto("compagno",2,"test-a")',ctx);
    vm.runInContext('carcereModificaRapporto("compagno",2,"test-b")',ctx);
    const p=G.gente[0];
    expect(p.carcere.rapporto).toBe(4);
    expect(p.carcere.interazioni).toHaveLength(2);
    expect(p.strada).toBeUndefined();
  });

  it("un rapporto forte esce dal carcere come contatto persistente",()=>{
    const {ctx,G,jail}=runtime();
    vm.runInContext('carcereModificaRapporto("giro",6,"legame")',ctx);
    const out=vm.runInContext("carcereScarcerazioneRelazioni(carcereStato())",ctx);
    const p=G.gente[0];
    expect(Array.from(out.contatti).map(x=>x.id)).toEqual([p.id]);
    expect(p.strada.known).toBe(true);
    expect(p.strada.source).toBe("carcere");
    expect(p.strada.fiducia).toBeGreaterThanOrEqual(23);
    expect(p.carcere.linkedStreet).toBe(true);
    expect(p.carcere.currentJailId).toBeNull();
    expect(jail.persone.giro).toBe(p.id);
  });

  it("un rapporto debole resta persona del mondo ma non diventa contatto automatico",()=>{
    const {ctx,G}=runtime();
    vm.runInContext('carcereModificaRapporto("compagno",2,"poco")',ctx);
    const out=vm.runInContext("carcereScarcerazioneRelazioni(carcereStato())",ctx);
    expect(out.contatti).toHaveLength(0);
    expect(G.gente[0].carcere.rapporto).toBe(2);
    expect(G.gente[0].strada).toBeUndefined();
    expect(G.gente[0].carcere.returnAfterAbsoluteDay).toBe(142);
    expect(G.gente[0].carcere.outsideFollowupDone).toBe(false);
  });

  it("una conoscenza debole ha un percorso reale per ricomparire fuori",()=>{
    expect(crime).toContain("m.returnAfterAbsoluteDay=stradaAbsDay()+ritardo");
    expect(posto).toContain("function postoRientroCarcereDisponibile(p)");
    expect(posto).toContain('p.origineLuogo!=="carcere"');
    expect(posto).toContain("p.circoloSbloccato=true");
    expect(posto).toContain("dialogoCarcereFuori(p)");
  });

  it("il primo reincontro può trasformare un favore in continuità reale",()=>{
    expect(posto).toContain('jailOutside:"favore"');
    expect(posto).toContain('source:"carcere-reunion"');
    expect(posto).toContain('stradaModificaFiducia(p,4,"carcere-favore-fuori")');
    expect(posto).toContain('stradaAggiungiFavore(p,1,"carcere-favore-fuori")');
    expect(posto).toContain("p.carcere.outsideFollowupDone=true");
  });

  it("un conto grave può uscire come rivalità, non come premio",()=>{
    const {ctx,G}=runtime();
    vm.runInContext('carcereModificaRapporto("conto",-5,"conto")',ctx);
    const out=vm.runInContext("carcereScarcerazioneRelazioni(carcereStato())",ctx);
    const p=G.gente[0];
    expect(Array.from(out.rivali).map(x=>x.id)).toEqual([p.id]);
    expect(p.strada.known).toBe(true);
    expect(p.strada.rivalita).toBe(true);
  });

  it("gli eventi rapporti/crime sono collegati a profili persistenti",()=>{
    for(const id of [
      "jail_compagno_parla","jail_vecchio_consiglio","jail_tavolo_cortile",
      "jail_favore_piccolo","jail_faccia_giro","jail_conto_vecchio"
    ]) expect(crime).toContain(id+":Object.freeze({profilo:");
    expect(crime).toContain("carcereApplicaRelazioneEvento(e,r)");
    expect(crime).toContain("carcereApplicaRelazioneHigh(e,o,r)");
  });

  it("Parla con il giro ora muove una persona concreta",()=>{
    expect(crime).toContain('carcerePersonaProfilo("giro",true)');
    expect(crime).toContain('carcereModificaRapporto(profilo,2,"azione-giro")');
    expect(crime).toContain('Il nome gira un po\', ma soprattutto il rapporto resta');
  });

  it("la scarcerazione applica il gate prima di togliere lo stato arresto",()=>{
    const rel=crime.indexOf("const relazioniUscita=carcereScarcerazioneRelazioni(jailFx);");
    const clear=crime.indexOf("s.arresto = null;",rel);
    expect(rel).toBeGreaterThan(0);
    expect(clear).toBeGreaterThan(rel);
    expect(crime).toContain("rapporto>=4");
    expect(crime).toContain("rapporto<=-4");
  });

  it("la UI carcere mostra le persone e lo stato del rapporto",()=>{
    expect(crime).toContain("persone:carcerePersone().map");
    expect(crime).toContain("carcereRelazioneEtichetta(p)");
    expect(ui).toContain("Persone qui dentro");
    expect(ui).toContain('id="adf-jail-people"');
    expect(ui).toContain("v.persone&&v.persone.length");
  });
});
