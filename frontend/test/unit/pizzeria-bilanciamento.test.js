import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require=createRequire(import.meta.url);
const {
  esegui,simulaFatica,simulaCarrieraPerfetta,simulaProfiliRuolo,
  simulaConfrontoReteFabbrica,simulaDoppiaVita,pacingSocialeMensile
}=require("../../strumenti/bilanciamento/pizzeria.js");

describe("stress test Pizzeria part-time",()=>{
  it("il contratto normale 4/4 recupera la fatica invece di accumularla",()=>{
    const out=simulaFatica("4/4",()=>4,52);
    expect(out.finale.fatica).toBe(0);
    expect(out.massima).toBe(0);
    expect(out.finale.qualita).toBe(1);
    expect(out.finale.lifestyle).toBe(1);
  });

  it("il quinto servizio resta gestibile, sei continuativi diventano sovraccarico",()=>{
    const cinque=simulaFatica("5",()=>5,52);
    const sei=simulaFatica("6",()=>6,52);

    expect(cinque.finale.fatica).toBe(14);
    expect(cinque.finale.qualita).toBe(1);
    expect(cinque.finale.lifestyle).toBe(1);

    expect(sei.finale.fatica).toBe(46);
    expect(sei.finale.qualita).toBeLessThan(.9);
    expect(sei.finale.lifestyle).toBeLessThan(.8);
  });

  it("i quattro ruoli restano leggeri ma cambiano davvero il tipo di carico",()=>{
    const p=simulaProfiliRuolo();

    expect(p.lavapiatti).toMatchObject({
      energiaTurno:18,benessereTurno:-1,luciditaTurno:0,
      settimana:{turni:4,energia:72,benessere:-4,lucidita:0}
    });
    expect(p.aiuto_cucina).toMatchObject({
      energiaTurno:17,benessereTurno:-1,luciditaTurno:0
    });
    expect(p.aiuto_pizzaiolo).toMatchObject({
      energiaTurno:16,benessereTurno:0,luciditaTurno:-1
    });
    expect(p.pizzaiolo).toMatchObject({
      energiaTurno:15,benessereTurno:0,luciditaTurno:-1,
      settimana:{turni:4,energia:60,benessere:0,lucidita:-4}
    });
  });

  it("la carriera perfetta resta secondaria nel primo anno e arriva a Pizzaiolo solo dopo",()=>{
    const anno=simulaCarrieraPerfetta(13);
    const tappeAnno=anno.storia.filter(x=>x.evento);

    expect(anno.finale.ruolo).toBe("aiuto_pizzaiolo");
    expect(anno.finale.paga).toBe(154);
    expect(anno.pagaAnnua).toBe(24544);
    expect(tappeAnno.filter(x=>x.evento.tipo==="promozione")).toHaveLength(2);
    expect(tappeAnno.filter(x=>x.evento.tipo==="aumento")).toHaveLength(2);

    const lungo=simulaCarrieraPerfetta(19);
    const tappeLunghe=lungo.storia.filter(x=>x.evento);
    expect(lungo.finale.ruolo).toBe("pizzaiolo");
    expect(tappeLunghe.filter(x=>x.evento.tipo==="promozione")).toHaveLength(3);
  });

  it("ogni livello Pizzeria espone a più rete del livello Fabbrica equivalente",()=>{
    const rows=simulaConfrontoReteFabbrica();
    expect(rows).toHaveLength(4);
    for(const x of rows){
      expect(x.pChance).toBeGreaterThan(x.fChance);
      expect(x.pCap).toBeGreaterThan(x.fCap);
    }
    expect(rows[0]).toMatchObject({pChance:.22,fChance:.16,pCap:5,fCap:4});
    expect(rows[3]).toMatchObject({pChance:.28,fChance:.22,pCap:8,fCap:7});
  });

  it("il part-time lascia molto spazio di giorno ma confligge naturalmente con la musica serale",()=>{
    const d=simulaDoppiaVita();

    expect(d.fonti.turnoPizzeria).toBe(300);
    expect(d.fonti.turnoFabbrica).toBe(480);

    expect(d.base.inizioTurno).toBe(17*60);
    expect(d.base.fineTurno).toBe(22*60);
    expect(d.base.conflitto).toBe(true);

    expect(d.registrazionePrima.musicaPrima).toBe(180);
    expect(d.registrazionePrima.inizioTurno).toBe(17*60);
    expect(d.registrazionePrima.turnoPossibile).toBe(true);

    expect(d.giornataMusicalePiena.musicaPrima).toBe(585);
    expect(d.giornataMusicalePiena.inizioTurno).toBe(17*60+45);
    expect(d.giornataMusicalePiena.turnoPossibile).toBe(true);

    expect(d.giornataMoltoPiena.musicaPrima).toBe(705);
    expect(d.giornataMoltoPiena.turnoPossibile).toBe(true);
  });

  it("la socialità resta dentro lo stesso tetto di pacing degli altri eventi",()=>{
    const p=pacingSocialeMensile();
    expect(p.gapDays).toBe(3);
    expect(p.turni).toBe(16);
    expect(p.maxIncidentali).toBe(8);
  });

  it("il pacchetto complessivo conferma il trade-off Pizzeria/Fabbrica",()=>{
    const out=esegui();

    expect(out.ok).toBe(true);
    expect(out.controlli.every(x=>x.ok)).toBe(true);
    expect(out.economia).toMatchObject({
      orePizzeriaSettimana:20,
      oreFabbricaSettimana:40,
      pagaIngressoPizzeria:400,
      pagaIngressoFabbrica:1100,
      pagaTopPizzeria:616,
      pagaAnnuaPizzeria:24544
    });
    expect(out.economia.pagaTopPizzeria).toBeLessThan(out.economia.pagaIngressoFabbrica);
  });
});
