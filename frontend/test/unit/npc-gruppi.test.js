import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const legami=fs.readFileSync(path.join(ROOT,"js/game/npc-legami.js"),"utf8");
const cerchie=fs.readFileSync(path.join(ROOT,"js/game/npc-cerchie.js"),"utf8");
const gruppi=fs.readFileSync(path.join(ROOT,"js/game/npc-gruppi.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(legami,ctx);
  vm.runInContext(cerchie,ctx);
  vm.runInContext(gruppi,ctx);
  return window;
}
function p(id){return {id,n:id};}
function triangolo(w,ids=["a","b","c"]){
  const ps=ids.map(p);
  w.ADF_NPC_LEGAMI.collega(ps[0],ps[1],{tipo:"amicizia"});
  w.ADF_NPC_LEGAMI.collega(ps[1],ps[2],{tipo:"conoscenza"});
  w.ADF_NPC_LEGAMI.collega(ps[2],ps[0],{tipo:"collaborazione"});
  return ps;
}
function promuovi(w,reg,ps,extra={}){
  const c=w.ADF_NPC_CERCHIE.cerchie(ps)[0];
  return w.ADF_NPC_GRUPPI.promuoviCerchia(reg,ps,c.key,{
    groupId:"g1",
    nome:"I Tre",
    tipo:"collettivo",
    contesto:"musica",
    giorno:10,
    fonte:"evento:fondazione",
    ...extra
  });
}

describe("NPC · punto 14 gruppi emergenti",()=>{
  it("una cerchia resta solo candidata finché nessun evento la promuove",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const cand=w.ADF_NPC_GRUPPI.candidati(reg,ps);
    expect(cand).toHaveLength(1);
    expect(reg).toEqual([]);
    for(const x of ps){
      expect(x).not.toHaveProperty("groupId");
      expect(x).not.toHaveProperty("groupIds");
      expect(x).not.toHaveProperty("gruppi");
    }
  });

  it("promuove una cerchia reale a gruppo persistente",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const g=promuovi(w,reg,ps,{cittaId:"provincia",ambienteId:"sala:provincia"});
    expect(reg).toHaveLength(1);
    expect(g).toMatchObject({
      groupId:"g1",
      nome:"I Tre",
      tipo:"collettivo",
      contesto:"musica",
      stato:"attivo",
      creatoGiorno:10,
      fonte:"evento:fondazione",
      membri:[
        {personId:"a",entratoGiorno:10,uscitoGiorno:null},
        {personId:"b",entratoGiorno:10,uscitoGiorno:null},
        {personId:"c",entratoGiorno:10,uscitoGiorno:null}
      ]
    });
    expect(g.luoghi).toEqual([{
      dalGiorno:10,cittaId:"provincia",ambienteId:"sala:provincia",
      fonte:"evento:fondazione"
    }]);
  });

  it("rifiuta una chiave di cerchia inventata",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    expect(()=>w.ADF_NPC_GRUPPI.promuoviCerchia(reg,ps,"cerchia:falsa",{
      groupId:"g1",tipo:"crew",giorno:10,fonte:"test"
    })).toThrow(/cerchia corrente non trovata/);
    expect(reg).toEqual([]);
  });

  it("non promuove due volte la stessa cerchia attiva",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    promuovi(w,reg,ps);
    const key=w.ADF_NPC_CERCHIE.cerchie(ps)[0].key;
    expect(()=>w.ADF_NPC_GRUPPI.promuoviCerchia(reg,ps,key,{
      groupId:"g2",tipo:"crew",giorno:11,fonte:"test"
    })).toThrow(/gia promossa/);
  });

  it("un groupId è stabile e non può essere riutilizzato",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    promuovi(w,reg,ps);
    w.ADF_NPC_GRUPPI.sciogli(reg,"g1",{giorno:20,fonte:"evento:fine"});
    const ps2=triangolo(w,["d","e","f"]);
    const key=w.ADF_NPC_CERCHIE.cerchie(ps2)[0].key;
    expect(()=>w.ADF_NPC_GRUPPI.promuoviCerchia(reg,ps2,key,{
      groupId:"g1",tipo:"crew",giorno:30,fonte:"evento:nuovo"
    })).toThrow(/groupId gia esistente/);
  });

  it("i membri possono uscire, rientrare ed entrare senza perdere la storia",()=>{
    const w=runtime(),reg=[],ps=triangolo(w),d=p("d");
    const g=promuovi(w,reg,ps);

    w.ADF_NPC_GRUPPI.rimuoviMembro(reg,"g1","b",{giorno:20,fonte:"evento:litigio"});
    w.ADF_NPC_GRUPPI.aggiungiMembro(reg,"g1",d,{giorno:22,fonte:"evento:ingresso"});
    w.ADF_NPC_GRUPPI.aggiungiMembro(reg,"g1",ps[1],{giorno:30,fonte:"evento:rientro"});

    expect(w.ADF_NPC_GRUPPI.membriAttivi(g)).toEqual(["a","c","d","b"]);
    expect(g.membri.filter(m=>m.personId==="b")).toEqual([
      {
        personId:"b",entratoGiorno:10,fonte:"evento:fondazione",
        uscitoGiorno:20,uscitaFonte:"evento:litigio"
      },
      {
        personId:"b",entratoGiorno:30,fonte:"evento:rientro",
        uscitoGiorno:null,uscitaFonte:null
      }
    ]);
  });

  it("un gruppo continua a esistere anche se la cerchia originaria cambia",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const g=promuovi(w,reg,ps);
    // Rompe due archi del grafo dopo la fondazione.
    ps[0].reteLegami=ps[0].reteLegami.filter(x=>x.personId==="b");
    ps[2].reteLegami=ps[2].reteLegami.filter(x=>x.personId==="b");

    expect(w.ADF_NPC_CERCHIE.cerchie(ps)).toEqual([]);
    expect(w.ADF_NPC_GRUPPI.trova(reg,"g1")).toBe(g);
    expect(w.ADF_NPC_GRUPPI.membriAttivi(g)).toEqual(["a","b","c"]);
    expect(w.ADF_NPC_GRUPPI.coesione(g,ps)).toBeCloseTo(2/3);
  });

  it("la coesione è derivata dai legami correnti e non salvata come score magico",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const g=promuovi(w,reg,ps);
    expect(w.ADF_NPC_GRUPPI.coesione(g,ps)).toBe(1);
    expect(g).not.toHaveProperty("coesione");

    // Toglie un rapporto reciproco.
    ps[0].reteLegami=ps[0].reteLegami.filter(x=>x.personId!=="c");
    ps[2].reteLegami=ps[2].reteLegami.filter(x=>x.personId!=="a");
    expect(w.ADF_NPC_GRUPPI.coesione(g,ps)).toBeCloseTo(2/3);
  });

  it("il gruppo può cambiare città/ambiente tramite una timeline leggera",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    promuovi(w,reg,ps,{cittaId:"provincia",ambienteId:"sala:provincia"});
    w.ADF_NPC_GRUPPI.sposta(reg,"g1",{
      giorno:40,cittaId:"milano",ambienteId:"studio:milano",fonte:"evento:trasferimento"
    });
    expect(w.ADF_NPC_GRUPPI.luogo(reg,"g1",39)).toMatchObject({
      cittaId:"provincia",ambienteId:"sala:provincia"
    });
    expect(w.ADF_NPC_GRUPPI.luogo(reg,"g1",40)).toMatchObject({
      cittaId:"milano",ambienteId:"studio:milano"
    });
  });

  it("una stessa persona può appartenere a più gruppi reali",()=>{
    const w=runtime(),reg=[];
    const [a,b,c,d,e]=["a","b","c","d","e"].map(p);
    for(const [x,y] of [[a,b],[b,c],[c,a],[c,d],[d,e],[e,c]])
      w.ADF_NPC_LEGAMI.collega(x,y,{tipo:"conoscenza"});
    const circles=w.ADF_NPC_CERCHIE.cerchie([a,b,c,d,e]);
    expect(circles).toHaveLength(2);

    w.ADF_NPC_GRUPPI.promuoviCerchia(reg,[a,b,c,d,e],circles[0].key,{
      groupId:"g1",tipo:"collettivo",giorno:10,fonte:"e1"
    });
    w.ADF_NPC_GRUPPI.promuoviCerchia(reg,[a,b,c,d,e],circles[1].key,{
      groupId:"g2",tipo:"rete",giorno:12,fonte:"e2"
    });
    expect(w.ADF_NPC_GRUPPI.gruppiPerPersona(reg,"c").map(g=>g.groupId).sort())
      .toEqual(["g1","g2"]);
  });

  it("sciogliere un gruppo conserva il record storico ma lo toglie dai gruppi attivi",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const g=promuovi(w,reg,ps);
    w.ADF_NPC_GRUPPI.sciogli(reg,"g1",{giorno:50,fonte:"evento:scioglimento"});

    expect(g).toMatchObject({
      stato:"sciolto",scioltoGiorno:50,scioltoFonte:"evento:scioglimento"
    });
    expect(w.ADF_NPC_GRUPPI.gruppiPerPersona(reg,"a")).toEqual([]);
    expect(w.ADF_NPC_GRUPPI.trova(reg,"g1")).toBe(g);
    expect(g.membri.every(m=>m.uscitoGiorno===50)).toBe(true);
  });

  it("la vista espone membri, coesione e luogo senza modificare il record",()=>{
    const w=runtime(),reg=[],ps=triangolo(w);
    const g=promuovi(w,reg,ps,{cittaId:"provincia"});
    const before=JSON.stringify(g);
    expect(w.ADF_NPC_GRUPPI.vista(g,ps,15)).toMatchObject({
      groupId:"g1",tipo:"collettivo",stato:"attivo",
      memberIds:["a","b","c"],coesione:1,
      luogo:{cittaId:"provincia"}
    });
    expect(JSON.stringify(g)).toBe(before);
  });

  it("con 800 persone il gruppo salva solo i membri reali",()=>{
    const w=runtime(),reg=[];
    const ps=Array.from({length:800},(_,i)=>p("p"+String(i).padStart(3,"0")));
    w.ADF_NPC_LEGAMI.collega(ps[0],ps[1],{tipo:"amicizia"});
    w.ADF_NPC_LEGAMI.collega(ps[1],ps[2],{tipo:"amicizia"});
    w.ADF_NPC_LEGAMI.collega(ps[2],ps[0],{tipo:"amicizia"});
    const key=w.ADF_NPC_CERCHIE.cerchie(ps)[0].key;
    w.ADF_NPC_GRUPPI.promuoviCerchia(reg,ps,key,{
      groupId:"g1",tipo:"crew",giorno:5,fonte:"evento"
    });
    expect(reg).toHaveLength(1);
    expect(reg[0].membri).toHaveLength(3);
    expect(ps.filter(x=>Object.keys(x).some(k=>/group|grupp/i.test(k)))).toEqual([]);
  });
});
