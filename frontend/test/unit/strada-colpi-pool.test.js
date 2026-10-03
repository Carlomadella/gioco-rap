import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function runtime(){
  const source=leggi("js/game/strada-crimine.js");
  const dataStart=source.indexOf("const STRADA_CATEGORIE_COLPO");
  const dataEnd=source.indexOf("/* Città chiuse:",dataStart);
  const runtimeStart=source.indexOf("function stradaAbsDay(){");
  const runtimeEnd=source.indexOf("/* ==================== INGRESSO",runtimeStart);
  if(dataStart<0||dataEnd<0||runtimeStart<0||runtimeEnd<0)
    throw new Error("blocchi pool Strada non trovati");

  const G={
    year:1,week:1,day:1,
    strada:{rep:0,precedenti:0,offerteColpi:{absoluteDay:null,ids:[],previousIds:[]}}
  };
  const ctx={
    G,Math,Number,Object,Array,Set,String,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    stradaReputazioneGlobale:()=>Math.max(0,Math.min(100,Number(G.strada&&G.strada.rep||0))),
    stradaOpportunitaAttiva:()=>null
  };
  vm.createContext(ctx);
  vm.runInContext(
    source.slice(dataStart,dataEnd)+
    source.slice(runtimeStart,runtimeEnd)+
    "\nglobalThis.__pool=STRADA_COLPI;"+
    "globalThis.__cats=STRADA_CATEGORIE_COLPO;",
    ctx
  );
  return {ctx,G,pool:ctx.__pool,cats:ctx.__cats,source};
}

const plain=v=>JSON.parse(JSON.stringify(v));

describe("Strada · pool e categorie dei colpi",()=>{
  it("la Provincia ha un pool ampio, unico e mantiene i quattro colpi storici",()=>{
    const {pool,cats}=runtime();
    expect(pool).toHaveLength(30);
    expect(new Set(pool.map(c=>c.id)).size).toBe(30);
    expect(Object.keys(cats)).toEqual(["trasporto","merce","furto","veicoli","incassi"]);
    expect(new Set(pool.map(c=>c.categoria))).toEqual(new Set(Object.keys(cats)));
    for(const id of ["consegne","scotta","cassa","macchina"])
      expect(pool.some(c=>c.id===id)).toBe(true);
  });

  it("il pool cresce organicamente con la reputazione senza mostrare una gerarchia di livelli",()=>{
    const {pool}=runtime();
    const n0=pool.filter(c=>Number(c.minRep||0)<=0).length;
    const n20=pool.filter(c=>Number(c.minRep||0)<=20).length;
    const n50=pool.filter(c=>Number(c.minRep||0)<=50).length;
    expect(n0).toBe(8);
    expect(n20).toBeGreaterThan(n0);
    expect(n50).toBe(30);
  });

  it("le quattro offerte possono avere categorie duplicate e lasciarne altre assenti",()=>{
    const {ctx}=runtime();
    const cats=plain(vm.runInContext(
      "stradaGeneraOfferteColpi(1,50,[]).map(c=>c.categoria)",ctx
    ));
    expect(cats).toHaveLength(4);
    expect(new Set(cats).size).toBeLessThan(4);
    expect(cats.filter(c=>c==="trasporto").length).toBe(2);
  });

  it("la rotazione produce quattro colpi unici e penalizza quelli del giorno prima senza imporre categorie",()=>{
    const {ctx}=runtime();
    const a=plain(vm.runInContext("stradaGeneraOfferteColpi(73,50,[]).map(c=>c.id)",ctx));
    const b=plain(vm.runInContext(
      "stradaGeneraOfferteColpi(74,50,"+JSON.stringify(a)+").map(c=>c.id)",ctx
    ));
    expect(a).toHaveLength(4);
    expect(new Set(a).size).toBe(4);
    expect(b).toHaveLength(4);
    expect(new Set(b).size).toBe(4);
    expect(b.filter(id=>a.includes(id)).length).toBeLessThanOrEqual(1);
  });

  it("una dritta attiva forza il proprio colpo dentro le quattro offerte",()=>{
    const {ctx,G}=runtime();
    G.strada.rep=0;
    G.strada.offerteColpi={
      absoluteDay:1,
      ids:["consegne","busta-chiusa","passaggio-rapido","scotta"],
      previousIds:[]
    };
    ctx.stradaOpportunitaAttiva=()=>({colpoId:"macchina"});
    const ids=plain(vm.runInContext("stradaColpiDisponibili().map(c=>c.id)",ctx));
    expect(ids).toHaveLength(4);
    expect(ids).toContain("macchina");
  });

  it("bonus e malus di categoria scalano con la difficoltà",()=>{
    const {ctx}=runtime();
    const low=plain(vm.runInContext(
      'stradaEffettiCategoria(STRADA_COLPI.find(c=>c.id==="consegne"))',ctx
    ));
    const high=plain(vm.runInContext(
      'stradaEffettiCategoria(STRADA_COLPI.find(c=>c.id==="consegna-sensibile"))',ctx
    ));
    expect(high.chance).toBeGreaterThan(low.chance);
    expect(high.heat).toBeLessThan(low.heat);
    expect(high.guadagno).toBeLessThan(low.guadagno);

    const furtoLow=plain(vm.runInContext(
      'stradaEffettiCategoria(STRADA_COLPI.find(c=>c.id==="retrobottega"))',ctx
    ));
    const furtoHigh=plain(vm.runInContext(
      'stradaEffettiCategoria(STRADA_COLPI.find(c=>c.id==="incasso-notte"))',ctx
    ));
    expect(furtoHigh.guadagno).toBeGreaterThan(furtoLow.guadagno);
    expect(furtoHigh.heat).toBeGreaterThan(furtoLow.heat);
  });

  it("tutte le opportunità esistenti puntano ancora a colpi reali del pool",()=>{
    const {pool,source}=runtime();
    const ids=new Set(pool.map(c=>c.id));
    const start=source.indexOf("const STRADA_OPPORTUNITA =");
    const end=source.indexOf("]);",start);
    const block=source.slice(start,end);
    const refs=[...block.matchAll(/colpoId:"([^"]+)"/g)].map(m=>m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for(const id of refs) expect(ids.has(id)).toBe(true);
  });

  it("la UI V2 usa le offerte del giorno coerenti con l'ora e mostra la categoria",()=>{
    const {source}=runtime();
    const ui=leggi("js/game/strada-crimine-ui.js");
    expect(source).toContain("function stradaColpiDisponibiliAdesso()");
    expect(ui).toContain('typeof stradaColpiDisponibiliAdesso==="function"');
    expect(ui).toContain('typeof stradaCategoria==="function"?stradaCategoria(c).n');
    expect(ui).toContain("Nessun lavoro gira adesso");
    expect(ui).not.toContain('q("#crimes").innerHTML=STRADA_COLPI.map');
  });
});
