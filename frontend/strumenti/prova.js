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

/* === START ZERO REGRESSION V1 START === */
console.log("\nla nuova carriera parte da zero");
{
  const vm = require("vm");
  const scatola = {
    console, Math, JSON, Object, Array, String, Number, Boolean, Date,
    parseInt, parseFloat, isNaN,
    localStorage: { getItem: () => null, setItem: () => {} }
  };
  scatola.window = scatola;
  vm.createContext(scatola);

  let stato = null, lvl = null, errore = null;
  try{
    vm.runInContext(
      fs.readFileSync(path.join(RADICE, "js/game/state.js"), "utf8"),
      scatola,
      { filename: "state.js" }
    );
    stato = vm.runInContext("START()", scatola);
    lvl = vm.runInContext("livello().lvl", scatola);
  }catch(e){ errore = e; }

  controlla(
    "soldi, fan, hype, skill e stream iniziano tutti da zero",
    !errore &&
      stato.money === 0 &&
      stato.fans === 0 &&
      stato.hype === 0 &&
      stato.streamsPrev === 0 &&
      Array.isArray(stato.songs) && stato.songs.length === 0 &&
      Object.values(stato.skills).every(v => v === 0),
    errore ? [errore.message] : [
      "money=" + stato.money,
      "fans=" + stato.fans,
      "hype=" + stato.hype,
      "streamsPrev=" + stato.streamsPrev,
      "skills=" + JSON.stringify(stato.skills)
    ]
  );

  controlla(
    "una nuova carriera parte dal livello 1",
    !errore && lvl === 1,
    errore ? [errore.message] : ["livello=" + lvl]
  );
}
/* === START ZERO REGRESSION V1 END === */

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

/* Le immagini non stanno solo nei CSS: gli sfondi delle Attività criminali e del
   carcere sono elenchi di percorsi dentro al codice, e il controllo qui sopra non
   li guardava. Novanta file erano spariti dal disco senza che niente se ne
   accorgesse: la schermata si apriva nera e la prova diceva ok. */
