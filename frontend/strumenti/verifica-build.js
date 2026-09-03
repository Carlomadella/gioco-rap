"use strict";
/* Controlla il PRODOTTO del build, non solo che build.js sia uscito con 0.
   Va lanciato dopo:
     npm run build
     npm run demo
*/
const fs=require("fs");
const path=require("path");

const ROOT=path.resolve(__dirname,"..");
const DIST=path.join(ROOT,"dist");
let ok=0,no=0;

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
test("la demo monofile esiste",exists("anni-di-fame.html"));

let index="";
try{ index=read("index.html"); }catch(_){}

const css=refs(index,/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
const js=refs(index,/<script[^>]+src="([^"]+)"[^>]*><\/script>/g);

test("index build usa un solo CSS bundle",css.length===1 && /^assets\/stile-[0-9a-f]{8}\.css$/.test(css[0]),css);
test("index build usa un solo JS bundle",js.length===1 && /^assets\/gioco-[0-9a-f]{8}\.js$/.test(js[0]),js);
test("i bundle citati da index esistono",[...css,...js].every(exists),[...css,...js].filter(x=>!exists(x)));
test("index build non punta più ai sorgenti css/ o js/",
  !/(?:href|src)="(?:css|js)\//.test(index));

const catalog="assets/eventi-master-1000-v1.2.13.json";
test("catalogo Eventi V2 è copiato accanto al bundle",exists(catalog));
if(exists(catalog)){
  try{
    const db=JSON.parse(read(catalog));
    test("catalogo build contiene 1000 eventi",Array.isArray(db)&&db.length===1000,
      Array.isArray(db)?db.length:typeof db);
  }catch(e){ test("catalogo build contiene 1000 eventi",false,e.message); }
}

if(css.length===1 && exists(css[0])){
  const text=read(css[0]);
  const broken=[];
  for(const m of text.matchAll(/url\(([^)]+)\)/g)){
    const raw=m[1].trim().replace(/^['"]|['"]$/g,"");
    if(/^https?:|^data:/i.test(raw)) continue;
    const clean=raw.split("?")[0];
    const abs=path.resolve(DIST,path.dirname(css[0]),clean);
    if(!fs.existsSync(abs)) broken.push(raw);
  }
  test("ogni asset richiamato dal CSS build esiste",broken.length===0,broken);
}

if(js.length===1 && exists(js[0])){
  try{ new Function(read(js[0])); test("bundle JavaScript compilato è sintatticamente valido",true); }
  catch(e){ test("bundle JavaScript compilato è sintatticamente valido",false,e.message); }
}

let demo="";
try{ demo=read("anni-di-fame.html"); }catch(_){}
test("demo incorpora il catalogo eventi",
  demo.includes("window.__ADF_EVENT_CATALOG__="));
const demoShell = demo
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, "");
test("demo non dipende dai JS/CSS locali",
  !/<link\b[^>]*\bhref=["'](?:css|js)\//i.test(demoShell) &&
  !/<script\b[^>]*\bsrc=["'](?:css|js)\//i.test(demoShell));
test("demo incorpora almeno un'immagine",
  demo.includes("data:image/"));

console.log("\nRisultato build: "+ok+" ok, "+no+" falliti");
process.exit(no?1:0);
