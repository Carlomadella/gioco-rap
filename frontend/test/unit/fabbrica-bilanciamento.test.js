import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  esegui, simulaFatica, simulaCarrieraPerfetta,
  simulaProfiliRuolo, simulaDisciplina, simulaEventiRuolo, simulaConflittiMusica,
  simulaDoppiaVita
} = require("../../strumenti/bilanciamento/fabbrica.js");

describe("stress test annuale Fabbrica", () => {
  it("il contratto normale 5/5 resta sostenibile per 52 settimane", () => {
    const out=simulaFatica("5/5",()=>5,52);
    expect(out.finale.fatica).toBe(14);
    expect(out.massima).toBeLessThanOrEqual(15);
    expect(out.finale.qualita).toBe(1);
    expect(out.finale.lifestyle).toBe(1);
  });

  it("6/7 e 7/7 restano sovraccarico vero e distinto", () => {
    const sei=simulaFatica("6/7",()=>6,52);
    const sette=simulaFatica("7/7",()=>7,52);

    expect(sei.finale.fatica).toBe(46);
    expect(sei.finale.qualita).toBeLessThan(.9);
    expect(sei.finale.lifestyle).toBeLessThan(.8);

    expect(sette.finale.fatica).toBe(86);
    expect(sette.finale.qualita).toBe(.78);
    expect(sette.finale.lifestyle).toBeCloseTo(.476);
  });

  it("dopo un periodo pesante tornare al 5/5 recupera gradualmente", () => {
    const out=simulaFatica("recupero",w=>w<=12?6:5,52);
    expect(out.massima).toBe(46);
    expect(out.finale.fatica).toBe(17);
    expect(out.finale.qualita).toBe(1);
    expect(out.finale.lifestyle).toBeCloseTo(.99);
  });

  it("la carriera perfetta è forte ma finita: top role e paga non crescono all'infinito", () => {
    const out=simulaCarrieraPerfetta(13);

    expect(out.finale.ruolo).toBe("capoturno");
    expect(out.finale.paga).toBe(456);
    expect(out.pagaAnnua).toBe(88520);
    expect(out.storia.filter(x=>x.evento&&x.evento.tipo==="promozione")).toHaveLength(3);
    expect(out.storia.filter(x=>x.evento&&x.evento.tipo==="aumento")).toHaveLength(4);
  });

  it("la paga cresce ma non rende gratuito il lifestyle massimo", () => {
    const out=esegui();

    expect(out.economia.pagaIngressoSettimana).toBe(1100);
    expect(out.economia.pagaTopSettimana).toBe(2280);
    expect(out.economia.costoMinimoSettimanaleMassimo).toBe(2845);
    expect(out.economia.pagaTopSettimana).toBeLessThan(out.economia.costoMinimoSettimanaleMassimo);
    expect(out.economia.pagaTopSestoGiorno).toBe(2873);
    expect(out.economia.pagaTopSestoGiorno).toBeGreaterThanOrEqual(out.economia.costoMinimoSettimanaleMassimo);
  });

  it("lo stress test misura il carico settimanale reale dei quattro ruoli", () => {
    const p=simulaProfiliRuolo();

    expect(p.operaio).toMatchObject({
      energiaTurno:40,benessereTurno:-3,luciditaTurno:-1,
      settimana:{turni:5,energia:200,benessere:-15,lucidita:-5}
    });
    expect(p.operaio_esperto).toMatchObject({
      energiaTurno:36,benessereTurno:-2,luciditaTurno:-1
    });
    expect(p.capolinea).toMatchObject({
      energiaTurno:32,benessereTurno:-1,luciditaTurno:-2
    });
    expect(p.capoturno).toMatchObject({
      energiaTurno:28,benessereTurno:-1,luciditaTurno:-3,
      settimana:{turni:5,energia:140,benessere:-5,lucidita:-15}
    });
  });

  it("lo stress test attraversa davvero disciplina, richiami e licenziamento", () => {
    const d=simulaDisciplina();

    expect(d.normale).toMatchObject({absences:0,warningAdded:0,reliabilityDelta:0,dismissed:false});
    expect(d.lieve).toMatchObject({absences:1,warningAdded:0,reliabilityDelta:-5,dismissed:false});
    expect(d.gravi).toHaveLength(3);
    expect(d.gravi[0]).toMatchObject({absences:3,warningAdded:1,dismissed:false});
    expect(d.gravi[1]).toMatchObject({absences:3,warningAdded:1,dismissed:false});
    expect(d.gravi[2]).toMatchObject({absences:3,dismissed:true});
    expect(d.blocco.active).toBe(true);
    expect(d.blocco.weeksRemaining).toBeGreaterThan(0);
  });

  it("in cinque settimane ogni ruolo attraversa i cinque eventi specifici senza ripetersi", () => {
    const eventi=simulaEventiRuolo();

    for(const ruolo of ["operaio","operaio_esperto","capolinea","capoturno"]){
      expect(eventi[ruolo].mostrati).toBe(5);
      expect(eventi[ruolo].unici).toBe(5);
      expect(new Set(eventi[ruolo].eventi).size).toBe(5);
    }
    expect(eventi.operaio.delta.wellbeing).not.toBe(0);
    expect(eventi.capoturno.delta.lucidita).toBeLessThan(0);
  });

  it("il conflitto musica/lavoro distingue costo opportunità, rischio assenza e appuntamento perso", () => {
    const c=simulaConflittiMusica();

    expect(c.musicaRecuperabile.row).toMatchObject({
      choice:"music",forgonePay:220
    });
    expect(c.musicaRecuperabile.row.attendance.assenzeCreateDalConflitto).toBe(0);

    expect(c.musicaCritica.row.choice).toBe("music");
    expect(c.musicaCritica.row.attendance.assenzeCreateDalConflitto).toBe(1);

    expect(c.scegliLavoro.row.choice).toBe("work");
    expect(c.scegliLavoro.started).toEqual(["turno"]);
    expect(c.scegliLavoro.missed).toBe(1);
  });

  it("la doppia vita 5/5 + musica serale resta possibile all'inizio", () => {
    const d=simulaDoppiaVita();

    expect(d.fonti).toMatchObject({
      turnoFabbrica:480,
      scrivi:120,
      beat:120,
      registra:180,
      mixa:120,
      promo:45
    });
    expect(d.base.lavorabili).toBe(6);
    expect(d.base.richiesti).toBe(5);
    expect(d.base.margine).toBe(1);
    expect(d.base.contrattoPossibile).toBe(true);
    expect(d.base.conflitti).toEqual([]);
  });

  it("una giornata piena di musica toglie il margine ma si recupera col sabato", () => {
    const d=simulaDoppiaVita();

    expect(d.unaGiornataPiena.giorni[4].giorno).toBe(5);
    expect(d.unaGiornataPiena.giorni[4].preWork.map(x=>x.id)).toEqual(["scrivi","beat"]);
    expect(d.unaGiornataPiena.giorni[4].musicaPrima).toBe(240);
    expect(d.unaGiornataPiena.giorni[4].turnoPossibile).toBe(false);
    expect(d.unaGiornataPiena.lavorabili).toBe(5);
    expect(d.unaGiornataPiena.margine).toBe(0);
    expect(d.unaGiornataPiena.contrattoPossibile).toBe(true);
  });

  it("due giornate musicali piene rendono il 5/5 impossibile senza una scelta", () => {
    const d=simulaDoppiaVita();

    expect(d.dueGiornatePiene.lavorabili).toBe(4);
    expect(d.dueGiornatePiene.contrattoPossibile).toBe(false);
    expect(d.dueGiornatePiene.giorni[3].turnoPossibile).toBe(false);
    expect(d.dueGiornatePiene.giorni[4].turnoPossibile).toBe(false);
  });

  it("tre ore di studio prima del turno possono trasformare un evento serale in conflitto", () => {
    const d=simulaDoppiaVita();
    const r=d.registrazionePrima;

    expect(r.preWork.map(x=>x.id)).toEqual(["registra"]);
    expect(r.musicaPrima).toBe(180);
    expect(r.inizioTurno).toBe(11*60);
    expect(r.fineTurno).toBe(19*60);
    expect(r.turnoPossibile).toBe(true);

    if(r.evento && r.evento.id==="promo"){
      expect(r.evento.ora).toBe("18:00");
      expect(r.conflitto).toBe(true);
    }
  });

  it("il pacchetto di guardrail del punto 16 passa interamente", () => {
    const out=esegui();
    expect(out.ok).toBe(true);
    expect(out.controlli.every(x=>x.ok)).toBe(true);
  });

  it("il simulatore globale registra le metriche di lavoro nel rapporto", () => {
    const bot = require("node:fs").readFileSync(
      new URL("../../strumenti/bilanciamento/bot.js", import.meta.url), "utf8"
    );
    const rapporto = require("node:fs").readFileSync(
      new URL("../../strumenti/bilanciamento/rapporto.js", import.meta.url), "utf8"
    );

    expect(bot).toContain("faticaLavoro:Math.round(Number(G.workFatigue||0))");
    expect(bot).toContain("affidabilitaLavoro:");
    expect(bot).toContain("pagaLavoro:");
    expect(rapporto).toContain('"faticaLavoro", "pagaLavoro", "affidabilitaLavoro"');
    expect(rapporto).toContain('["paga lavoro €/turno"');
    expect(rapporto).toContain('["fatica lavoro"');
  });
});