console.log("\nle immagini richiamate dal codice");
const senzaFile = [];
const ESTENSIONE = /\.(?:jpe?g|png|webp|gif|svg|mp3|ogg|wav)$/i;
for(const f of jsSulDisco){
  const testo = fs.readFileSync(path.join(RADICE, f), "utf8");
  const visti = new Set();
  for(const m of testo.matchAll(/["'`]((?:media|assets)\/[A-Za-z0-9_\-./]+)["'`]/g)){
    const rel = m[1];
    if(!ESTENSIONE.test(rel) || visti.has(rel)) continue;
    visti.add(rel);
    if(!fs.existsSync(path.resolve(RADICE, rel))) senzaFile.push(f + " → " + rel);
  }
}
controlla("ogni immagine richiamata dal codice sta al suo posto", senzaFile.length === 0,
  senzaFile.length > 6 ? senzaFile.slice(0, 6).concat("… e altri " + (senzaFile.length - 6)) : senzaFile);

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

console.log("\nla chat del telefono: non si deve ripetere");
/* Il difetto da cui e' nata questa parte era: «le conversazioni sono monotone e
   vanno subito in loop». Un difetto cosi' non lo prende un controllo di
   sintassi — si vede solo giocando, o facendo giocare il codice. Qui si fa
   vivere la chat per centosessanta settimane e si guarda cosa succede. */
{
  const vm = require("vm");
  const scatola = {
    console, Math, JSON, Object, Array, String, Number, Boolean, Date, isNaN,
    localStorage: { getItem: () => null, setItem: () => {} }
  };
  scatola.window = scatola;
  vm.createContext(scatola);
  /* il minimo che chat.js si aspetta di trovare gia' in giro */
  vm.runInContext([
    "const pick = a => a[Math.floor(Math.random()*a.length)];",
    "const clamp = (v,a,b) => Math.max(a, Math.min(b, v));",
    "let G = { week:1, year:1, day:1, age:19, energy:100, maxEnergy:100,",
    "  money:220, fans:0, hype:0, wellbeing:80, lucidita:80,",
    "  skills:{scrittura:8, flow:6, presenza:5, rete:4},",
    "  songs:[], beats:[], rivals:[{n:'Nino Zero'}], job:null, contract:null,",
    "  strada:{heat:0, rep:0}, chat:{}, market:[], gente:[] };",
    /* quel tanto che basta perche' i contatti de La Sala funzionino */
    "const rnd = (a,b) => a + Math.random()*(b-a);",
    "const relSoglia = p => 3 + p.rel;",
    "const POSTO_RUOLI = { beatmaker:{n:'Beatmaker',k:'#4ADE80'}, fonico:{n:'Fonico',k:'#38BDF8'} };",
    "const mioGenere = () => 'trap';",
    "let beatFatti = 0;",
    "const creaBeat = (g,q,presi) => { beatFatti++; return {n:'Beat '+beatFatti, q:Math.round(q), price:60}; };",
    "const pushLog = () => {};",
    "const luc = () => G.lucidita;",
    "const addLuc = n => { G.lucidita = clamp(luc()+n, 0, 100); };",
    "const totalWeeks = () => (G.year-1)*52 + G.week;",
    "const save = () => {}; const renderTelefono = () => {}; const renderGioco = () => {};",
    "const spoglia = x => String(x).replace(/<[^>]*>/g, '');",
    "const tronca = (x,n) => x.length > n ? x.slice(0,n-1) : x;",
    "const hsvg = () => '';"
  ].join("\n"), scatola);

  let viva = true;
  try{
    vm.runInContext(fs.readFileSync(path.join(RADICE, "js/game/chat.js"), "utf8"),
      scatola, { filename: "chat.js" });
  }catch(e){ viva = false; controlla("la chat si carica fuori dal browser", false, [e.message]); }

  if(viva){
    const dentro = c => vm.runInContext(c, scatola);
    const G = dentro("G");
    const gente = dentro("CHAT_GENTE");

    /* 1. ogni contatto deve avere di che parlare: con uno o due spunti si
          ripete per forza, per quanto furba sia la scelta */
    const poveri = gente.filter(c => (c.spunti || []).length < 3)
      .map(c => c.n + " (" + (c.spunti || []).length + ")");
    controlla("ogni contatto ha almeno tre cose diverse da dire", poveri.length === 0, poveri);

    /* 2. la carriera va avanti e la chat vive: si risponde a caso, come farebbe
          uno che gioca senza pensarci. Dentro ci sono anche due contatti presi
          a La Sala, se no il giro lungo non li proverebbe mai. */
    G.gente = [
      { id:"pA", ruolo:"beatmaker", n:"Bit",  gen:"trap",  fama:20, rel:1, pt:0, numero:true },
      { id:"pB", ruolo:"fonico",    n:"Sara", gen:"",      fama:30, rel:2, pt:0, numero:true },
      { id:"pC", ruolo:"rapper",    n:"Nino", gen:"drill", fama:25, rel:3, pt:0 }
    ];
    const dette = {};
    for(let w = 1; w <= 160; w++){
      G.week = w;
      G.fans = Math.round(Math.pow(w, 2.2));
      G.money = 150 + w * 45;
      G.wellbeing = 40 + (w * 7) % 60;
      G.lucidita = 35 + (w * 11) % 60;
      G.skills.presenza = 5 + Math.floor(w / 12);
      G.skills.rete = 4 + Math.floor(w / 15);
      G.strada.heat = Math.max(0, (w % 17) * 3);
      if(w % 5 === 0) G.songs.push({ t:"Pezzo " + w, released:true, week:w, txt:"una barra vera" });
      if(w % 9 === 0) G.beats.push({ n:"beat" });
      if(w === 60) G.contract = { et:"Etichetta" };
      dentro("chatSettimana()");
      for(let g = 0; g < 6; g++) dentro("chatGiorno()");
      for(const c of dentro("chatAttivi()")){
        const t = G.chat[c.id];
        if(!t || !t.aperto) continue;
        (dette[c.id] = dette[c.id] || []).push(t.aperto.sp);
        let giri = 0;
        while(t.aperto && giri < 8){
          const opts = dentro("chatOpzioni(chatChi('" + c.id + "'), G.chat['" + c.id + "'])");
          if(!opts || !opts.length) break;
          dentro("chatRispondi('" + c.id + "', " + Math.floor(Math.random() * opts.length) + ")");
          giri++;
        }
      }
    }

    const ripetuti = [];
    let messaggi = 0;
    for(const id in dette){
      const v = dette[id];
      messaggi += v.length;
      for(let i = 1; i < v.length; i++)
        if(v[i] === v[i-1]) ripetuti.push(id + ": «" + v[i] + "» due volte di fila");
    }
    controlla("in 160 settimane (" + messaggi + " messaggi) nessuno dice due volte di fila la stessa cosa",
      ripetuti.length === 0, ripetuti.slice(0, 6));

    /* 3. si e' visto girare gente diversa, non sempre i soliti due */
    const chiHaParlato = Object.keys(dette).length;
    controlla("col crescere della carriera si fanno vivi almeno sei contatti diversi",
      chiHaParlato >= 6, chiHaParlato);

    /* 4. una conversazione a meta' deve sopravvivere al salvataggio: nello stato
          va solo la strada, se ci finissero le funzioni al ricaricamento della
          pagina resterebbero dei bottoni morti */
    let provate = 0, perse = 0;
    for(const c of gente){
      for(const sp of c.spunti){
        const ramo = sp.opts.findIndex(o => o.poi && o.poi.length);
        if(ramo < 0) continue;
        provate++;
        G.chat[c.id] = { msgs:[], nonLetti:0, bloccatoFino:0, visti:[], aperto:{ sp: sp.id, via: [] } };
        dentro("chatRispondi('" + c.id + "', " + ramo + ")");
        const prima = dentro("chatOpzioni(chatChi('" + c.id + "'), G.chat['" + c.id + "'])");
        /* ecco il giro che fa localStorage */
        vm.runInContext("G.chat = " + JSON.stringify(JSON.parse(JSON.stringify(G.chat))), scatola);
        const dopo = dentro("chatOpzioni(chatChi('" + c.id + "'), G.chat['" + c.id + "'])");
        if(!prima || !dopo || prima.length !== dopo.length) perse++;
      }
    }
    controlla("le " + provate + " conversazioni a più giri sopravvivono al salvataggio",
      provate > 0 && perse === 0, perse);

    /* 5. quello che si puo' scrivere dev'essere scrivibile: nessuna opzione
          senza nome, nessuno spunto senza testo */
    const storti = [];
    for(const c of gente){
      const guarda = (o, dove) => {
        if(!o.n) storti.push(dove + ": un'opzione senza nome");
        if(o.run && typeof o.run !== "function") storti.push(dove + ": run non è una funzione");
        (o.poi || []).forEach(x => guarda(x, dove));
      };
      for(const sp of c.spunti){
        if(typeof sp.testo !== "function") storti.push(c.n + "/" + sp.id + ": testo non è una funzione");
        if(!sp.opts || !sp.opts.length) storti.push(c.n + "/" + sp.id + ": senza risposte");
        (sp.opts || []).forEach(o => guarda(o, c.n + "/" + sp.id));
      }
      (c.tu || []).forEach(a => guarda(a, c.n + "/scrivi tu"));
    }
    controlla("ogni spunto ha un testo e delle risposte scritte per bene", storti.length === 0, storti);

    /* i contatti de La Sala hanno appena fatto le 160 settimane insieme agli
       altri: qui si guarda che compaiano e spariscano quando devono */
    controlla("anche i contatti presi a La Sala parlano nel giro lungo",
      !!dette["sala:pA"] && !!dette["sala:pB"],
      Object.keys(dette).filter(k => k.indexOf("sala:") === 0));

    /* ---- i contatti che arrivano da La Sala («Da smistare», punto 4) ---- */
    G.chat = {};
    G.gente = [
      { id:"pA", ruolo:"beatmaker", n:"Bit", gen:"trap", fama:20, rel:1, pt:0 },
      { id:"pB", ruolo:"fonico",    n:"Sara", gen:"",    fama:30, rel:2, pt:0 },
      { id:"pC", ruolo:"rapper",    n:"Nino", gen:"drill", fama:25, rel:3, pt:0 }
    ];
    const senzaNumero = dentro("chatAttivi()").length;
    G.gente[0].numero = true;
    G.gente[1].numero = true;
    G.gente[2].numero = true;                 /* al rapper il numero non si chiede: non deve comparire */
    const conNumero = dentro("chatAttivi()");
    controlla("chi ti ha dato il numero compare fra le chat",
      conNumero.length === senzaNumero + 2, { prima: senzaNumero, dopo: conNumero.length });
    controlla("e ci compare col suo nome e col suo mestiere",
      conNumero.some(c => c.n === "Bit" && c.sotto === "Beatmaker") &&
      conNumero.some(c => c.n === "Sara" && c.sotto === "Fonico"),
      conNumero.filter(c => c.dallaSala).map(c => c.n + "/" + c.sotto));
    controlla("un rapper col numero non finisce in chat: a lui si propone un feat di persona",
      !conNumero.some(c => c.n === "Nino"));

    /* si presenta da solo, se no apri una chat vuota */
    dentro("chatPresentazione(G.gente[0])");
    const tBit = G.chat["sala:pA"];
    controlla("appena avete il numero si fa vivo lui per primo",
      !!tBit && tBit.msgs.length === 1 && tBit.nonLetti === 1, tBit && tBit.msgs);

    /* il beatmaker manda un beat vero, che finisce nel catalogo */
    const primaBeat = G.market.length;
    const cBit = dentro("chatChi('sala:pA')");
    const spManda = cBit.spunti.find(x => x.id === "manda");
    G.chat["sala:pA"] = { msgs:[], nonLetti:0, bloccatoFino:0, visti:[], aperto:{ sp:"manda", via:[] } };
    dentro("chatRispondi('sala:pA', 0)");
    controlla("il beatmaker ti manda un beat vero, che finisce nel catalogo",
      G.market.length === primaBeat + 1 && G.market[G.market.length-1].da === "Bit",
      G.market[G.market.length-1]);

    /* parlarsi avvicina, come parlarsi di persona */
    const relPrima = G.gente[1].rel, ptPrima = G.gente[1].pt;
    dentro("chatAvvicina(G.gente[1], 6)");
    controlla("parlare in chat fa salire il rapporto, come parlarsi di persona",
      G.gente[1].rel > relPrima, { prima: relPrima + "+" + ptPrima, dopo: G.gente[1].rel + "+" + G.gente[1].pt });

    /* se sparisce dal giro, sparisce anche dalla rubrica */
    G.gente[0].via = true;
    controlla("chi lascia il giro esce anche dalle chat",
      !dentro("chatAttivi()").some(c => c.n === "Bit"));
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
