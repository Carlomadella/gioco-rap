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

/* La classifica vera nella schermata (punti 12 e 30). Il server la sa dare da
   un pezzo; quello che va provato è la metà di qua: che le righe che arrivano
   da Internet si disegnino, che si veda la tua posizione anche quando sei
   fuori dalla fetta, e soprattutto che **un nome scritto da un altro
   giocatore non possa portarsi dentro dell'HTML**. Il server tiene i nomi
   corti e senza caratteri invisibili ma non li ripulisce dai tag — non è il
   suo mestiere — quindi il posto dove quella roba va disinnescata è
   esattamente questo, e una prova che lo tenga fermo ci vuole.

   Si carica `ui.js` fuori dal browser con un DOM finto: quello che ci
   interessa è la stringa che finisce dentro a `#g-chart`. */
console.log("\nla classifica vera nella schermata");
{
  const vm = require("vm");
  const nodi = {};
  const finto = () => ({
    innerHTML: "", textContent: "", style: { setProperty(){} }, dataset: {},
    classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
    offsetWidth: 0, addEventListener(){}, removeEventListener(){},
    querySelector: () => finto(), querySelectorAll: () => []
  });
  const scatola = {
    console, Math, JSON, Object, Array, String, Number, Boolean, Date, Set, Map,
    parseInt, parseFloat, isNaN, isFinite,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      getElementById(id){ return nodi[id] || (nodi[id] = finto()); },
      querySelectorAll: () => [], addEventListener(){}
    }
  };
  scatola.window = scatola;
  vm.createContext(scatola);

  const sorgenti = ["js/core.js", "js/game/state.js", "js/game/rivals.js",
                    "js/game/covers.js", "js/game/scene-art.js", "js/game/content.js",
                    "js/game/actions.js", "js/game/phases.js", "js/game/sim.js",
                    "js/game/ui.js"];
  let acceso = true, errore = null;
  try{
    for(const f of sorgenti)
      vm.runInContext(fs.readFileSync(path.join(RADICE, f), "utf8"), scatola, { filename: f });
    vm.runInContext("G = START(); G.songs = []; window.ARTIST = {name:'Io', city:'Rovereto'};", scatola);
  }catch(e){ acceso = false; errore = e; }
  controlla("la classifica si carica fuori dal browser", acceso, errore ? [errore.message] : []);

  if(acceso){
    const dentro = c => vm.runInContext(c, scatola);
    const riga = (pos, nome, extra) => Object.assign({
      id: "id-" + pos, pos, nome, citta: "Milano", genere: "trap", stream: 5000 - pos * 10,
      delta: null, uscite: 3, deal: false, ultima: "Un pezzo", seed: 12345,
      storia: "", livello: 4, difficolta: "anni-di-fame", io: false
    }, extra || {});

    /* dieci righe vere, e io non ci sono: sono 428° */
    dentro("ONLINE = { classificaInCache: () => CACHE_FINTA, identita: () => ({id:'io'}) };");
    scatola.CACHE_FINTA = {
      settimana: 3, totale: 1200, filtro: null, prossimoGiro: 0,
      righe: [riga(1, "Primo", { delta: 2 }), riga(2, "Secondo", { delta: -1 }),
              riga(3, "Terzo"), riga(4, "Quarto"), riga(5, "Quinto"),
              riga(6, "Sesto"), riga(7, "Settimo"), riga(8, "Ottavo"),
              riga(9, "Nono"), riga(10, "Decimo")],
      io: riga(428, "Io", { io: true, stream: 90 })
    };
    dentro("renderChart()");
    const html = nodi["g-chart"].innerHTML;

    controlla("le righe del server si disegnano tutte",
      (html.match(/class="crow/g) || []).length === 11,
      (html.match(/class="crow/g) || []).length + " righe");
    controlla("la freccia della settimana arriva dal server",
      html.indexOf("▲ 2") >= 0 && html.indexOf("▼ 1") >= 0);
    controlla("chi non ha una posizione di prima ha un punto, non uno zero",
      html.indexOf('class="dl eq">·') >= 0);
    controlla("«sei 428°»: la tua riga c'è anche se sei fuori dalla fetta",
      html.indexOf(">428<") >= 0 && html.indexOf("staccata") >= 0);
    /* il punto separatore lo mette toLocaleString, che fuori dal browser
       dipende da com'e' compilato Node: si guardano le cifre, non il punto */
    controlla("il titolo dice quanti sono in classifica",
      nodi["g-charthead"].textContent.replace(/[.  ]/g, "").indexOf("1200artisti") >= 0,
      nodi["g-charthead"].textContent);
    controlla("da sotto si allarga alla top 100 (punto 12)",
      nodi["g-chartpiu"].innerHTML.indexOf('data-chart="100"') >= 0,
      nodi["g-chartpiu"].innerHTML);

    /* il pezzo che conta: il nome lo scrive un altro giocatore */
    scatola.CACHE_FINTA.righe = [riga(1, '<img src=x onerror="alert(1)">',
      { ultima: "</text><script>alert(2)</script>" })];
    scatola.CACHE_FINTA.io = null;
    dentro("renderChart()");
    const cattivo = nodi["g-chart"].innerHTML;
    controlla("un nome con dentro dell'HTML non diventa HTML",
      cattivo.indexOf("<img") < 0 && cattivo.indexOf("&lt;img") >= 0, cattivo.slice(0, 160));
    controlla("e nemmeno il titolo del pezzo, che finisce dentro alla copertina",
      cattivo.toLowerCase().indexOf("<script") < 0);

    /* niente server: si torna ai rivali di casa, senza accorgersene */
    dentro("ONLINE = { classificaInCache: () => null, identita: () => null };");
    dentro("G.rivals = []; sistemaRivali();");
    dentro("renderChart()");
    controlla("senza server si disegna la classifica di casa, come prima",
      nodi["g-chart"].innerHTML.indexOf('class="crow') >= 0 &&
      nodi["g-charthead"].textContent === "Top 10 della settimana",
      nodi["g-charthead"].textContent);
  }
}

/* I dialoghi della Sala devono tornare (punto 14 di `implementazioni.md`).
   La cosa segnalata: «in una conversazione in studio, alla domanda "mi presti
   il microfono", anche se gli dico di no l'amicizia aumenta». Era vero, e non
   era quella battuta lì: era la regola. Il bonus «hai capito che tipo è» (+1
   quando la risposta è quella giusta per il suo carattere) si sommava a
   **tutte** le risposte, comprese quelle che valgono zero o meno — così un
   rifiuto etichettato col carattere giusto diventava un passo avanti.

   Qui non si legge il codice: si gioca. Ogni situazione, per ogni risposta,
   contro ognuno dei quattro caratteri, chiamando la `poRispondi()` vera; e si
   guarda se il rapporto è salito. Una risposta che non è un passo verso di lui
   non deve **mai** farlo salire, qualunque carattere abbia davanti. */
console.log("\ni dialoghi della Sala: dire di no non è fare amicizia");
{
  const vm = require("vm");
  const zitto = () => {};
  const scatola = {
    console: { log: zitto, warn: zitto, error: zitto },
    Math, JSON, Object, Array, String, Number, Boolean, Date, Set, Map,
    parseInt, parseFloat, isNaN, isFinite,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      getElementById: () => finto(), querySelectorAll: () => [], addEventListener: zitto
    }
  };
  const finto = () => ({
    innerHTML: "", textContent: "", style: { setProperty: zitto }, dataset: {},
    classList: { add: zitto, remove: zitto, toggle: zitto, contains: () => false },
    addEventListener: zitto, querySelector: () => finto(), querySelectorAll: () => []
  });
  scatola.window = scatola;
  vm.createContext(scatola);

  let acceso = true, errore = null;
  try{
    for(const f of ["js/core.js", "js/game/state.js", "js/game/posto.js"])
      vm.runInContext(fs.readFileSync(path.join(RADICE, f), "utf8"), scatola, { filename: f });
    /* tutto quello che poRispondi tocca fuori da sé: qui non deve fare niente,
       serve solo che non esploda — quello che ci interessa è `p.pt` e `p.rel` */
    vm.runInContext(`
      G = START();
      SFX = { tap(){}, fanfare(){} };
      function toast(){} function pushLog(){} function save(){}
      function renderGioco(){} function renderPosto(){} function gain(){}
      function addLuc(){}
    `, scatola);
  }catch(e){ acceso = false; errore = e; }
  controlla("i dialoghi si caricano fuori dal browser", acceso, errore ? [errore.message] : []);

  if(acceso){
    const dentro = c => vm.runInContext(c, scatola);
    const DIALOGHI = dentro("DIALOGHI");
    const CARATTERI = dentro("CARATTERI").map(c => c.id);

    /* prima: sono scritti bene? */
    const storti = [];
    let situazioni = 0, risposte = 0;
    for(const ruolo of Object.keys(DIALOGHI)){
      const visti = new Set();
      for(const sit of DIALOGHI[ruolo]){
        situazioni++;
        if(visti.has(sit.t)) storti.push(ruolo + " · situazione ripetuta: " + sit.t);
        visti.add(sit.t);
        if(!sit.t || sit.o.length < 2) storti.push(ruolo + " · situazione monca: " + sit.t);
        for(const o of sit.o){
          risposte++;
          if(!o[0]) storti.push(ruolo + " · risposta senza testo: " + sit.t);
          if(!(o[1] >= -1 && o[1] <= 2)) storti.push(ruolo + " · punti fuori scala (" + o[1] + "): " + o[0]);
          if(o[2] != null && CARATTERI.indexOf(o[2]) < 0)
            storti.push(ruolo + " · carattere inventato (" + o[2] + "): " + o[0]);
        }
      }
    }
    controlla("ogni situazione e ogni risposta sono scritte per bene (" +
      situazioni + " situazioni, " + risposte + " risposte)", storti.length === 0, storti.slice(0, 8));

    /* poi: si gioca. Ogni risposta contro ogni carattere. */
    const saliti = [];
    let giocate = 0;
    for(const ruolo of Object.keys(DIALOGHI)){
      for(let s = 0; s < DIALOGHI[ruolo].length; s++){
        for(let i = 0; i < DIALOGHI[ruolo][s].o.length; i++){
          for(const car of CARATTERI){
            dentro(`
              G.gente = [{ id:"x", n:"Tizio", ruolo:${JSON.stringify(ruolo)}, car:${JSON.stringify(car)},
                           rel:1, pt:0, ult:-99, fama:30, via:false }];
              POSTO_PARLA = { p: G.gente[0], sit: DIALOGHI[${JSON.stringify(ruolo)}][${s}] };
              poRispondi(${i});
            `);
            giocate++;
            const p = dentro("G.gente[0]");
            const base = DIALOGHI[ruolo][s].o[i][1];
            /* un rifiuto (o una risposta che vale zero) non deve mai lasciare
               il rapporto più su di com'era: rel 1 e pt 0 di partenza */
            if(base <= 0 && (p.pt > 0 || p.rel > 1))
              saliti.push(ruolo + " · «" + DIALOGHI[ruolo][s].o[i][0] + "» (" + base +
                ", carattere " + car + ") → pt " + p.pt + ", rel " + p.rel);
          }
        }
      }
    }
    controlla("una risposta che vale zero o meno non fa mai salire l'amicizia (" +
      giocate + " conversazioni giocate)", saliti.length === 0, saliti.slice(0, 8));

    /* e la controprova: il bonus deve funzionare ancora dov'è giusto. Si parte
       da rel 1 (soglia 4) apposta: da rel 0 la soglia è 3, i punti la
       toccherebbero e verrebbero spesi per salire di gradino — giusto per il
       gioco, ma qui nasconderebbe il numero che stiamo guardando. */
    const beat0 = DIALOGHI.beatmaker[0];
    const buona = beat0.o.findIndex(o => o[1] > 0 && o[2]);
    dentro(`
      G.gente = [{ id:"x", n:"Tizio", ruolo:"beatmaker", car:${JSON.stringify(beat0.o[buona][2])},
                   rel:1, pt:0, ult:-99, fama:30, via:false }];
      POSTO_PARLA = { p: G.gente[0], sit: DIALOGHI.beatmaker[0] };
      poRispondi(${buona});
    `);
    const conBonus = dentro("G.gente[0].pt");
    controlla("ma con la risposta giusta il bonus «hai capito che tipo è» c'è ancora",
      conBonus === beat0.o[buona][1] + 1, "pt = " + conBonus + ", attesi " + (beat0.o[buona][1] + 1));
    controlla("e il carattere, indovinato, resta scoperto", dentro("G.gente[0].scoperto") === true);
  }
}

/* Le certificazioni dei pezzi (punto 13). La scala chiesta era scritta di
   corsa e non tornava — il diamante messo sotto al platino, e il platino
   definito con se stesso — quindi è stata rimessa nell'ordine che ha nel
   mondo tenendo i numeri dati. Proprio perché è un'interpretazione, il posto
   dove sta scritta nero su bianco è una prova: se un giorno si cambia idea,
   si cambia qui e si vede subito cosa si sta cambiando. */
console.log("\nle certificazioni dei pezzi");
{
  const vm = require("vm");
  const scatola = { console, Math, JSON, Object, Array, String, Number, Boolean, Date };
  scatola.window = scatola;
  vm.createContext(scatola);
  let acceso = true, errore = null;
  try{
    vm.runInContext(fs.readFileSync(path.join(RADICE, "js/game/content.js"), "utf8"),
      scatola, { filename: "content.js" });
  }catch(e){ acceso = false; errore = e; }
  controlla("le certificazioni si caricano", acceso, errore ? [errore.message] : []);

  if(acceso){
    const cert = n => vm.runInContext("certificazione(" + n + ")", scatola);
    const grad = n => vm.runInContext("gradinoDisco(" + n + ")", scatola);
    const nome = n => { const c = cert(n); return c ? c.etichetta : null; };

    controlla("sotto il mezzo milione un pezzo non è certificato",
      cert(0) === null && cert(499999) === null, nome(499999));
    controlla("mezzo milione è il disco d'oro", nome(500000) === "Disco d'oro", nome(500000));
    controlla("un milione è il disco di platino",
      nome(1000000) === "Disco di platino", nome(1000000));
    controlla("i multipli si contano: tre milioni sono 3× platino",
      nome(3000000) === "3× Disco di platino", nome(3000000));
    controlla("dieci volte il platino è il diamante",
      nome(10000000) === "Disco di diamante", nome(10000000));
    controlla("e il diamante non si moltiplica: sopra non c'è più niente da dire",
      nome(90000000) === "Disco di diamante", nome(90000000));

    /* il gradino serve al giro di settimana per dire «è successo adesso»:
       deve salire a ogni traguardo e non scendere mai */
    const tappe = [0, 499999, 500000, 999999, 1000000, 2000000, 3000000, 9999999, 10000000];
    let cresce = true, saliti = 0;
    for(let i = 1; i < tappe.length; i++){
      if(grad(tappe[i]) < grad(tappe[i - 1])) cresce = false;
      if(grad(tappe[i]) > grad(tappe[i - 1])) saliti++;
    }
    controlla("il gradino non torna mai indietro, e scatta a ogni traguardo",
      cresce && saliti === 6, "gradini saliti: " + saliti);
  }
}

/* Lo Studio (punti 10, 11, 12). Le quattro stanze si aprono davvero, e
   soprattutto: **la gente conosciuta alla Sala conta**. Un beatmaker con cui
   sei in confidenza ti fa un beat migliore e te lo fa pagare meno; un fonico
   dietro al banco alza il mix. Se quel legame si rompe — un `typeof` di
   troppo, un id che non combacia — lo Studio continua a disegnarsi benissimo
   e il gioco perde il suo motivo per tornare alla Sala, senza dire niente.
   Ecco perché si prova qui e non a occhio. */
console.log("\nlo Studio: la gente della Sala conta");
{
  const vm = require("vm");
  const zitto = () => {};
  const nodi = {};
  /* un DOM finto ma con le classi vere: `apriStudio` mette "on" e
     `renderStudio` non disegna niente se non la trova */
  function finto(){
    const cls = new Set();
    return {
      innerHTML: "", textContent: "", value: "", dataset: {}, hidden: false,
      style: { setProperty: zitto, removeProperty: zitto },
      classList: {
        add: c => cls.add(c), remove: c => cls.delete(c),
        contains: c => cls.has(c),
        toggle: (c, v) => (v === undefined ? (cls.has(c) ? cls.delete(c) : cls.add(c))
                                           : (v ? cls.add(c) : cls.delete(c)))
      },
      offsetWidth: 0, addEventListener: zitto, removeEventListener: zitto,
      querySelector: () => finto(), querySelectorAll: () => [], appendChild: zitto,
      set onclick(v){}, get onclick(){ return null; }
    };
  }
  const scatola = {
    console: { log: zitto, warn: zitto, error: zitto },
    Math, JSON, Object, Array, String, Number, Boolean, Date, Set, Map,
    parseInt, parseFloat, isNaN, isFinite, setTimeout: zitto, clearTimeout: zitto,
    localStorage: { getItem: () => null, setItem: zitto, removeItem: zitto },
    document: {
      getElementById: id => nodi[id] || (nodi[id] = finto()),
      querySelector: () => finto(), querySelectorAll: () => [], addEventListener: zitto,
      createElement: () => finto(), body: finto()
    }
  };
  scatola.window = scatola;
  vm.createContext(scatola);

  const sorgenti = ["js/core.js", "js/game/state.js", "js/game/content.js",
                    "js/game/actions.js", "js/game/beats.js", "js/game/covers.js",
                    "js/game/rivals.js", "js/game/scene-art.js", "js/game/phases.js",
                    "js/game/posto.js", "js/game/studio.js"];
  let acceso = true, errore = null;
  try{
    /* i pochi appigli fuori dai file caricati: non devono fare niente */
    vm.runInContext(`
      function toast(){} function pushLog(){} function save(){} function renderGioco(){}
      function gain(){} function addLuc(){} function totalWeeks(){ return G.week; }
      function chiediTitolo(){} function hubPronta(){ return {ok:true, perche:""}; }
      function hubAzione(){} function apriFoglio(){} function scegliModo(){}
      function offriBeat(){ return []; } function adfOggi(){ return 0; }
      SFX = { tap(){}, rec(){}, fanfare(){}, fail(){} };
    `, scatola);
    for(const f of sorgenti)
      vm.runInContext(fs.readFileSync(path.join(RADICE, f), "utf8"), scatola, { filename: f });
    vm.runInContext(`
      G = START();
      G.money = 5000; G.energy = 100; G.skills.rete = 20;
      window.ARTIST = { name: "Io", city: "Rovereto", genre: "trap", color: "#FF5A36" };
    `, scatola);
  }catch(e){ acceso = false; errore = e; }
  controlla("lo Studio si carica fuori dal browser", acceso, errore ? [errore.message] : []);

  if(acceso){
    const dentro = c => vm.runInContext(c, scatola);

    /* due persone conosciute alla Sala: un beatmaker in confidenza e un fonico */
    dentro(`
      G.gente = [
        { id:"bm", ruolo:"beatmaker", n:"Bit", gen:"trap", eta:24, fama:30, car:"pratico",
          scoperto:true, rel:2, pt:0, ult:-1, feat:-99, skin:"#C68A5C", hair:1, col:"#B026FF" },
        { id:"fo", ruolo:"fonico", n:"Gigi", gen:"", eta:40, fama:22, car:"aperto",
          scoperto:false, rel:3, pt:0, ult:-1, feat:-99, skin:"#E8B991", hair:0, col:"#3DC7FF" }
      ];
      apriStudio("beat");
    `);
    controlla("si apre, e la stanza dei beat elenca chi conosci",
      nodi["st-corpo"].innerHTML.indexOf("Bit") >= 0 &&
      nodi["st-corpo"].innerHTML.indexOf('data-beat="bm"') >= 0,
      nodi["st-corpo"].innerHTML.slice(0, 200));

    /* tutte e quattro le stanze si disegnano: una che esplode manderebbe giù
       lo Studio intero, e capiterebbe solo a chi ci clicca */
    const rotte = [];
    for(const s of ["beat", "cabina", "banco", "fuori"]){
      try{
        dentro('STUDIO_SEZ = ' + JSON.stringify(s) + '; renderStudio();');
        if(!nodi["st-corpo"].innerHTML) rotte.push(s + " (vuota)");
      }catch(e){ rotte.push(s + " — " + e.message); }
    }
    controlla("tutte e quattro le stanze si disegnano", rotte.length === 0, rotte);

    /* il beat su misura: costa, arriva in cartella, e porta il nome di chi l'ha fatto */
    const soldiPrima = dentro("G.money"), energiaPrima = dentro("G.energy");
    dentro("studioFattiUnBeat('bm')");
    const beats = dentro("G.beats");
    controlla("un beatmaker in confidenza ti fa un beat, e finisce in cartella",
      beats.length === 1 && beats[0].da === "Bit", JSON.stringify(beats));
    controlla("e costa: soldi ed energia scendono",
      dentro("G.money") < soldiPrima && dentro("G.energy") === energiaPrima - 20,
      "soldi " + soldiPrima + " → " + dentro("G.money") +
      ", energia " + energiaPrima + " → " + dentro("G.energy"));
    dentro("studioFattiUnBeat('bm')");
    controlla("ma uno a settimana: un beatmaker non è un distributore",
      dentro("G.beats").length === 1, dentro("G.beats").length + " beat");

    /* più siete in confidenza, meglio lo fa e meno lo fa pagare */
    const q0 = dentro("G.gente[0].rel = 0; studioBeatPrezzo(G.gente[0])");
    const q5 = dentro("G.gente[0].rel = 5; studioBeatPrezzo(G.gente[0])");
    controlla("da partner non te lo fa nemmeno pagare", q5 === 0 && q0 > 0,
      "conoscenza " + q0 + " € · partner " + q5 + " €");
    dentro("G.gente[0].rel = 1");
    const s1 = dentro("G.skills.rete = 0; G.gente[0].fama = 30; G.gente[0].rel = 1; studioBeatQualita(G.gente[0])");
    const s5 = dentro("G.gente[0].rel = 5; studioBeatQualita(G.gente[0])");
    controlla("e viene meglio: il rapporto vale qualità", s5 > s1, "rel 1 → q" + s1 + ", rel 5 → q" + s5);

    /* il fonico dietro al banco entra nell'economia vera, non in una sua */
    const mixSolo = dentro("mixGain()");
    dentro("studioScegliFonico('fo')");
    const mixCon = dentro("mixGain()");
    controlla("un fonico chiamato dallo Studio alza il mix di actions.js",
      mixCon === mixSolo + 6 && dentro("studioAiutoFonico()") === 6,
      "da solo " + mixSolo + ", con Gigi " + mixCon);
    dentro("studioScegliFonico('fo')");
    controlla("e si può rimandare a casa", dentro("mixGain()") === mixSolo,
      "mix " + dentro("mixGain()"));

    /* chi molla la scena non resta dietro a un banco */
    dentro("G.gente[1].via = true; studioScegliFonico('fo');");
    controlla("chi lascia il giro non lavora più in studio",
      dentro("studioFonico()") === null && dentro("mixGain()") === mixSolo);

    /* Qui c'era il guardiano della porta «Tutte le mosse della settimana →»:
       serviva perché senza quella porta restavano orfane scrivere le barre, la
       promo, il palco e i turni. Adesso l'elenco non esiste più e ognuna ha un
       posto suo — le barre nella cabina (il controllo qui sotto), il palco al
       Live Club, i turni in Pizzeria/Fabbrica/Centro per l'impiego — e la
       promo è entrata nello Studio, in «Fuori». Il guardiano resta, sulla
       cosa che adesso può davvero rompersi in silenzio: che la promo sia lì. */
    dentro("G.songs = [{t:'Uno', q:60, mixed:true, released:true, seed:1}]; STUDIO_SEZ = 'fuori'; renderStudio();");
    controlla("la promo ha un posto: sta nello Studio, in «Fuori»",
      nodi["st-corpo"].innerHTML.indexOf('data-az="promo"') >= 0,
      nodi["st-corpo"].innerHTML.slice(0, 200));
    dentro("G.bars = []; G.beats = []; STUDIO_SEZ = 'cabina'; renderStudio();");
    controlla("e senza strofa la cabina non è un vicolo cieco: si scrive da lì",
      nodi["st-corpo"].innerHTML.indexOf('data-az="scrivi"') >= 0,
      nodi["st-corpo"].innerHTML.slice(0, 200));
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
