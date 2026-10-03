import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/npc-geografia.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Map,Set,Infinity,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return window.ADF_NPC_GEOGRAFIA;
}

function p(extra={}){
  return {id:"p1",n:"Test",...extra};
}

describe("NPC · punto 9 geografia e mobilita",()=>{
  it("registra un catalogo città senza imporlo come whitelist",()=>{
    const api=runtime();
    api.registraCatalogo([{id:"milano",n:"Milano"},{id:"roma",n:"Roma"}]);
    expect(api.citta("Milano")).toEqual({id:"milano",n:"Milano"});
    expect(api.citta("torino")).toBeNull();
    expect(api.cittaAttuale(p({citta:"Torino"}),10)).toBe("torino");
  });

  it("origine geografica resta separata da origineLuogo e città corrente",()=>{
    const api=runtime();
    const x=p({origineLuogo:"fabbrica",citta:"milano"});
    expect(api.origine(x)).toBeNull();
    expect(api.cittaAttuale(x,20)).toBe("milano");
    api.impostaOrigine(x,"Bologna","story:biografia");
    expect(api.origine(x)).toEqual({cittaId:"bologna",fonte:"story:biografia"});
    expect(api.cittaAttuale(x,20)).toBe("milano");
    expect(x.origineLuogo).toBe("fabbrica");
  });

  it("non consente di riscrivere una provenienza già definita",()=>{
    const api=runtime();
    const x=p();
    api.impostaOrigine(x,"roma","story:a");
    expect(api.impostaOrigine(x,"Roma","story:b").cittaId).toBe("roma");
    expect(()=>api.impostaOrigine(x,"napoli","story:c")).toThrow(/gia definita/);
  });

  it("legge i fallback legacy nell'ordine mondo, cittaAttuale, citta",()=>{
    const api=runtime();
    expect(api.posizione(p({mondo:{cittaAttuale:"Roma"},cittaAttuale:"Milano",citta:"Torino"}),5))
      .toMatchObject({cittaId:"roma",fonte:"legacy:mondo.cittaAttuale",esplicita:false});
    expect(api.posizione(p({cittaAttuale:"Milano",citta:"Torino"}),5))
      .toMatchObject({cittaId:"milano",fonte:"legacy:cittaAttuale"});
    expect(api.posizione(p({citta:"Torino"}),5))
      .toMatchObject({cittaId:"torino",fonte:"legacy:citta"});
  });

  it("uno spostamento esplicito prevale sul fallback legacy senza cancellarlo",()=>{
    const api=runtime();
    const x=p({citta:"milano"});
    api.sposta(x,{cittaId:"roma",dalGiorno:20,fonte:"evento:tour"});
    expect(api.cittaAttuale(x,19)).toBe("milano");
    expect(api.cittaAttuale(x,20)).toBe("roma");
    expect(x.citta).toBe("milano");
  });

  it("supporta spostamenti futuri e li applica solo quando maturano",()=>{
    const api=runtime();
    const x=p({citta:"milano"});
    api.sposta(x,{cittaId:"roma",dalGiorno:30,fonte:"agenda:evento"});
    expect(api.cittaAttuale(x,29)).toBe("milano");
    expect(api.cittaAttuale(x,30)).toBe("roma");
    expect(api.cittaAttuale(x,100)).toBe("roma");
  });

  it("una visita temporanea programma andata e ritorno senza storyline",()=>{
    const api=runtime();
    const x=p({citta:"milano"});
    api.visita(x,{
      cittaId:"roma",
      dalGiorno:20,
      alGiorno:23,
      fonte:"evento:festival"
    });
    expect(api.cittaAttuale(x,19)).toBe("milano");
    expect(api.cittaAttuale(x,20)).toBe("roma");
    expect(api.cittaAttuale(x,22)).toBe("roma");
    expect(api.cittaAttuale(x,23)).toBe("milano");
    expect(api.posizioni(x)).toEqual([
      {cittaId:"roma",dalGiorno:20,fonte:"evento:festival"},
      {cittaId:"milano",dalGiorno:23,fonte:"evento:festival:rientro"}
    ]);
  });

  it("una visita richiede una città di ritorno se la posizione precedente è ignota",()=>{
    const api=runtime();
    const x=p();
    expect(()=>api.visita(x,{
      cittaId:"roma",dalGiorno:20,alGiorno:23,fonte:"evento:festival"
    })).toThrow(/ritorno sconosciuta/);
    api.visita(x,{
      cittaId:"roma",dalGiorno:20,alGiorno:23,
      ritornoCittaId:"provincia",fonte:"evento:festival"
    });
    expect(api.cittaAttuale(x,23)).toBe("provincia");
  });

  it("rifiuta due città diverse nello stesso giorno",()=>{
    const api=runtime();
    const x=p();
    api.sposta(x,{cittaId:"roma",dalGiorno:10,fonte:"a"});
    expect(()=>api.sposta(x,{cittaId:"milano",dalGiorno:10,fonte:"b"}))
      .toThrow(/stesso giorno/);
  });

  it("rifiuta visite che attraversano altri spostamenti già programmati",()=>{
    const api=runtime();
    const x=p({citta:"provincia"});
    api.sposta(x,{cittaId:"torino",dalGiorno:22,fonte:"evento:altro"});
    expect(()=>api.visita(x,{
      cittaId:"roma",dalGiorno:20,alGiorno:25,fonte:"evento:festival"
    })).toThrow(/sovrapposta/);
  });

  it("ripetere lo stesso spostamento è idempotente",()=>{
    const api=runtime();
    const x=p();
    api.sposta(x,{cittaId:"roma",dalGiorno:10,fonte:"evento:a"});
    api.sposta(x,{cittaId:"roma",dalGiorno:10,fonte:"evento:a"});
    expect(api.posizioni(x)).toHaveLength(1);
  });

  it("le letture non consentono di mutare la timeline persistita",()=>{
    const api=runtime();
    const x=p();
    api.sposta(x,{cittaId:"roma",dalGiorno:10,fonte:"evento:a"});
    const list=api.posizioni(x);
    list[0].cittaId="milano";
    list.push({cittaId:"torino",dalGiorno:20,fonte:"falso"});
    expect(api.posizioni(x)).toEqual([
      {cittaId:"roma",dalGiorno:10,fonte:"evento:a"}
    ]);
  });

  it("sopravvive a roundtrip JSON mantenendo origine e mobilità",()=>{
    const api=runtime();
    const x=p({citta:"milano"});
    api.impostaOrigine(x,"bologna","story:bio");
    api.visita(x,{cittaId:"roma",dalGiorno:20,alGiorno:22,fonte:"tour"});
    const copy=JSON.parse(JSON.stringify(x));
    expect(api.origine(copy)).toEqual(api.origine(x));
    expect(api.posizioni(copy)).toEqual(api.posizioni(x));
    expect(api.cittaAttuale(copy,21)).toBe("roma");
    expect(api.cittaAttuale(copy,22)).toBe("milano");
  });
});
