/* Il build del gioco.

     npm run build     → dist/       la cartella da dare a Electron e a Capacitor
     npm run demo      → dist/anni-di-fame.html   il gioco da mandare a qualcuno

   Le pagine sono tre (punto 27): `pagine/landing.html`, `pagine/accesso.html`,
   `pagine/gioco.html`. Ognuna cita i suoi file e ognuna si impacchetta per
   conto suo — la landing non si porta dietro il gioco, che è il motivo per cui
   sono state separate.

   Cosa fa, per ogni pagina, in ordine:
   1. ne tira fuori l'elenco ordinato dei CSS e dei JS (l'ordine dei tag è il
      contratto del gioco: i file contano l'uno sull'altro);
   2. li mette insieme in due file soli e li minifica con esbuild;
   3. dà a ognuno un nome con dentro l'impronta del contenuto
      (`gioco-3f2a91c4.js`), così la cache si sistema da sé e il `?v=` a mano sparisce;
   4. riscrive la pagina con due tag al posto di quarantatré;
   e alla fine copia le immagini e i suoni, e `index.html` — che è la porta
   d'ingresso e non cita niente di suo.

   Con `--unico` fa invece tre file HTML che stanno in piedi da soli, con dentro
   anche le immagini dei CSS come data URI: si mandano a qualcuno e ci gioca,
   senza installare niente. Sono tre e non uno perché le pagine sono tre; i
   collegamenti fra loro vengono riscritti coi nomi nuovi (js/pagine.js tiene
   quei nomi in un posto solo apposta).

   L'unica dipendenza è esbuild, e serve solo qui: nel gioco non entra niente. */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RADICE = path.resolve(__dirname, "..");
const USCITA = path.join(RADICE, "dist");
const UNICO = process.argv.includes("--unico");
const NUDO = process.argv.includes("--senza-minificare");

/* Le tre pagine, e come si chiamano nella demo monofile (dove finiscono tutte
   nella stessa cartella e «pagine/» non esiste più). */
const PAGINE = [
  { file: "pagine/landing.html", nome: "landing", unico: "anni-di-fame.html" },
  { file: "pagine/accesso.html", nome: "accesso", unico: "anni-di-fame-accesso.html" },
  { file: "pagine/gioco.html",   nome: "gioco",   unico: "anni-di-fame-gioco.html" }
];

/* Eventi V2 usa un catalogo JSON esterno. Nel build store va copiato accanto
   al bundle; nella demo monofile va incorporato, altrimenti file:// non
   può fare fetch del JSON e il motore eventi (con Notifiche) non parte. */
const CATALOGO_EVENTI_V2 = path.join(RADICE, "js", "game", "eventi-master-1000-v1.2.13.json");

/* ADF_RPG_V24_BUILD: nella demo monofile il creator iframe deve viaggiare dentro
   allo stesso HTML. Nel build store resta invece sotto media/ ed è copiato normalmente. */
const CREATOR_RPG_V24_DIR = path.join(RADICE, "media", "creator-rpg-v24");
/* ADF_MENU_MUSIC_BUILD_V1: nello store resta un MP3; nella demo viene incorporato. */
const MENU_MUSIC_FILE = path.join(RADICE, "media", "audio", "music", "dream-catcher.mp3");
function menuMusicDataUrl(){
  if(!fs.existsSync(MENU_MUSIC_FILE)) throw new Error("Musica menu: manca " + MENU_MUSIC_FILE);
  return "data:audio/mpeg;base64," + fs.readFileSync(MENU_MUSIC_FILE).toString("base64");
}
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

/* Roba che sta in media/ ma non deve finire addosso a chi installa il gioco.
   media/ si copia intera, ed è comodo finché dentro ci sono solo le foto e i
   suoni del gioco. `makehuman-editor-v1` non è quello: è il dataset da cui si
   pescano i pezzi dell'avatar — 2,8 GB fra proxy, texture e target, più di
   tutto il resto del gioco messo insieme — e nessuna riga di codice lo nomina.
   Serve a chi lavora agli avatar, non a chi gioca. Dal 07/09/2026 sta fuori
   anche dalla storia di git: qui dentro restano i cataloghi JSON e il manifest,
   il dataset vero se lo scarica chi gli serve con `npm run setup:makehuman`
   (finisce in `data/`, che .gitignore tiene fuori). Il salto qui sotto vale
   comunque: chi ha già fatto il setup ha di nuovo 2,8 GB in media/, e nel
   pacchetto per gli store non ci devono finire. Il giorno che il gioco lo
   carica davvero, si toglie da qui — ma allora si caricherà il pezzo che
   serve, non 2,8 GB. */
