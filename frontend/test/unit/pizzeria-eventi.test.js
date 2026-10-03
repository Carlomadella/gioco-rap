import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function ambiente({role="lavapiatti",random=0}={}){
  const G={
    year:1,week:1,day:2,
    job:{id:role,place:"pizzeria",n:{
      lavapiatti:"Lavapiatti",
      aiuto_cucina:"Aiuto cucina",
      aiuto_pizzaiolo:"Aiuto pizzaiolo",
      pizzaiolo:"Pizzaiolo"
    }[role],pay:100,e:18},
    workplaces:{},
    gente:[],
    skills:{rete:0},
    wellbeing:80,lucidita:80,shifts:1,
    strada:{giroAvviato:false}
  };
  const shown=[];
  const math=Object.create(Math);
  math.random=()=>random;
  const career={reliability:50};

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
    lavoroCarriera:luogo=>luogo==="pizzeria"?career:null,
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
    chatAvvicina:()=>{},
    AGENDA:{conflittiTra:()=>[],mancaVoce:()=>null},
    GAME_TIME:{
      now:()=>17*60,durationFor:()=>300,
      format:m=>String(Math.floor(Number(m||0)/60)).padStart(2,"0")+":00"
    },
    ADF_EVENTI:{claimAutoEvent:()=>true,addNotification:n=>n}
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(leggi("js/game/lavoro-eventi.js"),ctx);
  return {ctx,G,shown,career};
}

describe("eventi Pizzeria per ruolo e cucina",()=>{
  it("ha cinque eventi per ciascuno dei quattro ruoli",()=>{
    const src=leggi("js/game/lavoro-eventi.js");
    const start=src.indexOf("const PIZZERIA_ROLE_EVENTS");
    const end=src.indexOf("const FACTORY_ROLE_EVENT_LOAD",start);
    const block=src.slice(start,end);
    const roles=["lavapiatti","aiuto_cucina","aiuto_pizzaiolo","pizzaiolo"];

    for(let i=0;i<roles.length;i++){
      const marker="\n  "+roles[i]+":Object.freeze([";
      const from=block.indexOf(marker);
      const to=i<roles.length-1
        ? block.indexOf("\n  "+roles[i+1]+":Object.freeze([",from+marker.length)
        : block.length;
      const piece=block.slice(from,to);
      expect((piece.match(/\bid:"[^"]+"/g)||[]).length).toBe(5);
    }

    expect(src).toContain("if(s.roleRecent.length>4) s.roleRecent.length=4");
    expect(src).toContain('role:()=>showWorkRole(job,s,r("role"))');
  });

  it("ha dieci eventi ambientali propri della cucina",()=>{
    const src=leggi("js/game/lavoro-eventi.js");
    const start=src.indexOf("const PIZZERIA_FLOOR_EVENTS");
    const end=src.indexOf("function floorEventsForJob",start);
    const block=src.slice(start,end);
    expect((block.match(/\bid:"[^"]+"/g)||[]).length).toBe(10);
    expect(src).toContain('factory:()=>showWorkplaceFloor(job,s,r("factory"))');
    expect(src).toContain('"Pizzeria · Cucina"');
  });

  it("mostra un evento ruolo Pizzeria senza creare contatti automatici",()=>{
    const env=ambiente({role:"lavapiatti",random:0});
    const shown=env.ctx.ADF_WORK_EVENTS.afterShift({},{
      factory:1,colleague:1,role:0,music:1,physical:1,crime:1
    });
    expect(shown).toBe(true);
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0].k).toContain("Pizzeria · Lavapiatti");
    expect(env.shown[0].t).toContain("montagna di roba");

    env.shown[0].opts[0].run();
    expect(env.G.skills.rete).toBeCloseTo(.2);
    expect(env.G.gente).toHaveLength(0);

    const history=env.G.workplaces.pizzeria.workEvents.history;
    expect(history.some(x=>x.family==="role"&&x.workplace==="pizzeria")).toBe(true);
  });

  it("gli eventi cucina applicano affidabilità e rete alla Pizzeria, non alla Fabbrica",()=>{
    const env=ambiente({role:"aiuto_pizzaiolo",random:0});
    const shown=env.ctx.ADF_WORK_EVENTS.afterShift({},{
      factory:0,colleague:1,role:1,music:1,physical:1,crime:1
    });
    expect(shown).toBe(true);
    expect(env.shown[0].k).toBe("Pizzeria · Cucina");

    env.shown[0].opts[0].run();
    expect(env.career.reliability).toBe(51);
    expect(env.G.skills.rete).toBeCloseTo(.1);
    expect(env.G.lucidita).toBe(79);
    expect(env.G.gente).toHaveLength(0);
  });

  it("la stanchezza da evento usa il profilo leggero del part-time",()=>{
    const env=ambiente({role:"lavapiatti",random:0});
    env.G.shifts=4;
    const shown=env.ctx.ADF_WORK_EVENTS.afterShift({},{
      factory:1,colleague:1,role:1,music:1,physical:0,crime:1
    });
    expect(shown).toBe(true);
    expect(env.shown[0].k).toContain("Stanchezza");
    expect(env.shown[0].opts[1].d).toContain("−2 benessere");
    expect(env.shown[0].opts[1].d).toContain("−1 lucidità");
  });

  it("riusa il pacing globale invece di aggiungere popup extra",()=>{
    const src=leggi("js/game/lavoro-eventi.js");
    expect(src).toContain("incidentalGapDays:3");
    expect(src).toContain('"factory","colleague","social","role","music","physical","crime"');
    expect(src).not.toContain('"pizzeriaRole"');
    expect(src).not.toContain('"kitchen"');
  });
});
