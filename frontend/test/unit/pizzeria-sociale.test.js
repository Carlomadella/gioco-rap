import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function ambiente({persona=null,songs=[],random=.5}={}){
  const G={
    year:1,week:1,day:2,
    job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18},
    workplaces:{},
    gente:persona?[persona]:[],
    songs:songs.slice(),
    skills:{rete:0},
    wellbeing:80,lucidita:80,shifts:1,
    fans:100,hype:20,
    strada:{giroAvviato:false}
  };
  const shown=[];
  const math=Object.create(Math);
  math.random=()=>random;

  const ctx={
    G,console,Number,Object,Array,Set,String,Boolean,Date,Math:math,
    window:null,
    setTimeout:fn=>{ fn(); return 1; },clearTimeout:()=>{},
    save:()=>{},
    showEvent:e=>shown.push(e),
    lavoroReteChiave:job=>job&&(job.place||job.id),
    lavoroLuogo:job=>job&&job.place,
    lavoroSede:key=>{
      if(!G.workplaces[key]) G.workplaces[key]={};
      return G.workplaces[key];
    },
    lavoroCarriera:()=>({reliability:50}),
    lavoroCarrieraDef:()=>null,
    lavoroAumentoDisponibile:()=>false,
    lavoroPromozioneDisponibile:()=>false,
    lavoroProssimoRuolo:()=>null,
    stradaGiroAvviato:()=>false,
    gain:(skill,v)=>{
      G.skills[skill]=Number(G.skills[skill]||0)+Number(v||0);
    },
    addLuc:v=>{
      G.lucidita=Math.max(0,Math.min(100,Number(G.lucidita||0)+Number(v||0)));
    },
    chatAvvicina:(p,v)=>{
      p.pt=Math.max(0,Number(p.pt||0)+Number(v||0));
      if(Number(v)<0 && p.pt===0 && Number(p.rel||0)>0) p.rel-=1;
    },
    AGENDA:{conflittiTra:()=>[],mancaVoce:()=>null},
    GAME_TIME:{now:()=>17*60,durationFor:()=>300,format:()=>""},
    ADF_EVENTI:{claimAutoEvent:()=>true,addNotification:n=>n}
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/game/lavoro-eventi.js"),ctx);

  function preparaSocial(){
    const state=ctx.ADF_WORK_EVENTS.stateForJob(G.job);
    state.incidentalCursor=2;
    return state;
  }
  function turnoSocial(){
    preparaSocial();
    return ctx.ADF_WORK_EVENTS.afterShift({},{
      factory:1,colleague:1,social:0,role:1,music:1,physical:1,crime:1
    });
  }
  return {ctx,G,shown,turnoSocial,preparaSocial};
}

function persona(ruolo="rapper"){
  return {
    id:"p1",n:"Mauri",ruolo,origineLuogo:"pizzeria",
    numero:false,via:false,pt:0,rel:0,fama:20
  };
}

