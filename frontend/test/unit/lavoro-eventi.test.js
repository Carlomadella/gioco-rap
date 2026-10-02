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
  it("espone anche la famiglia di eventi legata alla responsabilità del ruolo", () => {
    const env=ambiente();
    expect(Object.keys(env.ctx.ADF_WORK_EVENTS.families)).toEqual([
      "discipline","career","overtime","colleague","social","role","factory",
      "music","crime","conflict","physical"
    ]);
  });

  it("ogni ruolo Fabbrica ha cinque eventi propri e un anti-ripetizione coerente", () => {
    const src=leggi("js/game/lavoro-eventi.js");
    const start=src.indexOf("const FACTORY_ROLE_EVENTS");
    const end=src.indexOf("const PIZZERIA_ROLE_EVENTS",start);
    const block=src.slice(start,end);
    const ruoli=["operaio","operaio_esperto","capolinea","capoturno"];

    for(let i=0;i<ruoli.length;i++){
      const from=block.indexOf(ruoli[i]+":Object.freeze([");
      const to=i<ruoli.length-1
        ? block.indexOf(ruoli[i+1]+":Object.freeze([",from)
        : block.length;
      const pezzo=block.slice(from,to);
      expect((pezzo.match(/\bid:"[^"]+"/g)||[]).length).toBe(5);
    }

    expect(src).toContain("if(s.roleRecent.length>4) s.roleRecent.length=4");
    expect(src).toContain("x.roles.includes(job.id)");
    expect((src.match(/roles:Object\.freeze\(\["operaio","operaio_esperto"\]\)/g)||[]).length)
      .toBeGreaterThanOrEqual(3);
  });

  it("limita gli eventi incidentali a circa due per settimana e ruota le famiglie", () => {
    const env=ambiente({
      random:0,
      G:{
        year:1,week:1,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},
        gente:[{
          id:"m1",n:"Mauri",ruolo:"promoter",origineLuogo:"fabbrica",
          numero:true,via:false,pt:0,rel:1
        }],
        skills:{rete:0},wellbeing:80,lucidita:80,shifts:4,
        strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });
    const rolls={music:0,role:0,factory:0,crime:0,colleague:0,physical:0};

    for(let week=1;week<=4;week++){
      for(const day of [1,2,3,4,5]){
        env.G.week=week;
        env.G.day=day;
        env.ctx.ADF_WORK_EVENTS.afterShift({},rolls);
      }
    }

    const s=env.G.workplaces.fabbrica.workEvents;
    const shown=s.history.filter(x =>
      x.status==="shown" &&
      ["factory","colleague","social","role","music","physical","crime"].includes(x.family)
    );
    const perWeek={};
    for(const row of shown) perWeek[row.week]=(perWeek[row.week]||0)+1;

    expect(shown).toHaveLength(8);
    expect(Object.values(perWeek).every(n=>n<=2)).toBe(true);
    expect(new Set(shown.map(x=>x.family)).size).toBeGreaterThanOrEqual(5);
    expect(s.incidentalRecent).toHaveLength(8);
    expect(env.ctx.ADF_WORK_EVENTS.debug().pacing.gapDays).toBe(3);
  });

  it("il cooldown globale blocca i popup casuali nei due giorni successivi", () => {
    const env=ambiente({
      random:0,
      G:{
        year:1,week:1,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:70,lucidita:70,shifts:1,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });
    const rolls={music:0,role:0,factory:0,crime:0,colleague:0,physical:0};

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(true);
    const prima=env.shown.length;
    expect(env.G.workplaces.fabbrica.workEvents.lastIncidentalDay).toBe(1);

    env.G.day=2;
    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(false);
    env.G.day=3;
    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(false);
    expect(env.shown).toHaveLength(prima);

    env.G.day=4;
    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(true);
    expect(env.shown).toHaveLength(prima+1);
  });

  it("carriera e disciplina non vengono soffocate dal pacing degli eventi casuali", () => {
    const env=ambiente({
      random:0,
      G:{
        year:1,week:1,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:70,lucidita:70,shifts:1,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });
    const rolls={music:0,role:0,factory:0,crime:0,colleague:0,physical:0};

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(true);
    env.G.day=2;

    env.ctx.lavoroCarrieraDef=()=>({});
    env.ctx.lavoroAumentoDisponibile=()=>true;
    env.ctx.lavoroPromozioneDisponibile=()=>false;
    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},rolls)).toBe(true);
    expect(env.shown.at(-1).t).toContain("aumento");

    env.ctx.ADF_WORK_EVENTS.onDiscipline("fabbrica",{
      eligible:true,dismissed:false,warningAdded:1,absences:3,
      warningsAfter:1,reliabilityDelta:-10
    });
    expect(env.notifications.at(-1).title).toBe("Richiamo formale");
  });

  it("gli straordinari esistenti entrano nella stessa storia persistente", () => {
    const env=ambiente({
      G:{
        year:1,week:5,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:0,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });

    env.ctx.ADF_WORK_EVENTS.onOvertime("fabbrica","accepted",{
      tipo:"sabato",targetAbsoluteDay:34,bonusPct:30
    });
    env.ctx.ADF_WORK_EVENTS.onOvertime("fabbrica","completed",{
      tipo:"sabato",bonusPct:30,affidabilitaDelta:2
    });

    const rows=env.G.workplaces.fabbrica.workEvents.history
      .filter(x => x.family==="overtime");
    expect(rows.map(x=>x.status)).toEqual(["completed","accepted"]);
    expect(rows[0].reliabilityDelta).toBe(2);
  });

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
    expect(env.missed).toHaveLength(0);
    expect(env.started).toEqual(["turno"]);
    expect(env.G.workplaces.barista.workEvents.pendingConflictMiss.voice.id).toBe("live");

    env.ctx.ADF_WORK_EVENTS.afterShift({
      started_at:17*60,
      ended_at:22*60,
      job_id:"barista"
    },{music:1,crime:1,colleague:1,physical:1});

    expect(env.missed).toHaveLength(1);
    expect(env.G.workplaces.barista.workEvents.pendingConflictMiss).toBeUndefined();
    expect(env.G.workplaces.barista.workEvents.history.some(x =>
      x.family==="conflict" && x.choice==="work" && x.missed===true
    )).toBe(true);
  });

  it("mostra se saltare il turno lascia ancora possibile il 5/5", () => {
    const env=ambiente({
      now:12*60,duration:480,
      G:{
        year:1,week:2,day:3,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:2,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id),
        lavoroPagaTurno:()=>({totale:220,percentuale:0}),
        lavoroEffettiTurno:()=>({energia:40,benessere:-3,lucidita:-1}),
        lavoroCartellino:()=>({
          giorniLavoratiSettimana:2,
          turniSettimanaliRichiesti:5,
          conteggi:Array(28).fill(0),
          posOggi:9
        }),
        lavoroContrattoDef:()=>({turniSettimanali:5,giorniConsentiti:[1,2,3,4,5,6]}),
        lavoroStraordinarioOggi:()=>null
      }
    });
    env.ctx.AGENDA.conflittiTra=()=>[{
      k:"settimana:live",id:"live",tipo:"settimana",n:"Serata live",
      ora:"18:00",minuti:18*60,anno:1,settimana:2,giorno:3
    }];
    env.ctx.AGENDA.pesoDiOggi=()=>1.15;

    env.ctx.ADF_WORK_EVENTS.guardAction("turno");

    expect(env.shown[0].d).toContain("2/5 presenze");
    expect(env.shown[0].d).toContain("Puoi ancora coprire il contratto");
    expect(env.shown[0].opts[0].d).toContain("+220 €");
    expect(env.shown[0].opts[0].d).toContain("×1.15");
    expect(env.shown[0].opts[1].d).toContain("puoi ancora chiudere 5/5");
  });

  it("avverte quando scegliere la musica rende inevitabile un'assenza", () => {
    const env=ambiente({
      now:12*60,duration:480,
      G:{
        year:1,week:2,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:3,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id),
        lavoroPagaTurno:()=>({totale:220,percentuale:0}),
        lavoroEffettiTurno:()=>({energia:40,benessere:-3,lucidita:-1}),
        lavoroCartellino:()=>({
          giorniLavoratiSettimana:3,
          turniSettimanaliRichiesti:5,
          conteggi:Array(28).fill(0),
          posOggi:11
        }),
        lavoroContrattoDef:()=>({turniSettimanali:5,giorniConsentiti:[1,2,3,4,5,6]}),
        lavoroStraordinarioOggi:()=>null
      }
    });
    env.ctx.AGENDA.conflittiTra=()=>[{
      k:"settimana:live",id:"live",tipo:"settimana",n:"Serata live",
      ora:"18:00",minuti:18*60,anno:1,settimana:2,giorno:5
    }];

    env.ctx.ADF_WORK_EVENTS.guardAction("turno");

    expect(env.shown[0].d).toContain("3/5 presenze");
    expect(env.shown[0].d).toContain("rende inevitabile 1 assenza");
    expect(env.shown[0].opts[1].d).toContain("1 assenza diventa inevitabile");
  });

  it("scegliere la musica registra il costo opportunità senza regalare statistiche", () => {
    const env=ambiente({
      now:18*60,duration:300,
      G:{
        year:1,week:1,day:1,
        job:{id:"barista",n:"Barista",pay:130,e:18},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:0,strada:{giroAvviato:false}
      },
      extra:{
        lavoroPagaTurno:()=>({totale:130,percentuale:0})
      }
    });
    env.ctx.AGENDA.conflittiTra=()=>[{
      k:"oggi:sala",id:"sala",tipo:"oggi",n:"Sessione lunga al Circolo",
      ora:"20:00",minuti:20*60,anno:1,settimana:1,giorno:1
    }];

    env.ctx.ADF_WORK_EVENTS.guardAction("turno");
    const prima=env.G.lucidita;
    env.shown[0].opts[1].run();

    expect(env.G.lucidita).toBe(prima);
    const row=env.G.workplaces.barista.workEvents.history.find(x =>
      x.family==="conflict" && x.choice==="music"
    );
    expect(row.forgonePay).toBe(130);
    expect(row.eventWeight).toBe(1);
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
        lavoroCarrieraDef:()=>({}),
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

  it("i colleghi persistenti possono modificare davvero rapporto, rete e benessere", () => {
    const env=ambiente({
      random:0.9,
      G:{
        year:1,week:2,day:2,
        job:{id:"barista",n:"Barista",pay:130,e:18},
        workplaces:{},
        gente:[{id:"c1",n:"Sara",ruolo:"collega",origineLuogo:"barista",numero:true,via:false,pt:0,rel:1}],
        skills:{rete:0},wellbeing:60,lucidita:50,shifts:1,strada:{giroAvviato:false}
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:1,colleague:0,physical:1
    })).toBe(true);
    expect(env.shown[0].k).toContain("Colleghi");

    env.shown[0].opts[0].run();
    expect(env.G.gente[0].pt).toBe(2);
    expect(env.G.skills.rete).toBeCloseTo(0.4);
    expect(env.G.wellbeing).toBe(59);
  });

  it("un Capoturno può ricevere un evento specifico del suo ruolo con effetti reali", () => {
    const career={reliability:70};
    const env=ambiente({
      random:0,
      G:{
        year:1,week:10,day:3,
        job:{id:"capoturno",place:"fabbrica",n:"Capoturno",pay:330,e:28},
        workplaces:{fabbrica:{workEvents:{
          lastFamilyDay:{},history:[],musicLead:null,crimeLead:null,
          incidentalRecent:[],incidentalCursor:2
        }}},gente:[],skills:{rete:0},wellbeing:70,lucidita:60,shifts:2,
        strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id),
        lavoroCarriera:()=>career
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:0,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0].k).toContain("Capoturno");

    const primaLuc=env.G.lucidita;
    env.shown[0].opts[0].run();

    expect(career.reliability).toBeGreaterThan(70);
    expect(env.G.lucidita).toBeLessThan(primaLuc);
    expect(env.G.workplaces.fabbrica.workEvents.history.some(x =>
      x.family==="role" && x.roleId==="capoturno" && x.status==="resolved"
    )).toBe(true);
  });

  it("la Fabbrica ha eventi di reparto propri, separati dagli eventi di ruolo", () => {
    const env=ambiente({
      random:0.9,
      G:{
        year:1,week:3,day:3,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:2,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0].k).toBe("Fabbrica · Reparto");
    expect(env.shown[0].t).toContain("fila tutto liscio");

    env.shown[0].opts[0].run();
    expect(env.G.wellbeing).toBe(62);
    expect(env.G.lucidita).toBe(51);
    expect(env.G.workplaces.fabbrica.workEvents.history.some(x =>
      x.family==="factory" && x.eventId==="giornata-liscia" && x.status==="resolved"
    )).toBe(true);
  });

  it("gli eventi di reparto rispettano il profilo fisico/mentale e il ruolo", () => {
    const crea=(id,n,random) => {
      const career={reliability:70};
      return ambiente({
        random,
        G:{
          year:1,week:3,day:3,
          job:{id,place:"fabbrica",n,pay:300,e:id==="capoturno"?28:40},
          workplaces:{},gente:[],skills:{rete:0},
          wellbeing:60,lucidita:50,shifts:2,strada:{giroAvviato:false}
        },
        extra:{
          lavoroLuogo:job => job && job.place,
          lavoroReteChiave:job => job && (job.place||job.id),
          lavoroCarriera:()=>career
        }
      });
    };

    const operaioFisico=crea("operaio","Operaio",.21);
    expect(operaioFisico.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(operaioFisico.shown[0].t).toContain("muore di caldo");
    expect(operaioFisico.shown[0].opts[1].d).toContain("−2 benessere");
    operaioFisico.shown[0].opts[1].run();
    expect(operaioFisico.G.wellbeing).toBe(58);

    /* Il Capoturno non riceve più gli eventi operativi di postazione/linea:
       il suo carico arriva dagli eventi di coordinamento e da quelli mentali. */
    const capoNonOperativo=crea("capoturno","Capoturno",.21);
    expect(capoNonOperativo.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(capoNonOperativo.shown[0].t).not.toContain("muore di caldo");
    expect(capoNonOperativo.shown[0].t).not.toContain("postazione");

    const operaioMentale=crea("operaio","Operaio",.31);
    operaioMentale.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    });
    expect(operaioMentale.shown[0].t).toContain("protezione");
    expect(operaioMentale.shown[0].opts[0].d).toContain("−1 lucidità");
    operaioMentale.shown[0].opts[0].run();
    expect(operaioMentale.G.lucidita).toBe(49);

    const capoMentale=crea("capoturno","Capoturno",.31);
    capoMentale.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    });
    expect(capoMentale.shown[0].t).toContain("protezione");
    expect(capoMentale.shown[0].opts[0].d).toContain("−2 lucidità");
    capoMentale.shown[0].opts[0].run();
    expect(capoMentale.G.lucidita).toBe(48);
  });

  it("la stanchezza Fabbrica segue il profilo del ruolo e può nascere da lucidità bassa", () => {
    const crea=(id,n,wellbeing,lucidita,shifts) => ambiente({
      random:.9,
      G:{
        year:1,week:6,day:4,
        job:{id,place:"fabbrica",n,pay:300,e:id==="capoturno"?28:40},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing,lucidita,shifts,strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id)
      }
    });

    const operaio=crea("operaio","Operaio",60,50,4);
    expect(operaio.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:1,crime:1,colleague:1,physical:0
    })).toBe(true);
    expect(operaio.shown[0].t).toContain("braccia");
    expect(operaio.shown[0].opts[1].d).toContain("−4 benessere");
    expect(operaio.shown[0].opts[1].d).toContain("−1 lucidità");
    operaio.shown[0].opts[1].run();
    expect(operaio.G.wellbeing).toBe(56);
    expect(operaio.G.lucidita).toBe(49);

    const capoturno=crea("capoturno","Capoturno",60,35,1);
    expect(capoturno.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:1,crime:1,colleague:1,physical:0
    })).toBe(true);
    expect(capoturno.shown[0].t).toContain("testa");
    expect(capoturno.shown[0].opts[1].d).toContain("−1 benessere");
    expect(capoturno.shown[0].opts[1].d).toContain("−4 lucidità");
    capoturno.shown[0].opts[1].run();
    expect(capoturno.G.wellbeing).toBe(59);
    expect(capoturno.G.lucidita).toBe(31);
    expect(capoturno.G.workplaces.fabbrica.workEvents.history.some(x =>
      x.family==="physical" && x.roleId==="capoturno" &&
      x.effects && x.effects.lucidita===-4
    )).toBe(true);
  });

  it("gli eventi di reparto Fabbrica non contaminano gli altri lavori", () => {
    const env=ambiente({
      G:{
        year:1,week:3,day:3,
        job:{id:"barista",place:"bar",n:"Barista",pay:130,e:18},
        workplaces:{},gente:[],skills:{rete:0},
        wellbeing:60,lucidita:50,shifts:1,strada:{giroAvviato:false}
      }
    });

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,role:1,factory:0,crime:1,colleague:1,physical:1
    })).toBe(false);
    expect(env.shown).toHaveLength(0);
  });

  it("la carriera eventi segue anche la Pizzeria strutturata, non solo la Fabbrica", () => {
    const env=ambiente({
      G:{
        year:1,week:9,day:3,
        job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
        workplaces:{},gente:[],skills:{rete:0},wellbeing:70,shifts:2,
        strada:{giroAvviato:false}
      },
      extra:{
        lavoroLuogo:job => job && job.place,
        lavoroReteChiave:job => job && (job.place||job.id),
        lavoroCarrieraDef:luogo => luogo==="pizzeria" ? {aumento:{},promozione:{},ruoli:[{id:"lavapiatti"},{id:"aiuto_cucina",n:"Aiuto cucina"}]} : null,
        lavoroNomeLuogo:luogo => luogo==="pizzeria" ? "Pizzeria" : luogo,
        lavoroAumentoDisponibile:()=>false,
        lavoroPromozioneDisponibile:luogo => luogo==="pizzeria",
        lavoroProssimoRuolo:()=>({id:"aiuto_cucina",n:"Aiuto cucina"}),
        lavoroPromuoviRuolo:(place,opt)=>{
          const prima={id:"lavapiatti",n:"Lavapiatti"};
          const dopo={id:"aiuto_cucina",n:"Aiuto cucina"};
          const pagaPrima=100;
          envRef.G.job.id=dopo.id; envRef.G.job.n=dopo.n;
          envRef.G.job.pay=Number(opt.nuovaPaga);
          return {luogo:place,da:prima,a:dopo,pagaPrima,pagaDopo:envRef.G.job.pay};
        }
      }
    });
    const envRef=env;

    expect(env.ctx.ADF_WORK_EVENTS.afterShift({},{
      music:1,crime:1,colleague:1,physical:1
    })).toBe(true);
    expect(env.shown[0].k).toBe("Pizzeria · Carriera");
    env.shown[0].opts[0].run();
    expect(env.G.job.id).toBe("aiuto_cucina");
    expect(env.G.job.pay).toBe(115);
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

  it("Agenda usa il minuto numerico reale del clock", () => {
    const agenda=leggi("js/game/agenda.js");
    expect(agenda).toContain("Number(GAME_TIME.now())");
    expect(agenda).not.toContain("GAME_TIME.now().minutes");
  });

  it("gli eventi dopo-turno aspettano la ripresa di un turno interrotto da un evento alto", () => {
    const eventi=leggi("js/game/eventi-v2.js");
    expect(eventi).toContain("GAME_TIME.suspended && GAME_TIME.suspended()");
    expect(eventi).toContain('window.addEventListener("game-time:action-resumed",onResume)');
    expect(eventi).toContain("adfCompletaHookAzione(a,jobBefore,d.to)");
    expect(eventi).toContain('window.addEventListener("jail-ui:opened",onAbort)');
  });

  it("il rientro di contratto usa la carriera del luogo e non un hardcode Fabbrica", () => {
    const actions=leggi("js/game/actions.js");
    const firma=actions.slice(
      actions.indexOf("function lavoroFirmaContratto("),
      actions.indexOf("function lavoroTerminaContratto(")
    );
    expect(firma).toContain("const cfgCarriera = lavoroCarrieraDef(luogo)");
    expect(firma).toContain("cfgCarriera.ruoli.findIndex");
    expect(firma).not.toContain("ADF_FABBRICA_CARRIERA.ruoli.findIndex");
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
    expect(eventi).toContain("lavoroAnnullaRichiestaStraordinario(luogo)");
    expect(actions).toContain("function lavoroAnnullaRichiestaStraordinario(luogo)");
    expect(actions).toContain('ADF_WORK_EVENTS.onOvertime(luogo,"completed",result)');
    expect(eventi.indexOf("adfWorkOvertimeAfterShift()"))
      .toBeLessThan(eventi.indexOf("ADF_WORK_EVENTS.afterShift(shiftPayload)"));
    expect(eventi.indexOf("adfFactoryStreetAfterShift()"))
      .toBeLessThan(eventi.indexOf("ADF_WORK_EVENTS.afterShift(shiftPayload)"));
    expect(strada).toContain("ADF_WORK_EVENTS.crimeLeadActive()");
    expect(strada).toContain("ADF_WORK_EVENTS.consumeCrimeLead(successo)");
    expect(strada).toContain('"Dritta " + lead.sourceLabel');
    expect(eventi).toContain("ADF_WORK_EVENTS.crimeLeadActive()) return false");
    expect(html).toContain('js/game/lavoro-eventi.js?v=8');
    expect(famepedia).toContain("Quando il lavoro si scontra con la musica");
  });
});
