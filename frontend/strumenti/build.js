/* Il build del gioco.

     npm run build     → dist/       la cartella da dare a Electron e a Capacitor
     npm run demo      → dist/anni-di-fame.html   il gioco in un file solo, per farlo provare

   Cosa fa, in ordine:
   1. legge `index.html` e ne tira fuori l'elenco ordinato dei CSS e dei JS
      (l'ordine dei tag è il contratto del gioco: i file contano l'uno sull'altro);
   2. li mette insieme in due file soli e li minifica con esbuild;
   3. dà a ognuno un nome con dentro l'impronta del contenuto
      (`gioco-3f2a91c4.js`), così la cache si sistema da sé e il `?v=` a mano sparisce;
   4. riscrive `index.html` con due tag al posto di quarantatré;
   5. copia le immagini e i suoni.

   Con `--unico` fa invece un file HTML solo, con dentro anche le immagini come
   data URI: quello si manda a qualcuno e ci gioca, senza installare niente.

   L'unica dipendenza è esbuild, e serve solo qui: nel gioco non entra niente. */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RADICE = path.resolve(__dirname, "..");
const USCITA = path.join(RADICE, "dist");
const UNICO = process.argv.includes("--unico");
const NUDO = process.argv.includes("--senza-minificare");

/* Eventi V2 usa un catalogo JSON esterno. Nel build store va copiato accanto
   al bundle; nella demo monofile va incorporato, altrimenti file:// non
   può fare fetch del JSON e il motore eventi (con Notifiche) non parte. */
const CATALOGO_EVENTI_V2 = path.join(RADICE, "js", "game", "eventi-master-1000-v1.2.13.json");

/* ADF_RPG_V24_BUILD: nella demo monofile il creator iframe deve viaggiare dentro
   allo stesso HTML. Nel build store resta invece sotto media/ ed è copiato normalmente. */
