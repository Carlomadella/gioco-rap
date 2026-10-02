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
const LIFESTYLE = path.join(ROOT, "js/game/lifestyle.js");
const WORK_EVENTS = path.join(ROOT, "js/game/lavoro-eventi.js");

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
    effetti:job => {
      ctx.__job=job;
      return vm.runInContext("lavoroEffettiTurno('fabbrica',__job)",ctx);
    },
    disciplina:(absoluteWeek,cycle,weekInCycle,turni) => {
      ctx.__turni=turni;
      return vm.runInContext(
        "lavoroValutaDisciplinaSettimana('fabbrica',"+Number(absoluteWeek)+","+
        Number(cycle)+","+Number(weekInCycle)+",__turni,{silent:true})",ctx
      );
    },
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
    wellbeing:70,lucidita:70,skills:{rete:0},gente:[],
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

function runtimeEventi(G, opts){
  opts=opts||{};
  const base=runtime(G), ctx=base.ctx;
  const shown=[], notifications=[], started=[], missed=[];
  const agenda=[];
  const clock={
    now:Number(opts.now==null?8*60:opts.now),
    duration:Number(opts.duration==null?480:opts.duration)
  };
  const math=Object.create(Math);
  math.random=()=>Number(opts.random==null?0:opts.random);

  Object.assign(ctx,{
    console,
    Math:math,
    String,Boolean,Date,
    setTimeout:fn=>{ fn(); return 1; },
    clearTimeout:()=>{},
    save:()=>{},
    showEvent:e=>shown.push(e),
    avviaAzioneDiretta:id=>started.push(id),
    gain:(skill,v)=>{
      G.skills=G.skills||{};
      G.skills[skill]=Number(G.skills[skill]||0)+Number(v||0);
    },
    addLuc:v=>{
      G.lucidita=Math.max(0,Math.min(100,Number(G.lucidita||0)+Number(v||0)));
    },
    chatAvvicina:(p,v)=>{
      if(p) p.pt=Math.max(0,Number(p.pt||0)+Number(v||0));
    },
    AGENDA:{
      conflittiTra:()=>agenda.slice(),
      mancaVoce:v=>{ missed.push(v); return v; },
      pesoDiOggi:()=>1
    },
    GAME_TIME:{
      now:()=>clock.now,
      durationFor:()=>clock.duration,
      format:m=>{
        const n=((Math.round(Number(m)||0)%1440)+1440)%1440;
        return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
      }
    },
    ADF_EVENTI:{
      claimAutoEvent:()=>true,
      addNotification:n=>{ notifications.push(n); return n; }
    }
  });
  ctx.window=ctx;
  vm.runInContext(fs.readFileSync(WORK_EVENTS,"utf8"),ctx);

  return Object.assign(base,{
    shown,notifications,started,missed,
    setAgenda:voci=>{ agenda.splice(0,agenda.length,...(voci||[])); },
    setClock:(now,duration)=>{
      if(now!=null) clock.now=Number(now);
      if(duration!=null) clock.duration=Number(duration);
    },
    afterShift:(payload,rolls)=>{
      ctx.__payload=payload||{};
      ctx.__rolls=rolls||{};
      return vm.runInContext("ADF_WORK_EVENTS.afterShift(__payload,__rolls)",ctx);
    },
    guardTurno:()=>vm.runInContext("ADF_WORK_EVENTS.guardAction('turno')",ctx)
  });
}

function simulaProfiliRuolo(turniSettimana=5){
  const G=statoCarriera(), r=runtime(G);
  const ruoli=vm.runInContext(
    "lavoroCarrieraDef('fabbrica').ruoli.map(x=>({id:x.id,n:x.n,energia:x.energia,"+
    "benessereTurno:x.benessereTurno,luciditaTurno:x.luciditaTurno,fisico:x.fisico,stress:x.stress}))",
    r.ctx
  );
  const out={};
  for(const ruolo of ruoli){
    G.job={id:ruolo.id,place:"fabbrica",n:ruolo.n,pay:220,e:ruolo.energia,d:""};
    const fx=r.effetti(G.job);
    out[ruolo.id]={
      ruolo:ruolo.n,
      energiaTurno:Number(fx.energia),
      benessereTurno:Number(fx.benessere),
      luciditaTurno:Number(fx.lucidita),
      fisico:fx.fisico,
      stress:fx.stress,
      settimana:{
        turni:turniSettimana,
        energia:Number(fx.energia)*turniSettimana,
        benessere:Number(fx.benessere)*turniSettimana,
        lucidita:Number(fx.lucidita)*turniSettimana
      }
    };
  }
  return out;
}

