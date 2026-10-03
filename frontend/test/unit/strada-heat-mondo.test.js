import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const state=fs.readFileSync(path.join(ROOT,"js/game/state.js"),"utf8");

const heatSlice=crime.slice(
  crime.indexOf("const STRADA_HEAT_FASCE"),
  crime.indexOf("function stradaRelazioneForte")
);

function persona(id,fiducia){
  return {
    id,n:"P"+id,via:false,
    strada:{
      known:true,key:"p"+id,firstLinkedAbsoluteDay:1,sources:[],opportunityIds:[],
      introducedByPersonId:null,fiducia,fiduciaEventi:[],favori:0,favoriEventi:[],
      colpiInsieme:0,streetStatus:"active",lastPlayerStreetInteractionAbsoluteDay:90,
      lastStreetContactAttemptAbsoluteDay:null,ignoredStreetOffers:0,
      inactiveSinceAbsoluteDay:null,unreachableSinceAbsoluteDay:null,returnAfterAbsoluteDay:null,
      streetStatusReason:null,streetStatusHistory:[],debitiGiocatore:0,tensione:0,rivalita:false,
      lastReferralAbsoluteDay:null,conseguenzeEventi:[],heatCaution:false,
      heatCautionBand:null,heatCautionSinceAbsoluteDay:null
    }
  };
}

function contesto(heat=0, persone=[]){
  const G={
    year:1,week:1,day:1,
    gente:persone,
    strada:{heat,precedenti:0,prot:0,ferro:false,heatMondo:{lastStopRequestAbsoluteDay:null,history:[]}}
  };
  const ctx={
    G,Math,Number,Object,Array,String,Set,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    stradaAbsDay:()=>100,
    stradaFiduciaValore:p=>Number(p?.strada?.fiducia||0),
    stradaRelazioneDisponibile:p=>!!(p&&p.strada&&p.strada.known&&!p.via),
    stradaRivalitaAttiva:p=>!!p?.strada?.rivalita
  };
  vm.createContext(ctx);
  vm.runInContext(heatSlice,ctx);
  return ctx;
}

