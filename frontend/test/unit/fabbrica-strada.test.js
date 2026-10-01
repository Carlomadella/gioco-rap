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

  const cfgStart = source.indexOf("const STRADA_FABBRICA_LEAD");
  const cfgEnd = source.indexOf("/* ==================== LA SCENA IN CORSO", cfgStart);
  const giroStart = source.indexOf("function stradaGiroAvviato(){");
  const chanceStart = source.indexOf("function stradaChance", giroStart);

  if(cfgStart < 0 || cfgEnd < 0 || giroStart < 0 || chanceStart < 0)
    throw new Error("helper proposta Fabbrica/Strada non trovato");

  return source.slice(cfgStart, cfgEnd) + "\n" + source.slice(giroStart, chanceStart);
}

function contestoStrada(overrides = {}){
  const G = {
    year:1,
    week:1,
    day:5,
    job:{id:"operaio",place:"fabbrica",n:"Operaio"},
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
  const ctx = {
    G,
    Object,
    Number,
    Math,
    Array,
    Set,
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
    expect(proposta.colpoId).toBe("consegne");
    expect(proposta.bonusPct).toBe(20);
    expect(proposta.extraHeat).toBe(2);

    const attiva = vm.runInContext("stradaAccettaPropostaFabbrica()", ctx);
    expect(attiva.status).toBe("active");
    expect(attiva.expiresAbsoluteDay).toBe(12);
    expect(G.strada.fabbricaLead.pending).toBeNull();
    expect(G.strada.fabbricaLead.active.colpoId).toBe("consegne");
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
    expect(logs.some(x => x.msg.includes("proposta fuori dalla Fabbrica è scaduta"))).toBe(true);
  });

  it("collega popup fuori dal cancello, timer e bonus al colpo reale", () => {
    const eventi = leggi("js/game/eventi-v2.js");
    const strada = leggi("js/game/strada-crimine.js");
    const stato = leggi("js/game/state.js");

    expect(eventi).toContain("function adfFactoryStreetAfterShift()");
    expect(eventi).toContain('k:"Fuori dalla Fabbrica"');
    expect(eventi).toContain('t:"Ti aspetta al cancello"');
    expect(eventi).toContain('claimAutoEvent("factory-street")');
    expect(eventi).toContain("stradaAggiornaPropostaFabbrica(false)");
    expect(eventi).toContain('const streetShown = a.id==="turno" && !overtimeShown');
    expect(eventi).toContain("!overtimeShown && !streetShown && !workFamilyShown && !contactShown");

    expect(strada).toContain("moltiplicatoreLead");
    expect(strada).toContain("rumoreLead");
    expect(strada).toContain("Dritta Fabbrica +");
    expect(strada).toContain("stradaConsumaPropostaFabbrica(colpoId, successo)");
    expect(stato).toContain("fabbricaLead:{lastCheckAbsoluteDay:null");
  });
});