function simulaDisciplina(){
  const scenario=turni=>{
    const G=statoCarriera(), r=runtime(G);
    const risultato=r.disciplina(1,0,0,turni);
    return {risultato,carriera:r.carriera()};
  };
  const normale=scenario([0,1,2,3,4]);
  const lieve=scenario([0,1,2,3]);

  const G=statoCarriera(), r=runtime(G), gravi=[];
  const settimane=[
    {week:1,weekInCycle:0,turni:[0,1]},
    {week:2,weekInCycle:1,turni:[7,8]},
    {week:3,weekInCycle:2,turni:[14,15]}
  ];
  for(const x of settimane){
    G.week=x.week;
    const risultato=r.disciplina(x.week,0,x.weekInCycle,x.turni);
    gravi.push(risultato);
    if(risultato&&risultato.dismissed) break;
  }
  const blocco=vm.runInContext("lavoroBloccoRiassunzione('fabbrica')",r.ctx);
  return {normale:normale.risultato,lieve:lieve.risultato,gravi,blocco};
}

function simulaEventiRuolo(){
  const profili=simulaProfiliRuolo();
  const out={};
  for(const [id,p] of Object.entries(profili)){
    const G=statoCarriera();
    G.job={id,place:"fabbrica",n:p.ruolo,pay:300,e:p.energiaTurno,d:""};
    G.workplaces.fabbrica.career.roleId=id;
    G.workplaces.fabbrica.career.roleLevel=["operaio","operaio_esperto","capolinea","capoturno"].indexOf(id);
    G.workplaces.fabbrica.career.reliability=70;
    G.wellbeing=70;
    G.lucidita=70;
    const rt=runtimeEventi(G,{random:0});
    const prima={wellbeing:G.wellbeing,lucidita:G.lucidita,rete:G.skills.rete,reliability:70};
    const ids=[];

    for(let settimana=1;settimana<=5;settimana++){
      G.week=settimana;
      G.day=3;
      const mostrato=rt.afterShift({},{
        music:1,role:0,factory:1,crime:1,colleague:1,physical:1
      });
      if(!mostrato || !rt.shown.length) continue;
      const scena=rt.shown[rt.shown.length-1];
      if(scena.opts&&scena.opts[0]&&typeof scena.opts[0].run==="function") scena.opts[0].run();
      const row=(G.workplaces.fabbrica.workEvents.history||[]).find(x=>
        x.family==="role" && x.status==="resolved" && x.roleId===id &&
        Number(x.absoluteDay)===((settimana-1)*7+3)
      );
      if(row) ids.push(row.eventId);
    }

    const c=G.workplaces.fabbrica.career;
    out[id]={
      mostrati:ids.length,
      unici:new Set(ids).size,
      eventi:ids,
      delta:{
        wellbeing:G.wellbeing-prima.wellbeing,
        lucidita:G.lucidita-prima.lucidita,
        rete:Number(G.skills.rete||0)-prima.rete,
        reliability:Number(c.reliability||0)-prima.reliability
      }
    };
  }
  return out;
}

function voceMusica(){
  return {
    k:"settimana:live",id:"live",tipo:"settimana",n:"Serata live",
    ora:"18:00",minuti:18*60,anno:1,settimana:2,giorno:3
  };
}

function scenarioConflitto(day,turni,scelta){
  const G=statoCarriera();
  G.week=2;
  G.day=day;
  G.workplaces.fabbrica.attendance={ciclo:0,turni:turni.slice()};
  const rt=runtimeEventi(G,{random:0,now:12*60,duration:480});
  const voce=voceMusica();
  voce.giorno=day;
  rt.setAgenda([voce]);

  const gate=rt.guardTurno();
  const scena=rt.shown[rt.shown.length-1];
  if(!gate || gate.ok || !scena) return {gate,errore:"conflitto non mostrato"};
  const indice=scelta==="work"?0:1;
  scena.opts[indice].run();

  if(scelta==="work"){
    rt.afterShift({started_at:12*60,ended_at:20*60,job_id:"operaio"},{
      music:1,role:1,factory:1,crime:1,colleague:1,physical:1
    });
  }
  const rows=(G.workplaces.fabbrica.workEvents.history||[]).filter(x=>x.family==="conflict");
  return {
    gate,
    scelta,
    started:rt.started.slice(),
    missed:rt.missed.length,
    row:rows[0]||null
  };
}

function simulaConflittiMusica(){
  return {
    musicaRecuperabile:scenarioConflitto(3,[7,8],"music"),
    musicaCritica:scenarioConflitto(5,[7,8,9],"music"),
    scegliLavoro:scenarioConflitto(3,[7,8],"work")
  };
}

