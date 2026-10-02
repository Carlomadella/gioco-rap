/* Stress test rapido della Pizzeria.
   Usa le funzioni reali del lavoro da actions.js e le durate/orari del gioco.
   Obiettivo: verificare il trade-off deciso per la Pizzeria:
   meno soldi e carriera lavorativa, meno peso sulla vita, più esposizione sociale. */
"use strict";

const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const ACTIONS=path.join(ROOT,"js/game/actions.js");
const TEMPO=path.join(ROOT,"js/game/tempo.js");
const ORARI=path.join(ROOT,"js/game/orari.js");
const WORK_EVENTS=path.join(ROOT,"js/game/lavoro-eventi.js");

function helperLavoro(){
  const source=fs.readFileSync(ACTIONS,"utf8");
  const start=source.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end=source.indexOf("/* Cosa determina davvero la qualità",start);
  if(start<0||end<0) throw new Error("helper lavoro per luogo non trovato");
  return source.slice(start,end);
}

function runtime(G){
  const ctx={
    G,Number,Math,Array,Object,Set,
    clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
  };
  ctx.totalWeeks=()=>((ctx.G.year||1)-1)*52+(ctx.G.week||1);
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(),ctx);
  return {
    ctx,
    fatica:()=>Number(G.workFatigue||0),
    aggiornaFatica:n=>vm.runInContext("lavoroAggiornaFaticaSettimanale("+Number(n)+")",ctx),
    qualita:(n,f)=>vm.runInContext("lavoroQualitaFattore("+Number(n)+","+Number(f)+")",ctx),
    lifestyle:(n,f)=>vm.runInContext("lavoroLifestyleFattore("+Number(n)+","+Number(f)+")",ctx),
    effetti:job=>{
      ctx.__job=job;
      return vm.runInContext("lavoroEffettiTurno('pizzeria',__job)",ctx);
    },
    rete:job=>{
      ctx.__job=job;
      return vm.runInContext("lavoroReteDef(__job)",ctx);
    },
    valutaCiclo:(c,turni)=>{
      ctx.__turni=turni;
      return vm.runInContext("lavoroValutaCiclo('pizzeria',"+Number(c)+",__turni)",ctx);
    },
    aumento:()=>vm.runInContext(
      "lavoroApplicaAumento('pizzeria',{percentuale:8,motivo:'stress-test'})",ctx
    ),
    promozione:()=>vm.runInContext(
      "lavoroPromuoviRuolo('pizzeria',{nuovaPaga:Math.max(Number(G.job.pay)+1,Math.round(Number(G.job.pay)*1.15)),motivo:'stress-test'})",
      ctx
    ),
    aumentoPronto:()=>vm.runInContext("lavoroAumentoDisponibile('pizzeria')",ctx),
    promozionePronta:()=>vm.runInContext("lavoroPromozioneDisponibile('pizzeria')",ctx),
    carriera:()=>vm.runInContext("lavoroCarriera('pizzeria')",ctx)
  };
}

function simulaFatica(nome,pattern,settimane=52){
  const G={year:1,week:1,day:1,workFatigue:0,workplaces:{},strada:{}};
  const r=runtime(G),righe=[];
  for(let w=1;w<=settimane;w++){
    G.year=1+Math.floor((w-1)/52);
    G.week=((w-1)%52)+1;
    const turni=Number(pattern(w));
    const out=r.aggiornaFatica(turni);
    righe.push({
      settimana:w,turni,fatica:out.dopo,
      qualita:r.qualita(turni,out.dopo),
      lifestyle:r.lifestyle(turni,out.dopo)
    });
  }
  const finale=righe[righe.length-1];
  return {
    nome,finale,
    massima:Math.max(...righe.map(x=>x.fatica)),
    righe
  };
}

function statoCarriera(){
  return {
    year:1,week:1,day:2,money:0,shifts:0,workFatigue:0,strada:{},
    wellbeing:70,lucidita:70,skills:{rete:0},gente:[],
    job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18,d:""},
    workplaces:{pizzeria:{
      contract:{signed:true,signedAbsoluteDay:1},
      attendance:{ciclo:0,turni:[]},
      career:{
        reliability:50,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
        cyclesInRole:0,perfectCyclesInRole:0,roleId:"lavapiatti",roleLevel:0,
        raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
        weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,
        lastEvaluatedCycle:null,lastEvaluation:null,evaluations:[]
      }
    }}
  };
}