describe("Strada · punto 19 heat cambia il mondo",()=>{
  it("ha quattro fasce con soglie 0/25/50/75",()=>{
    const ctx=contesto();
    const casi=[[0,"basso"],[24,"basso"],[25,"medio"],[49,"medio"],[50,"alto"],[74,"alto"],[75,"critico"],[100,"critico"]];
    for(const [heat,id] of casi){
      ctx.G.strada.heat=heat;
      expect(vm.runInContext("stradaHeatProfilo().id",ctx)).toBe(id);
    }
  });

  it("a heat basso nessun contatto si tira indietro",()=>{
    const ps=[persona("a",10),persona("b",20),persona("c",80),persona("d",90)];
    const ctx=contesto(10,ps);
    const n=vm.runInContext("stradaHeatSincronizzaPersone().length",ctx);
    expect(n).toBe(0);
    expect(ps.every(p=>!p.strada.heatCaution)).toBe(true);
  });

  it("a heat alto si tirano indietro prima i legami più deboli",()=>{
    const ps=[persona("a",10),persona("b",20),persona("c",80),persona("d",90)];
    const ctx=contesto(60,ps);
    const ids=vm.runInContext("stradaHeatSincronizzaPersone().map(p=>p.id)",ctx);
    expect(Array.from(ids)).toEqual(["a","b"]);
    expect(ps[0].strada.heatCaution).toBe(true);
    expect(ps[1].strada.heatCaution).toBe(true);
    expect(ps[2].strada.heatCaution).toBe(false);
    expect(ps[3].strada.heatCaution).toBe(false);
  });

  it("abbassare l'heat rimette in circolo i contatti prudenti",()=>{
    const ps=[persona("a",10),persona("b",20),persona("c",80)];
    const ctx=contesto(80,ps);
    vm.runInContext("stradaHeatSincronizzaPersone()",ctx);
    expect(ps.some(p=>p.strada.heatCaution)).toBe(true);
    ctx.G.strada.heat=5;
    vm.runInContext("stradaHeatSincronizzaPersone()",ctx);
    expect(ps.every(p=>!p.strada.heatCaution)).toBe(true);
  });

  it("il rischio di controllo cresce con l'heat anche senza ferro",()=>{
    const ctx=contesto(10);
    const valori=[];
    for(const h of [10,30,60,85]){
      ctx.G.strada.heat=h;
      valori.push(vm.runInContext("stradaHeatRischioControllo()",ctx));
    }
    expect(valori[0]).toBe(0);
    expect(valori[1]).toBeGreaterThan(valori[0]);
    expect(valori[2]).toBeGreaterThan(valori[1]);
    expect(valori[3]).toBeGreaterThan(valori[2]);
  });

  it("a heat molto alto un errore costa di più e la sola denuncia diventa meno probabile",()=>{
    const ctx=contesto(10);
    const baseCosto=vm.runInContext("stradaHeatCostoErrore()",ctx);
    const baseDenuncia=vm.runInContext("stradaHeatChanceSoloDenuncia(.6)",ctx);
    ctx.G.strada.heat=85;
    const hotCosto=vm.runInContext("stradaHeatCostoErrore()",ctx);
    const hotDenuncia=vm.runInContext("stradaHeatChanceSoloDenuncia(.6)",ctx);
    expect(hotCosto).toBeGreaterThan(baseCosto);
    expect(hotDenuncia).toBeLessThan(baseDenuncia);
    expect(vm.runInContext("stradaHeatPenaMoltiplicatore()",ctx)).toBeGreaterThan(1);
  });

  it("le opportunità nuove rallentano e quelle aperte possono bruciarsi per heat",()=>{
    expect(crime).toContain("chance*=Number(heat.opportunita||1)");
    expect(crime).toContain('if(heat.id==="alto") cooldown+=2');
    expect(crime).toContain('else if(heat.id==="critico") cooldown+=4');
    expect(crime).toContain("function stradaHeatBruciaOpportunita(roll,silent)");
    expect(crime).toContain('type:"burned-by-heat"');
    expect(crime).toContain("st.active=null");
    expect(crime).toContain("st.pending=null");
    expect(crime).toContain("st.pendingChoices=[]");
  });

  it("heat alto può produrre una richiesta reale di abbassare il profilo",()=>{
    expect(crime).toContain("function stradaHeatRichiestaFermati(silent)");
    expect(crime).toContain('type:"stop-request"');
    expect(crime).toContain("ti ha chiesto di abbassare il profilo");
    expect(state).toContain("heatMondo:{lastStopRequestAbsoluteDay:null,history:[]}");
  });

  it("contatti prudenti non partecipano a squadra, incontri o ponti",()=>{
    expect(crime).toContain("stradaRelazioneOperativa(p)");
    expect(crime).toContain("stradaContattiAttivi().filter(p=>!stradaHeatPersonaCauta(p))");
    expect(crime).toContain("!stradaHeatPersonaCauta(p)");
    expect(crime).toContain("non vuole farsi vedere adesso");
  });

  it("il fallimento scala multa, heat e pena con la pressione già accumulata",()=>{
    expect(crime).toContain("(rumore + rumoreLead) * costoErrore");
    expect(crime).toContain("colpo.min * .45 * costoErrore");
    expect(crime).toContain("colpo.min * .8 * costoErrore");
    expect(crime).toContain("stradaHeatPenaMoltiplicatore()");
    expect(crime).toContain("stradaHeatChanceSoloDenuncia(.6)");
  });

  it("la UI usa la stessa fascia del gameplay",()=>{
    expect(crime).toContain("return stradaHeatProfilo().occhi");
    expect(crime).toContain("<strong>Pressione sul giro</strong>");
    expect(crime).toContain("heatMondo.mondo");
    expect(crime).toContain("si tiene basso");
  });
});
