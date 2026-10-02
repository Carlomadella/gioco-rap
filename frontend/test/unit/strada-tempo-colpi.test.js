import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const tempo=fs.readFileSync(path.join(ROOT,"js/game/tempo.js"),"utf8");

function runtimeDurate(){
  const start=crime.indexOf("const STRADA_DURATA_BASE_CATEGORIA");
  const end=crime.indexOf("/* Città chiuse",start);
  if(start<0 || end<0) throw new Error("blocco durata colpi non trovato");
  const code=crime.slice(start,end);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const GAME_TIME={formatDuration:m=>m+"m"};
  return new Function("clamp","GAME_TIME",
    code+"\nreturn {stradaDurataColpo,stradaDurataColpoLabel,STRADA_DURATA_BASE_CATEGORIA};"
  )(clamp,GAME_TIME);
}

describe("Strada · punto 9 tempo dei colpi",()=>{
  it("scala la durata per categoria e difficoltà a scatti da 15 minuti",()=>{
    const r=runtimeDurate();
    expect(r.stradaDurataColpo({categoria:"trasporto",difficolta:.15})).toBe(75);
    expect(r.stradaDurataColpo({categoria:"merce",difficolta:.64})).toBe(120);
    expect(r.stradaDurataColpo({categoria:"furto",difficolta:.72})).toBe(150);
    expect(r.stradaDurataColpo({categoria:"incassi",difficolta:.70})).toBe(120);
  });

  it("mantiene i colpi attuali nel range 1h–2h30",()=>{
    const r=runtimeDurate();
    for(const categoria of Object.keys(r.STRADA_DURATA_BASE_CATEGORIA)){
      for(const difficolta of [0,.25,.5,.75,1]){
        const minuti=r.stradaDurataColpo({categoria,difficolta});
        expect(minuti%15).toBe(0);
        expect(minuti).toBeGreaterThanOrEqual(60);
        expect(minuti).toBeLessThanOrEqual(150);
      }
    }
  });

  it("spende il tempo prima di energia, dado e consumo opportunità",()=>{
    const time=crime.indexOf("const tempoColpo=stradaSpendiTempoColpo(colpo);");
    const energy=crime.indexOf("G.energy -= colpo.energia;",time);
    const roll=crime.indexOf("const successo = Math.random()",time);
    const consume=crime.indexOf("stradaConsumaOpportunita(colpoId, successo)",time);
    expect(time).toBeGreaterThan(0);
    expect(energy).toBeGreaterThan(time);
    expect(roll).toBeGreaterThan(energy);
    expect(consume).toBeGreaterThan(roll);
  });

  it("usa GAME_TIME e blocca il colpo se la giornata non basta",()=>{
    expect(crime).toContain("GAME_TIME.canSpend(minuti)");
    expect(crime).toContain('GAME_TIME.spend(minuti,"crime:job"');
    expect(crime).toContain('gate&&gate.reason==="day-end"');
    expect(crime).toContain("Non fai in tempo oggi");
  });

  it("resta compatibile con quattro sere in Pizzeria",()=>{
    expect(tempo).toContain("pizzeria:300");
    const r=runtimeDurate();
    const colpoMassimo=Math.max(...Object.keys(r.STRADA_DURATA_BASE_CATEGORIA)
      .map(c=>r.stradaDurataColpo({categoria:c,difficolta:1})));
    const preparazioneMassima=90;
    const margineSpostamento=30;
    const finestraPostTurno=6*60; // turno 17–22, giornata fino alle 04
    expect(colpoMassimo+preparazioneMassima+margineSpostamento)
      .toBeLessThanOrEqual(finestraPostTurno);
  });

  it("mostra il costo-tempo sia nella card sia nelle scene del colpo",()=>{
    expect(crime).toContain("stradaDurataColpoLabel(c)");
    expect(crime).toContain('stradaDurataColpoLabel(colpo)+" di tempo"');
  });
});
