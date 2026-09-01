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

console.log("\nil creatore: ogni opzione si deve vedere");
/* Il punto 3 chiede un elenco preciso di opzioni per l'avatar. Che siano
   scritte in `data.js` non basta: la domanda vera e' se ognuna **cambia
   davvero il disegno**. Un'opzione che c'e' nell'elenco ma che il ritratto
   ignora e' peggio che non averla — la scegli, non succede niente, e sembra
   rotto il gioco.

   Qui si carica il ritratto fuori dal browser, si generano tutti i disegni una
   opzione alla volta e si confrontano. Due opzioni della stessa riga che danno
   lo stesso identico SVG vogliono dire che una delle due non e' disegnata. */
{
  const vm = require("vm");
  const crypto = require("crypto");
  const scatola = {
    localStorage: { getItem: () => null, setItem: () => {} },
    console, Math, JSON, Object, Array, String, Number, Boolean, Date,
    parseInt, parseFloat, isNaN
  };
  scatola.window = scatola;
  vm.createContext(scatola);
  const sorgenti = ["js/creator/data.js", "js/creator/avatar-presets.js",
                    "js/creator/state.js", "js/creator/portrait.js"];
  let acceso = true;
  try{
    for(const f of sorgenti)
      vm.runInContext(fs.readFileSync(path.join(RADICE, f), "utf8"), scatola, { filename: f });
  }catch(e){ acceso = false; controlla("il ritratto si carica fuori dal browser", false, [e.message]); }

  if(acceso){
    /* `const HAIRS = [...]` a livello di script e' una dichiarazione lessicale,
       non una proprieta' globale: si legge valutando il nome nel contesto. */
    const dentro = c => vm.runInContext(c, scatola);
    const A = dentro("A");
    /* gli id dentro all'SVG cambiano a ogni chiamata: si normalizzano, se no
       due disegni identici sembrerebbero diversi */
    const impronta = svg => crypto.createHash("sha1")
      .update(String(svg).replace(/p\d+/g, "pX")).digest("hex");

    /* le sei categorie della barra, come le costruisce js/creator/options.js */
    const RIGHE = [
      ["capelli", "hair", "HAIRS"], ["capelli", "hairCol", "HAIRCOLS"],
      ["cappelli", "hat", "HATS"],
      ["occhi", "eyes", "EYES"], ["occhi", "eyeCol", "EYECOLS"], ["occhi", "brow", "BROWS"],
      ["accessori", "glasses", "GLASSES"], ["accessori", "cuffie", "CUFFIE"],
      ["accessori", "ear", "EARS"], ["accessori", "grillz", "GRILLZ"],
      ["accessori", "chain", "CHAINS"],
      ["vestiti", "fit", "FITS"],
      ["tatuaggi", "tattoo", "TATTOOS"], ["tatuaggi", "beard", "BEARDS"]
    ];
    /* «Come l'espressione» disegna gli occhi che vuole l'umore: con l'umore
       neutro sono per l'appunto quelli normali, ed e' giusto che coincidano.
       Con qualunque altro umore cambia — c'e' una prova apposta qui sotto. */
    const AMMESSE = { eyes: ["auto"] };

    let quante = 0;
    const mute = [];
    for(const [cat, k, nome] of RIGHE){
      const lista = dentro(nome).map(o => o.id !== undefined ? o : { id: o.c, n: o.n });
      const visti = new Map();
      const salvato = A[k];
      for(const o of lista){
        A[k] = o.id;
        quante++;
        const imp = impronta(dentro("portrait()"));
        if(visti.has(imp)){
          if((AMMESSE[k] || []).indexOf(o.id) < 0 && (AMMESSE[k] || []).indexOf(visti.get(imp).id) < 0)
            mute.push(cat + "/" + k + ": «" + o.n + "» disegna come «" + visti.get(imp).n + "»");
        } else visti.set(imp, o);
      }
      A[k] = salvato;
    }
    controlla("tutte e " + quante + " le opzioni del creatore cambiano il ritratto",
      mute.length === 0, mute);

    /* e la scorciatoia «come l'espressione» deve seguire davvero l'umore */
    const salvaM = A.mood, salvaE = A.eyes;
    A.mood = "arrabbiato"; A.eyes = "auto";
    const arrabbiato = impronta(dentro("portrait()"));
    A.eyes = "normali";
    const normali = impronta(dentro("portrait()"));
    A.mood = salvaM; A.eyes = salvaE;
    controlla("«come l'espressione» segue l'umore, non fa gli occhi normali e basta",
      arrabbiato !== normali);

    /* il punto 3 elenca quello che ci deve stare dentro, per nome */
    const chiesto = {
      HAIRS: ["Corti","Fade","Buzz cut","Ricci","Afro","Treccine","Dread","Dread lunghe",
              "Dread corte","Mullet","Lunghi","Cornrows","Twist","Durag"],
      HATS: ["Niente","Snapback","Snapback laterale","Snapback rovesciato","Beanie",
             "Bucket","Bandana","Cappellino NY","Cappellino LA"],
      EYECOLS: ["Marroni","Neri","Nocciola","Azzurri","Verdi","Grigi"],
      FITS: ["Hoodie","T-shirt","Bomber","Piumino","Canotta","Tuta"],
      TATTOOS: ["Nessuno","Lacrima","Croce","Rosa","Corona","Scritta sul collo",
                "Scritta sul viso","Stelle","Tattoo full neck"],
      GLASSES: ["Occhiali piccoli","Occhiali grandi","Occhiali neri","Occhiali colorati"]
    };
    /* Dove il gioco chiama la stessa cosa con un nome piu' lungo, sta scritto
       qui: e' una differenza voluta, non una voce che manca. Meglio elencarla
       che allargare il confronto, se no la prossima volta un buco vero passa. */
    const SINONIMI = {
      "Tuta": "Tuta sportiva",              // nel gioco si specifica che e' sportiva
      "Stelle": "Stelle sul viso",
      "Tattoo full neck": "Full neck"
    };
    const senza = [];
    for(const nome in chiesto){
      const ci_sono = dentro(nome).map(o => o.n);
      for(const voce of chiesto[nome])
        if(ci_sono.indexOf(voce) < 0 && ci_sono.indexOf(SINONIMI[voce]) < 0)
          senza.push(nome + ": " + voce);
    }
    controlla("c'è tutto quello che chiede il punto 3, con quel nome", senza.length === 0, senza);
  }
}

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