function simulaOperativo(){
  return {
    profili:simulaProfiliRuolo(),
    disciplina:simulaDisciplina(),
    eventi:simulaEventiRuolo(),
    conflitti:simulaConflittiMusica()
  };
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

function costoLifestyleMassimo(){
  const source=fs.readFileSync(LIFESTYLE,"utf8");
  const start=source.indexOf("const LIFE =");
  const end=source.indexOf("/* punto 63:",start);
  if(start<0 || end<0) throw new Error("catalogo lifestyle non trovato");
  const ctx={
    G:{life:{casa:4,auto:4,look:3,uscite:3,crew:3}},
    Number,Math,Array,Object,Set
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(start,end),ctx);
  return Number(vm.runInContext("lifeCost()",ctx));
}

function esegui(){
  const cinque=simulaFatica("5 turni ogni settimana",()=>5);
  const sei=simulaFatica("6 turni ogni settimana",()=>6);
  const sette=simulaFatica("7 turni ogni settimana",()=>7);
  const recupero=simulaFatica("12 settimane da 6, poi 5",w=>w<=12?6:5);
  const carriera=simulaCarrieraPerfetta(13);
  const operativo=simulaOperativo();
  const lifestyleMax=costoLifestyleMassimo();
  const pagaTop=Number(carriera.finale.paga||0);
  const economia={
    lifestyleMassimoSettimanale:lifestyleMax,
    costoMinimoSettimanaleMassimo:lifestyleMax+25,
    pagaIngressoSettimana:220*5,
    pagaTopSettimana:pagaTop*5,
    pagaTopSestoGiorno:pagaTop*5+Math.round(pagaTop*1.30),
    pagaTopSetteGiorniAutorizzati:pagaTop*5+Math.round(pagaTop*1.30)+Math.round(pagaTop*1.75)
  };

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
      ok:carriera.finale.ruolo==="capoturno" && carriera.finale.paga===456 && carriera.pagaAnnua===88520},
    {nome:"il 5/5 al grado massimo non finanzia da solo il lifestyle massimo",
      ok:economia.pagaTopSettimana<economia.costoMinimoSettimanaleMassimo},
    {nome:"il 6° giorno può colmare il gap ma passa dal sovraccarico",
      ok:economia.pagaTopSestoGiorno>=economia.costoMinimoSettimanaleMassimo && sei.finale.fatica>=40},
    {nome:"i ruoli spostano davvero il carico da fisico a mentale",
      ok:operativo.profili.operaio.energiaTurno>operativo.profili.operaio_esperto.energiaTurno &&
        operativo.profili.operaio_esperto.energiaTurno>operativo.profili.capolinea.energiaTurno &&
        operativo.profili.capolinea.energiaTurno>operativo.profili.capoturno.energiaTurno &&
        Math.abs(operativo.profili.capoturno.luciditaTurno)>Math.abs(operativo.profili.operaio.luciditaTurno)},
    {nome:"la disciplina distingue settimana piena, assenza lieve e assenze gravi",
      ok:operativo.disciplina.normale.absences===0 &&
        operativo.disciplina.normale.reliabilityDelta===0 &&
        operativo.disciplina.lieve.absences===1 &&
        operativo.disciplina.lieve.reliabilityDelta===-5 &&
        operativo.disciplina.gravi.length===3 &&
        operativo.disciplina.gravi[0].warningAdded===1 &&
        operativo.disciplina.gravi[1].warningAdded===1 &&
        operativo.disciplina.gravi[2].dismissed===true &&
        operativo.disciplina.blocco.active===true},
    {nome:"ogni ruolo attraversa l'intero pool di 5 eventi senza ripetersi",
      ok:Object.values(operativo.eventi).every(x=>x.mostrati===5 && x.unici===5)},
    {nome:"il conflitto musica/lavoro registra costo opportunità e rischio presenza",
      ok:operativo.conflitti.musicaRecuperabile.row &&
        operativo.conflitti.musicaRecuperabile.row.choice==="music" &&
        operativo.conflitti.musicaRecuperabile.row.forgonePay===220 &&
        operativo.conflitti.musicaRecuperabile.row.attendance.assenzeCreateDalConflitto===0 &&
        operativo.conflitti.musicaCritica.row &&
        operativo.conflitti.musicaCritica.row.attendance.assenzeCreateDalConflitto===1 &&
        operativo.conflitti.scegliLavoro.row &&
        operativo.conflitti.scegliLavoro.row.choice==="work" &&
        operativo.conflitti.scegliLavoro.missed===1}
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
    },
    economia,
    operativo
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
  console.log("Economia settimanale: 5/5 top "+out.economia.pagaTopSettimana+
    " € · 6/7 top "+out.economia.pagaTopSestoGiorno+
    " € · lifestyle massimo minimo "+out.economia.costoMinimoSettimanaleMassimo+" €");
  console.log("Ruoli (energia/turno): operaio "+out.operativo.profili.operaio.energiaTurno+
    " · esperto "+out.operativo.profili.operaio_esperto.energiaTurno+
    " · capolinea "+out.operativo.profili.capolinea.energiaTurno+
    " · capoturno "+out.operativo.profili.capoturno.energiaTurno);
  console.log("Disciplina grave: "+out.operativo.disciplina.gravi.length+
    " settimane critiche · licenziamento="+
    !!out.operativo.disciplina.gravi[out.operativo.disciplina.gravi.length-1].dismissed);
  console.log("Eventi ruolo unici in 5 settimane: "+
    Object.entries(out.operativo.eventi).map(([k,v])=>k+"="+v.unici).join(" · "));
}

if(require.main===module){
  const out=esegui();
  stampa(out);
  if(!out.ok) process.exitCode=1;
}

module.exports={
  simulaFatica,simulaCarrieraPerfetta,simulaProfiliRuolo,simulaDisciplina,
  simulaEventiRuolo,simulaConflittiMusica,simulaOperativo,
  costoLifestyleMassimo,esegui,stampa
};
