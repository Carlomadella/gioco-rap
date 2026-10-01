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

    expect(actions).toContain('paga.etichetta + ": bonus +" + paga.percentuale');
    expect(actions).toContain('paga.totale');
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

  it("la Fabbrica non usa più il vecchio licenziamento dopo tre settimane a zero turni", () => {
    const sim = leggi("js/game/sim.js");
    expect(sim).toContain('if(luogoLavoro !== "fabbrica")');
    expect(sim).toContain("due sistemi disciplinari in conflitto");
  });

  it("le dimissioni non azzerano i richiami, il rientro dopo licenziamento sì", () => {
    const ctx = {
      G:{
        year:1,week:6,day:1,
        job:{id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40},
        workplaces:{
          fabbrica:{
            contract:{signed:true,legacy:false,signedAbsoluteDay:1,roleAtSign:"operaio"},
            career:{
              reliability:55,cyclesCompleted:1,perfectCycles:0,perfectStreak:0,
              cyclesInRole:1,perfectCyclesInRole:0,roleId:"operaio",roleLevel:0,
              raisesByRole:{},payHistory:[],roleHistory:[],warnings:2,warningHistory:[],
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

    vm.runInContext('lavoroTerminaContratto("fabbrica","dimissioni"); G.job={id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}; lavoroFirmaContratto("fabbrica",G.job);', ctx);
    expect(vm.runInContext('lavoroCarriera("fabbrica").warnings', ctx)).toBe(2);

    vm.runInContext('lavoroTerminaContratto("fabbrica","licenziamento"); lavoroCarriera("fabbrica").blockedUntilWeek=5;', ctx);
    ctx.G.week = 6;
    vm.runInContext('G.job={id:"operaio",place:"fabbrica",n:"Operaio",pay:220,e:40}; lavoroFirmaContratto("fabbrica",G.job);', ctx);
    expect(vm.runInContext('lavoroCarriera("fabbrica").warnings', ctx)).toBe(0);
  });

  it("contratto e UI espongono richiami e blocco di riassunzione", () => {
    const hub = leggi("js/game/hub.js");
    const luoghi = leggi("js/game/luoghi-foto.js");

    expect(hub).toContain("da 3 in su scatta un richiamo formale");
    expect(hub).toContain("8 settimane senza riassunzione");
    expect(hub).toContain('lavoroBloccoRiassunzione("fabbrica")');
    expect(luoghi).toContain("'Richiami <b>' + Number(cart.richiami || 0) + '/2</b>'");
    expect(luoghi).toContain('"Riassunzione bloccata · " + bloccoRiassunzione.weeksRemaining');
  });

  it("il motore eventi non può aggirare il blocco Fabbrica", () => {
    const eventi = leggi("js/game/eventi-v2.js");
    expect(eventi).toContain('lavoroBloccoRiassunzione("fabbrica").active');
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

    expect(eventi).toContain("function adfFactoryOvertimeAfterShift()");
    expect(eventi).toContain('claimAutoEvent("factory-overtime")');
    expect(eventi).toContain('t:"Il capo ti ferma prima di uscire"');
    expect(eventi).toContain('lavoroAccettaStraordinario("fabbrica")');
    expect(eventi).toContain('lavoroAggiornaStraordinariTempo();');
    expect(luoghi).toContain("Straordinario concordato oggi");
    expect(luoghi).toContain("straordinarioAccettato.targetLabel");
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
