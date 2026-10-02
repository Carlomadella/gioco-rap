/* Stress test rapido della Fabbrica.
   Fa parte del sistema strumenti/bilanciamento: usa le stesse funzioni del gioco
   lette da actions.js, ma senza avviare Chromium. Serve per regressioni veloci su
   fatica, carriera e paga; il simulatore lungo resta simulatore-bilanciamento.js. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const ACTIONS = path.join(ROOT, "js/game/actions.js");

function helperLavoro(){
  const source = fs.readFileSync(ACTIONS, "utf8");
  const start = source.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end = source.indexOf("/* Cosa determina davvero la qualità", start);
  if(start < 0 || end < 0) throw new Error("helper lavoro per luogo non trovato");
  return source.slice(start, end);
}

function runtime(G){
  const ctx = {
    G,
    Number, Math, Array, Object, Set,
    clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
  };
  ctx.totalWeeks = () => ((ctx.G.year||1)-1)*52 + (ctx.G.week||1);
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(), ctx);
  return {
    ctx,
    fatica:() => Number(G.workFatigue||0),
    aggiornaFatica:n => vm.runInContext("lavoroAggiornaFaticaSettimanale("+Number(n)+")",ctx),
    qualita:(n,f) => vm.runInContext("lavoroQualitaFattore("+Number(n)+","+Number(f)+")",ctx),
    lifestyle:(n,f) => vm.runInContext("lavoroLifestyleFattore("+Number(n)+","+Number(f)+")",ctx),
    valutaCiclo:(c,turni) => {
      ctx.__turni = turni;
      return vm.runInContext("lavoroValutaCiclo('fabbrica',"+Number(c)+",__turni)",ctx);
    },
    aumento:() => vm.runInContext("lavoroApplicaAumento('fabbrica',{percentuale:8,motivo:'stress-test'})",ctx),
    promozione:() => vm.runInContext(
      "lavoroPromuoviRuolo('fabbrica',{nuovaPaga:Math.max(Number(G.job.pay)+1,Math.round(Number(G.job.pay)*1.15)),motivo:'stress-test'})",
      ctx
    ),
    aumentoPronto:() => vm.runInContext("lavoroAumentoDisponibile('fabbrica')",ctx),
    promozionePronta:() => vm.runInContext("lavoroPromozioneDisponibile('fabbrica')",ctx),
    carriera:() => vm.runInContext("lavoroCarriera('fabbrica')",ctx)
  };
}

function simulaFatica(nome, pattern, settimane=52){
  const G={year:1,week:1,day:1,workFatigue:0,workplaces:{},strada:{}};
  const r=runtime(G);
  const righe=[];
  for(let w=1;w<=settimane;w++){
    G.year=1+Math.floor((w-1)/52);
    G.week=((w-1)%52)+1;
    const turni=Number(pattern(w));
    const out=r.aggiornaFatica(turni);
    righe.push({
      settimana:w,
      turni,
      fatica:out.dopo,
      qualita:r.qualita(turni,out.dopo),
      lifestyle:r.lifestyle(turni,out.dopo)
    });
  }
  const media=k=>righe.reduce((a,x)=>a+Number(x[k]||0),0)/righe.length;
  return {
    nome,
    finale:righe[righe.length-1],
    massima:Math.max(...righe.map(x=>x.fatica)),
    mediaQualita:Number(media("qualita").toFixed(3)),
    mediaLifestyle:Number(media("lifestyle").toFixed(3)),
    righe
  };
}

function statoCarriera(){
  return {
    year:1,week:1,day:1,money:0,shifts:0,workFatigue:0,strada:{},
    job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40,d:""},
    workplaces:{fabbrica:{
      contract:{signed:true,signedAbsoluteDay:1},
      attendance:{ciclo:0,turni:[]},
      career:{
        reliability:50,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
        cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
        raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
        weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,
        lastEvaluatedCycle:null,lastEvaluation:null,evaluations:[]
      }
    }}
  };
}

function turniPerfetti(){
  const out=[];
  for(let w=0;w<4;w++) for(const d of [0,1,2,3,4]) out.push(w*7+d);
  return out;
}

function simulaCarrieraPerfetta(cicli=13){
  const G=statoCarriera(), r=runtime(G), storia=[];
  let pagaAnnua=0;
  for(let ciclo=0;ciclo<cicli;ciclo++){
    G.year=1+Math.floor((ciclo*4)/52);
    G.week=((ciclo*4)%52)+1;
    r.valutaCiclo(ciclo,turniPerfetti());
    pagaAnnua += 20*Number(G.job.pay||0);

    let evento=null;
    if(r.promozionePronta()){
      const da={ruolo:G.job.id,paga:G.job.pay};
      r.promozione();
      evento={tipo:"promozione",da,a:{ruolo:G.job.id,paga:G.job.pay}};
    }else if(r.aumentoPronto()){
      const da={ruolo:G.job.id,paga:G.job.pay};
      r.aumento();
      evento={tipo:"aumento",da,a:{ruolo:G.job.id,paga:G.job.pay}};
    }

    const c=r.carriera();
    storia.push({
      ciclo:ciclo+1,settimana:(ciclo+1)*4,
      ruolo:G.job.id,paga:G.job.pay,affidabilita:c.reliability,
      cicliNelRuolo:c.cyclesInRole,perfettiNelRuolo:c.perfectCyclesInRole,
      evento
    });
  }
  return {pagaAnnua,finale:storia[storia.length-1],storia,G,r};
}

function esegui(){
  const cinque=simulaFatica("5 turni ogni settimana",()=>5);
  const sei=simulaFatica("6 turni ogni settimana",()=>6);
  const sette=simulaFatica("7 turni ogni settimana",()=>7);
  const recupero=simulaFatica("12 settimane da 6, poi 5",w=>w<=12?6:5);
  const carriera=simulaCarrieraPerfetta(13);

  const controlli=[
    {nome:"5/5 non crea malus globale permanente",
      ok:cinque.finale.fatica<=15 && cinque.finale.qualita===1 && cinque.finale.lifestyle===1},
    {nome:"6/7 resta sovraccarico reale",
      ok:sei.finale.fatica>=40 && sei.finale.qualita<.9 && sei.finale.lifestyle<.8},
    {nome:"7/7 resta nettamente peggiore del 6/7",
      ok:sette.finale.fatica>sei.finale.fatica && sette.finale.qualita<=sei.finale.qualita},
    {nome:"tornare a 5/5 recupera il sovraccarico",
      ok:recupero.finale.fatica<sei.finale.fatica},
    {nome:"carriera perfetta arriva al grado massimo senza crescita infinita",
      ok:carriera.finale.ruolo==="capoturno" && carriera.finale.paga===456 && carriera.pagaAnnua===88520}
  ];

  return {
    ok:controlli.every(x=>x.ok),
    controlli,
    fatica:{
      cinque:{finale:cinque.finale,massima:cinque.massima,mediaQualita:cinque.mediaQualita,mediaLifestyle:cinque.mediaLifestyle},
      sei:{finale:sei.finale,massima:sei.massima,mediaQualita:sei.mediaQualita,mediaLifestyle:sei.mediaLifestyle},
      sette:{finale:sette.finale,massima:sette.massima,mediaQualita:sette.mediaQualita,mediaLifestyle:sette.mediaLifestyle},
      recupero:{finale:recupero.finale,massima:recupero.massima}
    },
    carriera:{
      pagaAnnua:carriera.pagaAnnua,
      finale:carriera.finale,
      tappe:carriera.storia.filter(x=>x.evento)
    }
  };
}

function stampa(out){
  console.log("Stress test Fabbrica — 52 settimane");
  for(const c of out.controlli) console.log((c.ok?"PASS":"FAIL")+"  "+c.nome);
  console.log("");
  console.log("Fatica finale: 5/5="+out.fatica.cinque.finale.fatica+
    " · 6/7="+out.fatica.sei.finale.fatica+
    " · 7/7="+out.fatica.sette.finale.fatica);
  console.log("Fattore qualità: 5/5="+out.fatica.cinque.finale.qualita.toFixed(3)+
    " · 6/7="+out.fatica.sei.finale.qualita.toFixed(3)+
    " · 7/7="+out.fatica.sette.finale.qualita.toFixed(3));
  console.log("Carriera perfetta: "+out.carriera.finale.ruolo+
    " · "+out.carriera.finale.paga+" €/turno · "+out.carriera.pagaAnnua+" € in 52 settimane");
}

if(require.main===module){
  const out=esegui();
  stampa(out);
  if(!out.ok) process.exitCode=1;
}

module.exports={simulaFatica,simulaCarrieraPerfetta,esegui,stampa};
