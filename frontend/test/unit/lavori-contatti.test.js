import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");

function helperLavoro(){
  const source = leggi("js/game/actions.js");
  const start = source.indexOf("/* ================= LAVORO PER LUOGO =================");
  const end = source.indexOf("/* Cosa determina davvero la qualità", start);
  if(start < 0 || end < 0) throw new Error("helper lavoro per luogo non trovato");
  return source.slice(start, end);
}

function contesto(G, extra = {}){
  const ctx = { G, Number, Math, Array, Object, Set, ...extra };
  ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
  vm.createContext(ctx);
  vm.runInContext(helperLavoro(), ctx);
  return ctx;
}

describe("identità sociale dei lavori", () => {
  it("differenzia davvero i bacini di contatti", () => {
    const ctx = contesto({year:1,week:1,day:1,strada:{giroAvviato:false}});

    const out = vm.runInContext(
      '({fabbrica:ADF_LAVORO_RETE.fabbrica,barista:ADF_LAVORO_RETE.barista,fonico:ADF_LAVORO_RETE.fonico,buttafuori:ADF_LAVORO_RETE.buttafuori,fattorino:ADF_LAVORO_RETE.fattorino})',
      ctx
    );

    expect(out.barista.chanceIncontro).toBeGreaterThan(out.fabbrica.chanceIncontro);
    expect(Array.from(out.barista.ruoli)).toContain("promoter");
    expect(Array.from(out.barista.ruoli)).toContain("rapper");

    expect(Array.from(out.fonico.ruoli)).toContain("beatmaker");
    expect(Array.from(out.fonico.ruoli)).toContain("fonico");
    expect(Array.from(out.fonico.ruoli)).not.toContain("strada");
    expect(Array.from(out.fabbrica.ruoli)).toContain("collega");

    expect(Array.from(out.buttafuori.ruoli)).toContain("promoter");
    expect(Array.from(out.buttafuori.ruoli)).toContain("strada");

    expect(new Set(Array.from(out.fattorino.ruoli)).size).toBeGreaterThanOrEqual(5);
    expect(out.fabbrica.maxContatti).toBeLessThan(out.barista.maxContatti);
    expect(out.fabbrica.cooldownGiorni).toBeGreaterThan(out.barista.cooldownGiorni);
  });

  it("non espone contatti Strada finché il giro non è stato avviato", () => {
    const ctx = contesto({
      year:1,week:1,day:1,
      strada:{giroAvviato:false}
    });

    const chiusi = vm.runInContext(
      'lavoroReteRuoli({id:"buttafuori"}, lavoroReteDef({id:"buttafuori"}))',
      ctx
    );
    expect(Array.from(chiusi)).not.toContain("strada");

    ctx.G.strada.giroAvviato = true;
    const aperti = vm.runInContext(
      'lavoroReteRuoli({id:"buttafuori"}, lavoroReteDef({id:"buttafuori"}))',
      ctx
    );
    expect(Array.from(aperti)).toContain("strada");
  });

  it("salva la rete dei lavori normali nello stesso strato persistente dei luoghi", () => {
    const chiamate = [];
    const persona = {
      id:"p-bar-1",
      ruolo:"promoter",
      origineLuogo:"barista",
      numero:false,
      via:false
    };
    const ctx = contesto({
      year:1,week:1,day:1,
      job:{id:"barista",n:"Barista",pay:130,e:18},
      gente:[],
      strada:{giroAvviato:false}
    }, {
      postoContattoLavoroCandidato:(luogo, ripresa, max, ruoli, meta) => {
        chiamate.push({luogo, ripresa, max, ruoli:Array.from(ruoli), meta});
        return persona;
      }
    });

    const out = vm.runInContext(
      'lavoroTentaIncontroContatto("barista",0,G.job)',
      ctx
    );

    expect(out.id).toBe("p-bar-1");
    expect(chiamate).toHaveLength(1);
    expect(chiamate[0].luogo).toBe("barista");
    expect(chiamate[0].ruoli).toContain("promoter");
    expect(chiamate[0].meta.jobId).toBe("barista");
    expect(ctx.G.workplaces.barista.network.encounters).toBe(1);
    expect(ctx.G.workplaces.barista.network.turniVisti).toBe(1);
    expect(ctx.G.workplaces.barista.network.history[0].jobId).toBe("barista");

    const doppio = vm.runInContext(
      'lavoroTentaIncontroContatto("barista",0,G.job)',
      ctx
    );
    expect(doppio).toBeNull();
    expect(chiamate).toHaveLength(1);
  });

  it("una promozione in Fabbrica continua a usare la rete del luogo col profilo del nuovo ruolo", () => {
    const ctx = contesto({
      year:1,week:1,day:1,
      job:{id:"capoturno",place:"fabbrica",n:"Capoturno",pay:300,e:38},
      strada:{giroAvviato:false}
    });

    expect(vm.runInContext("lavoroReteChiave(G.job)", ctx)).toBe("fabbrica");
    expect(vm.runInContext("lavoroReteDef(G.job).roleId", ctx)).toBe("capoturno");
    expect(vm.runInContext("lavoroReteDef(G.job).maxContatti", ctx)).toBe(7);
  });

  it("le persone di lavoro usano ruoli reali e chat compatibili", () => {
    const posto = leggi("js/game/posto.js");
    const chat = leggi("js/game/chat.js");
    const telefono = leggi("js/game/telefono.js");

    expect(posto).toContain('promoter: {n:"Promoter"');
    expect(posto).toContain('cliente: {n:"Cliente abituale"');
    expect(posto).toContain('fornitore: {n:"Fornitore"');
    expect(posto).toContain('rider: {n:"Rider"');
    expect(posto).toContain('collega: {n:"Collega"');
    expect(posto).toContain('strada: {n:"Conoscenza della Strada"');
    expect(posto).toContain("p.origineLavoro = meta.jobId || luogo;");
    expect(posto).toContain("function postoContattoLavoroCandidato(luogo, daRiprendere, maxContatti, ruoli, meta)");

    expect(chat).toContain('const CHAT_MESTIERI_LAVORO = ["rapper","promoter","collega","cliente","fornitore","rider","strada"]');
    expect(chat).toContain("function chatSpuntiLavoroGenerici(p)");
    expect(chat).toContain('p.ruolo === "promoter"');
    expect(chat).toContain('p.ruolo === "collega"');
    expect(chat).toContain('p.ruolo === "strada"');
    expect(telefono).toContain('promoter:"Promoter"');
    expect(telefono).toContain('cliente:"Cliente abituale"');
    expect(telefono).toContain('fornitore:"Fornitore"');
    expect(telefono).toContain('rider:"Rider"');
    expect(telefono).toContain('collega:"Collega"');
    expect(telefono).toContain('strada:"Conoscenza della Strada"');
    expect(telefono).toContain('data-chat="sala:' + "' + p.id + '" + '"');
    expect(telefono).toContain('disabled aria-disabled="true"');
  });

  it("l'incontro nasce a fine turno e passa dall'arbitro eventi", () => {
    const eventi = leggi("js/game/eventi-v2.js");

    expect(eventi).toContain("function adfWorkContactAfterShift()");
    expect(eventi).toContain('claimAutoEvent("work-contact")');
    expect(eventi).toContain('lavoroTentaIncontroContatto(chiave,Math.random(),G.job)');
    expect(eventi).toContain('const contactShown = a.id==="turno" && !overtimeShown && !factoryIntroShown && !streetShown');
    expect(eventi).toContain("? adfWorkContactAfterShift()");
    expect(eventi).toContain('t:giaVisto ? p.n+" torna a fermarti dopo il turno"');
  });

  it("FAMEpedia spiega che il lavoro cambia anche il mondo sociale", () => {
    const famepedia = leggi("js/famepedia.js");

    expect(famepedia).toContain("il lavoro che scegli cambia anche il pezzo di mondo che incontri");
    expect(famepedia).toContain("Il Barista vede molta gente del giro e dei locali");
    expect(famepedia).toContain("il Fonico junior incrocia più facilmente beatmaker, artisti e tecnici");
    expect(famepedia).toContain("diventa una persona persistente");
  });

  it("i contatti nati in Pizzeria usano un budget rete per-persona anche nelle chat", () => {
    const chat=leggi("js/game/chat.js");
    expect(chat).toContain("function chatReteLavoro(p,fonte,n)");
    expect(chat).toContain('p.origineLuogo==="pizzeria"');
    expect(chat).toContain('lavoroBonusRetePersona(p,"pizzeria-chat:"');
    expect(chat).toContain('chatReteLavoro(p,"contact-chat",1)');
  });

});
