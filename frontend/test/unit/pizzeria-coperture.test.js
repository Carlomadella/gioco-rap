import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

describe("coperture extra narrative Pizzeria",()=>{
  it("mantiene quattro motivi narrativi senza aumentare la frequenza",()=>{
    const eventi=leggi("js/game/eventi-v2.js");
    const actions=leggi("js/game/actions.js");

    const start=eventi.indexOf("const ADF_PIZZERIA_OVERTIME_SCENARIOS");
    const end=eventi.indexOf("const ADF_PIZZERIA_OVERTIME_ROLE_CONTEXT",start);
    const block=eventi.slice(start,end);

    expect((block.match(/\bid:"[^"]+"/g)||[]).length).toBe(4);
    expect(block).toContain('id:"collega-malato"');
    expect(block).toContain('id:"prenotazione-grossa"');
    expect(block).toContain('id:"serata-zona"');
    expect(block).toContain('id:"delivery-pieno"');

    expect(actions).toContain("chanceSestoGiorno:0.14");
    expect(actions).toContain("chanceDomenica:0.16");
    expect(actions).toContain("bonusSestoGiornoPct:20");
  });

  it("differenzia chi chiede la copertura e cosa fai nei quattro ruoli",()=>{
    const eventi=leggi("js/game/eventi-v2.js");
    const start=eventi.indexOf("const ADF_PIZZERIA_OVERTIME_ROLE_CONTEXT");
    const end=eventi.indexOf("function adfPizzeriaOvertimeRoleContext",start);
    const block=eventi.slice(start,end);

    for(const role of ["lavapiatti","aiuto_cucina","aiuto_pizzaiolo","pizzaiolo"])
      expect(block).toContain(role+":Object.freeze({");

    expect(block).toContain('asker:"Il responsabile di cucina"');
    expect(block).toContain('asker:"Il pizzaiolo"');
    expect(block).toContain('asker:"Il titolare"');
    expect(block).toContain("lavaggio e chiusura");
    expect(block).toContain("preparazioni e dare supporto");
    expect(block).toContain("banco, preparazioni e forno");
    expect(block).toContain("tenere il forno e fare da riferimento");
  });

  it("persiste il motivo e il ruolo dentro la richiesta reale",()=>{
    const eventi=leggi("js/game/eventi-v2.js");

    expect(eventi).toContain("function adfPizzeriaOvertimeScenario(offerta)");
    expect(eventi).toContain("offerta.scenarioId=scelta.id");
    expect(eventi).toContain("offerta.scenarioLabel=scelta.label");
    expect(eventi).toContain("offerta.scenarioRoleId=scelta.roleId");
    expect(eventi).toContain("overtime.pendingOffer.scenarioLabel=scelta.label");
    expect(eventi).toContain("overtime.pendingOffer.scenarioRoleId=scelta.roleId");
    expect(eventi).toContain("pizzeriaOvertimeRecent");
    expect(eventi).toContain("if(recent.length>3) recent.length=3");
  });

  it("usa lo scenario Pizzeria nel popup invece del vecchio testo unico",()=>{
    const eventi=leggi("js/game/eventi-v2.js");

    expect(eventi).toContain(": adfPizzeriaOvertimeScenario(offerta)");
    expect(eventi).toContain(": (scenario||adfPizzeriaOvertimeRoleContext())");
    expect(eventi).toContain('k:nome+" · "+(fabbrica?"Straordinario":"Copertura extra")');
    expect(eventi).not.toContain("Nel weekend la sala è piena e manca una persona in cucina.");
  });

  it("mostra il motivo nella schermata Pizzeria dopo l'accettazione",()=>{
    const luoghi=leggi("js/game/luoghi-foto.js");

    const start=luoghi.indexOf("function lfPizzeria(){");
    const end=luoghi.indexOf("/* ---------- IL CIRCOLO ----------",start);
    const block=luoghi.slice(start,end);

    expect(block).toContain("straordinarioOggi.scenarioLabel");
    expect(block).toContain("straordinarioAccettato.scenarioLabel");
    expect(block).toContain("Copertura extra concordata oggi:");
    expect(block).toContain("Copertura extra concordata:");
  });
});
