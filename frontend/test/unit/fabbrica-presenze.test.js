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

describe("cartellino presenze Fabbrica", () => {
  it("conta i turni reali, anche due nello stesso giorno", () => {
    const ctx = { G:{year:1,week:2,day:3}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroRegistraPresenza("fabbrica"); lavoroRegistraPresenza("fabbrica");', ctx);
    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);

    expect(out.totale).toBe(2);
    expect(out.settimana).toBe(2);
    expect(out.giorno).toBe(3);
    expect(out.conteggi[out.posOggi]).toBe(2);
  });

  it("azzera automaticamente il registro all'inizio del ciclo successivo", () => {
    const ctx = { G:{year:1,week:4,day:7}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroRegistraPresenza("fabbrica")', ctx);
    expect(vm.runInContext('lavoroCartellino("fabbrica").totale', ctx)).toBe(1);

    ctx.G.week = 5;
    ctx.G.day = 1;
    const nuovo = vm.runInContext('lavoroCartellino("fabbrica")', ctx);

    expect(nuovo.totale).toBe(0);
    expect(nuovo.settimana).toBe(1);
    expect(nuovo.giorno).toBe(1);
  });

  it("lega la presenza alla Fabbrica anche se cambia la mansione", () => {
    const ctx = {
      G:{year:1,week:2,day:3,job:{id:"capoturno",place:"fabbrica"}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out = vm.runInContext(`
      const luogo = lavoroLuogo(G.job);
      lavoroRegistraPresenza(luogo);
      ({luogo, totale:lavoroCartellino("fabbrica").totale});
    `, ctx);

    expect(out.luogo).toBe("fabbrica");
    expect(out.totale).toBe(1);
  });

  it("migra il vecchio fabbricaPresenze senza perdere i turni", () => {
    const ctx = {
      G:{year:1,week:2,day:3,fabbricaPresenze:{ciclo:0,turni:[0,1,1]}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);
    expect(out.totale).toBe(3);
    expect(ctx.G.workplaces.fabbrica.attendance.turni).toEqual([0,1,1]);
  });

  it("definisce il contratto Fabbrica: 5 giorni, lunedì-sabato, domenica riposo", () => {
    const ctx = { G:{year:1,week:1,day:1}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const contratto = vm.runInContext('lavoroContrattoDef("fabbrica")', ctx);
    expect(contratto.turniSettimanali).toBe(5);
    expect(Array.from(contratto.giorniConsentiti)).toEqual([1,2,3,4,5,6]);
    expect(contratto.domenicaRiposo).toBe(true);
    expect(contratto.cicloSettimane).toBe(4);
  });

  it("conta per la quota settimanale i giorni distinti, non i doppi turni", () => {
    const ctx = { G:{year:1,week:1,day:1}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroRegistraPresenza("fabbrica"); lavoroRegistraPresenza("fabbrica");', ctx);
    ctx.G.day = 2;
    vm.runInContext('lavoroRegistraPresenza("fabbrica")', ctx);
    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);

    expect(out.totale).toBe(3);
    expect(out.giorniLavoratiSettimana).toBe(2);
    expect(out.turniSettimanaliRichiesti).toBe(5);
  });

  it("la domenica non entra nel conteggio contrattuale X/5", () => {
    const ctx = { G:{year:1,week:1,day:7}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          attendance:{ciclo:0,turni:[0,1,2,3,6]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroCartellino("fabbrica")', ctx);
    expect(out.giorniLavoratiSettimana).toBe(4);
    expect(out.turniSettimanaliRichiesti).toBe(5);
  });

  it("paga +30% soltanto sul sesto giorno ordinario distinto", () => {
    const ctx = { G:{year:1,week:1,day:6}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          attendance:{ciclo:0,turni:[0,1,2,3,4]}
        }
      };
    `, ctx);

    const paga = vm.runInContext('lavoroPagaTurno("fabbrica", 220)', ctx);
    expect(paga.percentuale).toBe(30);
    expect(paga.bonus).toBe(66);
    expect(paga.totale).toBe(286);
    expect(paga.tipo).toBe("sesto-giorno");

    vm.runInContext('lavoroRegistraPresenza("fabbrica")', ctx);
    const secondoTurno = vm.runInContext('lavoroPagaTurno("fabbrica", 220)', ctx);
    expect(secondoTurno.percentuale).toBe(0);
    expect(secondoTurno.totale).toBe(220);
  });

  it("paga +75% la domenica autorizzata senza usarla per il 5/5", () => {
    const ctx = { G:{year:1,week:1,day:7}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          attendance:{ciclo:0,turni:[0,1,2,3]}
        }
      };
      lavoroAutorizzaDomenica("fabbrica");
    `, ctx);

    const paga = vm.runInContext('lavoroPagaTurno("fabbrica", 220)', ctx);
    expect(paga.percentuale).toBe(75);
    expect(paga.bonus).toBe(165);
    expect(paga.totale).toBe(385);
    expect(paga.tipo).toBe("domenica");

    vm.runInContext('lavoroRegistraPresenza("fabbrica")', ctx);
    const cart = vm.runInContext('lavoroCartellino("fabbrica")', ctx);
    expect(cart.giorniLavoratiSettimana).toBe(4);
  });

  it("mostra la maggiorazione sia prima del turno sia nel risultato", () => {
    const actions = leggi("js/game/actions.js");
    const luoghi = leggi("js/game/luoghi-foto.js");

    expect(actions).toContain('bonus +" + paga.percentuale');
    expect(actions).toContain('paga.totale');
    expect(luoghi).toContain('pagaTurno.etichetta');
    expect(luoghi).toContain("(+" + pagaTurno.percentuale + "%)");
  });

  it("blocca la domenica salvo autorizzazione esplicita per quel giorno", () => {
    const ctx = { G:{year:1,week:1,day:7}, Number, Math, Array, Object, Set };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext('lavoroTurnoConsentitoOggi("fabbrica").ok', ctx)).toBe(false);
    vm.runInContext('lavoroAutorizzaDomenica("fabbrica")', ctx);
    expect(vm.runInContext('lavoroTurnoConsentitoOggi("fabbrica").ok', ctx)).toBe(true);

    ctx.G.week = 2;
    expect(vm.runInContext('lavoroDomenicaAutorizzata("fabbrica")', ctx)).toBe(false);
  });

  it("la prima assunzione in Fabbrica passa dalla firma del contratto", () => {
    const hub = leggi("js/game/hub.js");
    const luoghi = leggi("js/game/luoghi-foto.js");
    const orari = leggi("js/game/orari.js");

    expect(hub).toContain('t:"Contratto di lavoro"');
    expect(hub).toContain('n:"Firma il contratto"');
    expect(hub).toContain('lavoroFirmaContratto("fabbrica", def)');
    expect(luoghi).toContain('"Leggi e firma il contratto"');
    expect(orari).toContain('label:"Domenica: riposo da contratto"');
    expect(orari).toContain('lavoroDomenicaAutorizzata("fabbrica")');
  });

  it("premia con affidabilità un ciclo 4/4 davvero completo", () => {
    const logs = [];
    const ctx = {
      G:{year:1,week:4,day:7,job:{id:"operaio",place:"fabbrica"}},
      Number, Math, Array, Object, Set,
      pushLog:(msg, cls) => logs.push({msg, cls})
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          attendance:{ciclo:0,turni:[
            0,1,2,3,4,
            7,8,9,10,11,
            14,15,16,17,18,
            21,22,23,24,25
          ]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroChiudiCiclo("fabbrica")', ctx);
    expect(out.eligible).toBe(true);
    expect(out.fullWeeks).toBe(4);
    expect(out.absences).toBe(0);
    expect(out.perfect).toBe(true);
    expect(out.reliabilityBefore).toBe(50);
    expect(out.reliabilityAfter).toBe(60);
    expect(vm.runInContext('lavoroCarriera("fabbrica").perfectStreak', ctx)).toBe(1);
    expect(logs.some(x => x.msg.includes("4/4 settimane complete"))).toBe(true);
  });

  it("non considera valido il primo ciclo se il contratto è stato firmato a periodo già iniziato", () => {
    const ctx = {
      G:{year:1,week:4,day:7,job:{id:"operaio",place:"fabbrica"}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:8,roleAtSign:"operaio"},
          attendance:{ciclo:0,turni:[7,8,9,10,11,14,15,16,17,18,21,22,23,24,25]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroChiudiCiclo("fabbrica")', ctx);
    expect(out.eligible).toBe(false);
    expect(out.reliabilityDelta).toBe(0);
    expect(vm.runInContext('lavoroCarriera("fabbrica").cyclesCompleted', ctx)).toBe(0);
  });

  it("la domenica straordinaria non copre una presenza ordinaria mancante", () => {
    const ctx = {
      G:{year:1,week:4,day:7,job:{id:"operaio",place:"fabbrica"}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          attendance:{ciclo:0,turni:[
            0,1,2,3,6,
            7,8,9,10,11,
            14,15,16,17,18,
            21,22,23,24,25
          ]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroChiudiCiclo("fabbrica")', ctx);
    expect(out.fullWeeks).toBe(3);
    expect(out.absences).toBe(1);
    expect(out.perfect).toBe(false);
    expect(out.reliabilityAfter).toBe(50);
  });

  it("chiude il ciclo lavorativo prima di avanzare la settimana", () => {
    const sim = leggi("js/game/sim.js");
    const close = sim.indexOf('if(typeof lavoroChiudiCicli === "function") lavoroChiudiCicli();');
    const week = sim.indexOf("G.week++;", close);
    expect(close).toBeGreaterThan(-1);
    expect(week).toBeGreaterThan(close);
  });

  it("le dimissioni chiudono il contratto ma conservano storico e carriera", () => {
    const ctx = {
      G:{
        year:1,week:2,day:3,
        job:{id:"operaio",place:"fabbrica"},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2]},
            career:{reliability:70,cyclesCompleted:2,perfectCycles:1,perfectStreak:1,evaluations:[]}
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroTerminaContratto("fabbrica", "dimissioni")', ctx);

    expect(ctx.G.workplaces.fabbrica.contract).toBeNull();
    expect(ctx.G.workplaces.fabbrica.contractHistory).toHaveLength(1);
    expect(ctx.G.workplaces.fabbrica.contractHistory[0].endReason).toBe("dimissioni");
    expect(ctx.G.workplaces.fabbrica.attendance.turni).toEqual([0,1,2]);
    expect(ctx.G.workplaces.fabbrica.career.reliability).toBe(70);
  });

  it("marca sempre la domenica e colora i giorni non lavorati solo a settimana conclusa", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    const css = leggi("css/luoghi-foto.css");

    expect(luoghi).toContain("const domenica = giorno === 6;");
    expect(luoghi).toContain("const settimanaConclusa = settimana < (cart.settimana - 1);");
    expect(luoghi).toContain("const nonLavorato = settimanaConclusa && !domenica && n === 0;");
    expect(luoghi).toContain('(domenica ? " domenica" : "")');
    expect(luoghi).toContain('(nonLavorato ? " non-lavorato" : "")');

    expect(css).toContain(".lfpres-day.domenica{");
    expect(css).toContain(".lfpres-day.non-lavorato{");
    expect(css).toContain(".lfpres-day.domenica.fatto{");
  });

  it("mostra il tasto dimissioni nel pannello Fabbrica con conferma", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    expect(luoghi).toContain('data-dimissioni="fabbrica"');
    expect(luoghi).toContain('t:"Dare le dimissioni?"');
    expect(luoghi).toContain('n:"Dai le dimissioni"');
    expect(luoghi).toContain('lavoroTerminaContratto("fabbrica", "dimissioni")');
  });

  it("il turno usa il luogo e la UI Fabbrica non dipende dall'id operaio", () => {
    const actions = leggi("js/game/actions.js");
    const luoghi = leggi("js/game/luoghi-foto.js");
    const tempo = leggi("js/game/tempo.js");
    const orari = leggi("js/game/orari.js");

    expect(actions).toContain("const luogoLavoro = lavoroLuogo(j);");
    expect(actions).not.toContain('if(j && j.id === "operaio") fabbricaRegistraPresenza();');
    expect(luoghi).toContain('lavoroLuogo(G.job) === "fabbrica"');
    expect(luoghi).toContain('lfPan("Cartellino presenze", lfFabbricaCartellino(), "orologio")');
    expect(tempo).toContain("DURATE_LUOGO_LAVORO[luogo]");
    expect(orari).toContain("currentPlace !== place");

    const start = luoghi.indexOf("function lfFabbrica(){");
    const end = luoghi.indexOf("/* ---------- LA PIZZERIA ----------", start);
    const fabbrica = luoghi.slice(start, end);
    expect(fabbrica).not.toContain('G.job.id === def.id');
    expect(fabbrica).not.toContain('lfPan("Oggi"');
  });
});