const FUORI_DAL_PACCHETTO = new Set([
  path.join(RADICE, "media", "makehuman-editor-v1")
]);

function copiaCartella(da, a){
  if(FUORI_DAL_PACCHETTO.has(da)) return;
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

/* Una pagina: i suoi CSS in uno, i suoi JS in uno. */
async function impacchetta(pagina){
  const html = leggi(pagina.file);
  const { css, js } = pezzi(html);
  if(!css.length || !js.length)
    throw new Error(pagina.file + " non cita né fogli di stile né codice");

  /* i CSS, uno dietro l'altro nell'ordine dei tag */
  let stile = css.map(f => "/* " + f.split("?")[0] + " */\n" + leggi(f)).join("\n");
  stile = immagini(stile, UNICO);
  stile = await minifica(stile, "css");

  /* i JS, uno dietro l'altro: stesso scope, stesso ordine, come nella pagina */
  let codice = js.map(f => "/* " + f.split("?")[0] + " */\n" + leggi(f)).join("\n;\n");
  codice = await minifica(codice, "js");

  return { html, css, js, stile, codice,
    usaEventiV2: js.some(f => f.split("?")[0] === "js/game/eventi-v2.js") };
}

/* I collegamenti fra le pagine: nella demo monofile i file cambiano nome e
   stanno tutti nella stessa cartella. I nomi compaiono in due posti soli —
   js/pagine.js e qualche <a href> — e qui si riscrivono tutti insieme. */
function riscriviCollegamenti(testo){
  let t = testo;
  for(const p of PAGINE) t = t.split(p.file).join(p.unico);
  return t;
}

const SENZA_TAG_LOCALI = pagina => pagina
  .replace(/<link[^>]+rel="stylesheet"[^>]+href="(?!http)[^"]+"[^>]*>\s*/g, "")
  .replace(/<script[^>]+src="(?!http)[^"]+"[^>]*><\/script>\s*/g, "");

(async () => {
  const fatte = [];
  for(const p of PAGINE) fatte.push(Object.assign({ pagina: p }, await impacchetta(p)));
  const gioco = fatte.find(f => f.pagina.nome === "gioco");

  /* Eventi V2 usa un catalogo esterno: è roba della pagina del gioco. */
  let catalogoEventiV2 = null;
  if(gioco.usaEventiV2){
    if(!fs.existsSync(CATALOGO_EVENTI_V2))
      throw new Error("Eventi V2: manca " + CATALOGO_EVENTI_V2);
    catalogoEventiV2 = JSON.parse(fs.readFileSync(CATALOGO_EVENTI_V2, "utf8"));
    if(!Array.isArray(catalogoEventiV2) || catalogoEventiV2.length !== 1000)
      throw new Error("Eventi V2: catalogo non valido (" +
        (Array.isArray(catalogoEventiV2) ? catalogoEventiV2.length : typeof catalogoEventiV2) + ")");
  }

  console.log((UNICO ? "Il gioco da mandare in giro" : "Il gioco per gli store") +
    " — " + PAGINE.length + " pagine");
  for(const f of fatte)
    console.log("  " + f.pagina.nome.padEnd(8) + f.css.length + " fogli di stile, " + f.js.length + " file di codice");

  /* attenzione ai caratteri: se li prendiamo dalla rete, senza rete cambiano */
  if(fatte.some(f => /fonts\.googleapis\.com/.test(f.html))){
    console.log("  ! i caratteri arrivano ancora da Google Fonts: dentro a un'app,\n" +
                "    senza rete, il gioco si vede con quelli di sistema. Da portare dentro.");
  }

  fs.mkdirSync(USCITA, { recursive: true });

  /* ---------- la demo: pagine che stanno in piedi da sole ---------- */
  if(UNICO){
    const menuMusicInline = "<script>window.__ADF_MENU_MUSIC_SRC__=" +
      JSON.stringify(menuMusicDataUrl()).replace(/<\/script/gi, "<\/script") + ";<\/script>\n";
    const creatorRpgInline = "<script>window.__ADF_RPG_V24_SRC__=" +
      JSON.stringify(creatorRpgV24DataUrl()).replace(/<\/script/gi, "<\/script") + ";<\/script>\n";
    const catalogoInline = catalogoEventiV2
      ? '<script>window.__ADF_EVENT_CATALOG__=' +
        JSON.stringify(catalogoEventiV2).replace(/<\/script/gi, "<\/script") +
        ';<\/script>\n'
      : "";

    for(const f of fatte){
      const usaMenuMusic = f.js.some(x => x.split("?")[0] === "js/audio/music.js");
      const suo = (usaMenuMusic ? menuMusicInline : "") +
        (f.pagina.nome === "gioco" ? creatorRpgInline + catalogoInline : "");
      /* fuori il <base>: qui le pagine stanno accanto a media/, non dentro a pagine/ */
      let pagina = SENZA_TAG_LOCALI(f.html)
        .replace(/\s*<base href="\.\.\/">\n?/, "\n")
        .replace("</head>", "<style>\n" + f.stile + "\n</style>\n</head>")
        .replace("</body>", suo + "<script>\n" + f.codice + "\n</script>\n</body>");
      pagina = riscriviCollegamenti(pagina);
      const uscita = path.join(USCITA, f.pagina.unico);
      fs.writeFileSync(uscita, pagina);
      console.log("\nscritto " + uscita + " (" + kb(Buffer.byteLength(pagina)) + ")");
    }
    console.log("\nSi apre " + PAGINE[0].unico + " con un doppio clic. Le tre pagine si");
    console.log("chiamano fra loro, quindi vanno tenute nella stessa cartella insieme");
    console.log("a media/: dentro all'HTML ci sono i disegni dei CSS, le foto no.");
    return;
  }

  /* ---------- il pacchetto per gli store ---------- */
  /* si rifà il build, non si buttano le demo che magari stanno lì accanto */
  fs.rmSync(path.join(USCITA, "assets"), { recursive: true, force: true });
  fs.rmSync(path.join(USCITA, "media"), { recursive: true, force: true });
  fs.rmSync(path.join(USCITA, "pagine"), { recursive: true, force: true });
  fs.rmSync(path.join(USCITA, "index.html"), { force: true });

  fs.mkdirSync(path.join(USCITA, "assets"), { recursive: true });
  fs.mkdirSync(path.join(USCITA, "pagine"), { recursive: true });

  for(const f of fatte){
    const nomeStile = f.pagina.nome + "-" + impronta(f.stile) + ".css";
    const nomeCodice = f.pagina.nome + "-" + impronta(f.codice) + ".js";
    fs.writeFileSync(path.join(USCITA, "assets", nomeStile), f.stile);
    fs.writeFileSync(path.join(USCITA, "assets", nomeCodice), f.codice);
    /* le pagine hanno <base href="../">: da dentro pagine/ «assets/...» è
       la cartella accanto, esattamente come nei sorgenti «css/...» */
    const pagina = SENZA_TAG_LOCALI(f.html)
      .replace("</head>", '<link rel="stylesheet" href="assets/' + nomeStile + '">\n</head>')
      .replace("</body>", '<script src="assets/' + nomeCodice + '"></script>\n</body>');
    fs.writeFileSync(path.join(USCITA, f.pagina.file), pagina);
    f.uscita = { pagina: f.pagina.file, stile: nomeStile, codice: nomeCodice,
      peso: Buffer.byteLength(pagina) };
  }

  if(catalogoEventiV2){
    fs.copyFileSync(CATALOGO_EVENTI_V2,
      path.join(USCITA, "assets", path.basename(CATALOGO_EVENTI_V2)));
  }

  /* la porta d'ingresso: non cita niente di suo, si copia com'è */
  fs.copyFileSync(path.join(RADICE, "index.html"), path.join(USCITA, "index.html"));

  copiaCartella(path.join(RADICE, "media"), path.join(USCITA, "media"));

  console.log("\nscritto " + USCITA);
  console.log("  index.html          " + kb(fs.statSync(path.join(USCITA, "index.html")).size));
  for(const f of fatte){
    console.log("  " + f.uscita.pagina.padEnd(20) + kb(f.uscita.peso));
    console.log("    assets/" + f.uscita.stile + "  " + kb(Buffer.byteLength(f.stile)));
    console.log("    assets/" + f.uscita.codice + "  " + kb(Buffer.byteLength(f.codice)));
  }
  console.log("  media/              " + kb(pesa(path.join(USCITA, "media"))));
  console.log("\nTutti i percorsi sono relativi: la cartella gira anche da file://,");
  console.log("che è come la aprono Electron e Capacitor.");
})().catch(e => { console.error("\nil build si è fermato: " + e.message); process.exit(1); });