function turniPerfetti(){
  const out=[];
  for(let w=0;w<4;w++) for(const d of [1,2,3,4]) out.push(w*7+d);
  return out;
}

function simulaCarrieraPerfetta(cicli=13){
  const G=statoCarriera(),r=runtime(G),storia=[];
  let pagaAnnua=0;
  for(let ciclo=0;ciclo<cicli;ciclo++){
    G.year=1+Math.floor((ciclo*4)/52);
    G.week=((ciclo*4)%52)+1;
    r.valutaCiclo(ciclo,turniPerfetti());
    pagaAnnua+=16*Number(G.job.pay||0);

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

function simulaProfiliRuolo(){
  const G=statoCarriera(),r=runtime(G);
  const ids=["lavapiatti","aiuto_cucina","aiuto_pizzaiolo","pizzaiolo"];
  const out={};
  for(const id of ids){
    const ruolo=vm.runInContext(
      "lavoroCarrieraDef('pizzeria').ruoli.find(x=>x.id==='"+id+"')",r.ctx
    );
    G.job={id,place:"pizzeria",n:ruolo.n,pay:100,e:ruolo.energia,d:ruolo.d};
    const fx=r.effetti(G.job);
    const rete=r.rete(G.job);
    out[id]={
      ruolo:ruolo.n,
      energiaTurno:Number(fx.energia),
      benessereTurno:Number(fx.benessere),
      luciditaTurno:Number(fx.lucidita),
      fisico:fx.fisico,
      stress:fx.stress,
      settimana:{
        turni:4,
        energia:Number(fx.energia)*4,
        benessere:Number(fx.benessere)*4,
        lucidita:Number(fx.lucidita)*4
      },
      rete:{
        chance:Number(rete.chanceIncontro),
        cooldown:Number(rete.cooldownGiorni),
        cap:Number(rete.maxContatti),
        bonusNuovo:Number(rete.reteBonusIncontro||0)
      }
    };
  }
  return out;
}

function simulaConfrontoReteFabbrica(){
  const G=statoCarriera(),r=runtime(G);
  const pairs=[
    ["lavapiatti","operaio"],
    ["aiuto_cucina","operaio_esperto"],
    ["aiuto_pizzaiolo","capolinea"],
    ["pizzaiolo","capoturno"]
  ];
  return pairs.map(([pizzeria,fabbrica])=>{
    G.job={id:pizzeria,place:"pizzeria",n:pizzeria,pay:100,e:18};
    const p=r.rete(G.job);
    G.job={id:fabbrica,place:"fabbrica",n:fabbrica,pay:220,e:40};
    const f=vm.runInContext("lavoroReteDef(G.job)",r.ctx);
    return {
      pizzeria,fabbrica,
      pChance:Number(p.chanceIncontro),fChance:Number(f.chanceIncontro),
      pCap:Number(p.maxContatti),fCap:Number(f.maxContatti)
    };
  });
}

function leggiTempo(){
  const source=fs.readFileSync(TEMPO,"utf8");
  const start=source.indexOf("const DURATE = Object.freeze({");
  const end=source.indexOf("let AZIONE_ID_CATTURATA",start);
  if(start<0||end<0) throw new Error("costanti tempo non trovate");
  const ctx={Object};
  vm.createContext(ctx);
  vm.runInContext(source.slice(start,end)+
    "\nthis.__tempo={durate:DURATE,lavoro:DURATE_LUOGO_LAVORO};",ctx);
  return ctx.__tempo;
}

function leggiOrari(){
  const source=fs.readFileSync(ORARI,"utf8");
  const start=source.indexOf("const PLACE_HOURS = Object.freeze({");
  const end=source.indexOf("function parseClock",start);
  if(start<0||end<0) throw new Error("costanti orari non trovate");
  const ctx={Object};
  vm.createContext(ctx);
  vm.runInContext(source.slice(start,end)+
    "\nthis.__orari={place:PLACE_HOURS,actions:ACTION_HOURS};",ctx);
  return ctx.__orari;
}

function minutiOra(v){
  const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||""));
  if(!m) throw new Error("ora non valida: "+v);
  let out=Number(m[1])*60+Number(m[2]);
  if(out<8*60) out+=1440;
  return out;
}

