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
  const gateStart=source.indexOf("function stradaUscitaStato(){");
  const gateEnd=source.indexOf("function stradaProfonditaUscita(){",gateStart);
  const start=source.indexOf("function stradaAbsDay(){");
  const end=source.indexOf("function stradaOpportunitaStato(){",start);
  if(gateStart<0 || gateEnd<0 || start<0 || end<0)
    throw new Error("helper ingresso Strada non trovato");
  return source.slice(gateStart,gateEnd)+"\n"+source.slice(start,end);
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
    window:{},
    STRADA_FERRO_REP_MIN:20,
    STRADA_FERRO_FIDUCIA_MIN:50,
    STRADA_FERRO_COSTO:1200,
    STRADA_PROT:[
      {n:"Nessuna",costo:0},
      {n:"Occhi in giro",costo:260},
      {n:"Uomini fissi",costo:620},
      {n:"Scorta",costo:1450}
    ],
    STRADA_AVVOCATO_COSTO:320,
    renderStrada:()=>{},
    renderGioco:()=>{},
    stToast:()=>{}
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
    expect(G.gente[0].ruolo).toBe("rider");
    expect(G.gente[0].strada.known).toBe(true);
    expect(G.gente[0].strada.sources).toContain("intro");
    expect(G.gente[0].strada.fiducia).toBe(13);
    expect(vm.runInContext("stradaFiduciaEtichetta(G.gente[0])",ctx)).toBe("ti conosce");
    expect(G.gente[0].circoloSbloccato).toBe(true);
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
    expect(G.gente[0].strada.fiducia).toBe(10);
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

  it("una persona del lavoro mantiene il suo ruolo quando si scopre il lato Strada",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"p9",n:"Teo",ruolo:"rider",origine:"lavoro",origineLuogo:"pizzeria",rel:1,pt:0,circoloSbloccato:false}]
    });
    const p=vm.runInContext('stradaSegnaPersona(G.gente[0],{key:"intro:p9",source:"intro"})',ctx);
    expect(p.id).toBe("p9");
    expect(p.ruolo).toBe("rider");
    expect(p.strada.known).toBe(true);
    expect(p.circoloSbloccato).toBe(true);
  });

  it("amicizia e fiducia criminale restano separate",()=>{
    const {ctx,G}=contesto({
      gente:[
        {id:"social",n:"Amico",ruolo:"collega",rel:5,pt:99,via:false,
          strada:{known:true,key:"street:social",sources:["opportunity"],opportunityIds:[],fiducia:8}},
        {id:"trusted",n:"Fidato",ruolo:"strada",rel:0,pt:0,via:false,
          strada:{known:true,key:"street:trusted",sources:["opportunity"],opportunityIds:[],fiducia:25}}
      ]
    });
    const ids=vm.runInContext("stradaPersoneSquadra().map(p=>p.id)",ctx);
    expect(ids).toEqual(["trusted"]);
    expect(vm.runInContext("stradaFiduciaEtichetta(G.gente[0])",ctx)).toBe("appena entrati in contatto");
    expect(vm.runInContext("stradaFiduciaEtichetta(G.gente[1])",ctx)).toBe("si fida");
  });

  it("i contatti legacy migrano la fiducia solo da fatti criminali già salvati",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"old",n:"Old",ruolo:"strada",rel:5,pt:99,via:false,
        strada:{known:true,key:"street:old",sources:["intro"],opportunityIds:["a","b"]}}]
    });
    expect(vm.runInContext("stradaFiduciaValore(G.gente[0])",ctx)).toBe(30);
    expect(G.gente[0].strada.fiduciaEventi).toEqual([]);
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

  it("l'approccio di squadra usa persone reali e non il vecchio contatore uomini",()=>{
    const strada=leggi("js/game/strada-crimine.js");
    expect(strada).toContain("function stScenaPersonaSquadra(colpo,preparazione)");
    expect(strada).toContain('personaSquadraId');
    expect(strada).toContain('nessuno si fida abbastanza');
    expect(strada).toContain('stradaPersonaSquadra(personaSquadraId)');
    expect(strada).toContain('stradaBonusFiduciaSquadra(personaSquadra)');
    expect(strada).not.toContain('if(approccio.serveUomo && s.uomini <= 0)');
    expect(strada).not.toContain('s.uomini--');
    expect(strada).toContain("const fidati=stradaPersoneSquadra()");
    expect(strada).toContain('"Chiami "+chiamabile.n');
    expect(strada).toContain("Persone del giro (");
    expect(strada).toContain("Non puoi comprare la fiducia di qualcuno");
  });

  it("gli uomini legacy non danno piu bonus ne costi invisibili",()=>{
    const strada=leggi("js/game/strada-crimine.js");
    expect(strada).not.toContain("p += Math.min(s.uomini, 5) * .025");
    expect(strada).not.toContain("return s.uomini * STRADA_UOMO_UPKEEP");
    expect(strada).toContain("Gli uomini numerici sono solo compatibilità legacy");
  });

  it("il ferro richiede un contatto molto fidato e conserva chi lo procura",()=>{
    const {ctx,G}=contesto({
      money:2000,
      gente:[{id:"f1",n:"Nico",ruolo:"strada",rel:0,pt:0,via:false,
        strada:{known:true,key:"street:nico",sources:["opportunity"],opportunityIds:["a"],fiducia:55,colpiInsieme:2}}],
      strada:{
        rep:25,heat:10,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        traphone:{owned:true,source:"test"},
        ferroStato:{sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:null,source:null,lastCheckAbsoluteDay:null,nextOfferAbsoluteDay:null,pending:null,history:[]}
      }
    });
    ctx.stradaGiroAvviato=()=>true;
    ctx.stradaHaTrapPhone=()=>true;
    const proposta=vm.runInContext("stradaTentaPropostaFerro(0)",ctx);
    expect(proposta.personId).toBe("f1");
    expect(proposta.persona).toBe("Nico");
    const out=vm.runInContext("stradaAccettaFerro()",ctx);
    expect(out.ok).toBe(true);
    expect(G.strada.ferro).toBe(true);
    expect(G.strada.ferroStato.sourcePersonId).toBe("f1");
    expect(G.strada.ferroStato.sourceName).toBe("Nico");
    expect(G.strada.ferroStato.source).toBe("trusted-contact");
    expect(G.gente[0].strada.fiducia).toBe(59);
    expect(G.money).toBe(800);
  });

  it("senza fiducia o reputazione il ferro non viene proposto",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"f1",n:"Nico",ruolo:"strada",via:false,
        strada:{known:true,key:"street:nico",sources:[],opportunityIds:[],fiducia:49,colpiInsieme:2}}],
      strada:{
        rep:25,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        traphone:{owned:true,source:"test"},
        ferroStato:{sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:null,source:null,lastCheckAbsoluteDay:null,nextOfferAbsoluteDay:null,pending:null,history:[]}
      }
    });
    ctx.stradaGiroAvviato=()=>true;
    ctx.stradaHaTrapPhone=()=>true;
    expect(vm.runInContext("stradaTentaPropostaFerro(0)",ctx)).toBeNull();
    G.gente[0].strada.fiducia=60;
    G.strada.rep=19;
    G.strada.ferroStato.lastCheckAbsoluteDay=null;
    expect(vm.runInContext("stradaTentaPropostaFerro(0)",ctx)).toBeNull();
  });

  it("rifiutare il ferro richiude la porta per due settimane",()=>{
    const {ctx,G}=contesto({
      gente:[{id:"f1",n:"Nico",ruolo:"strada",via:false,
        strada:{known:true,key:"street:nico",sources:[],opportunityIds:[],fiducia:60,colpiInsieme:2}}],
      strada:{
        rep:25,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        traphone:{owned:true,source:"test"},
        ferroStato:{sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:null,source:null,lastCheckAbsoluteDay:null,nextOfferAbsoluteDay:null,pending:null,history:[]}
      }
    });
    ctx.stradaGiroAvviato=()=>true;
    ctx.stradaHaTrapPhone=()=>true;
    vm.runInContext("stradaTentaPropostaFerro(0)",ctx);
    vm.runInContext("stradaRifiutaFerro()",ctx);
    expect(G.strada.ferro).toBe(false);
    expect(G.strada.ferroStato.pending).toBeNull();
    expect(G.strada.ferroStato.nextOfferAbsoluteDay).toBe(15);
  });

  it("il ferro non è più acquistabile direttamente dalla schermata e il possesso aumenta il rischio controllo",()=>{
    const strada=leggi("js/game/strada-crimine.js");
    const eventi=leggi("js/game/eventi-v2.js");
    expect(strada).toContain("Non è merce da scaffale");
    expect(strada).toContain("function stradaTentaPropostaFerro");
    expect(strada).toContain("STRADA_FERRO_FIDUCIA_MIN = 50");
    expect(strada).toContain("function stradaHeatRischioControllo()");
    expect(strada).toContain("const rischioControllo=stradaHeatRischioControllo();");
    expect(strada).toContain('status:"seized"');
    expect(strada).toContain('status:"seized-on-crime"');
    expect(strada).toContain("ferroSt.nextOfferAbsoluteDay=stradaAbsDay()+30");
    expect(eventi).toContain("adfStreetFerroAfterAction");
    expect(eventi).toContain("stradaAccettaFerro()");
    expect(eventi).toContain("TRAPHONE16.receiveStorySms");
  });

  it("la protezione richiede una persona reale abbastanza fidata e paga la prima settimana subito",()=>{
    const {ctx,G}=contesto({
      money:2000,
      gente:[{id:"p1",n:"Luca",ruolo:"collega",via:false,
        strada:{known:true,key:"intro:p1",sources:["intro"],opportunityIds:[],fiducia:55,colpiInsieme:2}}],
      strada:{
        rep:30,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        protezioneStato:{providerPersonId:null,providerName:null,level:0,source:null,prepaidWeekKey:null,history:[]}
      }
    });
    const out=vm.runInContext('stImpostaProtezione(2,"p1")',ctx);
    expect(out).toContain("Luca");
    expect(G.strada.prot).toBe(2);
    expect(G.strada.protezioneStato.providerPersonId).toBe("p1");
    expect(G.strada.protezioneStato.providerName).toBe("Luca");
    expect(G.strada.protezioneStato.source).toBe("trusted-contact");
    expect(G.strada.protezioneStato.prepaidWeekKey).toBe("1-1");
    expect(G.money).toBe(1380);
  });

  it("senza reputazione o fiducia non puoi attivare protezione avanzata",()=>{
    const {ctx,G}=contesto({
      money:5000,
      gente:[{id:"p1",n:"Luca",ruolo:"strada",via:false,
        strada:{known:true,key:"street:luca",sources:[],opportunityIds:[],fiducia:49,colpiInsieme:2}}],
      strada:{
        rep:24,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        protezioneStato:{providerPersonId:null,providerName:null,level:0,source:null,prepaidWeekKey:null,history:[]}
      }
    });
    const out=vm.runInContext('stImpostaProtezione(2,"p1")',ctx);
    expect(out).toContain("nome non gira ancora abbastanza");
    expect(G.strada.prot).toBe(0);
    G.strada.rep=30;
    const out2=vm.runInContext('stImpostaProtezione(2,"p1")',ctx);
    expect(out2).toContain("Non hai una persona");
    expect(G.strada.prot).toBe(0);
  });

  it("l'avvocato privato è una persona conosciuta e non un toggle",()=>{
    const {ctx,G}=contesto({
      money:1000,
      gente:[{id:"law1",n:"Avv. Riva",ruolo:"avvocato",via:false,rel:2,pt:0}],
      strada:{
        rep:15,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,badgeSbloccato:true,
        avvocatoStato:{personId:null,name:null,retained:false,source:null,prepaidWeekKey:null,history:[]}
      }
    });
    expect(vm.runInContext("stradaAvvocatiConosciuti().map(p=>p.id)",ctx)).toEqual(["law1"]);
    const out=vm.runInContext('stIncaricaAvvocato("law1")',ctx);
    expect(out).toContain("Avv. Riva");
    expect(G.strada.avvocato).toBe(true);
    expect(G.strada.avvocatoStato.personId).toBe("law1");
    expect(G.strada.avvocatoStato.name).toBe("Avv. Riva");
    expect(G.strada.avvocatoStato.source).toBe("relationship");
    expect(G.strada.avvocatoStato.prepaidWeekKey).toBe("1-1");
    expect(G.gente[0].numero).toBe(true);
    expect(G.money).toBe(680);
  });

  it("protezione e avvocato legacy vengono migrati senza sparire",()=>{
    const {ctx,G}=contesto();
    G.strada.prot=2;
    G.strada.avvocato=true;
    delete G.strada.protezioneStato;
    delete G.strada.avvocatoStato;
    expect(vm.runInContext("stradaProtezioneStato().source",ctx)).toBe("legacy");
    expect(vm.runInContext("stradaAvvocatoStato().source",ctx)).toBe("legacy");
    expect(G.strada.prot).toBe(2);
    expect(G.strada.avvocato).toBe(true);
  });

  it("UI V2 e carcere non usano più protezione o avvocato come shop istantanei",()=>{
    const strada=leggi("js/game/strada-crimine.js");
    const crimeUi=leggi("js/game/strada-crimine-ui.js");
    const posto=leggi("js/game/posto.js");
    const circolo=leggi("js/game/circolo-stanze.js");
    expect(strada).toContain("function stScenaProtezione()");
    expect(strada).toContain("function stScenaAvvocato()");
    expect(strada).toContain("difensore d'ufficio");
    expect(strada).toContain("Math.random()<.35");
    expect(strada).toContain("Il primo costo si paga subito");
    expect(crimeUi).toContain("stScenaProtezione()");
    expect(crimeUi).toContain("stScenaAvvocato()");
    expect(crimeUi).toContain("stCompraFerro()");
    expect(crimeUi).not.toContain("stImpostaProtezione((before+1)%STRADA_PROT.length)");
    expect(crimeUi).not.toContain("stToggleAvvocato()");
    expect(crimeUi).not.toContain('id="gun" type="button">900 €');
    expect(posto).toContain('avvocato: {n:"Avvocato"');
    expect(posto).toContain('p.ruolo!=="avvocato"');
    expect(circolo).toContain("avvocato:{aperto:");
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
