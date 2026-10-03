import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const promozione=fs.readFileSync(path.join(ROOT,"js/game/npc-promozione.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(promozione,ctx);
  return window.ADF_NPC_PROMOZIONE;
}
function temp(id="raiz",n="Raiz"){
  return {tipo:"circolo-ospite",id,n,fama:82};
}

describe("NPC · punto 15 promozione temporanei",()=>{
  it("non persiste una comparsa finché nessun evento la promuove",()=>{
    const api=runtime(),persone=[];
    expect(api.risolvi(persone,temp())).toBeNull();
    expect(persone).toEqual([]);
  });

  it("promuove una comparsa mantenendo l'identità osservata",()=>{
    const api=runtime(),persone=[];
    const p=api.promuovi(persone,temp(),{
      giorno:12,motivo:"relazione",fonte:"circolo:collab-ospite",
      crea:()=>({id:"p100",n:"Nome casuale",fama:1,rel:0})
    });
    expect(persone).toEqual([p]);
    expect(p).toMatchObject({
      id:"p100",n:"Raiz",fama:82,
      promozioneTemporanea:{
        versione:1,tipo:"circolo-ospite",id:"raiz",giorno:12,
        motivo:"relazione",fonte:"circolo:collab-ospite"
      }
    });
  });

  it("ripetere la promozione restituisce la stessa PERSONA e non richiama il factory",()=>{
    const api=runtime(),persone=[];
    let create=0;
    const meta={giorno:12,motivo:"contatto",fonte:"evento",crea:()=>({id:"p"+(++create),n:"x"})};
    const a=api.promuovi(persone,temp(),meta);
    const b=api.promuovi(persone,temp(),{...meta,giorno:20,crea:()=>{create++;return {id:"mai"};}});
    expect(b).toBe(a);
    expect(create).toBe(1);
    expect(persone).toHaveLength(1);
  });

  it("non deduplica per nome: due comparse omonime restano due identità",()=>{
    const api=runtime(),persone=[];
    const a=api.promuovi(persone,temp("serata-1","Giulia"),{
      giorno:10,motivo:"narrativa",fonte:"evento:a",crea:()=>({id:"p1"})
    });
    const b=api.promuovi(persone,temp("serata-2","Giulia"),{
      giorno:11,motivo:"narrativa",fonte:"evento:b",crea:()=>({id:"p2"})
    });
    expect(a.id).not.toBe(b.id);
    expect(a.n).toBe("Giulia");
    expect(b.n).toBe("Giulia");
    expect(persone).toHaveLength(2);
  });

  it("accetta solo cause esplicite di persistenza",()=>{
    const api=runtime(),persone=[];
    expect(api.motivi()).toEqual(["contatto","relazione","ricorrenza","narrativa"]);
    expect(()=>api.promuovi(persone,temp(),{
      giorno:10,motivo:"l'ho-visto",fonte:"test",crea:()=>({id:"p1"})
    })).toThrow(/motivo promozione non supportato/);
    expect(persone).toEqual([]);
  });

  it("rifiuta ID PERSONA già presenti senza sporcare l'anagrafe",()=>{
    const api=runtime(),esistente={id:"p1",n:"Altro"},persone=[esistente];
    expect(()=>api.promuovi(persone,temp(),{
      giorno:10,motivo:"contatto",fonte:"test",crea:()=>({id:"p1"})
    })).toThrow(/ID PERSONA gia esistente/);
    expect(persone).toEqual([esistente]);
    expect(esistente).not.toHaveProperty("promozioneTemporanea");
  });

  it("rileva save incoerenti con la stessa origine temporanea assegnata due volte",()=>{
    const api=runtime();
    const promo={versione:1,tipo:"circolo-ospite",id:"raiz",giorno:1,motivo:"contatto",fonte:"x"};
    const persone=[{id:"p1",promozioneTemporanea:{...promo}},{id:"p2",promozioneTemporanea:{...promo}}];
    expect(()=>api.risolvi(persone,temp())).toThrow(/origine temporanea duplicata/);
  });

  it("roundtrip JSON conserva il ponte verso la PERSONA promossa",()=>{
    const api=runtime(),persone=[];
    const p=api.promuovi(persone,temp(),{
      giorno:40,motivo:"ricorrenza",fonte:"evento:ritorno",crea:()=>({id:"p40"})
    });
    const caricate=JSON.parse(JSON.stringify(persone));
    expect(api.risolvi(caricate,temp())).toMatchObject({id:p.id,n:"Raiz"});
  });

  it("con 800 PERSONA una promozione aggiunge solo la persona necessaria",()=>{
    const api=runtime();
    const persone=Array.from({length:800},(_,i)=>({id:"p"+i,n:"NPC "+i}));
    const p=api.promuovi(persone,temp(),{
      giorno:100,motivo:"narrativa",fonte:"storyline",crea:()=>({id:"p800"})
    });
    expect(persone).toHaveLength(801);
    expect(p.id).toBe("p800");
    expect(persone.filter(x=>x.promozioneTemporanea)).toHaveLength(1);
  });
});
