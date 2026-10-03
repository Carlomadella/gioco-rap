import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const actions=leggi("js/game/actions.js");
const eventi=leggi("js/game/eventi-v2.js");
const lavoroEventi=leggi("js/game/lavoro-eventi.js");

function helperLavoro(){
  const start=actions.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end=actions.indexOf("/* Cosa determina davvero la qualità",start);
  if(start<0||end<0) throw new Error("helper lavoro non trovato");
  return actions.slice(start,end);
}

function contestoLavoro(giroAvviato=true){
  const G={year:1,week:1,day:2,strada:{giroAvviato},workplaces:{}};
  const ctx={G,Number,Math,Array,Object,Set};
  ctx.totalWeeks=()=>1;
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(),ctx);
  return ctx;
}

function funzione(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return src.slice(a,b);
}

describe("Strada · punto 15 Pizzeria accesso sociale",()=>{
  it("il pool Pizzeria è dominato da facce quotidiane e non contiene ruoli Strada",()=>{
    const ctx=contestoLavoro(true);
    const cfg=vm.runInContext("ADF_LAVORO_RETE.pizzeria",ctx);
    const ruoli=Array.from(cfg.ruoli);
    const quotidiani=new Set(["collega","cliente","rider","fornitore"]);

    expect(cfg.socialOnly).toBe(true);
    expect(ruoli).not.toContain("strada");
    expect(ruoli.filter(r=>quotidiani.has(r)).length).toBeGreaterThan(ruoli.length/2);

    for(const id of ["lavapiatti","aiuto_cucina","aiuto_pizzaiolo","pizzaiolo"]){
      const prof=cfg.perRuolo[id];
      const pool=Array.from(prof.ruoli);
      expect(prof.socialOnly).toBe(true);
      expect(pool).not.toContain("strada");
      expect(pool.filter(r=>quotidiani.has(r)).length).toBeGreaterThan(pool.length/2);
    }
  });

  it("anche a carriera criminale avviata la Pizzeria non genera conoscenze Strada",()=>{
    const ctx=contestoLavoro(true);
    const ruoli=vm.runInContext(
      'lavoroReteRuoli({id:"lavapiatti",place:"pizzeria"}, {socialOnly:true,ruoli:["cliente","rider","strada"]})',
      ctx
    );
    expect(Array.from(ruoli)).toEqual(["cliente","rider"]);
  });

  it("il primo incontro Pizzeria non offre subito lo scambio del numero, il secondo sì",()=>{
    const block=funzione(eventi,"function adfWorkContactAfterShift","function hookMatches");
    const p={
      id:"p1",n:"Mauro",ruolo:"cliente",origineLuogo:"pizzeria",
      origineDettaglio:"cliente abituale",workEncountered:false,
      numero:false,rel:0,pt:0,via:false
    };
    const shown=[];
    const state={runtime:{lastAutoEventKey:null},lastHookEventDay:null};
    const fn=new Function(
      "G","lavoroTentaIncontroContatto","lavoroReteChiave","lavoroLuogo",
      "st","eventMinuteKey","claimAutoEvent","absDay","POSTO_RUOLI",
      "afterClear","showEvent","postoScambiaNumeroLavoro",
      "postoAvvicinaContattoLavoro","lavoroBonusRetePersona","gain",
      block+"\nreturn adfWorkContactAfterShift;"
    )(
      {job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti"}},
      ()=>p,
      ()=>"pizzeria",
      job=>job&&job.place,
      ()=>state,
      ()=>"1:1",
      ()=>true,
      ()=>1,
      {cliente:{n:"Cliente abituale"}},
      cb=>cb(),
      e=>shown.push(e),
      x=>{x.numero=true;return x;},
      (x,n)=>{x.pt+=n;return x;},
      ()=>0,
      ()=>{}
    );

    expect(fn()).toBe(true);
    expect(shown[0].opts.map(x=>x.n)).not.toContain("Scambiatevi il numero");
    expect(shown[0].d).toContain("al primo incontro non c'è ancora motivo");

    shown.length=0;
    expect(fn()).toBe(true);
    expect(shown[0].opts.map(x=>x.n)).toContain("Scambiatevi il numero");
  });

  it("la Pizzeria non può produrre una dritta crime nemmeno con un id lavoro criminale",()=>{
    const block=funzione(lavoroEventi,"function showCrime","function crimeLeadActive");
    const fn=new Function(
      "CRIME_JOBS","workKey",
      block+"\nreturn showCrime;"
    )(new Set(["fattorino","buttafuori"]),job=>job&&job.place||job&&job.id);

    expect(fn({id:"fattorino",place:"pizzeria"}, {}, 0)).toBe(false);
    expect(lavoroEventi).toContain('if(workKey(job)==="pizzeria") return false');
  });

  it("la crescita del ruolo aumenta esposizione sociale, non densità criminale",()=>{
    const ctx=contestoLavoro(true);
    const base=vm.runInContext("ADF_LAVORO_RETE.pizzeria",ctx);
    const lav=base.perRuolo.lavapiatti;
    const pizza=base.perRuolo.pizzaiolo;

    expect(pizza.chanceIncontro).toBeGreaterThan(lav.chanceIncontro);
    expect(pizza.maxContatti).toBeGreaterThan(lav.maxContatti);
    expect(pizza.cooldownGiorni).toBeLessThan(lav.cooldownGiorni);
    expect(Array.from(pizza.ruoli)).not.toContain("strada");
  });
});
