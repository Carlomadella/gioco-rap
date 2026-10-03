import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUI=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(QUI,"../..");
const html=fs.readFileSync(path.join(ROOT,"pagine/gioco.html"),"utf8");
const promozione=fs.readFileSync(path.join(ROOT,"js/game/npc-promozione.js"),"utf8");
const circolo=fs.readFileSync(path.join(ROOT,"js/game/circolo-incontri.js"),"utf8");

function runtime(){
  const window={};
  const ctx={window,globalThis:window,Object,Array,String,Number,Math,Set,Map,Error,TypeError,RangeError};
  vm.createContext(ctx);
  vm.runInContext(promozione,ctx);
  return window;
}
function blocco(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<0) throw new Error("blocco non trovato: "+start);
  return source.slice(a,b);
}

describe("NPC · punto 15 integrazione temporanei",()=>{
  it("gioco.html carica la promozione prima dei sistemi che la consumano",()=>{
    const a=html.indexOf("js/game/npc-promozione.js?v=1");
    const b=html.indexOf("js/game/posto.js?v=31");
    const c=html.indexOf("js/game/circolo-incontri.js?v=2");
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it("gli ospiti del Circolo hanno chiavi temporanee stabili e non usano il nome come identità",()=>{
    for(const id of ["raiz","nayra","dj-kento","siria","luca-framez"])
      expect(circolo).toContain(`tempId:"${id}"`);
    expect(circolo).toContain("c.presentati[o.tempId] = 1");
    expect(circolo).toContain("p[o.tempId] || p[o.n]");
  });

  it("i vecchi save che avevano presentati indicizzati per nome restano leggibili",()=>{
    const code=blocco(circolo,"function circoloOspiteGiaPresentato(o)","function circoloRuoloOspite(o)");
    const fn=new Function("circoloStato",code+"\nreturn circoloOspiteGiaPresentato;")(
      ()=>({presentati:{Raiz:1}})
    );
    expect(fn({tempId:"raiz",n:"Raiz"})).toBe(true);
  });

  it("una collaborazione riuscita promuove l'ospite per relazione persistente",()=>{
    expect(circolo).toContain('circoloPromuoviOspite(o,"relazione","circolo:collab-ospite")');
  });

  it("la stessa chiave ospite risolve sempre la stessa PERSONA in G.gente",()=>{
    const window=runtime();
    const helper=blocco(circolo,"function circoloOspiteRif(o)","/* chi del giro passa dal backstage");
    const G={gente:[]};
    let seq=0;
    const fn=new Function(
      "window","G","ccNumeroGiorno","nuovaPersona",
      helper+"\nreturn circoloPromuoviOspite;"
    )(
      window,G,()=>12,
      ruolo=>({id:"p"+(++seq),ruolo,n:"generato",fama:1,rel:0})
    );
    const o={tempId:"raiz",n:"Raiz",r:"Headliner",fama:82};
    const a=fn(o,"relazione","circolo:collab-ospite");
    const b=fn(o,"ricorrenza","circolo:ritorno");
    expect(a).toBe(b);
    expect(G.gente).toHaveLength(1);
    expect(a).toMatchObject({n:"Raiz",fama:82,ruolo:"rapper",visto:true,circoloSbloccato:false});
  });

  it("i fan hanno un tempId per serata ma restano fuori da G.gente finché nessun evento li promuove",()=>{
    expect(circolo).toContain('tempId:"circolo-fan:" + circoloGiorno() + ":" + i');
    const bloccoFan=blocco(circolo,"function circoloFan()", "function circoloFanMossa");
    expect(bloccoFan).not.toContain("ADF_NPC_PROMOZIONE.promuovi");
    expect(bloccoFan).not.toContain("G.gente.push");
  });
});
