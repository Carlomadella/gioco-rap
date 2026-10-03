import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const eventi=fs.readFileSync(path.join(ROOT,"js/game/eventi-v2.js"),"utf8");
const actions=fs.readFileSync(path.join(ROOT,"js/game/actions.js"),"utf8");

function blocco(src,a,b){
  const i=src.indexOf(a),j=src.indexOf(b,i);
  if(i<0||j<0) throw new Error("blocco non trovato: "+a);
  return src.slice(i,j);
}

describe("Strada · punto 14 Fabbrica come storyline parallela",()=>{
  it("prima di 10 turni reali un collega di Fabbrica non apre la Strada",()=>{
    const code=blocco(
      crime,
      "const STRADA_FABBRICA_STORY_MIN_TURNI",
      "function stradaCreaContatto"
    );
    const collega={
      id:"c1",n:"Marco",via:false,origineLuogo:"fabbrica",
      workEncountered:true,rel:4,pt:12,strada:{known:false}
    };
    const G={strada:{},gente:[collega]};
    let turni=9;
    const api=new Function(
      "G","lavoroTurniTotaliSede","lavoroCartellino","lavoroReteStato",
      "stradaPersonaDaId","stradaContattiLuogo","stradaRelazioneDisponibile",
      code+"\nreturn {stradaFabbricaTurniLavorati,stradaFabbricaPersonaCandidata};"
    )(
      G,
      ()=>turni,
      ()=>({totale:turni}),
      ()=>({turniVisti:turni,history:[{personId:"c1"}]}),
      id=>G.gente.find(p=>p.id===id)||null,
      luogo=>G.gente.filter(p=>p.origineLuogo===luogo),
      ()=>true
    );

    expect(api.stradaFabbricaTurniLavorati()).toBe(9);
    expect(api.stradaFabbricaPersonaCandidata()).toBeNull();

    turni=10;
    expect(api.stradaFabbricaPersonaCandidata()).toBe(collega);
  });

  it("la storyline continua con la stessa persona già salvata",()=>{
    const code=blocco(
      crime,
      "const STRADA_FABBRICA_STORY_MIN_TURNI",
      "function stradaCreaContatto"
    );
    const primo={
      id:"c1",n:"Marco",via:false,origineLuogo:"fabbrica",
      workEncountered:true,rel:1,pt:1,strada:{known:true}
    };
    const altro={
      id:"c2",n:"Sara",via:false,origineLuogo:"fabbrica",
      workEncountered:true,rel:5,pt:99,strada:{known:true}
    };
    const G={strada:{ingressoPersonaId:"c1"},gente:[primo,altro]};
    const api=new Function(
      "G","lavoroTurniTotaliSede","lavoroCartellino","lavoroReteStato",
      "stradaPersonaDaId","stradaContattiLuogo","stradaRelazioneDisponibile",
      code+"\nreturn stradaFabbricaPersonaCandidata;"
    )(
      G,()=>20,()=>({totale:20}),()=>({turniVisti:20,history:[]}),
      id=>G.gente.find(p=>p.id===id)||null,
      luogo=>G.gente.filter(p=>p.origineLuogo===luogo),
      ()=>true
    );
    expect(api()).toBe(primo);
  });

  it("la Fabbrica è esclusa dall'intro generica del mondo",()=>{
    const code=blocco(
      crime,
      "function stradaPersonaIngressoValida",
      "function stradaPersonaIngresso("
    );
    const fn=new Function(code+"\nreturn stradaPersonaIngressoValida;")();
    expect(fn({id:"f",n:"F",via:false,ruolo:"collega",origineLuogo:"fabbrica",visto:true})).toBe(false);
    expect(fn({id:"p",n:"P",via:false,ruolo:"collega",origineLuogo:"pizzeria"})).toBe(true);
  });

  it("dopo un turno Fabbrica il generatore generico non può sostituire la storyline dedicata",()=>{
    expect(eventi).toContain("function adfFactoryStreetIntroAfterShift()");
    expect(eventi).toContain('claimAutoEvent("factory-street-intro")');
    expect(eventi).toContain('lavoroLuogo(G.job)==="fabbrica") return false');
    expect(eventi).toContain("const factoryIntroShown = a.id===\"turno\" && !overtimeShown");
    expect(eventi).toContain("adfFactoryStreetIntroAfterShift()");
  });

  it("la proposta post-turno spiega che il crimine non appartiene alla Fabbrica",()=>{
    expect(eventi).toContain("Non è la Fabbrica che ti sta offrendo un crimine");
    expect(eventi).toContain("non è un crimine della Fabbrica");
    expect(eventi).toContain("Fuori dal cancello");
  });

  it("anche chi è già nel giro riceve proposte Fabbrica solo da una persona matura",()=>{
    const code=blocco(
      crime,
      "function stradaTentaPropostaFabbrica",
      "function stradaAccettaOpportunita"
    );
    expect(code).toContain("if(!stradaFabbricaPersonaCandidata()) return null");
    expect(code).toContain('stradaTentaOpportunita("fabbrica",roll,variantRoll)');
  });

  it("i turni totali della sede non si azzerano col cartellino mensile",()=>{
    const code=blocco(actions,"function lavoroTurniTotaliSede","function lavoroCartellino");
    const sede={
      attendance:{turni:[1,2,3]},
      network:{turniVisti:7}
    };
    const fn=new Function(
      "lavoroSede",
      code+"\nreturn lavoroTurniTotaliSede;"
    )(()=>sede);

    expect(fn("fabbrica")).toBe(7);
    sede.attendance={turni:[]};
    expect(fn("fabbrica")).toBe(7);
    expect(actions).toContain("sede.totalShiftsWorked=totaliPrima+1");
  });

  it("il gate usa una persona davvero incontrata e non solo origineLuogo",()=>{
    const code=blocco(
      crime,
      "const STRADA_FABBRICA_STORY_MIN_TURNI",
      "function stradaCreaContatto"
    );
    const sconosciuto={
      id:"c1",n:"Marco",via:false,origineLuogo:"fabbrica",
      workEncountered:false,numero:false,rel:0,pt:0,strada:{known:false}
    };
    const G={strada:{},gente:[sconosciuto]};
    const api=new Function(
      "G","lavoroTurniTotaliSede","lavoroCartellino","lavoroReteStato",
      "stradaPersonaDaId","stradaContattiLuogo","stradaRelazioneDisponibile",
      code+"\nreturn stradaFabbricaPersonaCandidata;"
    )(
      G,()=>50,()=>({totale:20}),
      ()=>({turniVisti:50,history:[]}),
      id=>G.gente.find(p=>p.id===id)||null,
      luogo=>G.gente.filter(p=>p.origineLuogo===luogo),
      ()=>true
    );
    expect(api()).toBeNull();
  });
});
