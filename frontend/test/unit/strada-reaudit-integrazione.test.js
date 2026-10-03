import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const leggi=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

const core=leggi("js/game/strada-crimine.js").replace(/\r\n/g,"\n");
const ui=leggi("js/game/strada-crimine-ui.js").replace(/\r\n/g,"\n");
const hours=leggi("js/game/orari.js").replace(/\r\n/g,"\n");

function runtimeFinestre(){
  const start=core.indexOf("const STRADA_CATEGORIE_COLPO");
  const end=core.indexOf("/* Città chiuse",start);
  if(start<0||end<0) throw new Error("blocco colpi/finestre non trovato");
  const block=core.slice(start,end);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const G={day:1};
  const GAME_TIME={
    now:()=>9*60,
    remaining:()=>20*60,
    format:m=>{
      const n=((Math.round(m)%1440)+1440)%1440;
      return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
    },
    formatDuration:m=>m+"m"
  };
  return new Function("clamp","G","GAME_TIME",
    block+"\nreturn {STRADA_COLPI,STRADA_FINESTRE_COLPI,stradaFinestraColpoStato,stradaFinestraColpoLabel};"
  )(clamp,G,GAME_TIME);
}

describe("Reaudit crime · integrazione UI/core",()=>{
  it("1 · la UI finale usa solo le quattro offerte del giorno",()=>{
    expect(ui).toContain("stradaColpiDisponibili()");
    expect(ui).toContain("offerte.map");
    expect(ui).not.toContain('q("#crimes").innerHTML=STRADA_COLPI.map');
  });

  it("2 · la durata arriva dal core e la UI non avanza il clock una seconda volta",()=>{
    expect(ui).toContain("stradaDurataColpo(c)");
    expect(core).toContain('GAME_TIME.spend(minuti,"crime:job"');
    expect(ui).not.toContain('GAME_TIME.advance(durationFor(colpoId),"crime:"+colpoId)');
  });

  it("3 · riciclaggio e attività annidate ridisegnano la UI V2, non il DOM legacy",()=>{
    expect(ui).toContain("stScenaRiciclaggio()");
    expect(ui).toContain("stScenaAttivita(manage.dataset.business)");
    expect(ui).toContain("renderStScheda=renderScene");
    expect(ui).toContain("stToast=toast");
    expect(ui).toContain("if(o&&o.no)return");
  });

  it("4 · coperture e squadra passano dal modello relazionale",()=>{
    expect(ui).toContain("Persone del giro");
    expect(ui).toContain("stradaPersoneSquadra()");
    expect(ui).toContain("stScenaProtezione()");
    expect(ui).toContain("stScenaAvvocato()");
    expect(ui).toContain("stCompraFerro()");
    expect(ui).not.toContain("500 € all'ingresso · 140 €/sett.");
    expect(ui).not.toContain('id="gun" type="button">900 €');
    expect(ui).not.toContain("stImpostaProtezione((before+1)%STRADA_PROT.length)");
    expect(ui).not.toContain("stToggleAvvocato()");
  });

  it("5 · mollare il giro rispetta il gate economico e mostra l'esito reale",()=>{
    expect(ui).toContain("disponibili=");
    expect(ui).toContain("manca=Math.max(0,costo-disponibili)");
    expect(ui).toContain("no:manca>0");
    expect(ui).toContain("const msg=stMollaIlGiro()");
    expect(ui).toContain("toast(msg)");
    expect(ui).not.toContain('toast("Hai mollato il giro.")');
  });

  it("6 · Attività criminali è 24/7 e il carcere conserva la priorità",()=>{
    expect(hours).toContain('crimin:    {allDay:true}');
    expect(hours).not.toContain('crimin:    {open:"18:00", close:"04:00"}');
    expect(hours).toContain('place === "crimin" && G.strada && G.strada.arresto');
    expect(hours).toContain("jail:true");
  });

  it("7 · tutti i 30 colpi hanno una finestra e giorno/notte/weekend sono distinti",()=>{
    const r=runtimeFinestre();
    const ids=r.STRADA_COLPI.map(c=>c.id);
    expect(ids).toHaveLength(30);
    expect(Object.keys(r.STRADA_FINESTRE_COLPI)).toHaveLength(30);
    for(const id of ids) expect(r.STRADA_FINESTRE_COLPI[id]).toBeTruthy();

    const by=id=>r.STRADA_COLPI.find(c=>c.id===id);

    expect(r.stradaFinestraColpoStato(by("conto-aperto"),9*60,1).ok).toBe(true);
    expect(r.stradaFinestraColpoStato(by("cassa"),9*60,1).ok).toBe(false);
    expect(r.stradaFinestraColpoStato(by("giro-notturno"),22*60,1).ok).toBe(true);
    expect(r.stradaFinestraColpoStato(by("conto-aperto"),22*60,1).ok).toBe(false);

    expect(r.stradaFinestraColpoStato(by("ufficio-vuoto"),10*60,1).reason).toBe("day");
    expect(r.stradaFinestraColpoStato(by("ufficio-vuoto"),10*60,6).ok).toBe(true);
    expect(r.stradaFinestraColpoStato(by("deposito-weekend"),19*60,6).ok).toBe(true);
  });
});