describe("socialità Pizzeria e autopromozione",()=>{
  it("non crea persone: senza contatti persistenti non parte nessun dialogo",()=>{
    const env=ambiente();
    expect(env.turnoSocial()).toBe(false);
    expect(env.shown).toHaveLength(0);
    expect(env.G.gente).toHaveLength(0);
  });

  it("il primo incontro sociale serve a costruire rapporto, non a spingere subito un pezzo",()=>{
    const p=persona("rapper");
    const env=ambiente({
      persona:p,
      songs:[{t:"Fuori tardi",q:88,released:true,week:1,seed:"s1"}]
    });

    expect(env.turnoSocial()).toBe(true);
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0].k).toBe("Pizzeria · Due minuti");
    expect(env.shown[0].t).toContain("Mauri");
    expect(env.shown[0].opts.map(x=>x.n)).toEqual([
      "Fermati a parlare","Saluta e vai"
    ]);

    env.shown[0].opts[0].run();
    expect(p.pt).toBe(1);
    expect(env.G.skills.rete).toBeCloseTo(.1);

    const st=env.G.workplaces.pizzeria.workEvents.socialPeople.p1;
    expect(st.talks).toBe(1);
    expect(st.shown).toBe(1);
    expect(env.G.gente).toHaveLength(1);
  });

  it("al reincontro può comparire l'autopromozione su un pezzo già pubblicato",()=>{
    const p=persona("rapper");
    const env=ambiente({
      persona:p,
      songs:[{t:"Fuori tardi",q:90,released:true,week:1,seed:"s1"}],
      random:.5
    });

    env.turnoSocial();
    env.shown[0].opts[0].run();

    env.G.week=2; env.G.day=1;
    env.shown.length=0;
    expect(env.turnoSocial()).toBe(true);

    const promo=env.shown[0].opts.find(x=>x.n.includes("Fuori tardi"));
    expect(promo).toBeTruthy();

    const fansPrima=env.G.fans;
    const hypePrima=env.G.hype;
    const out=promo.run();

    expect(out.c).toBe("good");
    expect(env.G.fans).toBe(fansPrima);
    expect(env.G.hype).toBe(hypePrima);
    expect(env.G.skills.rete).toBeCloseTo(.3);

    const rows=env.G.workplaces.pizzeria.workEvents.history;
    const done=rows.find(x=>x.family==="social"&&x.status==="promoted");
    expect(done.outcome).toBe("good");
    expect(done.songTitle).toBe("Fuori tardi");
  });

  it("lo stesso pezzo non si può farmare sulla stessa persona; un'uscita nuova sì",()=>{
    const p=persona("rapper");
    const song1={t:"Fuori tardi",q:90,released:true,week:1,seed:"s1"};
    const env=ambiente({persona:p,songs:[song1],random:.5});

    env.turnoSocial();
    env.shown[0].opts[0].run();

    env.G.week=2; env.G.day=1; env.shown.length=0;
    env.turnoSocial();
    env.shown[0].opts.find(x=>x.n.includes("Fuori tardi")).run();

    env.G.week=3; env.G.day=2; env.shown.length=0;
    env.turnoSocial();
    expect(env.shown[0].opts.some(x=>x.n.includes("Fuori tardi"))).toBe(false);

    env.G.songs.push({t:"Secondo giro",q:72,released:true,week:3,seed:"s2"});
    env.G.week=4; env.G.day=3; env.shown.length=0;
    env.turnoSocial();
    expect(env.shown[0].opts.some(x=>x.n.includes("Secondo giro"))).toBe(true);
  });

  it("l'autopromozione può andare male e non regala fama o pubblico",()=>{
    const p=persona("promoter");
    const env=ambiente({
      persona:p,
      songs:[{t:"Provino fuori",q:25,released:true,week:1,seed:"bad1"}],
      random:0
    });

    env.turnoSocial();
    env.shown[0].opts[0].run();

    env.G.week=2; env.G.day=1; env.shown.length=0;
    env.turnoSocial();
    const promo=env.shown[0].opts.find(x=>x.n.includes("Provino fuori"));
    const fansPrima=env.G.fans, hypePrima=env.G.hype;
    const out=promo.run();

    expect(out.c).toBe("bad");
    expect(env.G.fans).toBe(fansPrima);
    expect(env.G.hype).toBe(hypePrima);

    const done=env.G.workplaces.pizzeria.workEvents.history.find(
      x=>x.family==="social"&&x.status==="promoted"
    );
    expect(done.outcome).toBe("cold");
    expect(done.networkDelta).toBe(0);
  });

  it("resta dentro il pacing globale: non aggiunge popup oltre la finestra incidentale",()=>{
    const p=persona("rapper");
    const env=ambiente({persona:p});

    expect(env.turnoSocial()).toBe(true);
    const n=env.shown.length;

    env.G.day=3;
    env.shown.length=0;
    expect(env.turnoSocial()).toBe(false);
    expect(env.shown).toHaveLength(0);

    const state=env.G.workplaces.pizzeria.workEvents;
    expect(state.lastIncidentalFamily).toBe("social");
    expect(state.incidentalRecent.some(x=>x.family==="social")).toBe(true);
    expect(n).toBe(1);
  });

  it("i contatti normali sviluppano una micro-storyline persistente in tre episodi",()=>{
    const p=persona("cliente");
    const env=ambiente({persona:p,random:.5});
    const testi=[];

    for(const [week,day] of [[1,2],[2,4],[4,1]]){
      env.G.week=week; env.G.day=day; env.shown.length=0;
      expect(env.turnoSocial()).toBe(true);
      testi.push(env.shown[0].d);
      const talk=env.shown[0].opts.find(x=>x.n==="Fermati a parlare");
      expect(talk).toBeTruthy();
      talk.run();
    }

    const st=env.G.workplaces.pizzeria.workEvents.socialPeople.p1;
    expect(st.storyStep).toBe(3);
    expect(st.talks).toBe(3);
    expect(new Set(testi).size).toBe(3);

    env.G.week=6; env.G.day=2; env.shown.length=0;
    expect(env.turnoSocial()).toBe(true);
    expect(env.shown[0].d).not.toBe(testi[0]);
    expect(env.shown[0].d).not.toBe(testi[1]);
    expect(env.shown[0].d).not.toBe(testi[2]);
    expect(env.shown[0].d).toContain("due minuti veri");
  });


  it("anche favore collega e dritta musicale Pizzeria passano dal budget rete per-persona",()=>{
    const src=leggi("js/game/lavoro-eventi.js");
    expect(src).toContain('lavoroBonusRetePersona(p,"pizzeria-colleague-help",.4,2)');
    expect(src).toContain('lavoroBonusRetePersona(p,"pizzeria-music-lead",.5,2)');
    expect(src).toContain('workKey(job)==="pizzeria"');
  });

});