const CREATOR_RPG_V24_DIR = path.join(RADICE, "media", "creator-rpg-v24");
function mimeFile(f){ return ({".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".gif":"image/gif",".svg":"image/svg+xml"})[path.extname(f).toLowerCase()] || "application/octet-stream"; }
function inlineCreatorAssets(html, base){
  return html.replace(/assets\/([A-Za-z0-9._-]+)/g,(m,n)=>{
    const f=path.join(base,"assets",n); if(!fs.existsSync(f)) return m;
    return "data:"+mimeFile(f)+";base64,"+fs.readFileSync(f).toString("base64");
  });
}
function creatorRpgV24DataUrl(){
  const cfile=path.join(CREATOR_RPG_V24_DIR,"creator.html");
  const rfile=path.join(CREATOR_RPG_V24_DIR,"camerino.html");
  const lfile=path.join(CREATOR_RPG_V24_DIR,"local-editor.html");
  if(!fs.existsSync(cfile)||!fs.existsSync(rfile)||!fs.existsSync(lfile)) throw new Error("Creator RPG V24: file integrazione mancanti");
  let room=inlineCreatorAssets(fs.readFileSync(rfile,"utf8"),CREATOR_RPG_V24_DIR);
  let local=inlineCreatorAssets(fs.readFileSync(lfile,"utf8"),CREATOR_RPG_V24_DIR);
  let creator=inlineCreatorAssets(fs.readFileSync(cfile,"utf8"),CREATOR_RPG_V24_DIR);
  creator=creator.replace('src="camerino.html"','src="data:text/html;base64,'+Buffer.from(room).toString("base64")+'"');
  creator=creator.replace('src="local-editor.html"','src="data:text/html;base64,'+Buffer.from(local).toString("base64")+'"');
  return "data:text/html;base64,"+Buffer.from(creator).toString("base64");
}

/* ==================== ATTREZZI ==================== */
const leggi = rel => fs.readFileSync(path.join(RADICE, rel.split("?")[0]), "utf8");
const impronta = testo => crypto.createHash("sha256").update(testo).digest("hex").slice(0, 8);
const kb = n => (n / 1024).toFixed(0) + " KB";

function esbuild(){
  try{ return require(path.join(RADICE, "node_modules", "esbuild")); }
  catch(e){ return null; }
}

/* Minifica, ma **senza toccare i nomi**: i file del gioco stanno tutti nello
   stesso scope e si chiamano l'un l'altro per nome. Rinominare le variabili di
   primo livello qui vorrebbe dire rompere tutto in silenzio. */
async function minifica(testo, tipo){
  if(NUDO) return testo;
  const eb = esbuild();
  if(!eb){
    console.log("  ! esbuild non c'è (npm install): esce senza minificare");
    return testo;
  }
  const r = await eb.transform(testo, {
    loader: tipo,
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    legalComments: "none"
  });
  return r.code;
}

/* ==================== I PEZZI ====================
   L'elenco dei file e il loro ordine stanno in index.html e da nessun'altra
   parte: un elenco solo, quello che si vede aprendo la pagina. */
function pezzi(html){
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)]
    .map(m => m[1]).filter(h => !h.startsWith("http"));
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
    .map(m => m[1]).filter(h => !h.startsWith("http"));
  return { css, js };
}

/* Le immagini richiamate dai CSS: nel build normale restano file (e si copia
   la cartella media/), nel file unico diventano data URI. */
function immagini(testo, dentro){
  return testo.replace(/url\(([^)]+)\)/g, (tutto, dentroParentesi) => {
    const rel = dentroParentesi.trim().replace(/^['"]|['"]$/g, "");
    if(rel.startsWith("http") || rel.startsWith("data:")) return tutto;
    const f = path.resolve(RADICE, "css", rel.split("?")[0]);
    if(!fs.existsSync(f)) return tutto;
    /* il "?v=" che rompe la cache va tenuto anche qui: senza, il build
       normale lo perdeva per strada — la stessa svista del punto 6, dentro
       al build invece che nel CSS sorgente. */
    const query = rel.includes("?") ? rel.slice(rel.indexOf("?")) : "";
    if(!dentro) return 'url("' + path.posix.join("..", path.relative(RADICE, f).split(path.sep).join("/")) + query + '")';
    const tipo = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" }[path.extname(f).toLowerCase()]
      || "application/octet-stream";
    return 'url("data:' + tipo + ";base64," + fs.readFileSync(f).toString("base64") + '")';
  });
}

function copiaCartella(da, a){
  fs.mkdirSync(a, { recursive: true });
  for(const voce of fs.readdirSync(da, { withFileTypes: true })){
    const dentro = path.join(da, voce.name), fuori = path.join(a, voce.name);
    if(voce.isDirectory()) copiaCartella(dentro, fuori);
    else fs.copyFileSync(dentro, fuori);
  }
}
function pesa(cartella){
  let n = 0;
  for(const voce of fs.readdirSync(cartella, { withFileTypes: true })){
    const dentro = path.join(cartella, voce.name);
    n += voce.isDirectory() ? pesa(dentro) : fs.statSync(dentro).size;
  }
  return n;
}

/* ==================== IL BUILD ==================== */
(async () => {
  const html = leggi("index.html");
  const { css, js } = pezzi(html);
  const usaEventiV2 = js.some(f => f.split("?")[0] === "js/game/eventi-v2.js");
  let catalogoEventiV2 = null;
  if(usaEventiV2){
    if(!fs.existsSync(CATALOGO_EVENTI_V2))
      throw new Error("Eventi V2: manca " + CATALOGO_EVENTI_V2);
    catalogoEventiV2 = JSON.parse(fs.readFileSync(CATALOGO_EVENTI_V2, "utf8"));
    if(!Array.isArray(catalogoEventiV2) || catalogoEventiV2.length !== 1000)
      throw new Error("Eventi V2: catalogo non valido (" +
        (Array.isArray(catalogoEventiV2) ? catalogoEventiV2.length : typeof catalogoEventiV2) + ")");
  }
  console.log((UNICO ? "Il gioco in un file solo" : "Il gioco per gli store") +
    " — " + css.length + " fogli di stile, " + js.length + " file di codice");

  /* i CSS, uno dietro l'altro nell'ordine dei tag */
  let stile = css.map(f => "/* " + f.split("?")[0] + " */\n" + leggi(f)).join("\n");
  stile = immagini(stile, UNICO);
  stile = await minifica(stile, "css");

  /* i JS, uno dietro l'altro: stesso scope, stesso ordine, come nella pagina */
  let codice = js.map(f => "/* " + f.split("?")[0] + " */\n" + leggi(f)).join("\n;\n");
  codice = await minifica(codice, "js");

  /* attenzione ai caratteri: se li prendiamo dalla rete, senza rete cambiano */
  if(/fonts\.googleapis\.com/.test(html)){
    console.log("  ! i caratteri arrivano ancora da Google Fonts: dentro a un'app,\n" +
                "    senza rete, il gioco si vede con quelli di sistema. Da portare dentro.");
  }

  fs.mkdirSync(USCITA, { recursive: true });
  if(!UNICO){
    /* si rifà il build, non si butta la demo che magari sta li' accanto */
    fs.rmSync(path.join(USCITA, "assets"), { recursive: true, force: true });
    fs.rmSync(path.join(USCITA, "media"), { recursive: true, force: true });
    fs.rmSync(path.join(USCITA, "index.html"), { force: true });
  }

  if(UNICO){
    const creatorRpgInline = "<script>window.__ADF_RPG_V24_SRC__=" + JSON.stringify(creatorRpgV24DataUrl()).replace(/<\/script/gi,"<\\/script") + ";<\/script>\n";
    const catalogoInline = catalogoEventiV2
      ? '<script>window.__ADF_EVENT_CATALOG__=' +
        JSON.stringify(catalogoEventiV2).replace(/<\/script/gi, "<\\/script") +
        ';<\/script>\n'
      : "";
    const pagina = html
      .replace(/<link[^>]+rel="stylesheet"[^>]+href="(?!http)[^"]+"[^>]*>\s*/g, "")
      .replace(/<script[^>]+src="(?!http)[^"]+"[^>]*><\/script>\s*/g, "")
      .replace("</head>", "<style>\n" + stile + "\n</style>\n</head>")
      .replace("</body>", creatorRpgInline + catalogoInline + "<script>\n" + codice + "\n</script>\n</body>");
    const f = path.join(USCITA, "anni-di-fame.html");
    fs.writeFileSync(f, pagina);
    console.log("\nscritto " + f + " (" + kb(Buffer.byteLength(pagina)) + ")");
    console.log("Si apre con un doppio clic: dentro c'è tutto, immagini comprese.");
    return;
  }

  const nomeStile = "stile-" + impronta(stile) + ".css";
  const nomeCodice = "gioco-" + impronta(codice) + ".js";
  fs.mkdirSync(path.join(USCITA, "assets"), { recursive: true });
  fs.writeFileSync(path.join(USCITA, "assets", nomeStile), stile);
  fs.writeFileSync(path.join(USCITA, "assets", nomeCodice), codice);
  if(catalogoEventiV2){
    fs.copyFileSync(CATALOGO_EVENTI_V2,
      path.join(USCITA, "assets", path.basename(CATALOGO_EVENTI_V2)));
  }

  let pagina = html
    .replace(/<link[^>]+rel="stylesheet"[^>]+href="(?!http)[^"]+"[^>]*>\s*/g, "")
    .replace(/<script[^>]+src="(?!http)[^"]+"[^>]*><\/script>\s*/g, "")
    .replace("</head>", '<link rel="stylesheet" href="assets/' + nomeStile + '">\n</head>')
    .replace("</body>", '<script src="assets/' + nomeCodice + '"></script>\n</body>');
  fs.writeFileSync(path.join(USCITA, "index.html"), pagina);

  copiaCartella(path.join(RADICE, "media"), path.join(USCITA, "media"));

  console.log("\nscritto " + USCITA);
  console.log("  index.html          " + kb(Buffer.byteLength(pagina)));
  console.log("  assets/" + nomeStile + "  " + kb(Buffer.byteLength(stile)));
  console.log("  assets/" + nomeCodice + "  " + kb(Buffer.byteLength(codice)));
  console.log("  media/              " + kb(pesa(path.join(USCITA, "media"))));
  console.log("\nTutti i percorsi sono relativi: la cartella gira anche da file://,");
  console.log("che è come la aprono Electron e Capacitor.");
})().catch(e => { console.error("\nil build si è fermato: " + e.message); process.exit(1); });