function giornataPizzeria(preWork,eventAt){
  const tempo=leggiTempo(),orari=leggiOrari();
  const apertura=minutiOra(orari.place.pizzeria.open);
  const chiusura=minutiOra(orari.place.pizzeria.close);
  const turno=Number(tempo.lavoro.pizzeria||0);
  const azioni=(preWork||[]).map(id=>({id,minuti:Number(tempo.durate[id]||0)}));
  const musicaPrima=azioni.reduce((n,x)=>n+x.minuti,0);
  const fineMusica=8*60+musicaPrima;
  const inizioTurno=Math.max(apertura,fineMusica);
  const fineTurno=inizioTurno+turno;
  const turnoPossibile=fineTurno<=chiusura;
  const evento=eventAt==null?null:Number(eventAt);
  const conflitto=!!(turnoPossibile&&Number.isFinite(evento)&&evento>=inizioTurno&&evento<fineTurno);
  return {
    azioni,musicaPrima,apertura,chiusura,turno,inizioTurno,fineTurno,
    turnoPossibile,eventAt:evento,conflitto
  };
}

function simulaDoppiaVita(){
  const tempo=leggiTempo();
  return {
    fonti:{
      turnoPizzeria:Number(tempo.lavoro.pizzeria||0),
      turnoFabbrica:Number(tempo.lavoro.fabbrica||0),
      registra:Number(tempo.durate.registra||0),
      scrivi:Number(tempo.durate.scrivi||0),
      beat:Number(tempo.durate.beat||0),
      mixa:Number(tempo.durate.mixa||0),
      promo:Number(tempo.durate.promo||0),
      free:Number(tempo.durate.free||0)
    },
    base:giornataPizzeria([],21*60),
    registrazionePrima:giornataPizzeria(["registra"],21*60),
    giornataMusicalePiena:giornataPizzeria(["scrivi","beat","registra","mixa","promo"],21*60),
    giornataMoltoPiena:giornataPizzeria(["scrivi","beat","registra","mixa","promo","free"],21*60)
  };
}

function pacingSocialeMensile(){
  const source=fs.readFileSync(WORK_EVENTS,"utf8");
  const m=/incidentalGapDays\s*:\s*(\d+)/.exec(source);
  const gap=m?Number(m[1]):3;
  const turni=[];
  for(let w=0;w<4;w++) for(const d of [2,3,4,5]) turni.push(w*7+d);
  let last=null,count=0;
  for(const day of turni){
    if(last==null||day-last>=gap){ count++; last=day; }
  }
  return {gapDays:gap,turni:turni.length,maxIncidentali:count};
}

