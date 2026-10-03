import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

describe("Strada · adapter UI finale allineato al motore crime",()=>{
  const ui=leggi("js/game/strada-crimine-ui.js");

  it("mostra le quattro offerte del giorno, non l'intero pool da 30",()=>{
    expect(ui).toContain("stradaColpiDisponibili()");
    expect(ui).toContain("offerte.map");
    expect(ui).not.toContain('q("#crimes").innerHTML=STRADA_COLPI.map');
  });

  it("usa la durata calcolata dal core e non consuma il tempo una seconda volta",()=>{
    expect(ui).toContain("stradaDurataColpo(colpo)");
    expect(ui).not.toContain('GAME_TIME.advance(durationFor(colpoId),"crime:"+colpoId)');
  });

  it("non tratta più persone, protezione, ferro e avvocato come acquisti istantanei",()=>{
    expect(ui).toContain("Persone fidate");
    expect(ui).toContain("stScenaProtezione()");
    expect(ui).toContain("stScenaAvvocato()");
    expect(ui).toContain("stCompraFerro()");
    expect(ui).not.toContain("500 € all'ingresso · 140 €/sett.");
    expect(ui).not.toContain('id="gun" type="button">900 €');
    expect(ui).not.toContain("stImpostaProtezione((before+1)%STRADA_PROT.length)");
  });

  it("il costo copertura non reintroduce gli uomini numerici legacy",()=>{
    const start=ui.indexOf("function weeklyCost()");
    const end=ui.indexOf("function crimeDef(",start);
    const block=ui.slice(start,end);
    expect(block).toContain("stCopertura()");
    expect(block).not.toContain("s.uomini");
  });

  it("riciclaggio e attività passano dalle scene nuove invece di saltare le scelte",()=>{
    expect(ui).toContain("stScenaRiciclaggio()");
    expect(ui).toContain('data-business="');
    expect(ui).toContain("stScenaAttivita(manage.dataset.business)");
  });

  it("le scene rispettano opzioni disabilitate, hot, statistiche e dettagli",()=>{
    expect(ui).toContain('o.no?"disabled":""');
    expect(ui).toContain('o.hot?"hot":""');
    expect(ui).toContain("STRADA_SCENA.stats");
    expect(ui).toContain("[o.sx,o.dx]");
    expect(ui).toContain("if(o&&o.no)return");
  });

  it("le scene annidate del core ridisegnano l'adapter effettivamente visibile",()=>{
    expect(ui).toContain("renderStScheda=sync");
    expect(ui).toContain("stToast=toast");
  });

  it("mollare il giro mostra l'esito reale e non forza un falso successo",()=>{
    expect(ui).toContain("const msg=stMollaIlGiro()");
    expect(ui).toContain("toast(msg)");
    expect(ui).not.toContain('stMollaIlGiro();STRADA_SCENA=null;setVisual(["street","danger"]);toast("Hai mollato il giro.")');
  });
});
