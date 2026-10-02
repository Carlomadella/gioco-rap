import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperIngresso(){
  const source=leggi("js/game/strada-crimine.js");
  const start=source.indexOf("function stradaAbsDay(){");
  const end=source.indexOf("function stradaOpportunitaStato(){",start);
  if(start<0 || end<0) throw new Error("helper ingresso Strada non trovato");
  return source.slice(start,end);
}

function contesto(overrides={}){
  const G={
    year:1,week:1,day:1,energy:100,money:500,
    diario:{colpi:0},
    gente:[],
    strada:{
      rep:0,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
      attivita:{},precedenti:0,arresto:null,giroAvviato:false,
      badgeSbloccato:false,ingressoFase:"locked",ingressoPersonaId:null,
      ingressoPersonaNome:null,ingressoTentativi:0,
      ingressoLastOfferAbsoluteDay:null,ingressoNextOfferAbsoluteDay:null
    }
  };
  Object.assign(G,overrides);
  const logs=[];
  const ctx={
    G,Object,Number,Math,Array,Set,
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    fmt:v=>String(Math.round(Number(v)||0)),
    diarioBordo:()=>G.diario,
    pushLog:(msg,cls)=>logs.push({msg,cls}),
    save:()=>{},
    window:{}
  };
  vm.createContext(ctx);
  vm.runInContext(helperIngresso(),ctx);
  return {ctx,G,logs};
}

describe("Strada · ingresso nascosto",()=>{
  it("una nuova partita non ha badge e senza persone reali non riceve proposte",()=>{
    const {ctx,G}=contesto();
    expect(vm.runInContext("stradaAttivitaSbloccate()",ctx)).toBe(false);
    expect(vm.runInContext("stradaTentaIngresso(0,0)",ctx)).toBeNull();
    expect(G.strada.badgeSbloccato).toBe(false);
  });

  it("la strana proposta arriva da una persona persistente gia incontrata",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"p1",n:"Milo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria",rel:0,pt:0}]
    });
    const proposta=vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    expect(proposta.personId).toBe("p1");
    expect(proposta.persona).toBe("Milo");
    expect(proposta.step).toBe(1);
    expect(G.strada.ingressoFase).toBe("offered");
    expect(G.strada.badgeSbloccato).toBe(false);
  });

  it("rifiutare non apre la Strada e applica un cooldown",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"p1",n:"Milo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria"}]
    });
    vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    vm.runInContext("stradaRifiutaIngresso()",ctx);
    expect(G.strada.badgeSbloccato).toBe(false);
    expect(G.strada.giroAvviato).toBe(false);
    expect(G.strada.ingressoNextOfferAbsoluteDay).toBe(8);
  });

  it("due favori aprono il badge ma durante l'ingresso un fallimento non arresta",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"p1",n:"Milo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria"}]
    });

    vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    const primo=vm.runInContext("stradaAccettaIngresso(0,.5)",ctx);
    expect(primo.success).toBe(true);
    expect(primo.unlocked).toBe(false);
    expect(G.strada.ingressoTentativi).toBe(1);
    expect(G.strada.badgeSbloccato).toBe(false);
    expect(G.strada.arresto).toBeNull();

    G.day=4;
    vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    const secondo=vm.runInContext("stradaAccettaIngresso(.99,.5)",ctx);
    expect(secondo.success).toBe(false);
    expect(secondo.unlocked).toBe(true);
    expect(G.strada.badgeSbloccato).toBe(true);
    expect(G.strada.giroAvviato).toBe(true);
    expect(secondo.trapPhoneAcquired).toBe(true);
    expect(G.strada.traphone.owned).toBe(true);
    expect(G.strada.traphone.sourcePersonId).toBe("p1");
    expect(G.strada.traphone.sourceName).toBe("Milo");
    expect(G.strada.traphone.source).toBe("intro");
    expect(G.strada.arresto).toBeNull();
    expect(G.strada.precedenti).toBe(0);
  });

  it("se manca energia la proposta resta pendente e non conta come favore",()=>{
    const {ctx,G}=contesto({
      energy:2,
      gente:[{id:"p1",n:"Milo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria"}]
    });
    vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    const out=vm.runInContext("stradaAccettaIngresso(0,0)",ctx);
    expect(out.ok).toBe(false);
    expect(G.strada.ingressoTentativi).toBe(0);
    expect(G.strada.ingressoPending).toBeTruthy();
  });

  it("un salvataggio a meta ingresso conserva il vero contatto che consegna il TrapPhone",()=>{
    const {ctx,G}=contesto({
      day:4,
      gente:[{id:"p1",n:"Milo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria"}],
      strada:{
        rep:1,heat:2,sporchi:80,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:false,
        badgeSbloccato:false,ingressoFase:"contact",ingressoPersonaId:"p1",
        ingressoPersonaNome:"Milo",ingressoTentativi:1,
        ingressoLastOfferAbsoluteDay:null,ingressoNextOfferAbsoluteDay:4
      }
    });
    expect(G.strada.traphone).toBeUndefined();
    vm.runInContext("stradaTentaIngresso(0,0)",ctx);
    const out=vm.runInContext("stradaAccettaIngresso(0,.5)",ctx);
    expect(out.unlocked).toBe(true);
    expect(out.trapPhoneAcquired).toBe(true);
    expect(G.strada.traphone.sourcePersonId).toBe("p1");
    expect(G.strada.traphone.sourceName).toBe("Milo");
    expect(G.strada.traphone.source).toBe("intro");
  });

  it("migra i salvataggi legacy senza richiudere una carriera gia avviata",()=>{
    const {ctx,G}=contesto();
    delete G.strada.badgeSbloccato;
    delete G.strada.traphone;
    G.strada.giroAvviato=true;
    expect(vm.runInContext("stradaAttivitaSbloccate()",ctx)).toBe(true);
    expect(G.strada.badgeSbloccato).toBe(true);
    expect(vm.runInContext("stradaHaTrapPhone()",ctx)).toBe(true);
    expect(G.strada.traphone.source).toBe("legacy");
  });

  it("il TrapPhone e la sua UI rispettano il possesso reale",()=>{
    const ui=leggi("js/game/strada-crimine-ui.js");
    const trap=leggi("js/game/traphone16.js");
    expect(ui).toContain('trapDock.hidden=!trapOwned');
    expect(ui).toContain('hasTrapPhone:');
    expect(trap).toContain("function trapOwned()");
    expect(trap).toContain("function acquire(meta)");
    expect(trap).toContain("function receiveStorySms(data)");
    expect(trap).toContain("if(!trapOwned()) return null");
    expect(trap).toContain("receiveStorySms,");
    expect(trap).toContain("acquire,");
    expect(leggi("js/game/eventi-v2.js")).toContain("TRAPHONE16.receiveStorySms");
  });

  it("hub e colpo rapido rispettano lo stesso gate",()=>{
    const hub=leggi("js/game/hub.js");
    const strada=leggi("js/game/strada-crimine.js");
    expect(hub).toContain("HUB_LUOGHI.filter(hubLuogoVisibile)");
    expect(hub).toContain('e.id!=="colpo" || hubCrimineSbloccato()');
    expect(strada).toContain("if(!stradaAttivitaSbloccate())");
    expect(strada).toContain("const ingressoProtetto = !stradaAttivitaSbloccate()");
    expect(strada).toContain('if(trigger==="mondo" && !stradaHaTrapPhone()) return null');
  });
});
