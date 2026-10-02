import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { esegui, simulaFatica, simulaCarrieraPerfetta } =
  require("../../strumenti/bilanciamento/fabbrica.js");

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
