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

  it("i quattro ruoli Fabbrica cambiano davvero carico fisico e mentale", () => {
    const ctx = {
      G:{year:1,week:1,day:1,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const operaio = vm.runInContext('lavoroEffettiTurno("fabbrica",G.job)', ctx);
    expect(operaio.energia).toBe(40);
    expect(operaio.benessere).toBe(-3);
    expect(operaio.lucidita).toBe(-1);

    ctx.G.job.id="capolinea"; ctx.G.job.n="Capolinea";
    const capolinea = vm.runInContext('lavoroEffettiTurno("fabbrica",G.job)', ctx);
    expect(capolinea.energia).toBe(32);
    expect(capolinea.benessere).toBe(-1);
    expect(capolinea.lucidita).toBe(-2);

    ctx.G.job.id="capoturno"; ctx.G.job.n="Capoturno";
    const capoturno = vm.runInContext('lavoroEffettiTurno("fabbrica",G.job)', ctx);
    expect(capoturno.energia).toBe(28);
    expect(capoturno.benessere).toBe(-1);
    expect(capoturno.lucidita).toBe(-3);
    expect(capoturno.fisico).toBe("basso");
    expect(capoturno.stress).toBe("molto alto");
  });

  it("una settimana ordinaria da cinque turni non applica più un malus globale immediato", () => {
    const ctx = {
      G:{year:1,week:1,day:1,shifts:5,workFatigue:0},
      Number, Math, Array, Object, Set,
      clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext("lavoroQualitaFattore()", ctx)).toBe(1);
    expect(vm.runInContext("lavoroLifestyleFattore()", ctx)).toBe(1);

    const prima=vm.runInContext("lavoroAggiornaFaticaSettimanale(5)", ctx);
    expect(prima.dopo).toBe(4);
    expect(vm.runInContext("lavoroQualitaFattore(5)", ctx)).toBe(1);
  });

  it("un anno di contratto normale 5/5 si assesta senza malus globale permanente", () => {
    const ctx = {
      G:{year:1,week:1,day:1,shifts:5,workFatigue:0},
      Number, Math, Array, Object, Set,
      clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    for(let i=0;i<52;i++) vm.runInContext("lavoroAggiornaFaticaSettimanale(5)", ctx);

    expect(ctx.G.workFatigue).toBeLessThanOrEqual(15);
    expect(vm.runInContext("lavoroQualitaFattore(5)", ctx)).toBe(1);
    expect(vm.runInContext("lavoroLifestyleFattore(5)", ctx)).toBe(1);
  });

  it("il sovraccarico ripetuto resta un malus di lungo periodo e poi rientra gradualmente", () => {
    const ctx = {
      G:{year:1,week:1,day:1,shifts:6,workFatigue:0},
      Number, Math, Array, Object, Set,
      clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    for(let i=0;i<12;i++) vm.runInContext("lavoroAggiornaFaticaSettimanale(6)", ctx);
    expect(ctx.G.workFatigue).toBeGreaterThanOrEqual(40);
    expect(vm.runInContext("lavoroQualitaFattore(6)", ctx)).toBeLessThan(.9);
    expect(vm.runInContext("lavoroLifestyleFattore(6)", ctx)).toBeLessThan(.8);

    const prima=ctx.G.workFatigue;
    for(let i=0;i<4;i++) vm.runInContext("lavoroAggiornaFaticaSettimanale(5)", ctx);
    expect(ctx.G.workFatigue).toBeLessThan(prima);
    expect(ctx.G.workFatigue).toBeGreaterThan(15);
  });

  it("sesto e settimo turno creano sovraccarico immediato, mentre settimane leggere recuperano", () => {
    const ctx = {
      G:{year:1,week:1,day:1,shifts:6,workFatigue:0},
      Number, Math, Array, Object, Set,
      clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0))
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext("lavoroQualitaFattore(6,0)", ctx)).toBeCloseTo(.94);
    expect(vm.runInContext("lavoroLifestyleFattore(6,0)", ctx)).toBeCloseTo(.85);
    expect(vm.runInContext("lavoroQualitaFattore(7,0)", ctx)).toBeCloseTo(.86);
    expect(vm.runInContext("lavoroLifestyleFattore(7,0)", ctx)).toBeCloseTo(.68);

    ctx.G.workFatigue=50;
    const out=vm.runInContext("lavoroAggiornaFaticaSettimanale(2)", ctx);
    expect(out.recupero).toBe(13);
    expect(out.dopo).toBe(19);
    expect(out.delta).toBe(-31);
  });

  it("la simulazione usa il nuovo carico progressivo invece delle vecchie penalità lineari", () => {
    const actions = leggi("js/game/actions.js");
    const sim = leggi("js/game/sim.js");

    expect(actions).toContain("lavoroQualitaFattore()");
    expect(actions).not.toContain("(G.shifts||0)*0.07");
    expect(sim).toContain("lavoroAggiornaFaticaSettimanale(G.shifts||0)");
    expect(sim).toContain("lavoroLifestyleFattore(G.shifts||0,caricoLavoro.dopo)");
    expect(sim).not.toContain("1 - (G.shifts||0) * 0.20");
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
    expect(contratto.bonusSestoGiornoPct).toBe(30);
    expect(contratto.bonusDomenicaPct).toBe(75);
    expect(contratto.cicloSettimane).toBe(4);
  });

  it("prevede due giorni di ferie per ciclo, richiesti almeno il giorno prima", () => {
    const ctx = {
      G:{
        year:1,week:1,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{fabbrica:{contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"}}}
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const def=vm.runInContext('lavoroContrattoDef("fabbrica")',ctx);
    expect(def.ferieGiorniPerCiclo).toBe(2);
    expect(def.ferieAnticipoMinimoGiorni).toBe(1);

    expect(vm.runInContext('lavoroFerieRichiedi("fabbrica",1).ok',ctx)).toBe(false);
    expect(vm.runInContext('lavoroFerieRichiedi("fabbrica",2).ok',ctx)).toBe(true);
    expect(vm.runInContext('lavoroFerieRichiedi("fabbrica",3).ok',ctx)).toBe(true);

    const terza=vm.runInContext('lavoroFerieRichiedi("fabbrica",4)',ctx);
    expect(terza.ok).toBe(false);
    expect(terza.reason).toContain("2 giorni");
    expect(vm.runInContext('lavoroFerieDisponibili("fabbrica",0)',ctx)).toBe(0);
  });

  it("la quota ferie appartiene al ciclo di destinazione anche oltre il cambio mese", () => {
    const ctx = {
      G:{
        year:1,week:4,day:7,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{fabbrica:{contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"}}}
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const lunediProssimoCiclo=29;
    const out=vm.runInContext('lavoroFerieRichiedi("fabbrica",29)',ctx);
    expect(out.ok).toBe(true);
    expect(out.richiesta.cycle).toBe(1);
    expect(vm.runInContext('lavoroFerieDisponibili("fabbrica",0)',ctx)).toBe(2);
    expect(vm.runInContext('lavoroFerieDisponibili("fabbrica",1)',ctx)).toBe(1);
  });

  it("un giorno di ferie copre la presenza senza creare un turno o una paga", () => {
    const ctx = {
      G:{
        year:1,week:1,day:4,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3]}
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext('lavoroFerieRichiedi("fabbrica",5).ok',ctx)).toBe(true);
    ctx.G.day=5;

    const stato=vm.runInContext('lavoroTurnoConsentitoOggi("fabbrica")',ctx);
    expect(stato.ok).toBe(false);
    expect(stato.phase).toBe("vacation");

    ctx.G.day=7;
    const out=vm.runInContext(
      'lavoroValutaDisciplinaSettimana("fabbrica",1,0,0,G.workplaces.fabbrica.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.workedDays).toBe(4);
    expect(out.vacationDays).toBe(1);
    expect(out.coveredDays).toBe(5);
    expect(out.absences).toBe(0);
    expect(out.reliabilityDelta).toBe(0);
  });

  it("le ferie approvate possono mantenere perfetto il ciclo senza inventare presenze", () => {
    const ctx = {
      G:{
        year:1,week:4,day:7,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[
              0,1,2,3,
              7,8,9,10,11,
              14,15,16,17,18,
              21,22,23,24,25
            ]},
            leave:{requests:[{targetAbsoluteDay:5,requestedAbsoluteDay:4,cycle:0,status:"approved"}]}
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out=vm.runInContext('lavoroValutaCiclo("fabbrica",0,G.workplaces.fabbrica.attendance.turni)',ctx);
    expect(out.fullWeeks).toBe(4);
    expect(out.absences).toBe(0);
    expect(out.perfect).toBe(true);
    expect(out.settimane[0].giorni).toBe(4);
    expect(out.settimane[0].ferie).toBe(1);
    expect(out.settimane[0].coperti).toBe(5);
  });

  it("ferie e straordinario non possono occupare lo stesso giorno", () => {
    const ctx = {
      G:{
        year:1,week:1,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3,4]}
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext('lavoroFerieRichiedi("fabbrica",6).ok',ctx)).toBe(true);
    expect(vm.runInContext('lavoroCandidatoStraordinario("fabbrica")',ctx)).toBeNull();

    ctx.G.workplaces.fabbrica.leave={requests:[]};
    vm.runInContext('lavoroTentaRichiestaStraordinario("fabbrica",0)',ctx);
    const ferie=vm.runInContext('lavoroFerieRichiedi("fabbrica",6)',ctx);
    expect(ferie.ok).toBe(false);
    expect(ferie.reason).toContain("straordinario");
  });

  it("la schermata Fabbrica espone ferie, cartellino e regola del giorno prima", () => {
    const luoghi=leggi("js/game/luoghi-foto.js");
    const hub=leggi("js/game/hub.js");
    const css=leggi("css/luoghi-foto.css");

    expect(luoghi).toContain('lfPan("Ferie", lfFabbricaFerie(), "orologio")');
    expect(luoghi).toContain('function lfFerieLavoro(luogo,nome)');
    expect(luoghi).toContain('data-ferie-select="'+lfEsc(luogo)+'"');
    expect(luoghi).toContain('data-ferie-request="'+lfEsc(luogo)+'"');
    expect(luoghi).toContain('const inFerie = feriePosizioni.has(pos) && !n;');
    expect(luoghi).toContain('il giorno stesso non si recupera');
    expect(hub).toContain('<b>Ferie</b>');
    expect(hub).toContain('ferieAnticipoMinimoGiorni');
    expect(css).toContain(".lfpres-day.ferie{");
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

  it("mostra le maggiorazioni nel contratto, prima del turno e nel risultato", () => {
    const actions = leggi("js/game/actions.js");
    const luoghi = leggi("js/game/luoghi-foto.js");

    expect(actions).toContain('paga.etichetta + ": bonus +" + paga.percentuale');
    expect(actions).toContain('paga.totale');
    expect(luoghi).toContain("contratto.bonusSestoGiornoPct");
    expect(luoghi).toContain("contratto.bonusDomenicaPct");
    expect(luoghi).toContain('"Il 6° giorno distinto della settimana paga +"');
    expect(luoghi).toContain('"%. La domenica resta riposo: se l’azienda propone e autorizza uno straordinario, paga +"');
    expect(luoghi).toContain("regolaMaggiorazioni");
    expect(luoghi).toContain('pagaTurno.etichetta');
    expect(luoghi).toContain("(pagaTurno.percentuale ? ' (+' + pagaTurno.percentuale + '%)' : '')");
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
    expect(hub).toContain("function contrattoPostoLavoro(def)");
    expect(hub).toContain("lavoroFirmaContratto(luogo, def)");
    expect(luoghi).toContain('"Leggi e firma il contratto"');
    expect(orari).toContain("lavoroTurnoConsentitoOggi(place)");
    expect(orari).toContain('phase:"contract-rest"');
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

  it("sblocca la candidatura all'aumento dopo un ciclo pieno e affidabilità 60", () => {
    const ctx = {
      G:{year:1,week:4,day:7,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
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
            0,1,2,3,4,
            7,8,9,10,11,
            14,15,16,17,18,
            21,22,23,24,25
          ]}
        }
      };
      lavoroChiudiCiclo("fabbrica");
    `, ctx);

    expect(vm.runInContext('lavoroCarriera("fabbrica").cyclesInRole', ctx)).toBe(1);
    expect(vm.runInContext('lavoroCarriera("fabbrica").reliability', ctx)).toBe(60);
    expect(vm.runInContext('lavoroAumentoDisponibile("fabbrica")', ctx)).toBe(true);
  });

  it("un aumento cambia davvero la paga dei turni e viene registrato", () => {
    const ctx = {
      G:{year:1,week:5,day:1,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:60,cyclesCompleted:1,perfectCycles:1,perfectStreak:1,
            cyclesInRole:1,perfectCyclesInRole:1,roleId:"operaio",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],evaluations:[]
          }
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroApplicaAumento("fabbrica",{aumento:15,motivo:"test"})', ctx);
    expect(out.prima).toBe(220);
    expect(out.dopo).toBe(235);
    expect(ctx.G.job.pay).toBe(235);
    expect(ctx.G.workplaces.fabbrica.career.payHistory).toHaveLength(1);
    expect(vm.runInContext('lavoroAumentoDisponibile("fabbrica")', ctx)).toBe(false);
  });

  it("dopo tre cicli buoni abilita la promozione e preserva il luogo", () => {
    const ctx = {
      G:{year:1,week:13,day:1,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:235,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:80,cyclesCompleted:3,perfectCycles:3,perfectStreak:3,
            cyclesInRole:3,perfectCyclesInRole:3,roleId:"operaio",roleLevel:0,
            raisesByRole:{operaio:1},payHistory:[],roleHistory:[],evaluations:[]
          },
          attendance:{ciclo:3,turni:[]}
        }
      };
    `, ctx);

    expect(vm.runInContext('lavoroPromozioneDisponibile("fabbrica")', ctx)).toBe(true);
    expect(vm.runInContext('lavoroProssimoRuolo("fabbrica").id', ctx)).toBe("operaio_esperto");

    const out = vm.runInContext(
      'lavoroPromuoviRuolo("fabbrica",{nuovaPaga:260,energia:38,motivo:"test"})',
      ctx
    );

    expect(out.da.id).toBe("operaio");
    expect(out.a.id).toBe("operaio_esperto");
    expect(ctx.G.job.id).toBe("operaio_esperto");
    expect(ctx.G.job.n).toBe("Operaio esperto");
    expect(ctx.G.job.place).toBe("fabbrica");
    expect(ctx.G.job.pay).toBe(260);
    expect(ctx.G.job.e).toBe(38);
    expect(ctx.G.workplaces.fabbrica.career.cyclesInRole).toBe(0);
    expect(ctx.G.workplaces.fabbrica.career.perfectCyclesInRole).toBe(0);
    expect(ctx.G.workplaces.fabbrica.career.reliability).toBe(80);
    expect(ctx.G.workplaces.fabbrica.career.roleHistory).toHaveLength(1);
    expect(ctx.G.workplaces.fabbrica.network.turniPerRuolo.operaio_esperto).toBe(0);
  });

  it("prepara il motore eventi per requisiti ed effetti di carriera per luogo", () => {
    const eventi = leggi("js/game/eventi-v2.js");

    expect(eventi).toContain('if(t==="workplace_is")');
    expect(eventi).toContain('if(t==="work_raise_available")');
    expect(eventi).toContain('if(t==="work_promotion_available")');
    expect(eventi).toContain('if(v.work_raise && typeof lavoroApplicaAumento==="function")');
    expect(eventi).toContain('if(v.work_promotion && typeof lavoroPromuoviRuolo==="function")');
    expect(eventi).toContain('workplace:typeof lavoroLuogo==="function" ? lavoroLuogo(G.job)');
    expect(eventi).toContain('if(e && e.arc_id==="ARC106") return false;');
  });

  it("1-2 assenze settimanali abbassano l'affidabilità senza richiamo formale", () => {
    const ctx = {
      G:{year:1,week:1,day:7,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:60,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
            cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
            weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,evaluations:[]
          },
          attendance:{ciclo:0,turni:[0,1,2,3]}
        }
      };
    `, ctx);

    const out = vm.runInContext(
      'lavoroValutaDisciplinaSettimana("fabbrica",1,0,0,G.workplaces.fabbrica.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.absences).toBe(1);
    expect(out.warningAdded).toBe(0);
    expect(out.dismissed).toBe(false);
    expect(vm.runInContext('lavoroCarriera("fabbrica").warnings', ctx)).toBe(0);
    expect(vm.runInContext('lavoroCarriera("fabbrica").reliability', ctx)).toBe(55);
  });

  it("da 3 assenze nella settimana scatta un richiamo formale e -10 affidabilità", () => {
    const ctx = {
      G:{year:1,week:1,day:7,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:70,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
            cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
            weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,evaluations:[]
          },
          attendance:{ciclo:0,turni:[0,1]}
        }
      };
    `, ctx);

    const out = vm.runInContext(
      'lavoroValutaDisciplinaSettimana("fabbrica",1,0,0,G.workplaces.fabbrica.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.absences).toBe(3);
    expect(out.warningAdded).toBe(1);
    expect(out.dismissed).toBe(false);
    expect(vm.runInContext('lavoroCarriera("fabbrica").warnings', ctx)).toBe(1);
    expect(vm.runInContext('lavoroCarriera("fabbrica").reliability', ctx)).toBe(60);
  });

  it("dopo due richiami un'altra settimana grave licenzia e blocca 8 settimane", () => {
    const ctx = {
      G:{year:1,week:12,day:7,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:60,cyclesCompleted:2,perfectCycles:0,perfectStreak:0,
            cyclesInRole:2,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],warnings:2,warningHistory:[],
            weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,lastEvaluatedCycle:1,evaluations:[]
          },
          attendance:{ciclo:2,turni:[21,22]}
        }
      };
    `, ctx);

    const out = vm.runInContext(
      'lavoroValutaDisciplinaSettimana("fabbrica",12,2,3,G.workplaces.fabbrica.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.dismissed).toBe(true);
    expect(ctx.G.job).toBeNull();
    expect(ctx.G.workplaces.fabbrica.contract).toBeNull();
    expect(ctx.G.workplaces.fabbrica.career.dismissals).toBe(1);
    expect(ctx.G.workplaces.fabbrica.career.blockedUntilWeek).toBe(20);
    expect(ctx.G._lastJobLossReason).toBe("factory_absences");

    ctx.G.week = 13;
    const blocco = vm.runInContext('lavoroBloccoRiassunzione("fabbrica")', ctx);
    expect(blocco.active).toBe(true);
    expect(blocco.weeksRemaining).toBe(8);

    ctx.G.week = 21;
    expect(vm.runInContext('lavoroBloccoRiassunzione("fabbrica").active', ctx)).toBe(false);
  });

  it("due cicli perfetti consecutivi cancellano un richiamo", () => {
    const ctx = {
      G:{year:1,week:8,day:7,job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      G.workplaces = {
        fabbrica:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
          career:{
            reliability:60,cyclesCompleted:1,perfectCycles:1,perfectStreak:1,
            cyclesInRole:1,perfectCyclesInRole:1,roleId:"operaio",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],warnings:1,warningHistory:[],
            dismissals:0,blockedUntilWeek:null,lastEvaluatedCycle:0,evaluations:[]
          },
          attendance:{ciclo:1,turni:[
            0,1,2,3,4,
            7,8,9,10,11,
            14,15,16,17,18,
            21,22,23,24,25
          ]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroChiudiCiclo("fabbrica")', ctx);
    expect(out.perfect).toBe(true);
    expect(out.disciplina.warningRemoved).toBe(1);
    expect(vm.runInContext('lavoroCarriera("fabbrica").warnings', ctx)).toBe(0);
  });

  it("i lavori con contratto per sede non usano più il vecchio licenziamento a zero turni", () => {
    const sim = leggi("js/game/sim.js");
    expect(sim).toContain("const disciplinaPerSede");
    expect(sim).toContain("lavoroContrattoDef(luogoLavoro)");
    expect(sim).toContain("due sistemi disciplinari in conflitto");
  });

  it("dimissioni e licenziamento azzerano la progressione, ma il licenziamento conserva il blocco", () => {
    const ctx = {
      G:{
        year:1,week:6,day:1,
        job:{id:"capoturno",place:"fabbrica",n:"Capoturno",pay:456,e:28},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:1,turni:[0,1,2,3,4]},
            career:{
              reliability:92,cyclesCompleted:8,perfectCycles:6,perfectStreak:3,
              cyclesInRole:2,perfectCyclesInRole:2,roleId:"capoturno",roleLevel:3,
              raisesByRole:{operaio:1,operaio_esperto:1,capolinea:1,capoturno:1},
              payHistory:[{prima:422,dopo:456}],roleHistory:[{from:"capolinea",to:"capoturno"}],
              warnings:2,warningHistory:[],weeklyEvaluations:[{absoluteWeek:5}],
              dismissals:0,blockedUntilWeek:null,lastEvaluatedCycle:7,lastEvaluation:{},evaluations:[{}]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroTerminaContratto("fabbrica","dimissioni")', ctx);
    let c=vm.runInContext('lavoroCarriera("fabbrica")',ctx);
    expect(c.reliability).toBe(50);
    expect(c.cyclesCompleted).toBe(0);
    expect(c.roleId).toBeNull();
    expect(c.raisesByRole).toEqual({});
    expect(c.warnings).toBe(0);
    expect(ctx.G.workplaces.fabbrica.attendance.turni).toEqual([]);
    expect(ctx.G.workplaces.fabbrica.contractHistory[0].careerAtEnd.roleId).toBe("capoturno");
    expect(ctx.G.workplaces.fabbrica.contractHistory[0].careerAtEnd.pay).toBe(456);

    ctx.G.job={id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40};
    vm.runInContext('lavoroFirmaContratto("fabbrica",G.job)',ctx);
    c=vm.runInContext('lavoroCarriera("fabbrica")',ctx);
    expect(c.roleId).toBe("operaio");
    expect(c.raisesByRole).toEqual({});
    expect(vm.runInContext('lavoroAumentoDisponibile("fabbrica")',ctx)).toBe(false);

    /* Simula un vero licenziamento da una nuova carriera: progressione azzerata,
       ma il blocco disciplinare deve sopravvivere. */
    c.reliability=20;
    c.cyclesCompleted=4;
    c.raisesByRole={operaio:1};
    c.warnings=2;
    vm.runInContext('lavoroLicenzia("fabbrica","assenze ripetute")',ctx);
    c=vm.runInContext('lavoroCarriera("fabbrica")',ctx);
    expect(c.reliability).toBe(50);
    expect(c.cyclesCompleted).toBe(0);
    expect(c.raisesByRole).toEqual({});
    expect(c.warnings).toBe(0);
    expect(c.dismissals).toBe(1);
    expect(vm.runInContext('lavoroBloccoRiassunzione("fabbrica").active',ctx)).toBe(true);
  });

  it("contratto e UI espongono richiami e blocco di riassunzione", () => {
    const hub = leggi("js/game/hub.js");
    const luoghi = leggi("js/game/luoghi-foto.js");
    const lavoro = helperLavoro();
    const fabbrica = lavoro.slice(lavoro.indexOf("const ADF_FABBRICA_CARRIERA"),
      lavoro.indexOf("const ADF_PIZZERIA_CARRIERA"));

    /* Dalla Pizzeria (PR #11) il contratto è uno solo per tutti i luoghi: i
       numeri (3 assenze, 8 settimane, 2 richiami) li legge dalla disciplina
       della Fabbrica invece di averli scritti nel testo. */
    expect(fabbrica).toContain("assenzeRichiamoMin:3");
    expect(fabbrica).toContain("bloccoRiassunzioneSettimane:8");
    expect(fabbrica).toContain("richiamiPrimaLicenziamento:2");
    expect(hub).toContain('"da " + richiamoMin + " in su scatta un richiamo formale.');
    expect(hub).toContain('" settimane senza riassunzione"');
    expect(hub).toContain("lavoroBloccoRiassunzione(luogoContratto)");
    expect(luoghi).toContain("Richiami <b>' + Number(cart.richiami || 0) + '/' + maxRichiami + '</b>");
    expect(luoghi).toContain("Number(carrieraCfg.disciplina.richiamiPrimaLicenziamento || 2)");
    expect(luoghi).toContain('"Riassunzione bloccata · " + bloccoRiassunzione.weeksRemaining');
  });

  it("il motore eventi non può aggirare il blocco Fabbrica", () => {
    const eventi = leggi("js/game/eventi-v2.js");
    expect(eventi).toContain("lavoroBloccoRiassunzione(luogoContratto)");
    expect(eventi).toContain("!G.job && !blocco.active");
    expect(eventi).toContain('G._lastJobLossReason||"missed_shifts"');
    expect(eventi).toContain('delete G._lastJobLossReason');
  });

  it("dopo il 5/5 del venerdì può proporre il sabato extra con +30%", () => {
    const ctx = {
      G:{
        year:1,week:1,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3,4]},
            career:{
              reliability:60,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
              cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              dismissals:0,blockedUntilWeek:null,evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const offerta = vm.runInContext('lavoroTentaRichiestaStraordinario("fabbrica",0)', ctx);
    expect(offerta.tipo).toBe("sesto-giorno");
    expect(offerta.targetDay).toBe(6);
    expect(offerta.bonusPct).toBe(30);

    const accettata = vm.runInContext('lavoroAccettaStraordinario("fabbrica")', ctx);
    expect(accettata.targetAbsoluteDay).toBe(6);
    expect(ctx.G.workplaces.fabbrica.sundayPermitAbsoluteDay).toBeUndefined();
  });

  it("lo straordinario concordato completato dà +2 affidabilità una sola volta", () => {
    const ctx = {
      G:{
        year:1,week:1,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3,4]},
            career:{
              reliability:60,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
              cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              dismissals:0,blockedUntilWeek:null,evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroTentaRichiestaStraordinario("fabbrica",0); lavoroAccettaStraordinario("fabbrica")', ctx);
    ctx.G.day = 6;

    const out = vm.runInContext('lavoroCompletaStraordinario("fabbrica")', ctx);
    expect(out.affidabilitaDelta).toBe(2);
    expect(ctx.G.workplaces.fabbrica.career.reliability).toBe(62);
    expect(ctx.G.workplaces.fabbrica.overtime.accepted).toBeNull();

    expect(vm.runInContext('lavoroCompletaStraordinario("fabbrica")', ctx)).toBeNull();
    expect(ctx.G.workplaces.fabbrica.career.reliability).toBe(62);
  });

  it("il sabato può autorizzare solo la domenica successiva con +75%", () => {
    const ctx = {
      G:{
        year:1,week:1,day:6,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3,4]},
            career:{
              reliability:60,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
              cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              dismissals:0,blockedUntilWeek:null,evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const offerta = vm.runInContext('lavoroTentaRichiestaStraordinario("fabbrica",0)', ctx);
    expect(offerta.tipo).toBe("domenica");
    expect(offerta.bonusPct).toBe(75);

    vm.runInContext('lavoroAccettaStraordinario("fabbrica")', ctx);
    expect(ctx.G.workplaces.fabbrica.sundayPermitAbsoluteDay).toBe(7);

    ctx.G.day = 7;
    expect(vm.runInContext('lavoroDomenicaAutorizzata("fabbrica")', ctx)).toBe(true);
    expect(vm.runInContext('lavoroTurnoConsentitoOggi("fabbrica").ok', ctx)).toBe(true);
    expect(vm.runInContext('lavoroPagaTurno("fabbrica",220).totale', ctx)).toBe(385);

    ctx.G.week = 2;
    expect(vm.runInContext('lavoroDomenicaAutorizzata("fabbrica")', ctx)).toBe(false);
  });

  it("saltare uno straordinario già accettato costa 5 affidabilità", () => {
    const logs = [];
    const ctx = {
      G:{
        year:1,week:1,day:5,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,3,4]},
            career:{
              reliability:60,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
              cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              dismissals:0,blockedUntilWeek:null,evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set,
      pushLog:(msg, cls) => logs.push({msg, cls})
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroTentaRichiestaStraordinario("fabbrica",0); lavoroAccettaStraordinario("fabbrica")', ctx);
    ctx.G.day = 7;
    vm.runInContext('lavoroAggiornaStraordinariTempo()', ctx);

    expect(ctx.G.workplaces.fabbrica.career.reliability).toBe(55);
    expect(ctx.G.workplaces.fabbrica.overtime.accepted).toBeNull();
    expect(logs.some(x => x.msg.includes("Straordinario saltato"))).toBe(true);
  });

  it("il dialogo straordinari usa l'arbitro eventi e il calendario reale", () => {
    const eventi = leggi("js/game/eventi-v2.js");
    const luoghi = leggi("js/game/luoghi-foto.js");

    expect(eventi).toContain("function adfWorkOvertimeAfterShift()");
    expect(eventi).toContain('claimAutoEvent("work-overtime:"+luogo)');
    expect(eventi).toContain('const fabbrica=luogo==="fabbrica"');
    expect(eventi).toContain("ADF_FACTORY_OVERTIME_SCENARIOS");
    expect(eventi).toContain('id:"recupero-fermo"');
    expect(eventi).toContain('id:"spedizione-lunedi"');
    expect(eventi).toContain("adfFactoryOvertimeScenario(offerta)");
    expect(eventi).toContain("overtime.pendingOffer.scenarioLabel=scelta.label");
    expect(eventi).toContain("overtime.pendingOffer.scenarioRoleId=scelta.roleId");
    expect(eventi).toContain("ADF_FACTORY_OVERTIME_ROLE_CONTEXT");
    expect(eventi).toContain('asker:"Il capolinea"');
    expect(eventi).toContain('asker:"Il capoturno"');
    expect(eventi).toContain('asker:"Il responsabile di produzione"');
    expect(eventi).toContain('duty:"coordinare la linea nel turno extra"');
    expect(eventi).toContain('duty:"coordinare i reparti nel turno extra"');
    expect(eventi).not.toContain("Il capo ti chiede se puoi entrare");
    expect(eventi).not.toContain("A fine turno il capolinea ti ferma");
    expect(eventi).toContain("lavoroAccettaStraordinario(luogo)");
    expect(eventi).toContain('lavoroAggiornaStraordinariTempo();');
    expect(luoghi).toContain("straordinarioOggi");
    expect(luoghi).toContain("straordinarioAccettato.targetLabel");
    expect(luoghi).toContain("straordinarioAccettato.scenarioLabel");
  });

  it("la rete Fabbrica cresce con la mansione senza cambiare la sede persistente", () => {
    const ctx = {
      G:{year:1,week:1,day:1,job:{id:"operaio",place:"fabbrica",n:"Operaio"},strada:{}},
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => 1;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const profili = vm.runInContext(`
      ["operaio","operaio_esperto","capolinea","capoturno"].map(id => {
        const cfg=lavoroReteDef({id,place:"fabbrica",n:id});
        return {
          id,
          chance:cfg.chanceIncontro,
          cooldown:cfg.cooldownGiorni,
          minTurni:cfg.minTurni,
          max:cfg.maxContatti,
          key:lavoroReteChiave({id,place:"fabbrica"})
        };
      })
    `, ctx);

    expect(profili).toEqual([
      {id:"operaio",chance:.16,cooldown:7,minTurni:3,max:4,key:"fabbrica"},
      {id:"operaio_esperto",chance:.18,cooldown:6,minTurni:2,max:5,key:"fabbrica"},
      {id:"capolinea",chance:.20,cooldown:5,minTurni:2,max:6,key:"fabbrica"},
      {id:"capoturno",chance:.22,cooldown:4,minTurni:1,max:7,key:"fabbrica"}
    ]);
  });

  it("una promozione apre nuova rete ma non eredita i turni della mansione precedente", () => {
    const persona = {
      id:"p-exp-1",n:"Sara",ruolo:"fonico",
      origineLuogo:"fabbrica",numero:false,via:false
    };
    const metaVisti=[];
    const ctx = {
      G:{
        year:1,week:2,day:1,
        job:{id:"operaio_esperto",place:"fabbrica",n:"Operaio esperto",pay:245,e:36},
        gente:[],
        workplaces:{
          fabbrica:{
            network:{
              lastCheckAbsoluteDay:null,lastEncounterAbsoluteDay:null,
              encounters:0,turniVisti:12,
              turniPerRuolo:{operaio:12},
              history:[]
            }
          }
        },
        strada:{}
      },
      Number, Math, Array, Object, Set,
      postoContattoLavoroCandidato:(luogo,riprendi,max,ruoli,meta) => {
        metaVisti.push({luogo,max,ruoli:[...ruoli],meta:{...meta}});
        ctx.G.gente.push(persona);
        return persona;
      }
    };
    ctx.totalWeeks = () => 2;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const primo=vm.runInContext('lavoroTentaIncontroContatto("fabbrica",0)', ctx);
    expect(primo).toBeNull();
    expect(ctx.G.workplaces.fabbrica.network.turniPerRuolo.operaio_esperto).toBe(1);

    ctx.G.day=2;
    const secondo=vm.runInContext('lavoroTentaIncontroContatto("fabbrica",0)', ctx);
    expect(secondo.id).toBe("p-exp-1");
    expect(metaVisti).toHaveLength(1);
    expect(metaVisti[0].max).toBe(5);
    expect(metaVisti[0].meta.workRoleId).toBe("operaio_esperto");
    expect(metaVisti[0].meta.workRoleName).toBe("Operaio esperto");
  });

  it("un vecchio salvataggio conserva l'esposizione rete invece di ripartire da zero", () => {
    const persona = {
      id:"p-legacy",n:"Nico",ruolo:"beatmaker",
      origineLuogo:"fabbrica",numero:false,via:false
    };
    const ctx = {
      G:{
        year:1,week:2,day:2,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        gente:[],
        workplaces:{
          fabbrica:{
            network:{
              lastCheckAbsoluteDay:null,lastEncounterAbsoluteDay:null,
              encounters:0,turniVisti:5,history:[]
            }
          }
        },
        strada:{}
      },
      Number, Math, Array, Object, Set,
      postoContattoLavoroCandidato:() => {
        ctx.G.gente.push(persona);
        return persona;
      }
    };
    ctx.totalWeeks = () => 2;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out=vm.runInContext('lavoroTentaIncontroContatto("fabbrica",0)', ctx);
    expect(out.id).toBe("p-legacy");
    expect(ctx.G.workplaces.fabbrica.network.turniPerRuolo.operaio).toBe(6);
  });

  it("il contatto conserva per sempre la mansione in cui lo hai conosciuto", () => {
    const posto = leggi("js/game/posto.js");
    expect(posto).toContain("p.origineRuoloLavoro = meta.workRoleId || meta.jobId || null;");
    expect(posto).toContain("p.origineRuoloNome = meta.workRoleName || null;");
  });

  it("dopo almeno tre turni può nascere una conoscenza persistente di Fabbrica", () => {
    const persona = {
      id:"p-fab-1",
      n:"Nico",
      ruolo:"beatmaker",
      origineLuogo:"fabbrica",
      numero:false,
      via:false
    };
    const ctx = {
      G:{
        year:1,week:1,day:3,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        gente:[],
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2]}
          }
        }
      },
      Number, Math, Array, Object, Set,
      postoContattoLavoroCandidato:() => {
        ctx.G.gente.push(persona);
        return persona;
      }
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const out = vm.runInContext('lavoroTentaIncontroContatto("fabbrica",0)', ctx);

    expect(out.id).toBe("p-fab-1");
    expect(ctx.G.gente).toHaveLength(1);
    expect(ctx.G.workplaces.fabbrica.network.encounters).toBe(1);
    expect(ctx.G.workplaces.fabbrica.network.lastEncounterAbsoluteDay).toBe(3);
  });

  it("non genera una sfilza di contatti nello stesso periodo", () => {
    const persone = [
      {id:"p1",ruolo:"beatmaker",origineLuogo:"fabbrica",numero:true,via:false},
      {id:"p2",ruolo:"fonico",origineLuogo:"fabbrica",numero:true,via:false},
      {id:"p3",ruolo:"beatmaker",origineLuogo:"fabbrica",numero:true,via:false},
      {id:"p4",ruolo:"videomaker",origineLuogo:"fabbrica",numero:true,via:false}
    ];
    const ctx = {
      G:{
        year:1,week:2,day:3,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        gente:persone,
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2,7,8,9]}
          }
        }
      },
      Number, Math, Array, Object, Set,
      postoContattoLavoroCandidato:() => { throw new Error("non deve creare un quinto contatto"); }
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    expect(vm.runInContext('lavoroTentaIncontroContatto("fabbrica",0)', ctx)).toBeNull();
  });

  it("i contatti di Fabbrica restano persone vere dentro il motore generico dei lavori", () => {
    const posto = leggi("js/game/posto.js");
    const chat = leggi("js/game/chat.js");
    const eventi = leggi("js/game/eventi-v2.js");

    expect(posto).toContain('p.origineLuogo = luogo;');
    expect(posto).toContain('p.origineLavoro = meta.jobId || luogo;');
    expect(posto).toContain('p.numero = true;');
    expect(posto).toContain('function postoSoloLavoro(p)');
    expect(posto).toContain('!p.rivale && !postoSoloLavoro(p)');
    expect(posto).toContain('p => !p.via && !postoSoloLavoro(p)');

    expect(chat).toContain('p.origineDettaglio || "conosciuto al lavoro"');
    expect(chat).toContain('p.ruolo === "beatmaker"');
    expect(chat).toContain('p.ruolo === "fonico"');

    expect(eventi).toContain('function adfWorkContactAfterShift()');
    expect(eventi).toContain('claimAutoEvent("work-contact")');
    expect(eventi).toContain('n:"Scambiatevi il numero"');
    expect(eventi).toContain('postoScambiaNumeroLavoro(p)');
    expect(eventi).toContain('const contactShown = a.id==="turno" && !overtimeShown');
  });

  it("recupera due richiami dalle due settimane gravi già concluse del cartellino", () => {
    const ctx = {
      G:{
        year:1,week:4,day:2,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[
              0,1,3,4,5,
              7,
              21
            ]},
            career:{
              reliability:50,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
              cyclesInRole:0,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const cart = vm.runInContext('lavoroCartellino("fabbrica")', ctx);
    expect(cart.richiami).toBe(2);
    expect(cart.affidabilita).toBe(30);
    expect(ctx.G.workplaces.fabbrica.career.weeklyEvaluations).toHaveLength(3);
    expect(ctx.G.workplaces.fabbrica.career.weeklyEvaluations[1].absences).toBe(4);
    expect(ctx.G.workplaces.fabbrica.career.weeklyEvaluations[2].absences).toBe(5);
  });

  it("chiude disciplina settimanale e ciclo prima di avanzare la settimana", () => {
    const sim = leggi("js/game/sim.js");
    const weekly = sim.indexOf('if(typeof lavoroChiudiSettimane === "function") lavoroChiudiSettimane();');
    const cycle = sim.indexOf('if(typeof lavoroChiudiCicli === "function") lavoroChiudiCicli();', weekly);
    const week = sim.indexOf("G.week++;", cycle);
    expect(weekly).toBeGreaterThan(-1);
    expect(cycle).toBeGreaterThan(weekly);
    expect(week).toBeGreaterThan(cycle);
  });

  it("le dimissioni archiviano la vecchia carriera e ripuliscono il rapporto corrente", () => {
    const ctx = {
      G:{
        year:1,week:2,day:3,
        job:{id:"operaio_esperto",place:"fabbrica",n:"Operaio esperto",pay:275,e:36},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            attendance:{ciclo:0,turni:[0,1,2]},
            career:{
              reliability:70,cyclesCompleted:2,perfectCycles:1,perfectStreak:1,
              cyclesInRole:1,perfectCyclesInRole:1,roleId:"operaio_esperto",roleLevel:1,
              raisesByRole:{operaio:1},payHistory:[],roleHistory:[],warnings:1,
              warningHistory:[],weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,
              lastEvaluatedCycle:1,lastEvaluation:{},evaluations:[]
            }
          }
        }
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext('lavoroTerminaContratto("fabbrica", "dimissioni")', ctx);

    const sede=ctx.G.workplaces.fabbrica;
    expect(sede.contract).toBeNull();
    expect(sede.contractHistory).toHaveLength(1);
    expect(sede.contractHistory[0].endReason).toBe("dimissioni");
    expect(sede.contractHistory[0].careerAtEnd.roleId).toBe("operaio_esperto");
    expect(sede.contractHistory[0].careerAtEnd.pay).toBe(275);
    expect(sede.attendance.turni).toEqual([]);
    expect(sede.career.reliability).toBe(50);
    expect(sede.career.cyclesCompleted).toBe(0);
    expect(sede.career.raisesByRole).toEqual({});
    expect(sede.career.warnings).toBe(0);
  });

  it("salva un esito strutturato del turno e gli collega l'evento di fine turno", () => {
    const ctx = {
      G:{
        year:1,week:2,day:3,
        workplaces:{},
        job:{id:"operaio",place:"fabbrica",n:"Operaio"}
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => 2;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    vm.runInContext(`
      lavoroSalvaEsitoTurno("fabbrica",{
        jobId:"operaio",
        jobName:"Operaio",
        pay:{base:220,total:286,bonus:66,percent:30,label:"6° giorno"},
        energyDelta:-40,
        wellbeingDelta:-3,
        lucidityDelta:-1,
        attendance:{worked:5,required:5,total:6}
      });
      lavoroSegnaEventoEsitoTurno("fabbrica",{
        type:"factory",
        title:"Vita di Fabbrica",
        detail:"giornata-liscia"
      });
    `, ctx);

    const out=ctx.G.workplaces.fabbrica.lastShiftOutcome;
    expect(out.pay.total).toBe(286);
    expect(out.pay.bonus).toBe(66);
    expect(out.energyDelta).toBe(-40);
    expect(out.attendance.worked).toBe(5);
    expect(out.event.title).toBe("Vita di Fabbrica");
    expect(out.absoluteDay).toBe(10);
  });

  it("la scena Fabbrica mostra il riepilogo completo del turno senza uscire dal luogo", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    const eventi = leggi("js/game/eventi-v2.js");
    const actions = leggi("js/game/actions.js");

    expect(actions).toContain("function lavoroSalvaEsitoTurno(luogo,data)");
    expect(actions).toContain("function lavoroSegnaEventoEsitoTurno(luogo,event)");
    expect(luoghi).toContain("function lfFabbricaEsitoTurno()");
    expect(luoghi).toContain('lfRiga("Paga"');
    expect(luoghi).toContain('lfRiga("Bonus"');
    expect(luoghi).toContain('lfRiga("Energia"');
    expect(luoghi).toContain('lfRiga("Benessere"');
    expect(luoghi).toContain('lfRiga("Lucidità"');
    expect(luoghi).toContain('lfRiga("Presenze"');
    expect(luoghi).toContain('lfRiga("Fine turno"');
    expect(luoghi).toContain('LUOGO.esito && LUOGO.esito.a === "turno" && mio');
    expect(eventi).toContain("adfShiftOutcomeEvent(shiftPayload.workplace,jobBefore");
    expect(eventi).toContain('title:"Nessun evento extra"');
  });

  it("marca sempre la domenica e colora i giorni non lavorati solo a settimana conclusa", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    const css = leggi("css/luoghi-foto.css");

    /* il cartellino è generico dalla Pizzeria: il riposo viene dal contratto,
       e la classe «domenica» resta solo alla Fabbrica */
    expect(luoghi).toContain("const giornoRiposo = riposo === numeroGiorno;");
    expect(luoghi).toContain("const settimanaConclusa = settimana < (cart.settimana - 1);");
    expect(luoghi).toContain("const inFerie = feriePosizioni.has(pos) && !n;");
    expect(luoghi).toContain("const nonLavorato = settimanaConclusa && giornoOrdinario && !giornoRiposo && n === 0 && !inFerie;");
    expect(luoghi).toContain('(luogo === "fabbrica" && numeroGiorno === 7 ? " domenica" : "")');
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
    expect(luoghi).toContain('lavoroTerminaContratto(luogo, "dimissioni")');
  });

  it("la UI Fabbrica mostra energia e impatto del ruolo corrente", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    expect(luoghi).toContain('lavoroEffettiTurno("fabbrica", G.job)');
    expect(luoghi).toContain('lfRiga("Impatto turno", caricoRuolo)');
    expect(luoghi).toContain('effettiRuolo.fisico');
    expect(luoghi).toContain('effettiRuolo.stress');
  });

  it("espone requisiti carriera reali e il prossimo ruolo senza hardcode UI", () => {
    const ctx = {
      G:{
        year:1,week:13,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            career:{
              reliability:68,cyclesCompleted:2,perfectCycles:1,perfectStreak:1,
              cyclesInRole:2,perfectCyclesInRole:1,roleId:"operaio",roleLevel:0,
              raisesByRole:{operaio:1},payHistory:[],roleHistory:[],
              warnings:0,warningHistory:[],weeklyEvaluations:[],dismissals:0,
              blockedUntilWeek:null,lastEvaluatedCycle:null,lastEvaluation:null,evaluations:[]
            }
          }
        },
        strada:{}
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => 13;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const p=vm.runInContext('lavoroProgressoCarriera("fabbrica")',ctx);
    expect(p.ruolo.n).toBe("Operaio");
    expect(p.prossimo.n).toBe("Operaio esperto");
    expect(p.aumento.esaurito).toBe(true);
    expect(p.promozione.cicli).toEqual({valore:2,soglia:3,ok:false});
    expect(p.promozione.perfetti).toEqual({valore:1,soglia:2,ok:false});
    expect(p.promozione.affidabilita).toEqual({valore:68,soglia:75,ok:false});
    expect(p.prossimo.energia).toBe(36);
    expect(p.prossimo.fisico).toBe("medio-alto");
    expect(p.percorso.map(x=>x.stato)).toEqual(["corrente","futuro","futuro","futuro"]);
  });

  it("Capoturno resta il grado terminale finché non esiste un percorso successivo definito", () => {
    const ctx = {
      G:{
        year:2,week:10,day:1,
        job:{id:"capoturno",place:"fabbrica",n:"Capoturno",pay:456,e:28},
        workplaces:{
          fabbrica:{
            career:{
              reliability:100,cyclesCompleted:20,perfectCycles:20,perfectStreak:20,
              cyclesInRole:10,perfectCyclesInRole:10,roleId:"capoturno",roleLevel:3,
              raisesByRole:{operaio:1,operaio_esperto:1,capolinea:1,capoturno:1},
              payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
              weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,
              lastEvaluatedCycle:null,lastEvaluation:null,evaluations:[]
            }
          }
        },
        strada:{}
      },
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => 62;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);

    const p=vm.runInContext('lavoroProgressoCarriera("fabbrica")',ctx);
    expect(p.ruolo.id).toBe("capoturno");
    expect(p.prossimo).toBeNull();
    expect(p.promozione.massimo).toBe(true);
    expect(p.promozione.disponibile).toBe(false);
    expect(vm.runInContext('lavoroPromozioneDisponibile("fabbrica")',ctx)).toBe(false);
  });

  it("la UI Fabbrica spiega progressione, candidatura e impatto del prossimo ruolo", () => {
    const luoghi = leggi("js/game/luoghi-foto.js");
    const css = leggi("css/luoghi-foto.css");

    expect(luoghi).toContain("function lfFabbricaCarriera()");
    expect(luoghi).toContain('function lfCarrieraLavoro(luogo)');
    expect(luoghi).toContain('lavoroProgressoCarriera(luogo)');
    expect(luoghi).toContain('function lfFabbricaCarriera(){ return lfCarrieraLavoro("fabbrica"); }');
    expect(luoghi).toContain('lfPan("Carriera", lfFabbricaCarriera(), "spunta")');
    expect(luoghi).toContain("Prossimo ruolo");
    expect(luoghi).toContain("Grado massimo raggiunto");
    expect(luoghi).toContain("Non ci sono altre mansioni sopra");
    expect(luoghi).toContain("Cicli nel ruolo");
    expect(luoghi).toContain("Cicli perfetti");
    expect(luoghi).toContain("Affidabilità");
    expect(luoghi).toContain("Cosa cambia per turno:");
    expect(luoghi).toContain("Le soglie aprono una <b>candidatura</b>");
    expect(css).toContain(".lfcareer-path{");
    expect(css).toContain(".lfcareer-req.ok");
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


describe("Pizzeria strutturata", () => {
  function ctxBase(overrides = {}){
    const ctx = {
      G:Object.assign({
        year:1,week:1,day:2,
        job:{id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",pay:100,e:18}
      }, overrides),
      Number, Math, Array, Object, Set
    };
    ctx.totalWeeks = () => (ctx.G.year - 1) * 52 + ctx.G.week;
    vm.createContext(ctx);
    vm.runInContext(helperLavoro(), ctx);
    return ctx;
  }

  it("usa i dati propri: 4 servizi, martedì-domenica, lunedì riposo", () => {
    const ctx = ctxBase();
    const contratto = vm.runInContext('lavoroContrattoDef("pizzeria")', ctx);

    expect(contratto.turniSettimanali).toBe(4);
    expect(Array.from(contratto.giorniConsentiti)).toEqual([2,3,4,5,6,7]);
    expect(contratto.giornoRiposo).toBe(1);
    expect(contratto.domenicaRiposo).toBe(false);
    expect(contratto.bonusSestoGiornoPct).toBe(20);

    ctx.G.day = 1;
    expect(vm.runInContext('lavoroTurnoConsentitoOggi("pizzeria").ok', ctx)).toBe(false);
    ctx.G.day = 7;
    expect(vm.runInContext('lavoroTurnoConsentitoOggi("pizzeria").ok', ctx)).toBe(true);
  });

  it("paga +20% dal quinto giorno distinto senza trasformare la domenica in straordinario", () => {
    const ctx = ctxBase({day:6});
    vm.runInContext(`
      G.workplaces = {
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          attendance:{ciclo:0,turni:[1,2,3,4]}
        }
      };
    `, ctx);

    const paga = vm.runInContext('lavoroPagaTurno("pizzeria",100)', ctx);
    expect(paga.percentuale).toBe(20);
    expect(paga.bonus).toBe(20);
    expect(paga.totale).toBe(120);
    expect(paga.tipo).toBe("giorno-extra");
    expect(paga.etichetta).toBe("5° giorno");
  });

  it("due assenze su quattro generano il richiamo Pizzeria e -8 affidabilità", () => {
    const ctx = ctxBase({day:7});
    vm.runInContext(`
      G.workplaces = {
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          attendance:{ciclo:0,turni:[1,2]}
        }
      };
    `, ctx);

    const out = vm.runInContext(
      'lavoroValutaDisciplinaSettimana("pizzeria",1,0,0,G.workplaces.pizzeria.attendance.turni,{silent:true})',
      ctx
    );
    expect(out.absences).toBe(2);
    expect(out.warningAdded).toBe(1);
    expect(out.dismissed).toBe(false);
    expect(vm.runInContext('lavoroCarriera("pizzeria").warnings', ctx)).toBe(1);
    expect(vm.runInContext('lavoroCarriera("pizzeria").reliability', ctx)).toBe(42);
  });

  it("un ciclo 4/4 perfetto Pizzeria vale +8 affidabilità", () => {
    const ctx = ctxBase({week:4,day:7});
    vm.runInContext(`
      G.workplaces = {
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          attendance:{ciclo:0,turni:[
            1,2,3,4,
            8,9,10,11,
            15,16,17,18,
            22,23,24,25
          ]}
        }
      };
    `, ctx);

    const out = vm.runInContext('lavoroChiudiCiclo("pizzeria")', ctx);
    expect(out.perfect).toBe(true);
    expect(out.fullWeeks).toBe(4);
    expect(out.absences).toBe(0);
    expect(out.reliabilityBefore).toBe(50);
    expect(out.reliabilityAfter).toBe(58);
  });

  it("la carriera della Pizzeria resta legata al luogo quando cambia mansione", () => {
    const ctx = ctxBase({week:9,day:2});
    vm.runInContext(`
      G.workplaces = {
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          career:{
            reliability:76,cyclesCompleted:4,perfectCycles:3,perfectStreak:2,
            cyclesInRole:4,perfectCyclesInRole:2,roleId:"lavapiatti",roleLevel:0,
            raisesByRole:{lavapiatti:1},payHistory:[],roleHistory:[],warnings:0,
            warningHistory:[],weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,evaluations:[]
          }
        }
      };
    `, ctx);

    expect(vm.runInContext('lavoroPromozioneDisponibile("pizzeria")', ctx)).toBe(true);
    expect(vm.runInContext('lavoroProssimoRuolo("pizzeria").id', ctx)).toBe("aiuto_cucina");

    const out = vm.runInContext(
      'lavoroPromuoviRuolo("pizzeria",{nuovaPaga:115,energia:19,motivo:"test"})',
      ctx
    );
    expect(out.a.id).toBe("aiuto_cucina");
    expect(ctx.G.job.id).toBe("aiuto_cucina");
    expect(ctx.G.job.n).toBe("Aiuto cucina");
    expect(ctx.G.job.place).toBe("pizzeria");
    expect(ctx.G.job.pay).toBe(115);
  });

  it("la copertura extra Pizzeria usa +20% e affidabilità propria", () => {
    const ctx = ctxBase({day:5});
    vm.runInContext(`
      G.workplaces = {
        pizzeria:{
          contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"lavapiatti"},
          attendance:{ciclo:0,turni:[1,2,3,4]},
          career:{
            reliability:50,cyclesCompleted:0,perfectCycles:0,perfectStreak:0,
            cyclesInRole:0,perfectCyclesInRole:0,roleId:"lavapiatti",roleLevel:0,
            raisesByRole:{},payHistory:[],roleHistory:[],warnings:0,warningHistory:[],
            weeklyEvaluations:[],dismissals:0,blockedUntilWeek:null,evaluations:[]
          }
        }
      };
    `, ctx);

    const offerta = vm.runInContext('lavoroTentaRichiestaStraordinario("pizzeria",0)', ctx);
    expect(offerta.tipo).toBe("giorno-extra");
    expect(offerta.targetDay).toBe(6);
    expect(offerta.bonusPct).toBe(20);
    vm.runInContext('lavoroAccettaStraordinario("pizzeria")', ctx);
    ctx.G.day = 6;
    const done = vm.runInContext('lavoroCompletaStraordinario("pizzeria")', ctx);
    expect(done.affidabilitaDelta).toBe(1);
    expect(ctx.G.workplaces.pizzeria.career.reliability).toBe(51);
  });

  it("UI, assunzione, orari e FAMEpedia sono collegati alla sede Pizzeria", () => {
    const actions = leggi("js/game/actions.js");
    const hub = leggi("js/game/hub.js");
    const luoghi = leggi("js/game/luoghi-foto.js");
    const tempo = leggi("js/game/tempo.js");
    const spostamenti = leggi("js/game/spostamenti.js");
    const famepedia = leggi("js/famepedia.js");

    expect(actions).toContain('{id:"lavapiatti", place:"pizzeria"');
    expect(hub).toContain("function contrattoPostoLavoro(def)");
    expect(luoghi).toContain('data-dimissioni="pizzeria"');
    expect(luoghi).toContain("function lfPizzeriaCartellino()");
    expect(luoghi).toContain('lfPan("Settimane in cucina"');
    expect(tempo).toContain("pizzeria:300");
    expect(spostamenti).toContain("lavoroLuogo(G.job)");
    expect(famepedia).toContain('["Pizzeria","Il percorso parte da Lavapiatti: 100 €');
  });
});
