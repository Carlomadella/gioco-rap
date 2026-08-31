/* La prova del gioco: quello che si può controllare senza aprire il browser.

     npm run prova

   Non è una prova del gameplay — quella si fa giocando. È la rete che prende
   gli errori scemi e costosi: un file aggiunto e mai messo in `index.html`
   (che poi non c'è nel build e nessuno se ne accorge), un `<script>` che punta
   a un file che non esiste più, un'immagine richiamata da un CSS e sparita,
   un file di codice che non compila.

   Esce con 0 se fila tutto liscio, con 1 al primo controllo che non torna. */
"use strict";

const fs = require("fs");
const path = require("path");

const RADICE = path.resolve(__dirname, "..");
let passati = 0, falliti = 0;

function controlla(cosa, condizione, dettaglio){
  if(condizione){ passati++; console.log("  ok   " + cosa); }
  else {
    falliti++;
    console.log("  NO   " + cosa);
    if(dettaglio) for(const r of [].concat(dettaglio)) console.log("       · " + r);
  }
}
function tuttiIFile(dentro, estensione, trovati){
  trovati = trovati || [];
  for(const voce of fs.readdirSync(dentro, { withFileTypes: true })){
    const f = path.join(dentro, voce.name);
    if(voce.isDirectory()) tuttiIFile(f, estensione, trovati);
    else if(voce.name.endsWith(estensione)) trovati.push(path.relative(RADICE, f).split(path.sep).join("/"));
  }
  return trovati;
}

const html = fs.readFileSync(path.join(RADICE, "index.html"), "utf8");
const citati = tag => [...html.matchAll(tag)].map(m => m[1].split("?")[0]).filter(h => !h.startsWith("http"));
const css = citati(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g);
const js = citati(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g);

console.log("\ni file e l'ordine");
controlla("index.html cita dei fogli di stile e del codice", css.length > 0 && js.length > 0);

const mancanti = [...css, ...js].filter(f => !fs.existsSync(path.join(RADICE, f)));
controlla("ogni file citato in index.html esiste davvero", mancanti.length === 0, mancanti);

const cssSulDisco = tuttiIFile(path.join(RADICE, "css"), ".css");
const jsSulDisco = tuttiIFile(path.join(RADICE, "js"), ".js");
const dimenticati = [...cssSulDisco, ...jsSulDisco].filter(f => css.indexOf(f) < 0 && js.indexOf(f) < 0);
controlla("nessun file sul disco è rimasto fuori da index.html", dimenticati.length === 0, dimenticati);

const doppi = [...css, ...js].filter((f, i, a) => a.indexOf(f) !== i);
controlla("nessun file è citato due volte", doppi.length === 0, doppi);

console.log("\nil codice");
const rotti = [];
for(const f of jsSulDisco){
  const testo = fs.readFileSync(path.join(RADICE, f), "utf8");
  try{ new Function(testo); }catch(e){ rotti.push(f + " — " + e.message); }
}
controlla("ogni file di codice compila", rotti.length === 0, rotti);

console.log("\nle immagini dei fogli di stile");
const perse = [];
for(const f of cssSulDisco){
  const testo = fs.readFileSync(path.join(RADICE, f), "utf8");
  for(const m of testo.matchAll(/url\(([^)]+)\)/g)){
    const rel = m[1].trim().replace(/^['"]|['"]$/g, "");
    if(rel.startsWith("http") || rel.startsWith("data:")) continue;
    const punta = path.resolve(RADICE, path.dirname(f), rel.split("?")[0]);
    if(!fs.existsSync(punta)) perse.push(f + " → " + rel);
  }
}
controlla("ogni immagine richiamata da un CSS sta al suo posto", perse.length === 0, perse);

console.log("\nil build");
const dist = path.join(RADICE, "dist");
if(!fs.existsSync(path.join(dist, "index.html"))){
  console.log("  --   dist/ non c'è ancora: dai `npm run build` e ridai questa prova");
}else{
  const pagina = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const codice = [...pagina.matchAll(/<script[^>]+src="(assets\/[^"]+)"/g)].map(m => m[1]);
  const stile = [...pagina.matchAll(/<link[^>]+href="(assets\/[^"]+)"/g)].map(m => m[1]);
  controlla("il build ha un file di codice solo e un foglio di stile solo",
    codice.length === 1 && stile.length === 1, ["codice: " + codice.length, "stile: " + stile.length]);
  controlla("i due file hanno l'impronta nel nome",
    /-[0-9a-f]{8}\.(js|css)$/.test(codice[0] || "") && /-[0-9a-f]{8}\.(js|css)$/.test(stile[0] || ""));
  controlla("i file del build ci sono",
    codice.every(f => fs.existsSync(path.join(dist, f))) && stile.every(f => fs.existsSync(path.join(dist, f))));
  try{
    new Function(fs.readFileSync(path.join(dist, codice[0]), "utf8"));
    controlla("il codice minificato compila", true);
  }catch(e){ controlla("il codice minificato compila", false, [e.message]); }
  controlla("nel build non è rimasto nessun ?v= a mano", !/\?v=\d/.test(pagina));
  controlla("le immagini sono state copiate", fs.existsSync(path.join(dist, "media", "photo")));
}

console.log("\n" + passati + " a posto, " + falliti + " no.\n");
process.exit(falliti ? 1 : 0);
