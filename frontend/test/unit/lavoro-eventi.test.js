import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function ambiente(overrides = {}){
  const G = overrides.G || {
    year:1, week:1, day:1,
    job:{id:"barista",n:"Barista",pay:130,e:18},
    workplaces:{},
    gente:[],
    skills:{rete:0},
    wellbeing:60,
    shifts:0,
    lucidita:50,
    strada:{giroAvviato:false}
  };
  const shown = [];
  const notifications = [];
  const started = [];
  const missed = [];
  const saved = [];

  const math = Object.create(Math);
  math.random = () => overrides.random == null ? 0.9 : overrides.random;

  const ctx = {
    G, console, Number, Object, Array, Set, String, Boolean, Date,
    Math:math,
    setTimeout:fn => { fn(); return 1; },
    clearTimeout:()=>{},
    save:()=>saved.push(true),
    showEvent:e => shown.push(e),
    avviaAzioneDiretta:id => started.push(id),
    lavoroReteChiave:job => job ? (job.place || job.id) : null,
    lavoroLuogo:job => job ? (job.place || null) : null,
    lavoroSede:key => {
      if(!G.workplaces) G.workplaces={};
      if(!G.workplaces[key]) G.workplaces[key]={};
      return G.workplaces[key];
    },
    lavoroAumentoDisponibile:()=>false,
    lavoroPromozioneDisponibile:()=>false,
    lavoroProssimoRuolo:()=>null,
    stradaGiroAvviato:()=>!!(G.strada && G.strada.giroAvviato),
    gain:(skill,v) => {
      G.skills=G.skills||{};
      G.skills[skill]=Number(G.skills[skill]||0)+Number(v||0);
    },
    addLuc:v => { G.lucidita=Math.max(0,Math.min(100,Number(G.lucidita||0)+Number(v||0))); },
    chatAvvicina:(p,v) => { p.pt=Math.max(0,Number(p.pt||0)+Number(v||0)); },
    AGENDA:{
      conflittiTra:()=>[],
      mancaVoce:v => { missed.push(v); return v; }
    },
    GAME_TIME:{
      now:()=>Number(overrides.now == null ? 8*60 : overrides.now),
      durationFor:()=>Number(overrides.duration == null ? 300 : overrides.duration),
      format:m => {
        const n=((Math.round(Number(m)||0)%1440)+1440)%1440;
        return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
      }
    },
    ADF_EVENTI:{
      claimAutoEvent:()=>true,
      addNotification:n => { notifications.push(n); return n; }
    }
  };

  Object.assign(ctx, overrides.extra || {});
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/game/lavoro-eventi.js"),ctx);
  return {ctx,G,shown,notifications,started,missed,saved};
}

