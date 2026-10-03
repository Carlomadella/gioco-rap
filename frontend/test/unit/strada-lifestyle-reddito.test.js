import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

const lifestyle=leggi("js/game/lifestyle.js");
const actions=leggi("js/game/actions.js");
const sim=leggi("js/game/sim.js");
const crime=leggi("js/game/strada-crimine.js");
const trasferte=leggi("js/game/trasferte.js");
const negozio=leggi("js/game/negozio.js");
const ui=leggi("js/game/ui.js");
const phases=leggi("js/game/phases.js");

function contesto(overrides={}){
  const G={
    year:1,week:1,
    life:{casa:0,auto:0,look:0,uscite:0,crew:0},
    strada:{heat:0,giroAvviato:false,badgeSbloccato:false,
      rischioLifestyle:{key:null,entrate:0,fonti:{},speseExtra:0,speseFonti:{},history:[],closedKey:null,last:null}}
  };
  const ctx={
    G,window:{},Math,Number,Object,Array,String,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    difEnergia:()=>0,
    ...overrides
  };
  vm.createContext(ctx);
  vm.runInContext(lifestyle,ctx);
  return ctx;
}

describe("Strada · punto 18 lifestyle e reddito dichiarabile",()=>{
  it("registra solo le fonti giustificabili e le aggrega per settimana",()=>{
    const ctx=contesto();
    vm.runInContext(`
      lifestyleRegistraEntrata(120,"lavoro");
      lifestyleRegistraEntrata(80,"live");
      lifestyleRegistraSpesaVisibile(100,"vestiti",.5);
    `,ctx);
    const st=ctx.G.strada.rischioLifestyle;
    expect(st.entrate).toBe(200);
    expect(st.fonti.lavoro).toBe(120);
    expect(st.fonti.live).toBe(80);
    expect(st.speseExtra).toBe(50);
    expect(st.speseFonti.vestiti).toBe(50);
  });

  it("usa una media mobile e rende il rischio leggibile",()=>{
    const ctx=contesto();
    ctx.G.strada.rischioLifestyle.history=[
      {entrate:100,visibile:500},
      {entrate:120,visibile:520},
      {entrate:80,visibile:510}
    ];
    ctx.G.life={casa:4,auto:4,look:3,uscite:3,crew:3};
    const r=vm.runInContext("lifestyleRiepilogoRischio()",ctx);
    expect(["sopra","esposto"]).toContain(r.id);
    expect(r.label.length).toBeGreaterThan(3);
    expect(r.testo).toContain("giustific");
    expect(r.settimane).toBe(4);
  });

  it("un personaggio pulito non prende heat solo perché vive bene",()=>{
    const ctx=contesto({stradaGiroAvviato:()=>false});
    ctx.G.life={casa:4,auto:4,look:3,uscite:3,crew:3};
    vm.runInContext("lifestyleChiudiSettimanaRischio()",ctx);
    expect(ctx.G.strada.heat).toBe(0);
    expect(ctx.G.strada.rischioLifestyle.last.heatDelta).toBe(0);
  });

  it("la stessa discrepanza alza l'attenzione quando il giro è già avviato",()=>{
    const logs=[];
    const ctx=contesto({stradaGiroAvviato:()=>true,pushLog:t=>logs.push(t)});
    ctx.G.strada.giroAvviato=true;
    ctx.G.life={casa:4,auto:4,look:3,uscite:3,crew:3};
    vm.runInContext("lifestyleChiudiSettimanaRischio()",ctx);
    expect(ctx.G.strada.heat).toBeGreaterThan(0);
    expect(ctx.G.strada.rischioLifestyle.last.heatDelta).toBeGreaterThan(0);
    expect(logs.at(-1)).toContain("Tenore di vita");
  });

  it("reddito pulito sufficiente può mantenere il tenore coerente",()=>{
    const ctx=contesto({stradaGiroAvviato:()=>true});
    ctx.G.strada.giroAvviato=true;
    ctx.G.life={casa:2,auto:2,look:1,uscite:1,crew:1};
    vm.runInContext('lifestyleRegistraEntrata(1200,"lavoro"); lifestyleChiudiSettimanaRischio();',ctx);
    expect(ctx.G.strada.rischioLifestyle.last.status).toBe("coerente");
    expect(ctx.G.strada.heat).toBe(0);
  });

  it("il valore dei vestiti realmente indossati entra come segnale, senza contarlo ogni settimana per intero",()=>{
    const ctx=contesto({stileAddosso:()=>[{p:500},{p:300}]});
    expect(vm.runInContext("lifestyleValoreVestitiVisibili()",ctx)).toBe(800);
    const snap=vm.runInContext("lifestyleSnapshotCorrente(true)",ctx);
    expect(snap.vestiti).toBe(800);
    expect(snap.visibile).toBe(40);
  });

  it("le fonti legittime principali alimentano il registro",()=>{
    expect(actions).toContain('lifestyleRegistraEntrata(incassoLive,"live")');
    expect(actions).toContain('lifestyleRegistraEntrata(paga.totale,"lavoro")');
    expect(sim).toContain('lifestyleRegistraEntrata(gross,"streaming")');
    expect(crime).toContain('lifestyleRegistraEntrata(redditoAttivita,"attivita")');
    expect(trasferte).toContain('lifestyleRegistraEntrata(soldi,"trasferta")');
    expect(trasferte).toContain('lifestyleRegistraEntrata(soldi,"data-fuori-citta")');
    expect(ui).toContain('lifestyleRegistraEntrata(o.advance,"anticipo-etichetta")');
    expect(phases).toContain('lifestyleRegistraEntrata(9000,"tour")');
  });

  it("soldi criminali e riciclaggio non diventano automaticamente reddito giustificabile",()=>{
    const successo=crime.slice(crime.indexOf("if(successo){"),crime.indexOf("}else{",crime.indexOf("if(successo){")));
    const ricicla=crime.slice(crime.indexOf("function stradaRipulisci("),crime.indexOf("function stScenaLavaggioCanale"));
    expect(successo).not.toContain("lifestyleRegistraEntrata");
    expect(ricicla).not.toContain("lifestyleRegistraEntrata");
  });

  it("vestiti e viaggi alimentano la parte visibile senza diventare contabilità fiscale",()=>{
    expect(negozio).toContain('lifestyleRegistraSpesaVisibile(prezzo,"vestiti",.65)');
    expect(trasferte).toContain('lifestyleRegistraSpesaVisibile(inv.offerta.viaggio,"viaggio",.35)');
    expect(crime).toContain("<strong>Tenore di vita</strong>");
    expect(crime).toContain("€/sett. giustificabili");
    expect(crime).not.toContain("dichiarazione dei redditi");
  });
});
