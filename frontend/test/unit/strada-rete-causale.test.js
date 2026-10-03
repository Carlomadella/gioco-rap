import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const posto=leggi("js/game/posto.js");
const strada=leggi("js/game/strada-crimine.js");
const eventi=leggi("js/game/eventi-v2.js");

function blocco(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return src.slice(a,b);
}

describe("Strada · punto 16 rete causale",()=>{
  it("salva legami bidirezionali tra persone senza duplicarli",()=>{
    const G={week:3,gente:[]};
    const ctx={G,Number,Array,Object,Set};
    ctx.totalWeeks=()=>9;
    vm.createContext(ctx);
    vm.runInContext(
      blocco(posto,"function postoReteLegami","/* Quanta gente gira"),
      ctx
    );

    const a={id:"p1",n:"Mauro"},b={id:"p2",n:"Nina"};
    G.gente.push(a,b);
    expect(vm.runInContext("postoCollegaPersone(G.gente[0],G.gente[1],'strada-nome')",ctx)).toBe(true);
    expect(a.reteLegami).toEqual([{personId:"p2",reason:"strada-nome",sinceWeek:9}]);
    expect(b.reteLegami).toEqual([{personId:"p1",reason:"strada-nome",sinceWeek:9}]);

    vm.runInContext("postoCollegaPersone(G.gente[0],G.gente[1],'strada-ponte')",ctx);
    expect(a.reteLegami).toHaveLength(1);
    expect(b.reteLegami).toHaveLength(1);
    expect(a.reteLegami[0].reason).toBe("strada-ponte");
    expect(b.reteLegami[0].reason).toBe("strada-ponte");
  });

  it("al Circolo una relazione reale può far ricomparire insieme due facce",()=>{
    const a={id:"p9",n:"Mauro",rel:5,via:false};
    const b={id:"p1",n:"Nina",rel:0,via:false};
    const c={id:"p2",n:"Luca",rel:0,via:false};
    const G={year:1,week:1,day:2,gente:[a,b,c]};
    const fn=new Function(
      "G","sistemaGente","postoSoloLavoro","postoLegamiAttivi",
      blocco(posto,"function presentiOggi(quanti)","/* ==================== DOVE SI INCONTRA")+
        "\nreturn presentiOggi;"
    )(
      G,
      ()=>{},
      ()=>false,
      p=>p===a?[b]:[]
    );

    expect(fn(2).map(p=>p.id)).toEqual(["p9","p1"]);
    expect(a.circoloPresenze).toBe(1);
    expect(b.circoloPresenze).toBe(1);
    expect(a.visto).toBeUndefined();
    expect(b.visto).toBeUndefined();

    fn(2);
    expect(a.circoloPresenze).toBe(1);
    G.day=3;
    fn(2);
    expect(a.circoloPresenze).toBe(2);
  });

  it("un ricontatto dal Circolo viene spiegato come ricontatto, non come RNG",()=>{
    const target={id:"p7",n:"Nina",origine:"circolo",circoloPresenze:2,strada:{known:true}};
    const G={strada:{},gente:[target]};
    const causa=new Function(
      "G","stradaContattoKey","stradaContattiAttivi","stradaFiduciaValore",
      "stradaFavoriValore","stradaPersonaDaId","stradaAbsDay",
      blocco(strada,"function stradaCausaOpportunita","function stradaRisolviContattoOpportunita")+
        "\nreturn stradaCausaOpportunita;"
    )(
      G,
      n=>"street:"+String(n).toLowerCase(),
      ()=>[],
      ()=>0,
      ()=>0,
      ()=>null,
      ()=>20
    );

    const out=causa({id:"merce-urgente",persona:"Nina"},"mondo");
    expect(out.type).toBe("recontact-circolo");
    expect(out.text).toContain("Nina");
    expect(out.text).toContain("Circolo");
    expect(out.introducedBy).toBeNull();
  });

  it("una faccia già conosciuta in Pizzeria mantiene quella causa narrativa",()=>{
    const target={id:"p8",n:"Nina",origine:"lavoro",origineLuogo:"pizzeria",rel:1};
    const G={strada:{},gente:[target]};
    const causa=new Function(
      "G","stradaContattoKey","stradaContattiAttivi","stradaFiduciaValore",
      "stradaFavoriValore","stradaPersonaDaId","stradaAbsDay",
      blocco(strada,"function stradaCausaOpportunita","function stradaRisolviContattoOpportunita")+
        "\nreturn stradaCausaOpportunita;"
    )(
      G,
      n=>"street:"+String(n).toLowerCase(),
      ()=>[],
      ()=>0,
      ()=>0,
      ()=>null,
      ()=>20
    );

    const out=causa({id:"merce-urgente",persona:"Nina"},"mondo");
    expect(out.type).toBe("known-face");
    expect(out.text).toContain("Pizzeria");
    expect(out.person).toBe(target);
  });

  it("un contatto nuovo arriva tramite una persona reale della rete",()=>{
    const intro={id:"p3",n:"Mauro",rel:3,fiducia:70,favori:1,strada:{known:true}};
    const G={strada:{ingressoPersonaId:intro.id},gente:[intro]};
    const causa=new Function(
      "G","stradaContattoKey","stradaContattiAttivi","stradaFiduciaValore",
      "stradaFavoriValore","stradaPersonaDaId","stradaAbsDay",
      blocco(strada,"function stradaCausaOpportunita","function stradaRisolviContattoOpportunita")+
        "\nreturn stradaCausaOpportunita;"
    )(
      G,
      n=>"street:"+String(n).toLowerCase(),
      ()=>[intro],
      p=>p.fiducia||0,
      p=>p.favori||0,
      id=>G.gente.find(p=>p.id===id)||null,
      ()=>20
    );

    const out=causa({id:"giro-breve",persona:"Rami"},"mondo");
    expect(out.type).toBe("referral");
    expect(out.introducedBy).toBe(intro);
    expect(out.text).toContain("Mauro");
    expect(out.text).toContain("Rami");
    expect(out.text).toContain("ha fatto il tuo nome");
  });

  it("i ponti della rete diventano legami persistenti e le offerte mostrano la causa",()=>{
    expect(strada).toContain('postoCollegaPersone(requester,candidato,"strada-nome")');
    expect(strada).toContain('postoCollegaPersone(a,b,"strada-ponte")');
    expect(strada).toContain('postoCollegaPersone(persona,nuovo,"strada-referral")');
    expect(strada).toContain('postoCollegaPersone(causa.introducedBy,p,"strada-introduzione")');
    expect(strada).toContain('type:"legacy"');
    expect(strada).toContain("prima che il gioco iniziasse a tracciare il passaparola");
    expect(eventi).toContain("Come ci sei arrivato:");
    expect(eventi).toContain("Perché ti cerca:");
    expect(eventi).toContain("networkCauseText");
  });
});