describe("famiglie eventi lavoro", () => {
  it("blocca il turno prima di spendere tempo quando attraversa un appuntamento musicale", () => {
    const env=ambiente({now:17*60,duration:300});
    env.ctx.AGENDA.conflittiTra=()=>[{
      k:"settimana:live",id:"live",tipo:"settimana",n:"Serata live",
      ora:"21:30",minuti:21*60+30,anno:1,settimana:1,giorno:1
    }];

    const gate=env.ctx.ADF_WORK_EVENTS.guardAction("turno");
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe("work-music-conflict");
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0].t).toContain("Serata live");

    env.shown[0].opts[0].run();
    expect(env.missed).toHaveLength(1);
    expect(env.started).toEqual(["turno"]);
    expect(env.G.workplaces.barista.workEvents.history.some(x =>
      x.family==="conflict" && x.choice==="work"
    )).toBe(true);
  });

  it("tenere l'appuntamento non avvia il turno", () => {
    const env=ambiente({now:18*60,duration:300});
    env.ctx.AGENDA.conflittiTra=()=>[{
      k:"oggi:sala",id:"sala",tipo:"oggi",n:"Sessione lunga al Circolo",
      ora:"20:00",minuti:20*60,anno:1,settimana:1,giorno:1
    }];

    env.ctx.ADF_WORK_EVENTS.guardAction("turno");
    env.shown[0].opts[1].run();

    expect(env.started).toHaveLength(0);
    expect(env.missed).toHaveLength(0);
    expect(env.G.workplaces.barista.workEvents.history.some(x =>
      x.family==="conflict" && x.choice==="music"
    )).toBe(true);
  });

  it("un aumento di carriera cambia davvero la paga", () => {
    const env=ambiente({
      G:{
        year:1,week:8,day:2,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},wellbeing:70,shifts:2,
        strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id),
        lavoroAumentoDisponibile:()=>true,
        lavoroPromozioneDisponibile:()=>false,
        lavoroApplicaAumento:(place,opt)=>{
          const prima=220, dopo=Math.round(prima*(1+Number(opt.percentuale)/100));
          envRef.G.job.pay=dopo;
          return {luogo:place,prima,dopo,aumento:dopo-prima};
        }
      }
    });
    const envRef=env;

    const shown=env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:1,colleague:1,physical:1
    });
    expect(shown).toBe(true);
    expect(env.shown[0].t).toContain("aumento");

    env.shown[0].opts[0].run();
    expect(env.G.job.pay).toBe(238);
    expect(env.G.workplaces.fabbrica.workEvents.history.some(x =>
      x.family==="career" && x.status==="accepted"
    )).toBe(true);
  });

  it("un contatto musicale del lavoro può creare un bonus consumabile sulla prossima live", () => {
    const env=ambiente({
      G:{
        year:1,week:2,day:3,
        job:{id:"barista",n:"Barista",pay:130,e:18},
        workplaces:{},
        gente:[{id:"p1",n:"Mauri",ruolo:"promoter",origineLuogo:"barista",numero:true,via:false,pt:0,rel:1}],
        skills:{rete:0},wellbeing:60,shifts:1,strada:{giroAvviato:false}
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:0,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(env.shown[0].k).toContain("Musica");

    env.shown[0].opts[0].run();
    expect(env.G.workplaces.barista.workEvents.musicLead.multiplier).toBe(1.25);

    const lead=env.ctx.ADF_WORK_EVENTS.consumeMusicLead("live");
    expect(lead.multiplier).toBe(1.25);
    expect(env.G.workplaces.barista.workEvents.musicLead).toBeNull();
  });

  it("buttafuori e fattorino possono ricevere una dritta solo se la Strada è già aperta", () => {
    const base={
      year:1,week:3,day:4,
      job:{id:"buttafuori",n:"Buttafuori",pay:210,e:32},
      workplaces:{},gente:[],skills:{rete:0},wellbeing:60,shifts:1,
      strada:{giroAvviato:true,arresto:false}
    };
    const env=ambiente({G:base});

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:0,colleague:1,physical:1
    })).toBe(true);
    expect(env.shown[0].k).toContain("Strada");

    env.shown[0].opts[0].run();
    const active=env.ctx.ADF_WORK_EVENTS.crimeLeadActive();
    expect(active.bonusPct).toBe(15);
    expect(active.extraHeat).toBe(2);

    const used=env.ctx.ADF_WORK_EVENTS.consumeCrimeLead(true);
    expect(used.success).toBe(true);
    expect(env.G.workplaces.buttafuori.workEvents.crimeLead).toBeNull();

    const closed=ambiente({G:{
      ...base,
      workplaces:{},
      strada:{giroAvviato:false,arresto:false}
    }});
    expect(closed.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:0,colleague:1,physical:1
    })).toBe(false);
  });

  it("la stanchezza del lavoro modifica benessere e lucidità reali", () => {
    const env=ambiente({
      G:{
        year:1,week:1,day:5,
        job:{id:"magazzino",n:"Magazziniere",pay:165,e:32},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:30,lucidita:50,shifts:5,strada:{giroAvviato:false}
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:1,colleague:1,physical:0
    })).toBe(true);
    expect(env.shown[0].k).toContain("Stanchezza");

    env.shown[0].opts[1].run();
    expect(env.G.wellbeing).toBe(26);
    expect(env.G.lucidita).toBe(47);
  });

  it("disciplina e cicli perfetti finiscono nel centro notifiche", () => {
    const env=ambiente({
      G:{
        year:1,week:4,day:7,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},wellbeing:60,shifts:0,
        strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });

    env.ctx.ADF_WORK_EVENTS.onDiscipline("fabbrica",{
      eligible:true,dismissed:false,warningAdded:1,absences:3,
      warningsAfter:1,reliabilityDelta:-10
    });
    env.ctx.ADF_WORK_EVENTS.onCycle("fabbrica",{
      eligible:true,perfect:true,reliabilityDelta:10,fullWeeks:4
    });

    expect(env.notifications.map(x=>x.title)).toEqual([
      "Richiamo formale","Quattro settimane complete"
    ]);
    expect(env.G.workplaces.fabbrica.workEvents.history.some(x =>
      x.family==="discipline" && x.status==="warning"
    )).toBe(true);
  });

  it("integra il motore con clock, Agenda, Strada, live e arbitro Eventi V2", () => {
    const agenda=leggi("js/game/agenda.js");
    const ui=leggi("js/game/ui.js");
    const actions=leggi("js/game/actions.js");
    const eventi=leggi("js/game/eventi-v2.js");
    const strada=leggi("js/game/strada-crimine.js");
    const html=leggi("pagine/gioco.html");
    const famepedia=leggi("js/famepedia.js");

    expect(agenda).toContain("function conflittiTra(da, a)");
    expect(agenda).toContain("function mancaVoce(v, motivo)");
    expect(ui).toContain("function guardiaEventoLavoro(id)");
    expect(actions).toContain('ADF_WORK_EVENTS.consumeMusicLead("live")');
    expect(actions).toContain("ADF_WORK_EVENTS.onDiscipline(luogo,result)");
    expect(actions).toContain("ADF_WORK_EVENTS.onCycle(luogo,evaluation)");
    expect(eventi).toContain("ADF_WORK_EVENTS.afterShift(shiftPayload)");
    expect(eventi).toContain("started_at:jobBefore.from");
    expect(strada).toContain("ADF_WORK_EVENTS.crimeLeadActive()");
    expect(strada).toContain("ADF_WORK_EVENTS.consumeCrimeLead(successo)");
    expect(html).toContain('js/game/lavoro-eventi.js?v=1');
    expect(famepedia).toContain("Quando il lavoro si scontra con la musica");
  });
});
