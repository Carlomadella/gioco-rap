import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const crime=fs.readFileSync(path.join(ROOT,"js/game/strada-crimine.js"),"utf8");

const start=crime.indexOf("const STRADA_NPC_CONTRACT_VERSION = 1;");
const end=crime.indexOf("/* Punto 14:",start);
if(start<0 || end<0) throw new Error("contratto NPC crime non trovato");
const bridgeCode=crime.slice(start,end);

function runtime({gente=[],adapter=null}={}){
  const links=[];
  const G={gente};
  const window={};
  if(adapter) window.ADF_CRIME_NPC=adapter;
  const ctx={
    G,window,Object,Array,String,Set,Number,Math,
    nuovaPersona:ruolo=>({id:"legacy-new",n:"Legacy",ruolo,via:false}),
    postoCollegaPersone:(a,b,reason)=>{
      links.push({a:a.id,b:b.id,reason});
      return true;
    }
  };
  vm.createContext(ctx);
  vm.runInContext(bridgeCode,ctx);
  return {ctx,G,window,links};
}

describe("Strada · punto 22 contratto crime verso sistema NPC",()=>{
  it("pubblica un contratto versionato con soli hook NPC-side",()=>{
    const {window}=runtime();
    expect(window.ADF_CRIME_NPC_CONTRACT.version).toBe(1);
    expect(window.ADF_CRIME_NPC_CONTRACT.adapterGlobal).toBe("ADF_CRIME_NPC");
    expect(Array.from(window.ADF_CRIME_NPC_CONTRACT.methods)).toEqual([
      "personById","findPerson","createPerson","people",
      "linkPeople","cityOf","groupsForPerson","markContext"
    ]);
  });

  it("senza adapter continua a leggere G.gente e considera provincia i save legacy",()=>{
    const p={id:"p1",n:"Mauro",via:false};
    const {ctx}=runtime({gente:[p]});
    expect(vm.runInContext('stradaNpcPersonaDaId("p1")',ctx)).toBe(p);
    expect(vm.runInContext('stradaNpcCittaPersona(G.gente[0])',ctx)).toBe("provincia");
    expect(vm.runInContext('stradaNpcPersone({cityId:"provincia"}).length',ctx)).toBe(1);
  });

  it("quando esiste l'adapter, il crime usa la persona gestita senza copiarla in G.gente",()=>{
    const managed={id:"npc-77",n:"Nina",via:false};
    const calls=[];
    const adapter={
      findPerson:q=>{calls.push(["find",q]);return managed;},
      createPerson:q=>{calls.push(["create",q]);return managed;},
      cityOf:id=>id===managed.id?"milano":"provincia",
      groupsForPerson:id=>id===managed.id?[{groupId:"grp-2"}]:[]
    };
    const {ctx,G}=runtime({adapter});
    const found=vm.runInContext(
      'stradaNpcTrovaPersona({crimeKey:"street:nina",name:"Nina",cityId:"milano"})',
      ctx
    );
    expect(found).toBe(managed);
    expect(G.gente).toHaveLength(0);
    const snapshot=vm.runInContext(
      'stradaNpcContestoPersona(stradaNpcTrovaPersona({name:"Nina",cityId:"milano"}),"milano")',
      ctx
    );
    expect(snapshot.cityId).toBe("milano");
    expect(Array.from(snapshot.groupIds)).toEqual(["grp-2"]);
    expect(calls[0][1].context).toBe("crime");
  });

  it("creazione managed e fallback legacy hanno ownership diversa",()=>{
    const managed={id:"npc-1",n:"Managed",via:false};
    const a=runtime({adapter:{createPerson:()=>managed}});
    expect(vm.runInContext('stradaNpcCreaPersona({roleHint:"strada",cityId:"provincia"}).managed',a.ctx)).toBe(true);
    expect(a.G.gente).toHaveLength(0);

    const b=runtime();
    const out=vm.runInContext('stradaNpcCreaPersona({roleHint:"strada",cityId:"provincia"})',b.ctx);
    expect(out.managed).toBe(false);
    expect(out.person.id).toBe("legacy-new");
    expect(b.G.gente).toHaveLength(1);
  });

  it("i legami criminali passano all'adapter e degradano sul grafo attuale",()=>{
    const a={id:"p1",via:false},b={id:"p2",via:false};
    const calls=[];
    const managed=runtime({
      gente:[a,b],
      adapter:{linkPeople:x=>{calls.push(x);return true;}}
    });
    expect(vm.runInContext('stradaNpcCollega(G.gente[0],G.gente[1],"strada-ponte")',managed.ctx)).toBe(true);
    expect(calls[0]).toMatchObject({aId:"p1",bId:"p2",reason:"strada-ponte",context:"crime"});
    expect(managed.links).toHaveLength(0);

    const legacy=runtime({gente:[a,b]});
    expect(vm.runInContext('stradaNpcCollega(G.gente[0],G.gente[1],"strada-ponte")',legacy.ctx)).toBe(true);
    expect(legacy.links).toEqual([{a:"p1",b:"p2",reason:"strada-ponte"}]);
  });

  it("la rete criminale attiva è già filtrabile per città senza implementare Milano",()=>{
    expect(crime).toContain("function stradaContattiAttivi(citta)");
    expect(crime).toContain("stradaNpcPersone({cityId})");
    expect(crime).toContain('return "provincia"');
  });

  it("il crime non definisce gruppi, professioni o tratti NPC",()=>{
    const block=bridgeCode;
    expect(block).toContain("groupsForPerson");
    expect(block).not.toContain("creaGruppo");
    expect(block).not.toContain("professione");
    expect(block).not.toContain("tratti:");
    expect(crime).toContain("variante.networkGroupIds=networkCtx.groupIds");
    expect(crime).toContain("causa.introducedBy||causa.person");
  });
});
