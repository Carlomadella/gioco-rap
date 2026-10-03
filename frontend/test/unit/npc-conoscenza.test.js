import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/npc-conoscenza.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  return window.ADF_NPC_CONOSCENZA;
}
function p(extra={}){ return {id:"p1",...extra}; }

describe("NPC · punto 12 discovery informazioni",()=>{
  it("non crea conoscenza solo perché il fatto esiste nel mondo",()=>{
    const api=runtime();
    const x=p({
      personalita:{tratti:["prudente"],interessi:["musica"]},
      appartenenze:[{ambienteId:"sala:provincia",tipo:"musica",fonte:"x",dalGiorno:1}],
      reteLegami:[{personId:"p2",tipo:"amicizia",percezione:"positiva"}]
    });
    expect(api.profilo(x)).toEqual({
      personId:"p1",carattereLegacy:null,tratti:[],interessi:[],
      provenienza:null,appartenenze:[],legami:[]
    });
    expect(x).not.toHaveProperty("conoscenza");
  });

  it("scopre un tratto reale e salva solo prova/source, non una copia del profilo",()=>{
    const api=runtime();
    const x=p({personalita:{tratti:["prudente","leale"]}});
    api.scopri(x,{tipo:"tratto",id:"prudente"},{fonte:"dialogo:7",giorno:12});
    expect(api.trattiConosciuti(x)).toEqual(["prudente"]);
    expect(x.conoscenza).toEqual({
      versione:1,
      fatti:{"tratto:prudente":{fonte:"dialogo:7",giorno:12}}
    });
    expect(x.conoscenza).not.toHaveProperty("tratti");
  });

  it("rifiuta di scoprire un tratto o interesse che la PERSONA non possiede",()=>{
    const api=runtime();
    const x=p({personalita:{tratti:["prudente"],interessi:["audio"]}});
    expect(()=>api.scopri(x,{tipo:"tratto",id:"ambizioso"},{fonte:"test"}))
      .toThrow(/non presente/);
    expect(()=>api.scopri(x,{tipo:"interesse",id:"musica"},{fonte:"test"}))
      .toThrow(/non presente/);
    expect(x).not.toHaveProperty("conoscenza");
  });

  it("scopre interessi in modo indipendente dai tratti",()=>{
    const api=runtime();
    const x=p({personalita:{tratti:["prudente"],interessi:["audio","quartiere"]}});
    api.scopri(x,{tipo:"interesse",id:"quartiere"},{fonte:"chat",giorno:4});
    expect(api.interessiConosciuti(x)).toEqual(["quartiere"]);
    expect(api.trattiConosciuti(x)).toEqual([]);
  });

  it("un'appartenenza può esistere ma restare nascosta",()=>{
    const api=runtime();
    const x=p({appartenenze:[
      {ambienteId:"sala:provincia",tipo:"musica",fonte:"a",dalGiorno:1},
      {ambienteId:"strada:provincia",tipo:"strada",fonte:"b",dalGiorno:3}
    ]});
    api.scopri(x,{tipo:"appartenenza",id:"sala:provincia"},{fonte:"incontro",giorno:5});
    expect(api.appartenenzeConosciute(x)).toEqual(["sala:provincia"]);
  });

  it("conoscere l'esistenza di un legame non rivela tipo o percezione",()=>{
    const api=runtime();
    const x=p({reteLegami:[{
      personId:"p2",tipo:"amicizia",percezione:"positiva",reason:"quartiere"
    }]});
    api.scopri(x,{tipo:"legame-esistenza",id:"p2"},{fonte:"presentazione",giorno:8});
    expect(api.legamiConosciuti(x)).toEqual([{personId:"p2"}]);
  });

  it("tipo, percezione e sottotipo del legame si scoprono separatamente",()=>{
    const api=runtime();
    const x=p({reteLegami:[{
      personId:"p2",tipo:"parentela",percezione:"ambivalente",
      sottotipo:"fratello",reason:"anagrafica"
    }]});
    api.scopri(x,{tipo:"legame-esistenza",id:"p2"},{fonte:"dialogo"});
    api.scopri(x,{tipo:"legame-tipo",id:"p2",valore:"parentela"},{fonte:"dialogo"});
    api.scopri(x,{tipo:"legame-sottotipo",id:"p2",valore:"fratello"},{fonte:"dialogo"});
    expect(api.legamiConosciuti(x)).toEqual([{
      personId:"p2",tipo:"parentela",sottotipo:"fratello"
    }]);
    api.scopri(x,{tipo:"legame-percezione",id:"p2",valore:"ambivalente"},{fonte:"evento"});
    expect(api.legamiConosciuti(x)[0]).toEqual({
      personId:"p2",tipo:"parentela",percezione:"ambivalente",sottotipo:"fratello"
    });
  });

  it("scopriLegame è atomico: un dettaglio falso non lascia discovery parziali",()=>{
    const api=runtime();
    const x=p({reteLegami:[{personId:"p2",tipo:"conoscenza"}]});
    expect(()=>api.scopriLegame(
      x,"p2",{tipo:"amicizia"},{fonte:"evento",giorno:5}
    )).toThrow(/non presente/);
    expect(api.legamiConosciuti(x)).toEqual([]);
    expect(x).not.toHaveProperty("conoscenza");

    api.scopriLegame(x,"p2",{tipo:"conoscenza"},{fonte:"evento",giorno:5});
    expect(api.legamiConosciuti(x)).toEqual([{personId:"p2",tipo:"conoscenza"}]);
  });

  it("un legame che cambia non rivela automaticamente il nuovo tipo",()=>{
    const api=runtime();
    const x=p({reteLegami:[{personId:"p2",tipo:"conoscenza"}]});
    api.scopri(x,{tipo:"legame-esistenza",id:"p2"},{fonte:"intro"});
    api.scopri(x,{tipo:"legame-tipo",id:"p2",valore:"conoscenza"},{fonte:"intro"});
    expect(api.legamiConosciuti(x)[0].tipo).toBe("conoscenza");

    x.reteLegami[0].tipo="rivalita";
    expect(api.legamiConosciuti(x)).toEqual([{personId:"p2"}]);

    api.scopri(x,{tipo:"legame-tipo",id:"p2",valore:"rivalita"},{fonte:"scontro",giorno:20});
    expect(api.legamiConosciuti(x)[0].tipo).toBe("rivalita");
  });

  it("la provenienza esiste separatamente e non si deduce dalla città corrente",()=>{
    const api=runtime();
    const x=p({citta:"milano"});
    expect(()=>api.scopri(x,{tipo:"provenienza"},{fonte:"incontro"}))
      .toThrow(/non presente/);
    x.identita={provenienza:{cittaId:"bologna",fonte:"story"}};
    api.scopri(x,{tipo:"provenienza"},{fonte:"racconto",giorno:9});
    expect(api.profilo(x).provenienza).toEqual({cittaId:"bologna",fonte:"story"});
  });

  it("il vecchio scoperto continua a rendere noto solo il vecchio carattere",()=>{
    const api=runtime();
    const x=p({car:"pratico",scoperto:true,personalita:{tratti:["prudente"]}});
    expect(api.sa(x,{tipo:"carattere-legacy",id:"pratico"})).toBe(true);
    expect(api.profilo(x).carattereLegacy).toBe("pratico");
    expect(api.profilo(x).tratti).toEqual([]);
    expect(x).not.toHaveProperty("conoscenza");
  });

  it("idempotenza: riscoprire un fatto non riscrive la prima prova",()=>{
    const api=runtime();
    const x=p({personalita:{interessi:["musica"]}});
    api.scopri(x,{tipo:"interesse",id:"musica"},{fonte:"prima",giorno:2});
    api.scopri(x,{tipo:"interesse",id:"musica"},{fonte:"seconda",giorno:50});
    expect(api.prove(x)).toEqual([
      {key:"interesse:musica",fonte:"prima",giorno:2}
    ]);
  });

  it("le prove non contengono i valori completi dei profili",()=>{
    const api=runtime();
    const x=p({
      personalita:{tratti:["prudente"],interessi:["audio"]},
      identita:{provenienza:{cittaId:"roma",fonte:"bio"}}
    });
    api.scopri(x,{tipo:"tratto",id:"prudente"},{fonte:"a"});
    api.scopri(x,{tipo:"provenienza"},{fonte:"b"});
    const json=JSON.stringify(x.conoscenza);
    expect(json).not.toContain('"personalita"');
    expect(json).not.toContain('"cittaId"');
  });

  it("un fatto rimosso/corretto dal mondo non viene più mostrato come attuale",()=>{
    const api=runtime();
    const x=p({personalita:{tratti:["prudente"]}});
    api.scopri(x,{tipo:"tratto",id:"prudente"},{fonte:"dialogo"});
    x.personalita.tratti=["ambizioso"];
    expect(api.trattiConosciuti(x)).toEqual([]);
    expect(api.prove(x)[0].key).toBe("tratto:prudente");
  });

  it("la discovery resta sparsa anche con 800 NPC",()=>{
    const api=runtime();
    const persone=Array.from({length:800},(_,i)=>p({
      id:"p"+i,personalita:{interessi:["musica"]}
    }));
    api.scopri(persone[0],{tipo:"interesse",id:"musica"},{fonte:"dialogo",giorno:1});
    expect(persone.filter(x=>x.conoscenza).length).toBe(1);
    expect(persone[799]).not.toHaveProperty("conoscenza");
  });

  it("roundtrip JSON preserva ciò che è stato scoperto",()=>{
    const api=runtime();
    const x=p({
      personalita:{tratti:["leale"]},
      reteLegami:[{personId:"p2",tipo:"amicizia"}]
    });
    api.scopri(x,{tipo:"tratto",id:"leale"},{fonte:"dialogo",giorno:3});
    api.scopri(x,{tipo:"legame-esistenza",id:"p2"},{fonte:"presentazione",giorno:4});
    const copy=JSON.parse(JSON.stringify(x));
    expect(api.profilo(copy)).toEqual(api.profilo(x));
    expect(api.prove(copy)).toEqual(api.prove(x));
  });
});
