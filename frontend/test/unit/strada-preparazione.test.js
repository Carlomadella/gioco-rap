import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

describe("Strada · punto 8 preparazione colpi",()=>{
  it("fa passare ogni colpo da una sola preparazione prima dell'approccio",()=>{
    expect(source).toContain("const STRADA_PREPARAZIONI = Object.freeze([");
    expect(source).toContain("STRADA_SCENA = stScenaPreparazione(colpo);");
    expect(source).toContain("Una sola scelta: poi si decide come affrontare il colpo.");
    expect(source).toContain("stScenaApproccio(colpo,out.context)");
  });

  it("le opzioni a tempo usano il clock globale e non un contatore parallelo",()=>{
    expect(source).toContain('id:"informazioni"');
    expect(source).toContain("minuti:45");
    expect(source).toContain('id:"finestra"');
    expect(source).toContain("minuti:90");
    expect(source).toContain('GAME_TIME.spend(minuti,"crime:prepare"');
    expect(source).toContain("GAME_TIME.canSpend");
  });

  it("i favori appartengono alle persone, hanno cap e non si comprano",()=>{
    expect(source).toContain("favori:0");
    expect(source).toContain("favoriEventi:[]");
    expect(source).toContain("Math.min(3");
    expect(source).toContain("function stradaConsumaFavore");
    expect(source).toContain("function stradaPersoneConFavore");
    expect(source).not.toContain("STRADA_FAVORE_COSTO");
  });

  it("i favori si guadagnano aiutando con successo contatti reali",()=>{
    expect(source).toContain('stradaAggiungiFavore(personaIngresso,1,"intro-"+step+"-success")');
    expect(source).toContain('stradaAggiungiFavore(personaLead,1,"opportunita-success")');
    expect(source).toContain('stradaConsumaFavore(p,"preparazione:"');
  });

  it("la preparazione modifica davvero riuscita e attenzione del colpo",()=>{
    expect(source).toContain("p += prep.chance;");
    expect(source).toContain("effettiPreparazione.heat");
    expect(source).toContain('id:"contatto"');
    expect(source).toContain("chance:.07");
    expect(source).toContain("heat:.88");
  });

  it("squadra e ferro restano approcci separati dalla preparazione",()=>{
    expect(source).toContain("const STRADA_APPROCCI = [");
    expect(source).toContain('id:"squadra"');
    expect(source).toContain('id:"ferro"');
    expect(source).toContain("stScenaPersonaSquadra(colpo,preparazione)");
  });
});