function esegui(){
  const quattro=simulaFatica("4/4",()=>4);
  const cinque=simulaFatica("5 servizi",()=>5);
  const sei=simulaFatica("6 servizi",()=>6);
  const carriera=simulaCarrieraPerfetta(13);
  const profili=simulaProfiliRuolo();
  const rete=simulaConfrontoReteFabbrica();
  const doppiaVita=simulaDoppiaVita();
  const pacing=pacingSocialeMensile();

  const economia={
    orePizzeriaSettimana:doppiaVita.fonti.turnoPizzeria*4/60,
    oreFabbricaSettimana:doppiaVita.fonti.turnoFabbrica*5/60,
    pagaIngressoPizzeria:100*4,
    pagaIngressoFabbrica:220*5,
    pagaTopPizzeria:Number(carriera.finale.paga||0)*4,
    pagaAnnuaPizzeria:carriera.pagaAnnua
  };

  const controlli=[
    {nome:"4/4 part-time non accumula fatica globale",
      ok:quattro.finale.fatica===0&&quattro.finale.qualita===1&&quattro.finale.lifestyle===1},
    {nome:"il quinto servizio pesa più del contratto normale senza essere sovraccarico cronico",
      ok:cinque.finale.fatica>quattro.finale.fatica&&cinque.finale.fatica<=15&&cinque.finale.qualita===1},
    {nome:"sei servizi continuativi diventano sovraccarico vero",
      ok:sei.finale.fatica>=40&&sei.finale.qualita<.9&&sei.finale.lifestyle<.8},
    {nome:"i quattro ruoli restano leggeri e spostano gradualmente il carico",
      ok:profili.lavapiatti.energiaTurno===18&&profili.pizzaiolo.energiaTurno===15&&
        Math.abs(profili.lavapiatti.benessereTurno)<=1&&
        Math.abs(profili.pizzaiolo.luciditaTurno)<=1},
    {nome:"la carriera arriva a Pizzaiolo ma resta economicamente secondaria",
      ok:carriera.finale.ruolo==="pizzaiolo"&&
        carriera.storia.filter(x=>x.evento&&x.evento.tipo==="promozione").length===3&&
        economia.pagaTopPizzeria<economia.pagaIngressoFabbrica},
    {nome:"la Pizzeria usa metà delle ore settimanali della Fabbrica",
      ok:economia.orePizzeriaSettimana===20&&economia.oreFabbricaSettimana===40},
    {nome:"la Pizzeria paga molto meno della Fabbrica già all'ingresso",
      ok:economia.pagaIngressoPizzeria===400&&economia.pagaIngressoFabbrica===1100},
    {nome:"ogni gradino Pizzeria espone più della Fabbrica equivalente",
      ok:rete.every(x=>x.pChance>x.fChance&&x.pCap>x.fCap)},
    {nome:"molta musica diurna entra prima del turno serale",
      ok:doppiaVita.giornataMusicalePiena.turnoPossibile===true&&
        doppiaVita.giornataMusicalePiena.musicaPrima===585},
    {nome:"il turno serale crea un conflitto naturale con un live delle 21",
      ok:doppiaVita.base.inizioTurno===17*60&&doppiaVita.base.fineTurno===22*60&&
        doppiaVita.base.conflitto===true},
    {nome:"il social resta dentro il pacing globale e non aggiunge popup liberi",
      ok:pacing.gapDays===3&&pacing.maxIncidentali<=8}
  ];

  return {
    ok:controlli.every(x=>x.ok),
    controlli,fatica:{quattro,cinque,sei},carriera:{pagaAnnua:carriera.pagaAnnua,finale:carriera.finale,tappe:carriera.storia.filter(x=>x.evento)},
    profili,rete,doppiaVita,pacing,economia
  };
}

function stampa(out){
  console.log("Stress test Pizzeria — 52 settimane");
  for(const c of out.controlli) console.log((c.ok?"PASS":"FAIL")+"  "+c.nome);
  console.log("");
  console.log("Fatica finale: 4/4="+out.fatica.quattro.finale.fatica+
    " · 5 servizi="+out.fatica.cinque.finale.fatica+
    " · 6 servizi="+out.fatica.sei.finale.fatica);
  console.log("Economia ingresso: Pizzeria "+out.economia.pagaIngressoPizzeria+
    " €/settimana · Fabbrica "+out.economia.pagaIngressoFabbrica+" €/settimana");
  console.log("Tempo lavoro: Pizzeria "+out.economia.orePizzeriaSettimana+
    "h/settimana · Fabbrica "+out.economia.oreFabbricaSettimana+"h/settimana");
  console.log("Carriera perfetta: "+out.carriera.finale.ruolo+
    " · "+out.carriera.finale.paga+" €/turno · "+out.carriera.pagaAnnua+" €/anno");
  console.log("Social: massimo "+out.pacing.maxIncidentali+
    " eventi incidentali in 4 settimane sul calendario 4/4; il social è solo una delle famiglie.");
  console.log("Doppia vita: "+out.doppiaVita.giornataMusicalePiena.musicaPrima+
    " minuti di musica diurna possono precedere un turno ancora completabile.");
}

if(require.main===module){
  const out=esegui();
  stampa(out);
  if(!out.ok) process.exitCode=1;
}

module.exports={
  runtime,simulaFatica,simulaCarrieraPerfetta,simulaProfiliRuolo,
  simulaConfrontoReteFabbrica,simulaDoppiaVita,pacingSocialeMensile,
  giornataPizzeria,esegui,stampa
};
