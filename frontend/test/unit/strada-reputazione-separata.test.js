import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");
const html=fs.readFileSync(path.join(ROOT,"pagine/gioco.html"),"utf8");

function block(startText,endText){
  const a=crime.indexOf(startText);
  const b=crime.indexOf(endText,a);
  if(a<0 || b<0) throw new Error("blocco non trovato: "+startText);
  return crime.slice(a,b);
}

describe("Strada · punto 12 reputazione globale e fiducia personale",()=>{
  it("alzare il nome nel giro non cambia la fiducia di una persona",()=>{
    const G={strada:{rep:90,repStato:{history:[]}}};
    const p={strada:{fiducia:5}};
    const code=block("function stradaReputazioneStato","function stradaFiduciaEtichetta");
    const api=new Function("G","clamp","stradaAbsDay","stradaPersonaMeta",
      code+"\nreturn {stradaReputazioneGlobale,stradaModificaReputazione,stradaFiduciaValore};"
    )(
      G,
      (v,a,b)=>Math.max(a,Math.min(b,v)),
      ()=>50,
      x=>x.strada
    );

    expect(api.stradaFiduciaValore(p)).toBe(5);
    api.stradaModificaReputazione(7,"test-global");
    expect(G.strada.rep).toBe(97);
    expect(api.stradaFiduciaValore(p)).toBe(5);
    expect(G.strada.repStato.history.at(-1)).toMatchObject({delta:7,reason:"test-global"});
  });

  it("puoi essere poco conosciuto globalmente e avere due persone che si fidano molto",()=>{
    const G={strada:{rep:3,repStato:{history:[]}}};
    const persone=[
      {strada:{fiducia:88}},
      {strada:{fiducia:82}}
    ];
    const code=block("function stradaReputazioneStato","function stradaFiduciaEtichetta");
    const api=new Function("G","clamp","stradaAbsDay","stradaPersonaMeta",
      code+"\nreturn {stradaReputazioneGlobale,stradaFiduciaValore};"
    )(
      G,
      (v,a,b)=>Math.max(a,Math.min(b,v)),
      ()=>1,
      x=>x.strada
    );

    expect(api.stradaReputazioneGlobale()).toBe(3);
    expect(persone.map(api.stradaFiduciaValore)).toEqual([88,82]);
  });

  it("cambiare la fiducia personale non cambia il nome globale",()=>{
    const G={strada:{rep:72},day:1,week:1,year:1};
    const p={via:false,strada:{fiducia:12,fiduciaEventi:[]}};
    const code=block("function stradaModificaFiducia","/* I favori non sono comprabili.");
    const fn=new Function(
      "G","clamp","stradaPersonaMeta","stradaRegistraInterazione","stradaAbsDay",
      code+"\nreturn stradaModificaFiducia;"
    )(
      G,
      (v,a,b)=>Math.max(a,Math.min(b,v)),
      x=>x.strada,
      ()=>{},
      ()=>1
    );

    fn(p,30,"test-personal");
    expect(p.strada.fiducia).toBe(42);
    expect(G.strada.rep).toBe(72);
  });

  it("i gate che richiedono entrambe le cose controllano i due assi separatamente",()=>{
    expect(crime).toContain("stradaReputazioneGlobale()<req.rep");
    expect(crime).toContain("stradaFiduciaValore(p)<req.fiducia");
    expect(crime).toContain("stradaReputazioneGlobale()<STRADA_FERRO_REP_MIN");
    expect(crime).toContain("stradaFiduciaValore(p)>=STRADA_FERRO_FIDUCIA_MIN");
  });

  it("la UI distingue esplicitamente nome globale e fiducia personale",()=>{
    expect(html).toContain("<span>Nome nel giro</span>");
    expect(html).not.toContain("<span>Reputazione di strada</span>");
    expect(crime).toContain("p.n + ' · Fiducia: ' + stradaFiduciaEtichetta(p)");
    expect(crime).toContain('"nome nel giro "+stradaSegno(p.successRep)');
  });
});
