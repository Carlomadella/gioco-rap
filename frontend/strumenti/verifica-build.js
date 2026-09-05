"use strict";
/* Controlla il PRODOTTO del build, non solo che build.js sia uscito con 0.
   Va lanciato dopo:
     npm run build
     npm run demo

   Punto 27: le pagine sono tre e stanno in `dist/pagine/`. Ognuna deve avere
   il suo CSS e il suo JS, uno per uno, e non deve puntare più ai sorgenti.
   `dist/index.html` invece resta la porta d'ingresso: non carica niente, manda
   alla landing, e si copia com'è. */
const fs=require("fs");
const path=require("path");

const ROOT=path.resolve(__dirname,"..");
const DIST=path.join(ROOT,"dist");
let ok=0,no=0;

/* nome della pagina → file nel build, e file della demo monofile */
const PAGINE=[
  {nome:"landing",file:"pagine/landing.html",unico:"anni-di-fame.html"},
  {nome:"accesso",file:"pagine/accesso.html",unico:"anni-di-fame-accesso.html"},
  {nome:"gioco",  file:"pagine/gioco.html",  unico:"anni-di-fame-gioco.html"}
];

function test(nome,cond,dettaglio){
  if(cond){ ok++; console.log("  ok   "+nome); }
  else{
    no++; console.log("  NO   "+nome);
    if(dettaglio) for(const x of [].concat(dettaglio)) console.log("       · "+x);
  }
}
function exists(rel){ return fs.existsSync(path.join(DIST,rel)); }
function read(rel){ return fs.readFileSync(path.join(DIST,rel),"utf8"); }
function refs(html,re){
  return [...html.matchAll(re)].map(m=>m[1]).filter(x=>!/^https?:/i.test(x));
}

console.log("\nVerifica output build");

test("dist/index.html esiste",exists("index.html"));
test("dist/assets esiste",exists("assets"));
test("dist/media esiste",exists("media"));
test("le tre pagine sono nel build",PAGINE.every(p=>exists(p.file)),
  PAGINE.filter(p=>!exists(p.file)).map(p=>p.file));
test("le tre demo che stanno in piedi da sole esistono",PAGINE.every(p=>exists(p.unico)),
  PAGINE.filter(p=>!exists(p.unico)).map(p=>p.unico));

let porta="";
try{ porta=read("index.html"); }catch(_){}
test("index.html nel build è ancora solo la porta d'ingresso",
  porta.includes("pagine/landing.html") &&
  refs(porta,/<script[^>]+src="([^"]+)"[^>]*><\/script>/g).length===0 &&
  refs(porta,/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g).length===0);

/* ---------- pagina per pagina ---------- */
const bundleDi={};
for(const p of PAGINE){
  if(!exists(p.file)) continue;
  const html=read(p.file);
  const css=refs(html,/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
  const js=refs(html,/<script[^>]+src="([^"]+)"[^>]*><\/script>/g);
  const attesoCss=new RegExp("^assets/"+p.nome+"-[0-9a-f]{8}\\.css$");
  const attesoJs=new RegExp("^assets/"+p.nome+"-[0-9a-f]{8}\\.js$");

  test(p.nome+": un solo CSS bundle, col suo nome e la sua impronta",
    css.length===1 && attesoCss.test(css[0]),css);
  test(p.nome+": un solo JS bundle, col suo nome e la sua impronta",
    js.length===1 && attesoJs.test(js[0]),js);
  test(p.nome+": i bundle che cita esistono",[...css,...js].every(exists),
    [...css,...js].filter(x=>!exists(x)));
  test(p.nome+": non punta più ai sorgenti css/ o js/",
    !/(?:href|src)="(?:css|js)\//.test(html));
  bundleDi[p.nome]={css,js};
}

const catalog="assets/eventi-master-1000-v1.2.13.json";
test("catalogo Eventi V2 è copiato accanto ai bundle",exists(catalog));
if(exists(catalog)){
  try{
    const db=JSON.parse(read(catalog));
    test("catalogo build contiene 1000 eventi",Array.isArray(db)&&db.length===1000,
      Array.isArray(db)?db.length:typeof db);
  }catch(e){ test("catalogo build contiene 1000 eventi",false,e.message); }
}

/* ---------- i bundle veri e propri ---------- */
for(const p of PAGINE){
  const b=bundleDi[p.nome];
  if(!b) continue;
  if(b.css.length===1 && exists(b.css[0])){
    const text=read(b.css[0]);
    const rotti=[];
    for(const m of text.matchAll(/url\(([^)]+)\)/g)){
      const raw=m[1].trim().replace(/^['"]|['"]$/g,"");
      if(/^https?:|^data:/i.test(raw)) continue;
      const clean=raw.split("?")[0];
      const abs=path.resolve(DIST,path.dirname(b.css[0]),clean);
      if(!fs.existsSync(abs)) rotti.push(raw);
    }
    test(p.nome+": ogni immagine richiamata dal CSS build esiste",rotti.length===0,rotti);
  }
  if(b.js.length===1 && exists(b.js[0])){
    try{ new Function(read(b.js[0])); test(p.nome+": il bundle JavaScript compila",true); }
    catch(e){ test(p.nome+": il bundle JavaScript compila",false,e.message); }
  }
}

/* ---------- la demo da mandare in giro ---------- */
let demo="",demoGioco="";
try{ demo=read("anni-di-fame.html"); }catch(_){}
try{ demoGioco=read("anni-di-fame-gioco.html"); }catch(_){}

test("la demo del gioco incorpora il catalogo eventi",
  demoGioco.includes("window.__ADF_EVENT_CATALOG__="));
const senzaInline = t => t
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, "");
test("le demo non dipendono dai JS/CSS locali",
  [demo,demoGioco].every(t => {
    const guscio=senzaInline(t);
    return !/<link\b[^>]*\bhref=["'](?:css|js)\//i.test(guscio) &&
           !/<script\b[^>]*\bsrc=["'](?:css|js)\//i.test(guscio);
  }));
test("la demo incorpora almeno un'immagine",demo.includes("data:image/"));
test("nelle demo i collegamenti fra le pagine sono stati riscritti",
  !/pagine\/(landing|accesso|gioco)\.html/.test(demo) &&
  !/pagine\/(landing|accesso|gioco)\.html/.test(demoGioco) &&
  demo.includes("anni-di-fame-gioco.html"));
test("nelle demo non è rimasto il <base> di pagine/",
  !demo.includes('<base href="../">') && !demoGioco.includes('<base href="../">'));

console.log("\nRisultato build: "+ok+" ok, "+no+" falliti");
process.exit(no?1:0);
