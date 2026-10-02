import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperStradaFabbrica(){
  const source = leggi("js/game/strada-crimine.js");

  const colpiStart = source.indexOf("const STRADA_CATEGORIE_COLPO");
  const colpiEnd = source.indexOf("const STRADA_COLPI_MILANO", colpiStart);
  const prepDataStart = source.indexOf("const STRADA_APPROCCI = [");
  const prepDataEnd = source.indexOf("const STRADA_ATTIVITA", prepDataStart);
  const cfgStart = source.indexOf("const STRADA_FABBRICA_LEAD");
  const cfgEnd = source.indexOf("/* ==================== LA SCENA IN CORSO", cfgStart);
  const prepStart = source.indexOf("function stradaPreparazioneDaId");
  const prepEnd = source.indexOf("/* ==================== TENTARE UN COLPO", prepStart);
  const giroStart = source.indexOf("function stradaGiroAvviato(){");
  const chanceStart = source.indexOf("function stradaChance", giroStart);
  const chanceEnd = source.indexOf("function stradaLavaggioStato", chanceStart);

  if(colpiStart < 0 || colpiEnd < 0 || prepDataStart < 0 || prepDataEnd < 0 ||
     cfgStart < 0 || cfgEnd < 0 || prepStart < 0 || prepEnd < 0 ||
     giroStart < 0 || chanceStart < 0 || chanceEnd < 0)
    throw new Error("helper proposta Fabbrica/Strada non trovato");

  return source.slice(colpiStart, colpiEnd) + "\n" +
    source.slice(prepDataStart, prepDataEnd) + "\n" +
    source.slice(cfgStart, cfgEnd) + "\n" +
    source.slice(prepStart, prepEnd) + "\n" +
    source.slice(giroStart, chanceEnd);
}

function contestoStrada(overrides = {}){
  const G = {
    year:1,
    week:1,
    day:5,
    job:{id:"operaio",place:"fabbrica",n:"Operaio"},
    gente:[{
      id:"pf1",n:"Luca",ruolo:"collega",origine:"lavoro",origineLuogo:"fabbrica",
      rel:1,pt:0,via:false,circoloSbloccato:true,
      strada:{known:true,key:"intro:pf1",sources:["intro"],opportunityIds:[]}
    }],
    strada:{
      rep:0,
      heat:0,
      sporchi:0,
      uomini:0,
      prot:0,
      ferro:false,
      avvocato:false,
      attivita:{},
      precedenti:0,
      arresto:null,
      giroAvviato:false,
      fabbricaLead:{
        lastCheckAbsoluteDay:null,
        lastOfferAbsoluteDay:null,
        pending:null,
        active:null,
        history:[]
      }
    },
    ...overrides
  };
  const logs = [];
  let personaSeq=0;
  const ctx = {
    G,
    Object,
    Number,
    Math,
    Array,
    Set,
    String,
    window:{},
    nuovaPersona:ruolo=>({
      id:"ps"+(++personaSeq),ruolo,n:"Cobra",rel:0,pt:0,via:false,
      attivita:{},car:"pratico",fama:10,circoloSbloccato:false
    }),
    clamp:(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),
    lavoroLuogo: job => job && job.place || null,
    pushLog:(msg, cls) => logs.push({msg, cls})
  };
  vm.createContext(ctx);
  vm.runInContext(helperStradaFabbrica(), ctx);
  return {ctx, G, logs};
}

