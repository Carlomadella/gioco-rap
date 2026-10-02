import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QUI, "../..");
const leggi = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const LUOGHI = leggi("js/game/luoghi-foto.js");

function pezzo(da,a){
  const start=LUOGHI.indexOf(da);
  const end=LUOGHI.indexOf(a,start);
  if(start<0 || end<0) throw new Error("blocco UI Pizzeria non trovato");
  return LUOGHI.slice(start,end);
}

describe("UI carriera e servizio Pizzeria", () => {
  it("riusa il riepilogo turno comune e mostra i valori reali del servizio", () => {
    const source=pezzo("function lfDeltaTurno","function lfCarrieraSegno");
    const ctx={
      Number,Math,
      G:{money:1100,energy:82,wellbeing:69,lucidita:50},
      LUOGO:{
        prima:{money:1000,energy:100,well:70,lucidita:50},
        esito:{a:"turno",msg:"Servizio chiuso.",extra:""}
      },
      lavoroUltimoEsitoTurno:luogo=>({
        luogo,
        pay:{total:100,bonus:0,percent:0,label:""},
        energyDelta:-18,wellbeingDelta:-1,lucidityDelta:0,
        attendance:{worked:2,required:4,total:2},
        event:{title:"Fine servizio",detail:"Tutto regolare."}
      }),
      fmt:v=>String(v),
      lfEsc:v=>String(v),
      lfRiga:(k,v)=>k+":"+v+"|"
    };
    vm.createContext(ctx);
    vm.runInContext(source,ctx);

    const html=vm.runInContext("lfPizzeriaEsitoTurno()",ctx);
    expect(html).toContain("Paga:+100 €");
    expect(html).toContain("Energia:−18");
    expect(html).toContain("Benessere:−1");
    expect(html).toContain("Lucidità:0");
    expect(html).toContain("Presenze:2/4 questa settimana");
    expect(html).toContain("Fine servizio");
  });

  it("mostra Pizzaiolo come grado massimo invece di inventare un ruolo successivo", () => {
    const source=pezzo("function lfCarrieraSegno","function lfFabbrica(){");
    const ctx={
      Number,Math,
      lfEsc:v=>String(v),
      lavoroProgressoCarriera:luogo=>({
        luogo,
        ruolo:{id:"pizzaiolo",n:"Pizzaiolo",livello:3,descrizione:""},
        percorso:[
          {id:"lavapiatti",n:"Lavapiatti",stato:"fatto"},
          {id:"aiuto_cucina",n:"Aiuto cucina",stato:"fatto"},
          {id:"aiuto_pizzaiolo",n:"Aiuto pizzaiolo",stato:"fatto"},
          {id:"pizzaiolo",n:"Pizzaiolo",stato:"corrente"}
        ],
        affidabilita:82,
        prossimo:null,
        aumento:{
          disponibile:false,esaurito:true,
          cicli:{valore:4,soglia:2,ok:true},
          affidabilita:{valore:82,soglia:65,ok:true}
        },
        promozione:{disponibile:false,massimo:true}
      })
    };
    vm.createContext(ctx);
    vm.runInContext(source,ctx);

    const html=vm.runInContext("lfPizzeriaCarriera()",ctx);
    expect(html).toContain("Lavapiatti");
    expect(html).toContain("Aiuto cucina");
    expect(html).toContain("Aiuto pizzaiolo");
    expect(html).toContain("Pizzaiolo");
    expect(html).toContain("Grado massimo raggiunto");
    expect(html).toContain("Affidabilità 82/100");
  });

  it("la pagina Pizzeria usa carico per ruolo, riepilogo e pannello carriera", () => {
    const start=LUOGHI.indexOf("function lfPizzeria(){");
    const end=LUOGHI.indexOf("/* ---------- IL CIRCOLO ----------",start);
    const pizzeria=LUOGHI.slice(start,end);

    expect(pizzeria).toContain('lavoroEffettiTurno("pizzeria", G.job)');
    expect(pizzeria).toContain('lfRiga("Impatto servizio", caricoRuolo)');
    expect(pizzeria).toContain('lfPan("Servizio completato", lfPizzeriaEsitoTurno(), "spunta")');
    expect(pizzeria).toContain('lfPan("Carriera", lfPizzeriaCarriera(), "spunta")');
    expect(pizzeria).toContain('"−" + energiaTurno + " energia"');
    expect(pizzeria).not.toContain('"−" + def.e + " energia"');
  });

  it("Fabbrica continua a usare gli stessi wrapper senza perdere la propria UI", () => {
    expect(LUOGHI).toContain('function lfFabbricaEsitoTurno(){ return lfEsitoTurnoLavoro("fabbrica"); }');
    expect(LUOGHI).toContain('function lfFabbricaCarriera(){ return lfCarrieraLavoro("fabbrica"); }');
    expect(LUOGHI).toContain('lfPan("Ferie", lfFabbricaFerie(), "orologio")');
  });
});
