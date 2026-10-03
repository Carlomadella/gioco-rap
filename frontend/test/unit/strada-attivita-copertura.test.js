import { crimeNpcBridge } from "../helpers/crime-npc-bridge.js";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const strada=leggi("js/game/strada-crimine.js");
const css=leggi("css/strada-crimine-v2.css");

function blocco(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return src.slice(a,b);
}

describe("Strada · punto 17 attività di copertura",()=>{
  it("le tre attività hanno economia, capacità e rischio distinti",()=>{
    expect(strada).toContain('id:"lavanderia"');
    expect(strada).toContain("ricavoPulito:80");
    expect(strada).toContain("capienza:150");
    expect(strada).toContain("rischio:.05");
    expect(strada).toContain('id:"autolavaggio"');
    expect(strada).toContain("capienza:240");
    expect(strada).toContain('id:"minimarket"');
    expect(strada).toContain("capienza:330");
    expect(strada).not.toContain("45% pulito / 55% sporco");
  });

  it("un'attività posseduta crea socio e dipendente persistenti in G.gente",()=>{
    const G={week:4,year:1,gente:[],strada:{attivita:{lavanderia:true},attivitaStato:{}}};
    let seq=0;
    const links=[];
    const ctx={
      G,Number,Array,Object,Math,
      nuovaPersona:ruolo=>({id:"p"+(++seq),n:ruolo+" "+seq,ruolo,rel:0,pt:0,via:false}),
      postoCollegaPersone:(a,b,motivo)=>links.push([a.id,b.id,motivo])
    };
    vm.createContext(ctx);
    vm.runInContext(crimeNpcBridge(strada),ctx);
    vm.runInContext(
      blocco(strada,"const STRADA_ATTIVITA =","/* Protezione a tre gradini"),
      ctx
    );

    const st=vm.runInContext("stradaAttivitaStato('lavanderia',true)",ctx);
    expect(G.gente).toHaveLength(2);
    expect(st.partnerPersonId).toBe("p1");
    expect(st.employeePersonId).toBe("p2");
    expect(G.gente[0]).toMatchObject({
      origine:"attivita",
      origineLuogo:"attivita-lavanderia",
      circoloSbloccato:false,
      visto:true
    });
    expect(G.gente[0].attivita.ruolo).toBe("socio");
    expect(G.gente[1].attivita.ruolo).toBe("dipendente");
    expect(links).toEqual([["p1","p2","attivita-lavoro"]]);
  });

  it("la chiusura settimanale produce reddito pulito e può aprire un problema deterministico",()=>{
    const st={
      pressione:20,issue:null,history:[],lastIssueWeek:null,
      partnerPersonId:"p1",employeePersonId:"p2"
    };
    const G={money:0,strada:{attivita:{lavanderia:true},sporchi:500},gente:[
      {id:"p1",n:"Mauro"},{id:"p2",n:"Nina"}
    ]};
    const logs=[];
    const ctx={
      G,Number,Math,
      STRADA_ATTIVITA_PROBLEMI:[
        {id:"cassa",n:"La cassa non torna",tipo:"dipendente",testo:"domande",costo:120,heatIgnora:1.5},
        {id:"fornitore",n:"Fornitore bloccato",tipo:"operativo",testo:"consegna",costo:90,heatIgnora:.5},
        {id:"controllo",n:"Controllo amministrativo",tipo:"controllo",testo:"documenti",costo:180,heatIgnora:2.5}
      ],
      stradaAttivitaStato:()=>st,
      stradaAttivitaWeekIndex:()=>12,
      stradaAttivitaOperativa:()=>true,
      stradaLavaggioUsatoCanale:()=>120,
      stradaAttivitaPersone:()=>({partner:G.gente[0],employee:G.gente[1]}),
      pushLog:t=>logs.push(t),
      postoRegistraConseguenzaMondo:()=>null
    };
    vm.createContext(ctx);
    vm.runInContext(crimeNpcBridge(strada),ctx);
    vm.runInContext(
      blocco(strada,"function stradaAttivitaProblemaDef","function stradaAttivitaRisolviProblema"),
      ctx
    );

    const a={id:"lavanderia",ricavoPulito:80,gestione:25,capienza:150,rischio:.05};
    const out=vm.runInContext(
      "stradaAttivitaChiudiSettimana("+JSON.stringify(a)+",0,0.99)",
      ctx
    );
    expect(out.income).toBe(55);
    expect(G.strada.sporchi).toBe(500);
    expect(st.issue.id).toBe("controllo");
    expect(logs.at(-1)).toContain("Controllo amministrativo");
  });

  it("il riciclaggio è per canale e il giocatore sceglie anche l'importo",()=>{
    expect(strada).toContain("function stradaCanaliLavaggio()");
    expect(strada).toContain("function stradaRipulisci(importo,canaleId)");
    expect(strada).toContain("function stScenaLavaggioCanale(canaleId)");
    expect(strada).toContain("Come li fai passare");
    expect(strada).toContain("Scegli prima <b>dove</b>, poi <b>quanto</b>");
    expect(strada).toContain("Math.round(max*.25)");
    expect(strada).toContain("Math.round(max*.5)");
    expect(strada).toContain("st.pressione=Math.min(100");
  });

  it("problemi e controlli hanno tre risposte con costi e conseguenze diverse",()=>{
    expect(strada).toContain('id:"cassa"');
    expect(strada).toContain('id:"fornitore"');
    expect(strada).toContain('id:"controllo"');
    expect(strada).toContain('scelta==="sistema"');
    expect(strada).toContain('scelta==="pausa"');
    expect(strada).toContain('business-issue-ignored');
    expect(strada).toContain("blockedUntilAbsoluteDay=stradaAbsDay()+7");
  });

  it("le attività possono diventare punti d'incontro della rete",()=>{
    expect(strada).toContain("function stradaAttivitaContattoIncontro(id)");
    expect(strada).toContain("function stradaAttivitaIncontro(id)");
    expect(strada).toContain('GAME_TIME.spend(45,"crime:business-meeting"');
    expect(strada).toContain('postoCollegaPersone(persone.partner,contatto,"attivita-incontro")');
    expect(strada).toContain("Fissa un incontro con ");
  });

  it("la tab attività resta usabile quando le card diventano più ricche",()=>{
    expect(css).toContain("#strada #st-tab-attivita.tabpane{overflow-y:auto}");
    expect(strada).toContain('data-stgestione="');
    expect(strada).toContain("Sono imprese vere");
  });
});