describe("Fabbrica × Strada", () => {
  it("non genera proposte criminali a chi non ha già avviato il giro", () => {
    const {ctx} = contestoStrada();

    const out = vm.runInContext("stradaTentaPropostaFabbrica(0,0)", ctx);

    expect(out).toBeNull();
  });

  it("dopo una carriera criminale già avviata può creare una dritta persistente", () => {
    const {ctx, G} = contestoStrada({
      strada:{
        rep:12,
        heat:4,
        sporchi:0,
        uomini:0,
        prot:0,
        ferro:false,
        avvocato:false,
        attivita:{},
        precedenti:0,
        arresto:null,
        giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,
          lastOfferAbsoluteDay:null,
          pending:null,
          active:null,
          history:[]
        }
      }
    });

    const proposta = vm.runInContext("stradaTentaPropostaFabbrica(0,0)", ctx);
    expect(proposta.id).toBe("giro-breve");
    expect(proposta.colpoId).toBe("consegne");
    expect(proposta.personId).toBe("pf1");
    expect(proposta.persona).toBe("Luca");
    expect(proposta.bonusPct).toBe(15);
    expect(proposta.chanceDelta).toBeCloseTo(.08);
    expect(proposta.successHeat).toBe(1);
    expect(proposta.failureHeat).toBe(2);
    expect(proposta.successRep).toBe(1);
    expect(proposta.failureRep).toBe(-1);

    const attiva = vm.runInContext("stradaAccettaPropostaFabbrica()", ctx);
    expect(attiva.status).toBe("active");
    expect(attiva.expiresAbsoluteDay).toBe(12);
    expect(G.strada.fabbricaLead.pending).toBeNull();
    expect(G.strada.fabbricaLead.active.colpoId).toBe("consegne");
  });

  it("un collega reale puo rivelare il suo lato Strada senza cambiare identita",()=>{
    const {ctx,G}=contestoStrada({
      gente:[{
        id:"pf2",n:"Marco",ruolo:"collega",origine:"lavoro",origineLuogo:"fabbrica",
        rel:2,pt:1,via:false,circoloSbloccato:false
      }],
      strada:{
        rep:20,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]}
      }
    });
    const proposta=vm.runInContext("stradaTentaPropostaFabbrica(0,0)",ctx);
    expect(proposta).not.toBeNull();
    expect(proposta.personId).toBe("pf2");
    expect(proposta.persona).toBe("Marco");
    expect(G.gente).toHaveLength(1);
    expect(G.gente[0].ruolo).toBe("collega");
    expect(G.gente[0].strada.known).toBe(true);
    expect(G.gente[0].circoloSbloccato).toBe(true);
  });

  it("la Fabbrica non inventa una faccia criminale se nel posto non esiste nessun contatto reale",()=>{
    const {ctx}=contestoStrada({
      gente:[],
      strada:{
        rep:20,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]}
      }
    });
    expect(vm.runInContext("stradaTentaPropostaFabbrica(0,0)",ctx)).toBeNull();
  });

  it("usa un pool generale ampio e non lega le offerte alla mansione", () => {
    const {ctx} = contestoStrada({
      strada:{
        rep:60,heat:5,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]
        }
      }
    });

    const pool = vm.runInContext("STRADA_OPPORTUNITA.map(x=>({id:x.id,colpoId:x.colpoId,minRep:x.minRep}))", ctx);
    expect(pool).toHaveLength(10);
    expect(new Set(pool.map(x=>x.colpoId))).toEqual(new Set(["consegne","scotta","cassa","macchina"]));

    const testo = vm.runInContext("stradaDescriviOpportunita(STRADA_OPPORTUNITA[0])", ctx);
    expect(testo).toContain("guadagno");
    expect(testo).toContain("riuscita");
    expect(testo).toContain("attenzione");
    expect(testo).toContain("nome nel giro");
  });

  it("un contatto del mondo entra una volta sola in G.gente e viene riusato",()=>{
    const {ctx,G}=contestoStrada({
      gente:[],
      strada:{
        rep:20,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        badgeSbloccato:true,
        traphone:{owned:true,sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:1,source:"test"},
        fabbricaLead:{lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]}
      }
    });
    const a=vm.runInContext('stradaRisolviContattoOpportunita(STRADA_OPPORTUNITA[0],"mondo",false)',ctx);
    const count=G.gente.length;
    const b=vm.runInContext('stradaRisolviContattoOpportunita(STRADA_OPPORTUNITA[0],"mondo",false)',ctx);
    expect(a.id).toBe(b.id);
    expect(G.gente).toHaveLength(count);
    expect(a.strada.known).toBe(true);
    expect(a.strada.opportunityIds).toContain("giro-breve");
    expect(a.circoloSbloccato).toBe(true);
  });

  it("evita di riproporre subito la stessa opportunità", () => {
    const {ctx,G} = contestoStrada({
      strada:{
        rep:30,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]
        }
      }
    });

    const prima=vm.runInContext("stradaTentaPropostaFabbrica(0,0)",ctx);
    expect(prima.id).toBe("giro-breve");
    vm.runInContext("stradaRifiutaPropostaFabbrica()",ctx);

    G.week=3; G.day=5;
    const seconda=vm.runInContext("stradaTentaPropostaFabbrica(0,0)",ctx);
    expect(seconda.id).not.toBe(prima.id);
    expect(G.strada.crimeOpportunity.recentIds).toContain(prima.id);
  });

  it("i modificatori cambiano davvero riuscita e conseguenze del colpo", () => {
    const {ctx} = contestoStrada({
      strada:{
        rep:20,heat:0,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]
        }
      }
    });

    const base=vm.runInContext(`
      stradaChance(
        {difficolta:.30},
        {riuscita:0}
      )
    `,ctx);
    const conBonus=vm.runInContext(`
      stradaChanceConOpportunita(
        {difficolta:.30},
        {riuscita:0},
        {chanceDelta:.10}
      )
    `,ctx);
    expect(conBonus).toBeCloseTo(base+.10);

    const successo=vm.runInContext(`
      stradaEffettiOpportunita({
        source:"street-opportunity",bonusPct:40,
        successHeat:4,failureHeat:7,successRep:4,failureRep:-3
      },true)
    `,ctx);
    const fallimento=vm.runInContext(`
      stradaEffettiOpportunita({
        source:"street-opportunity",bonusPct:40,
        successHeat:4,failureHeat:7,successRep:4,failureRep:-3
      },false)
    `,ctx);

    expect(successo).toEqual({bonusPct:40,heatDelta:4,repDelta:4});
    expect(fallimento).toEqual({bonusPct:40,heatDelta:7,repDelta:-3});
  });

  it("può nascere anche fuori dal lavoro e usa un cooldown dedicato", () => {
    const {ctx,G} = contestoStrada({
      job:null,
      strada:{
        rep:20,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]
        }
      }
    });

    const proposta=vm.runInContext('stradaTentaOpportunita("mondo",0,0)',ctx);
    expect(proposta).not.toBeNull();
    expect(proposta.trigger).toBe("mondo");
    expect(G.strada.crimeOpportunity.nextOfferAbsoluteDay).toBe(15);

    vm.runInContext("stradaRifiutaOpportunita()",ctx);
    G.week=2; G.day=7; // giorno assoluto 14
    expect(vm.runInContext('stradaTentaOpportunita("mondo",0,0)',ctx)).toBeNull();

    G.week=3; G.day=1; // giorno assoluto 15
    expect(vm.runInContext('stradaTentaOpportunita("mondo",0,0)',ctx)).not.toBeNull();
  });

  it("i controlli Fabbrica e mondo non si bruciano a vicenda nello stesso giorno", () => {
    const {ctx} = contestoStrada({
      strada:{
        rep:20,heat:2,sporchi:0,uomini:0,prot:0,ferro:false,avvocato:false,
        attivita:{},precedenti:0,arresto:null,giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,lastOfferAbsoluteDay:null,pending:null,active:null,history:[]
        }
      }
    });

    expect(vm.runInContext('stradaTentaOpportunita("mondo",.99,0)',ctx)).toBeNull();
    const dallaFabbrica=vm.runInContext('stradaTentaOpportunita("fabbrica",0,0)',ctx);
    expect(dallaFabbrica).not.toBeNull();
    expect(dallaFabbrica.trigger).toBe("fabbrica");
  });

  it("rifiutare non dà effetti ma applica il cooldown di 14 giorni", () => {
    const {ctx, G} = contestoStrada({
      strada:{
        rep:20,
        heat:1,
        sporchi:0,
        uomini:0,
        prot:0,
        ferro:false,
        avvocato:false,
        attivita:{},
        precedenti:0,
        arresto:null,
        giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,
          lastOfferAbsoluteDay:null,
          pending:null,
          active:null,
          history:[]
        }
      }
    });

    expect(vm.runInContext("stradaTentaPropostaFabbrica(0,0)", ctx)).not.toBeNull();
    expect(vm.runInContext("stradaRifiutaPropostaFabbrica()", ctx).status).toBe("declined");

    G.day = 6;
    expect(vm.runInContext("stradaTentaPropostaFabbrica(0,0)", ctx)).toBeNull();

    G.week = 3;
    G.day = 5;
    expect(vm.runInContext("stradaTentaPropostaFabbrica(0,0)", ctx)).not.toBeNull();
  });

  it("la dritta scade col calendario e produce un log reale", () => {
    const {ctx, G, logs} = contestoStrada({
      strada:{
        rep:50,
        heat:10,
        sporchi:0,
        uomini:0,
        prot:0,
        ferro:false,
        avvocato:false,
        attivita:{},
        precedenti:0,
        arresto:null,
        giroAvviato:true,
        fabbricaLead:{
          lastCheckAbsoluteDay:null,
          lastOfferAbsoluteDay:null,
          pending:null,
          active:null,
          history:[]
        }
      }
    });

    vm.runInContext("stradaTentaPropostaFabbrica(0,0); stradaAccettaPropostaFabbrica();", ctx);

    G.week = 2;
    G.day = 6; // giorno assoluto 13, oltre la scadenza 12
    expect(vm.runInContext("stradaAggiornaPropostaFabbrica(false)", ctx)).toBeNull();
    expect(G.strada.fabbricaLead.active).toBeNull();
    expect(logs.some(x => x.msg.includes("opportunità della Strada è scaduta"))).toBe(true);
  });

  it("il Circolo gestisce anche ruoli di vita/Strada senza consumare gli slot del cast musicale",()=>{
    const posto=leggi("js/game/posto.js");
    const circolo=leggi("js/game/circolo-stanze.js");
    expect(posto).toContain("const DIALOGHI_VITA");
    expect(posto).toContain("DIALOGHI[p.ruolo] || DIALOGHI_VITA");
    expect(posto).toContain("!(p.strada && p.strada.known)");
    expect(circolo).toContain("Sai che è collegato alla Strada");
    expect(circolo).toContain("strada:{aperto:");
  });

  it("collega popup fuori dal cancello, timer e bonus al colpo reale", () => {
    const eventi = leggi("js/game/eventi-v2.js");
    const strada = leggi("js/game/strada-crimine.js");
    const stato = leggi("js/game/state.js");

    expect(eventi).toContain("function adfFactoryStreetAfterShift()");
    expect(eventi).toContain('k:"Fuori dalla Fabbrica"');
    expect(eventi).toContain('n:"Sentiamo"');
    expect(eventi).toContain("function adfStreetOpportunityDecision(proposta)");
    expect(eventi).toContain('n:"Accetta"');
    expect(eventi).toContain('claimAutoEvent("factory-street")');
    expect(eventi).toContain("stradaAggiornaPropostaFabbrica(false)");
    expect(eventi).toContain('const streetShown = a.id==="turno" && !overtimeShown');
    expect(eventi).toContain("!overtimeShown && !streetShown && !workFamilyShown && !contactShown");
    expect(eventi).toContain("Il lavoro non c'entra: è semplicemente dove vi siete incrociati.");
    expect(eventi).toContain("function adfStreetOpportunityAfterAction(a)");
    expect(eventi).toContain('stradaTentaOpportunita("mondo",Math.random(),Math.random())');
    expect(eventi).toContain('const streetOpportunityShown = a.id!=="turno"');

    expect(strada).toContain("const STRADA_OPPORTUNITA = Object.freeze([");
    expect(strada).toContain("stradaChanceConOpportunita");
    expect(strada).toContain("stradaEffettiOpportunita");
    expect(strada).toContain("successRep");
    expect(strada).toContain("failureRep");
    expect(strada).toContain("successHeat");
    expect(strada).toContain("failureHeat");
    expect(strada).toContain("stradaConsumaOpportunita(colpoId, successo)");
    expect(stato).toContain("fabbricaLead:{lastCheckAbsoluteDay:null");
  });
});
