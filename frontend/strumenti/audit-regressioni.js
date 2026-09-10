"use strict";
/* Test anti-regressione del Blocco 1.
   Eseguire da frontend/: node strumenti/audit-regressioni.js */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let ok = 0, no = 0;
function test(n, cond, d){
  if(cond){ ok++; console.log("  ok   " + n); }
  else { no++; console.log("  NO   " + n + (d ? " — " + d : "")); }
}
const leggi = p => fs.readFileSync(path.join(ROOT,p),"utf8");
function elencaFile(dir){
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? elencaFile(p) : [p];
  });
}

const build = leggi("strumenti/build.js");
const ev = leggi("js/game/eventi-v2.js");
const tel = leggi("js/game/telefono.js");
const chatjs = leggi("js/game/chat.js");
const actions = leggi("js/game/actions.js");
const posto = leggi("js/game/posto.js");
const studio = leggi("js/game/studio.js");
const studioEl = leggi("js/game/studio-elementi.js");
const studioElCss = leggi("css/studio-elementi.css");
const studioCss = leggi("css/studio.css");
const overlaysCss = leggi("css/overlays.css");
const effectsCss = leggi("css/effects.css");
const modal = leggi("js/game/modal.js");
const writer = leggi("js/game/writer.js");
const piazza = leggi("js/game/piazza.js");
const hub = leggi("js/game/hub.js");
const ui = leggi("js/game/ui.js");
const negozio = leggi("js/game/negozio.js");
const hours = leggi("js/game/orari.js");
const travel = leggi("js/game/spostamenti.js");
const crimeui = leggi("js/game/strada-crimine-ui.js");
const abilita = leggi("js/game/abilita.js");
const servizio = leggi("js/servizio.js");
const servizioCss = leggi("css/servizio.css");
const abilitaCss = leggi("css/abilita.css");
const cssCrimeV2 = leggi("css/strada-crimine-v2.css").replace(/\s+/g, " ");
const crimeuiPiatto = crimeui.replace(/\s+/g, "");
const crime = leggi("js/game/strada-crimine.js");
const state = leggi("js/game/state.js");
const sim = leggi("js/game/sim.js");
const skip = leggi("js/game/skip.js");
const transfers = leggi("js/game/trasferte.js");
const time = leggi("js/game/tempo.js");
const timeControls = leggi("js/game/tempo-controlli.js");
/* Punto 27: le pagine sono tre. «index» qui è la pagina del gioco, che è
   quella che tiene tutta l'impalcatura di cui parlano queste prove; la landing
   e la porta d'ingresso hanno le loro, più sotto. */
const index = leggi("pagine/gioco.html");
const landing = leggi("pagine/landing.html");
const accesso = leggi("pagine/accesso.html");
const porta = leggi("index.html");
const avvio = leggi("js/avvio.js");
const ingresso = leggi("js/gioco-ingresso.js");
/* Stessa riga letta con gli spazi appiattiti: la prova qui sotto guarda
   COSA fa il codice, non su quante righe sta scritto. Andare a capo per
   leggibilita' non e' una regressione, e non deve far suonare l'allarme. */
const ingressoPiatto = ingresso.replace(/\s+/g, "");
const agenda = leggi("js/game/agenda.js");
const jailBg = leggi("js/game/jail-backgrounds.js");
const menuSystem = leggi("js/menu-sistema.js");
const cat = JSON.parse(leggi("js/game/eventi-master-1000-v1.2.13.json"));
const pkg = JSON.parse(leggi("package.json"));
const verifyBuild = leggi("strumenti/verifica-build.js");
const ciWorkflow = fs.readFileSync(path.resolve(ROOT,"..",".github","workflows","verifica-gioco.yml"),"utf8");

console.log("\nCI / build — verifica automatica");
test("package espone un comando verifica unico",
  pkg.scripts && pkg.scripts.verifica &&
  pkg.scripts.verifica.includes("npm run prova") &&
  pkg.scripts.verifica.includes("node strumenti/audit-regressioni.js") &&
  pkg.scripts.verifica.includes("npm run verifica:build"));
test("verifica build produce sia store sia demo e poi controlla dist",
  pkg.scripts && pkg.scripts["verifica:build"] &&
  pkg.scripts["verifica:build"].includes("npm run build") &&
  pkg.scripts["verifica:build"].includes("npm run demo") &&
  pkg.scripts["verifica:build"].includes("node strumenti/verifica-build.js"));
/* Punto 27: i bundle non sono più due ma due per pagina, e il nome se lo
   porta dietro dalla pagina («gioco-3f2a91c4.js», «landing-...»). Il
   verificatore deve controllarli pagina per pagina. */
test("verificatore dist controlla bundle, catalogo, media e demo",
  verifyBuild.includes('"^assets/"+p.nome+"-[0-9a-f]{8}') &&
  verifyBuild.includes('pagine/gioco.html') &&
  verifyBuild.includes("eventi-master-1000-v1.2.13.json") &&
  verifyBuild.includes('exists("media")') &&
  verifyBuild.includes("window.__ADF_EVENT_CATALOG__="));
test("GitHub Actions esegue la verifica su push e pull request",
  ciWorkflow.includes("push:") &&
  ciWorkflow.includes("pull_request:") &&
  ciWorkflow.includes("run: npm run verifica"));
test("CI usa npm ci con Node 20 e cache del lockfile frontend",
  ciWorkflow.includes("actions/setup-node@v4") &&
  ciWorkflow.includes("node-version: 20") &&
  ciWorkflow.includes("run: npm ci") &&
  ciWorkflow.includes("frontend/package-lock.json"));
test("workflow di verifica è read-only sul repository",
  ciWorkflow.includes("permissions:") &&
  ciWorkflow.includes("contents: read") &&
  !ciWorkflow.includes("contents: write"));

console.log("\nBlocco 1 — Eventi V2 / telefono / dist");
test("catalogo contiene esattamente 1000 eventi", Array.isArray(cat) && cat.length === 1000);
test("build demo incorpora il catalogo", build.includes("window.__ADF_EVENT_CATALOG__"));
test("build store copia il JSON in dist/assets", build.includes("fs.copyFileSync(CATALOGO_EVENTI_V2"));
test("Eventi V2 supporta script inline file://", ev.includes("ADF_SCRIPT_SRC") && ev.includes("|| location.href"));
test("Eventi V2 usa il catalogo inline quando presente", ev.includes("ADF_INLINE_CATALOG") && ev.includes("__ADF_EVENT_CATALOG__"));
const install = ev.indexOf("adfInstallNotificationApp();");
const load = ev.indexOf("const ADF_CATALOG_LOAD");
test("Notifiche viene installata prima del caricamento catalogo", install >= 0 && load >= 0 && install < load);
test("Messaggi ha uno store diretto separato", tel.includes("function telMessaggiDiretti()"));
test("badge Messaggi non legge G.log", !tel.includes('badge:g => Math.max(0, g.log.length'));
/* L'app Messaggi non c'e' piu': elencava le stesse conversazioni di Chat con
   meno roba dentro. La garanzia pero' resta la stessa e si e' spostata su
   Chat, che e' l'unica lista di conversazioni rimasta: le persone che ti
   scrivono, mai il diario G.log. */
test("l'app Messaggi non e' tornata a fare il doppione di Chat",
  !tel.includes('id:"messaggi"') && !tel.includes("function schermataMessaggi()"));
const s0 = chatjs.indexOf("function schermataChat()");
const s1 = chatjs.indexOf("function schermataChatThread()", s0);
const msgScreen = s0 >= 0 && s1 > s0 ? chatjs.slice(s0,s1) : "";
test("schermata Chat non legge G.log", !!msgScreen && !msgScreen.includes("G.log"));
test("da Messaggi si entra nella Chat vera", tel.includes('TEL_APP = "chat"; TEL_CHAT_APERTA = chatOpen.dataset.chat'));

const mv0 = tel.indexOf("function renderTelefonoVecchio()");
const mv1 = tel.indexOf("/* ================= RENDER — HOME NUOVA", mv0);
const mobilePhone = mv0 >= 0 && mv1 > mv0 ? tel.slice(mv0,mv1) : "";
test("telefono sotto 1180 usa messaggi diretti e non G.log",
  mobilePhone.includes("telMessaggiDiretti().slice(0, 2)") &&
  mobilePhone.includes("telMessaggiNonLetti()") &&
  !mobilePhone.includes("G.log"));
test("anteprima mobile apre il thread Chat vero",
  mobilePhone.includes('data-chat="') &&
  mobilePhone.includes("m.id") &&
  tel.includes('TEL_APP = "chat"; TEL_CHAT_APERTA = chatOpen.dataset.chat'));
test("telefono compatto può aprire la stessa schermata Chat del PC",
  tel.includes('data-telapp="chat"') &&
  tel.includes("(TEL_APP ? schermataWrap(TEL_APP) : '')") &&
  /* «via il quaderno»: renderTelefono() non può più uscire con un return
     secco — dopo aver ridisegnato deve riprendersi dal magazzino il
     contenitore della schermata aperta (classifica, discografia, contratti).
     Lo smistamento fra telefono compatto e da PC è lo stesso di prima. */
  tel.includes('if(!telPC()) renderTelefonoVecchio();') &&
  tel.includes('riempiSlotTelefono();'));
test("G.log mobile è esplicitamente Notifiche",
  tel.includes('{id:"notifiche", n:"Notifiche"') &&
  tel.includes('g.log.length - (g.seenLog || 0)') &&
  /* punto 7: il bottone «Diario» non c'è più, il telefono chiama la funzione
     invece di simulare un click su un elemento che non esiste. */
  tel.includes('openDiary()'));
test("Vedi tutte le chat non apre più il Diario",
  mobilePhone.includes('data-telapp="chat"') &&
  !mobilePhone.includes('data-diario="1">Vedi tutti i messaggi'));
test("Escape chiude una app anche sotto 1180",
  tel.includes('if(ev.key === "Escape" && TEL_APP) telHome();') &&
  !tel.includes('if(ev.key === "Escape" && TEL_APP && telPC())'));

console.log("\nAgenda — disponibilità reale");
test("Agenda combina requisiti base e guardia runtime",
  tel.includes("function telAgendaAzione(id)") &&
  tel.includes("const base=hubPronta(id)") &&
  tel.includes("GAME_TRAVEL.actionAccess(id)"));
test("Agenda traduce luogo, orari, fine giornata e mossa pendente",
  tel.includes('gate.reason === "wrong-place"') &&
  tel.includes('gate.reason === "hours"') &&
  tel.includes('gate.reason === "day-end"') &&
  tel.includes('gate.reason === "action-pending"'));
test("eventi Agenda rispettano gli orari reali",
  tel.includes("function telAgendaEvento(e)") &&
  tel.includes("GAME_HOURS.eventStatus(e.id)") &&
  tel.includes("telAgendaEventText(st)"));
test("schermata Agenda usa i nuovi stati per eventi e mosse",
  tel.includes("const st = telAgendaEvento(e)") &&
  tel.includes("const pronto = telAgendaAzione(a.id)") &&
  tel.includes("(st.ok ? e.d : st.perche)") &&
  tel.includes("(pronto.ok ? a.d : pronto.perche)"));
test("contatore Agenda compatta conta solo mosse eseguibili ora",
  tel.includes('sotto:() => telAgendaDisponibili() + " mosse ora"') &&
  tel.includes("function telAgendaDisponibili()"));
test("Agenda non usa più hubPronta da solo nel renderer",
  (() => {
    const a0=tel.indexOf("function schermataAgenda()");
    const a1=tel.indexOf("/* ---- Impostazioni",a0);
    const body=a0>=0&&a1>a0?tel.slice(a0,a1):"";
    return !!body && !body.includes("hubPronta(") &&
      body.includes("telAgendaAzione(") && body.includes("telAgendaEvento(");
  })());

console.log("\nBlocco 2 — recupero / scrittura");
test("contatore giornaliero usa anno:settimana:giorno",
  actions.includes('return [Number(G.year||1), Number(G.week||1), Number(G.day||1)].join(":")'));
test("massimo 2 strofe completate al giorno",
  actions.includes("const ADF_MAX_SCRITTURE_GIORNO = 2") &&
  actions.includes('adfOggi("scrivi") >= ADF_MAX_SCRITTURE_GIORNO'));
test("una strofa conta solo quando viene realmente chiusa",
  writer.includes('adfSegnaOggi("scrivi")'));
test("Stacca la spina si blocca dopo due usi",
  actions.includes('adfOggi("stacca") >= 2 ? "TORNARE DOMANI"'));
test("Stacca la spina non usa più il vecchio +20/+32",
  !actions.includes("rnd(20,32)") && actions.includes("rnd(10,15)") && actions.includes("rnd(3,6)"));
test("Stacca la spina non genera più hype casuale",
  !actions.includes('Math.random() < .18){ G.hype = clamp(G.hype+5'));
test("scrittura automatica veloce parte più bassa",
  actions.includes("(22 + G.skills.scrittura*0.65)"));
test("fattore Scrittura 5 è circa 31,6%, non 52,5%",
  writer.includes("0.28 + s * 0.0072") &&
  Math.abs((0.28 + 5*0.0072) - 0.316) < 1e-9);
test("vecchio fattore 0,5 + skill/200 rimosso",
  !writer.includes("0.5 + G.skills.scrittura/100 * 0.5"));

console.log("\nPunto 2 - Promo con saturazione");

test("nuova carriera inizializza la memoria saturazione Promo",
  state.includes('promoSaturation:{key:"", baseFans:0, pctUsed:0}'));

test("Promo ha rendimenti giornalieri decrescenti",
  actions.includes("const ADF_PROMO_DAILY_MULT = Object.freeze([1, 0.5, 0.2])") &&
  actions.includes("const ADF_PROMO_DAILY_FLOOR = 0.1") &&
  actions.includes("function promoDailyMult()"));

test("ogni Promo completata viene contata nel giorno",
  actions.includes('adfSegnaOggi("promo")'));

test("la componente percentuale Promo ha cap settimanale 1,5%",
  actions.includes("const ADF_PROMO_WEEKLY_PCT_CAP = 0.015") &&
  actions.includes("const pctGain = Math.min(pctWanted, pctBudget)"));

test("il cap usa i fan di partenza della settimana",
  actions.includes("baseFans:Math.max(0, Number(G.fans||0))") &&
  actions.includes("p.baseFans * ADF_PROMO_WEEKLY_PCT_CAP"));

test("la vecchia formula percentuale illimitata e rimossa",
  !actions.includes("Math.round((G.fans*0.012 + rnd(4,24)) * RITMO)"));

{
  const vmPromo = require("vm");

  let promoErr = null;
  let promoGains = [];
  let promoCapOk = false;
  let promoResetOk = false;

  try{
    const mathPromo = Object.create(Math);
    mathPromo.random = () => 0.5;

    const box = {
      console,
      Math:mathPromo,
      JSON,Object,Array,String,Number,Boolean,Date,
      parseInt,parseFloat,isNaN,

      clamp:(v,a,b) => Math.max(a, Math.min(b,v)),
      rnd:(a,b) => (a+b)/2,

      G:{
        year:1,
        week:1,
        day:1,

        fans:10000,
        hype:0,
        wellbeing:80,

        skills:{
          scrittura:0,
          flow:0,
          presenza:0,
          rete:0
        },

        songs:[{released:true}],
        bars:[],
        beats:[],
        gear:{},

        adfDailyActions:null,
        promoSaturation:{
          key:"",
          baseFans:0,
          pctUsed:0
        }
      }
    };

    box.window = box;
    vmPromo.createContext(box);

    vmPromo.runInContext(actions, box, {
      filename:"actions.js"
    });

    const promo = vmPromo.runInContext(
      'ACTIONS.find(a => a.id === "promo")',
      box
    );

    /* Quattro Promo consecutive nello stesso giorno. */
    for(let i=0; i<4; i++){
      const prima = box.G.fans;
      promo.run();
      promoGains.push(box.G.fans - prima);
    }

    /* Continuiamo a promuovere nei giorni successivi. */
    for(let d=2; d<=7; d++){
      box.G.day = d;
      promo.run();
    }

    const cap =
      box.G.promoSaturation.baseFans * 0.015;

    promoCapOk =
      box.G.promoSaturation.pctUsed <= cap + 1e-9 &&
      Math.abs(
        box.G.promoSaturation.pctUsed - cap
      ) < 1e-9;

    /* Nuova settimana: nuovo budget. */
    box.G.week = 2;
    box.G.day = 1;

    const fansPrima =
      box.G.fans;

    promo.run();

    promoResetOk =
      box.G.promoSaturation.key === "1:2" &&
      box.G.promoSaturation.baseFans === fansPrima &&
      box.G.promoSaturation.pctUsed > 0;

  }catch(e){
    promoErr = e;
  }

  test(
    "runtime: prima, seconda, terza e quarta Promo rendono sempre meno",
    !promoErr &&
    promoGains.length === 4 &&
    promoGains[0] > promoGains[1] &&
    promoGains[1] > promoGains[2] &&
    promoGains[2] > promoGains[3],
    promoErr
      ? promoErr.message
      : promoGains.join(" > ")
  );

  test(
    "runtime: spam Promo non supera il budget percentuale settimanale",
    !promoErr && promoCapOk,
    promoErr ? promoErr.message : null
  );

  test(
    "runtime: nuova settimana crea un nuovo budget Promo",
    !promoErr && promoResetOk,
    promoErr ? promoErr.message : null
  );
}


console.log("\nPunto 3 - tempo reale Sala / Studio");

test("GAME_TIME espone gate e consumo per azioni custom",
  time.includes("function puoSpendere(minuti)") &&
  time.includes("function spendi(minuti,source,opts)") &&
  time.includes("canSpend:puoSpendere") &&
  time.includes("spend:spendi"));

{
  const vmClock=require("vm");
  let clockErr=null;
  let clockOk=false;

  try{
    const box={
      console,Math,JSON,Object,Array,String,Number,Boolean,Date,
      parseInt,parseFloat,isNaN,
      setTimeout:()=>0,
      clearTimeout:()=>{},
      setInterval:()=>0,
      clearInterval:()=>{},
      G:{
        year:1,week:1,day:1,
        energy:100,maxEnergy:100,
        timeMinutes:480,
        timeRuntime:{}
      },
      document:{
        addEventListener:()=>{},
        getElementById:()=>null,
        querySelectorAll:()=>[],
        createElement:()=>({}),
        head:{appendChild:()=>{}}
      },
      CustomEvent:function(type,opts){
        this.type=type;
        this.detail=opts&&opts.detail;
      }
    };

    box.window=box;
    box.addEventListener=()=>{};
    box.dispatchEvent=()=>{};

    vmClock.createContext(box);
    vmClock.runInContext(time,box,{filename:"tempo.js"});

    const prima=box.GAME_TIME.canSpend(60);
    box.GAME_TIME.spend(45,"audit");
    const dopo=box.G.timeMinutes;

    box.G.timeMinutes=1650;
    const tardi=box.GAME_TIME.canSpend(60);

    clockOk=
      prima.ok===true &&
      dopo===525 &&
      tardi.ok===false &&
      tardi.reason==="day-end" &&
      tardi.remaining===30;

  }catch(e){
    clockErr=e;
  }

  test("runtime: spend avanza esatto e non tronca una mossa alle 04:00",
    !clockErr && clockOk,
    clockErr ? clockErr.message : null);
}

test("La Sala dichiara una durata per ogni interazione di progresso",
  posto.includes("parla:30") &&
  posto.includes("numero:15") &&
  posto.includes("beat:60") &&
  posto.includes("sessione:180") &&
  posto.includes("mix:120") &&
  posto.includes("feat:180") &&
  posto.includes("video:240") &&
  posto.includes("intervista:60"));

test("i bottoni della Sala mostrano e rispettano il costo tempo",
  posto.includes("const gate=poTempoGate(tipo)") &&
  posto.includes("const puo=!!pronto && gate.ok") &&
  posto.includes("poTempoCosto(tipo,costo)"));

test("Fatti due parole usa il clock reale",
  posto.includes('if(poTempoBlocca("parla")) return;') &&
  posto.includes('poTempoAvanza("parla")'));

test("le altre azioni della Sala passano tutte dal gate e poi avanzano il tempo",
  posto.includes('if(tipo !== "parla"){') &&
  posto.includes("Object.prototype.hasOwnProperty.call(PO_TEMPO,tipo)") &&
  posto.includes('if(tipo !== "parla") poTempoAvanza(tipo);'));

test("il beat su misura dello Studio costa due ore reali",
  studio.includes("const STUDIO_BEAT_MINUTI = 120") &&
  studio.includes("studioBeatTempoGate()") &&
  studio.includes("studioBeatTempoAvanza()") &&
  studio.includes('"studio-beat-custom"'));

test("le ACTION standard dello Studio non vengono addebitate due volte",
  (() => {
    const a=studio.indexOf("function studioAzione(id)");
    const body=a>=0 ? studio.slice(a,a+500) : "";
    return body.includes("hubAzione(id)") &&
      !body.includes("GAME_TIME.spend");
  })());

/* =====================================================   Punto 4 di CARLO, seconda meta': «ricrea la schermata identica alle foto
   con elementi HTML». Le quattro schermate di riferimento dello Studio
   avevano dentro delle cose che il codice non disegnava — le schede dei
   beat, le take, i cursori del banco, il QUANDO. Adesso ci sono, e stanno
   in js/game/studio-elementi.js.

   Queste prove non guardano se sono belle: guardano che le tre cose nuove
   **non regalino niente**, che era la promessa scritta in cima al file. Se
   qualcuno un giorno alza un numero senza accorgersene, qui si ferma.
   ============================================================ */
console.log("\nPunto 4 — gli elementi dentro alle schermate dello Studio");

test("gli elementi dello Studio stanno in un file loro, caricato dopo studio.js",
  index.includes('js/game/studio-elementi.js') &&
  index.indexOf('js/game/studio-elementi.js') > index.indexOf('js/game/studio.js') &&
  index.includes('css/studio-elementi.css'));

test("la prima take e' lo stesso tiro di dado che registra faceva da sola",
  studioEl.includes("d.take = {k, l:[Math.round(rnd(-5, 6))], s:0}") &&
  actions.includes("typeof studioTakePresa === \"function\" ? studioTakePresa() : rnd(-5,6)") &&
  /* e chi non ha take in corso ricade sullo stesso dado */
  studioEl.includes("if(!d || !d.l || !d.l.length) return rnd(-5, 6);"));

test("una take in piu' si paga in energia, e non e' gratis",
  studioEl.includes("const STUDIO_TAKE_ENERGIA = 12") &&
  studioEl.includes("G.energy -= STUDIO_TAKE_ENERGIA") &&
  studioEl.includes("if(G.energy < STUDIO_TAKE_ENERGIA)") &&
  studioEl.includes("const STUDIO_TAKE_MAX = 6"));

test("i cursori del banco partono al centro e al centro valgono zero",
  studioEl.includes("d.banco = {voce:2, bassi:2, aria:2}") &&
  /* il carattere di ripiego, quello dei cursori fermi in mezzo, non da' punti */
  /PULITO",\s*q:0/.test(studioEl) &&
  actions.includes("+ studioBonus() + bancoBonus()"));

test("nessun carattere del banco vale piu' di tre punti, in su o in giu'",
  (() => {
    const q = (studioEl.match(/n:"[A-Z]+",\s*q:(-?\d+)/g) || [])
      .map(x => Number(x.split("q:")[1]));
    return q.length >= 10 && q.every(v => v >= -3 && v <= 3);
  })());

test("un pezzo in cassaforte non esce per sbaglio dalla plancia",
  actions.includes("ready().filter(s => !s.tenuto)") &&
  actions.includes("need:() => ready().some(s => !s.tenuto)") &&
  studio.includes("typeof studioPronti === \"function\" ? studioPronti() : ready()") &&
  studioEl.includes("return ready().filter(s => !s.tenuto);"));

test("le uscite messe in coda per venerdi' scattano da sole, dopo il giro di settimana",
  studioEl.includes("function studioUscitePronte()") &&
  sim.includes("if(typeof studioUscitePronte === \"function\") studioUscitePronte();") &&
  /* dopo advanceWeek(), se no il pezzo risulta uscito nella settimana sbagliata */
  sim.indexOf("advanceWeek();") < sim.indexOf("studioUscitePronte()") &&
  studioEl.includes("const STUDIO_VENERDI_HYPE = 4"));

test("la stima degli stream e' la formula vera di sim.js, non un numero inventato",
  studioEl.includes("Math.pow(Math.max(0, q - 26) / 74, 2.6) * (35 + G.hype * 13) * push") &&
  sim.includes("Math.pow(Math.max(0, s.q - 26)/74, 2.6) * (35 + G.hype*13) * push"));

test("la strofa e il beat che si incidono sono quelli scelti in cabina",
  actions.includes("const daIncidere = ()") &&
  actions.includes("const beatDaIncidere = ()") &&
  !/registra[\s\S]{0,900}?const b = bestBar\(\), bt = bestBeat\(\);/.test(actions) &&
  studioEl.includes("function studioStrofa()") &&
  studioEl.includes("function studioBeatSuCui()"));

test("il tema del foglio lo sceglie lo Studio, e senza scelta resta il tiro a caso",
  writer.includes("typeof studioTemaScelto === \"function\" ? studioTemaScelto() : null") &&
  writer.includes("scelto || pick(TEMI)") &&
  studioEl.includes("function studioTemaScelto()"));

test("comprare un beat dal banco e' scritto una volta sola, non due",
  studioEl.includes("function prendiBeatDalBanco(b)") &&
  posto.includes("prendiBeatDalBanco(b)") &&
  /* la vecchia copia dentro a posto.js non c'e' piu'. Si guarda la riga che
     mette il beat in cartella, non lo `splice`: quello resta, perche' La
     Sala ha anche il tasto per **lasciarlo li'**, che toglie il beat dal
     banco senza comprarlo ed e' un'altra cosa. */
  !posto.includes("G.beats.push({n:b.n"));

/* Gli attributi `data-` sono globali quanto le variabili, e `eventi-v2.js`
   ascolta i click su **tutto il documento**: un attributo riusato non rompe
   niente di visibile, spara solo l'evento sbagliato in silenzio. È già
   successo con `data-compra`, che il tasto «Compralo» dello Studio si era
   preso dal guardaroba: ogni beat comprato raccontava al motore degli eventi
   che ti eri comprato una felpa. */
test("gli attributi dello Studio non rubano il nome a quelli che ascolta tutto il documento",
  (() => {
    /* quelli che eventi-v2 intercetta a livello di documento */
    const suoi = (ev.match(/closest\("\[data-([a-z-]+)\]"\)/g) || [])
      .map(x => x.replace(/.*data-([a-z-]+).*/, "$1"));
    /* quelli che lo Studio si e' inventato in questa task */
    const miei = ["stcompra","bcard","bplay","take","tplay","ancora","ascolta",
                  "quando","manda","riprendi","vesti","curs","tema","strofa","incide"];
    const rubati = miei.filter(m => suoi.indexOf(m) >= 0);
    if(rubati.length) console.log("      nomi in comune: " + rubati.join(", "));
    return rubati.length === 0 &&
      /* e nessuno di loro e' rimasto scritto come `data-compra` */
      !studioEl.includes('"[data-compra]"') && !studio.includes(' data-compra=');
  })());

/* Il giro di fine task del 08/09/2026 (documentazione/problemi-riscontrati.md)
   ha trovato queste cose sulla roba nuova dello Studio. Sistemate: qui restano
   le prove, che sono l'unico modo perche' non tornino. */
test("la take vale solo per la strofa e il beat su cui l'hai pagata",
  /* la targhetta si guarda anche al momento di registrare, non solo in cabina */
  studioEl.includes("const mia = d.k === studioTakeChiave();") &&
  studioEl.includes("if(!mia) return rnd(-5, 6);") &&
  /* ed e' fatta coi numeri di serie: due strofe stesso tema e stesso voto
     erano la stessa cosa per la riga di prima */
  studioEl.includes('return studioBarraSeme(b) + "|" + beatSeed(bt);'));

test("muovere un cursore del banco non ridisegna la pagina sotto al dito",
  studioEl.includes("function studioBancoMuovi(k, v, nodo)") &&
  studioEl.includes("if(!nodo){ renderStudio(); return; }") &&
  studioEl.includes("function studioBancoRitocca(input, k, v)") &&
  studioEl.includes("studioBancoMuovi(c.dataset.curs, c.value, c)") &&
  /* e il riquadro del risultato lo ritocca guardando **lo stesso** provino
     che guarda la sezione: `studioDaMixare()` da solo torna null finche' non
     ne scegli uno a mano, e il riquadro restava fermo sul carattere di prima */
  studioEl.includes("function studioProvino()") &&
  studioEl.includes("const s = studioProvino();"));

test("dopo il cassetto il tasto d'oro torna a «Mandalo fuori»",
  (() => {
    const a = studioEl.indexOf('if(q === "cassetto")');
    const corpo = a >= 0 ? studioEl.slice(a, a + 700) : "";
    return corpo.includes('studioDati().quando = "subito";');
  })());

test("la cassaforte funziona anche sui pezzi di un salvataggio senza numero di serie",
  studioEl.includes("function studioPezzoSeme(s)") &&
  studioEl.includes("(G.songs || []).find(x => studioPezzoSeme(x) === seed)") &&
  studio.includes("data-riprendi=\"' + studioPezzoSeme(x) + '\"") &&
  studio.includes("data-vesti=\"' + studioPezzoSeme(s) + '\""));

test("la stima degli stream tiene conto del tetto della fase, come fa sim.js il lunedi'",
  studioEl.includes("const cap = PHASES[G.phase].cap;") &&
  studioEl.includes("return Math.max(0, Math.round(v * ((cap + (tot - cap) * 0.2) / tot)));") &&
  studioEl.includes("min: tetto(") && studioEl.includes("max: tetto("));

test("l'uscita di venerdi' costa la lucidita' come quella mandata fuori a mano",
  (() => {
    const a = studioEl.indexOf("function studioUscitePronte()");
    const corpo = a >= 0 ? studioEl.slice(a, a + 1400) : "";
    return corpo.includes('if(typeof addLuc === "function") addLuc(-1);');
  })());

test("la scheda del beat scelta si salva, come tutte le altre scelte dello Studio",
  (() => {
    const a = studioEl.indexOf("function studioBeatSegna(seed)");
    const corpo = a >= 0 ? studioEl.slice(a, a + 400) : "";
    return corpo.includes("save();");
  })());

test("il tondo per ascoltare e «cambia copertina» si toccano a 44 punti",
  studioElCss.includes("width:44px;height:44px;margin:-22px 0 0 -22px") &&
  /\.stlink\{[^}]*min-height:44px/.test(studioElCss));

/* La barra a tacche serve a confrontare le take a colpo d'occhio: se la
   casella del «← buona» collassa, la riga senza targhetta regala una
   sessantina di punti di larghezza alla sua barra e il confronto diventa
   falso — una q85 sembrava più corta di una q71. La casella si stringe con lo
   schermo, ma a zero non ci va **mai**. */
/* I blocchi stretti stanno in `css/stretto.css` dal 08/09/2026, non piu' nel
   foglio di ognuno: la prova guarda tutti e due i posti, cosi' regge sia se il
   blocco resta li' sia se un domani torna a casa sua. */
const cssStretti = studioElCss + leggi("css/stretto.css");
test("la casella del «← buona» non collassa: le barre delle take restano confrontabili",
  !/\.sttakeb\{min-width:0\}/.test(cssStretti.replace(/\s+/g, "")) &&
  /\.sttakeb\{min-width:56px/.test(cssStretti) &&
  /\.sttakeb\{min-width:50px/.test(cssStretti));

/* A 360 punti la nav globale si prende 210 punti fissi e i tre numeri della
   fascia ne vogliono quasi 190: su una riga sola l'ora finiva fuori dallo
   schermo e si leggeva «09:». Sotto i 480 la fascia va su due righe, e
   `--stAlta` deve crescere con lei se no le colonne ci finiscono dentro. */
test("sotto i 480px la fascia dello Studio va su due righe e l'ora resta dentro",
  (() => {
    const css = leggi("css/studio.css") + leggi("css/stretto.css");
    const a = css.indexOf("@media (max-width:480px)");
    if(a < 0) return false;
    const corpo = css.slice(a, a + 700);
    return corpo.includes("--stAlta:80px") &&
      corpo.includes("flex-wrap:wrap") &&
      /#studio \.strisorse\{flex:1 1 100%/.test(corpo);
  })());

test("dentro alle schede dei beat e alle take non ci sono bottoni annidati",
  !studioEl.includes('<button type="button" class="stbcard') &&
  !studioEl.includes('<button type="button" class="sttakeriga') &&
  studioEl.includes('role="button" tabindex="0"') &&
  /* e chi non e' piu' un bottone si prende lo stesso con la tastiera */
  studioEl.includes('addEventListener("keydown"'));

/* La stima del primo anno sotto alle offerte di contratto usava `my`, che in
   quella funzione non e' mai esistito: era definito seicento righe piu' sotto,
   dentro a chartDiCasa(). renderGioco() si piantava — schermata «Il gioco si e'
   fermato» — appena arrivavi ai 1500 fan della prima offerta senza aver
   firmato. Non lo prendeva nessuna prova perche' e' una riga dentro a una
   `map()` che gira solo quando quell'elenco non e' vuoto. */
console.log("\nLe offerte di contratto: la stima non usa una variabile che non c'e'");
test("gli stream della settimana si calcolano in un posto solo, e i due che li usano lo chiamano",
  ui.includes("const streamSettimana = () =>") &&
  ui.includes("streamSettimana() * 52 * 0.0055 * o.share * o.push + o.advance") &&
  ui.includes("const my = streamSettimana();"));

test("dentro a renderGioco non e' rimasto nessun `my` senza padrone",
  (() => {
    const a = ui.indexOf("function renderGioco");
    const b = ui.indexOf("function chartDiCasa");
    if(a < 0 || b < 0 || b < a) return false;
    const corpo = ui.slice(a, b);
    /* `my` usato come variabile, non come pezzo di un'altra parola */
    const usi = corpo.match(/(^|[^\w.$])my([^\w]|$)/g) || [];
    if(usi.length) console.log("      `my` compare ancora " + usi.length + " volte");
    return usi.length === 0;
  })());

console.log("\nBlocco 3 — carcere separato");
test("hub manda il detenuto alla schermata Carcere",
  hub.includes('G.strada && G.strada.arresto && typeof apriCarcere === "function"'));
test("orari non bloccano il carcere alle 08:00",
  hours.includes('place === "crimin" && G.strada && G.strada.arresto') &&
  hours.includes('jail:true'));
test("esiste una UI Carcere separata dal root criminale",
  crimeui.includes('function ensureJail()') &&
  crimeui.includes('jail.id="adf-jail"') &&
  crimeui.includes('window.apriCarcere=openJail'));
test("apriStrada reindirizza al carcere se detenuto",
  crimeui.includes('function open(){if(street().arresto)return openJail();'));
test("dopo l'esito Arrestato parte la transizione e non l'apertura secca",
  crimeui.includes('if(street().arresto&&!STRADA_SCENA){playArrestTransition()}') &&
  !crimeui.includes('if(street().arresto&&!STRADA_SCENA){close();openJail()}'));
test("la UI carcere usa la pena esistente, non una seconda condanna",
  crimeui.includes('const a=street().arresto;') &&
  crimeui.includes('Number(a.settimane)') &&
  !crimeui.includes('carcereSettimane'));


test("transizione arresto ha almeno dieci frasi e varianti contestuali",
  crimeui.includes("const JAIL_ARREST_PHRASES = [") &&
  crimeui.includes('["Ti hanno","bevuto."]') &&
  crimeui.includes('["Ti hanno","fatto."]') &&
  crimeui.includes('["Ti hanno messo","al fresco."]') &&
  crimeui.includes('["Non l\'hai fatta","franca."]') &&
  crimeui.includes('["Di nuovo","dentro."]') &&
  crimeui.includes('["Era solo questione","di tempo."]'));

test("transizione usa nero pieno, timing suspense e font del Carcere",
  crimeui.includes('await jailWait(reduced?90:2500)') &&
  crimeui.includes('await jailWait(reduced?260:3400)') &&
  crimeui.includes('font-family:"Big Shoulders Stencil Display","League Gothic",Impact,sans-serif') &&
  crimeui.includes('font-size:clamp(86px,10vw,190px)') &&
  crimeui.includes('line-height:.72') &&
  crimeui.includes('letter-spacing:-.025em'));

test("carcere è esclusivo: niente ritorno mappa e il listener locale non lo chiude con Escape",
  !crimeui.includes('id="adf-jail-exit"') &&
  crimeui.includes('if(street().arresto&&!force)return false') &&
  crimeui.includes('if(street().arresto)return;'));

test("nuovo menu di sistema riconosce il carcere e blocca Mappa",
  menuSystem.includes('if(document.querySelector("#adf-jail.on")) return "jail";') &&
  menuSystem.includes('if(hostAttivo() === "jail" || hostAttivo() === "hub"'));

/* Punto 27: il controllo non sta più in js/avvio.js — la landing non fa più
   entrare nessuno, cambia pagina. Adesso è la pagina del gioco a guardare,
   appena si apre, se la carriera che sta riprendendo è dentro. */
test("caricando una carriera arrestata si entra direttamente nel carcere",
  ingressoPiatto.includes("G.strada&&G.strada.arresto") &&
  ingressoPiatto.includes('window.apriCarcere({direct:true,reason:"resume"})') &&
  !avvio.includes("apriCarcere"));

/* La schermata è alta quanto la finestra e i pannelli hanno overflow:hidden:
   se il contenuto cresce, sparisce. È già successo — «Molla il giro» e il
   TRAPHONE tagliati fuori a 1366×768. Queste prove tengono aperta la via di
   fuga: le colonne devono poter scorrere, e i due titoloni non devono
   tornare a un'interlinea che fa sovrapporre le righe.
   (I fogli si leggono con gli spazi appiattiti: qui conta cosa dice la
   regola, non su quante righe è scritta.) */
test("le colonne delle Attività criminali possono scorrere",
  cssCrimeV2.includes("#strada .side, #strada .tabpane.on{ overflow-y:auto;"));

test("il titolo delle Attività criminali non ha righe che si toccano",
  cssCrimeV2.includes("#strada .herohead h1{ line-height:.92;"));

test("il carcere: titolo leggibile e scheda che scorre",
  crimeuiPiatto.includes("line-height:.86;letter-spacing:-.025em;text-transform:uppercase}") &&
  crimeuiPiatto.includes(".adf-jail-card{align-self:center;max-height:100%;overflow-y:auto;"));

test("avatar del detenuto usa ritratto reale con sbarre sovrapposte",
  crimeui.includes('id="adf-jail-portrait"') &&
  crimeui.includes('class="adf-jail-bars"') &&
  crimeui.includes('portrait.innerHTML=window.ARTIST_PORTRAIT()'));

/* Il numero dietro al ?v= cambia a ogni ritocco del file: qui conta solo
   l'ordine dei due <script>, non la versione. */
test("carcere carica il registro dedicato prima della sua UI",
  index.includes('js/game/jail-backgrounds.js?v=') &&
  index.indexOf('js/game/jail-backgrounds.js?v=') < index.indexOf('js/game/strada-crimine-ui.js?v='));

test("registro carcere contiene esattamente 20 sfondi ufficiali",
  (jailBg.match(/"id":/g)||[]).length === 20 &&
  (jailBg.match(/media\/photo\/carcere\/carcere-bg-/g)||[]).length === 20);

test("sfondi carcere non dipendono più dal pool Attività criminali",
  crimeui.includes("window.JAIL_BACKGROUNDS_LOCAL||[]") &&
  !crimeui.includes('const all=window.CRIME_BACKGROUNDS_LOCAL||[];\\n    const pool=all.filter(bg=>Array.isArray(bg.tags)&&bg.tags.includes("prison")') &&
  crimeui.includes('id="adf-jail-bg-a"') &&
  crimeui.includes('id="adf-jail-bg-b"') &&
  crimeui.includes('transition:opacity 1.8s ease,filter 1.5s ease') &&
  crimeui.includes('data-jail-daypart') &&
  crimeui.includes('},24000);'));


test("salto +7 in carcere non lascia un report invisibile bloccante",
  skip.includes("const detenutoDopoSalto=!!(G.strada&&G.strada.arresto)") &&
  skip.includes('report.classList.remove("on")'));

test("Eventi V2 ignora il report settimanale legacy mentre sei detenuto",
  ev.includes('if(id==="report" && detenuto) continue;'));

test("widget tempo resta riapribile dopo +7 mentre sei detenuto",
  timeControls.includes('if(sel==="#report.on" && detenuto) continue;'));


test("skip iniziato in carcere non apre report neanche se termina con scarcerazione",
  ev.includes("const detenutoPrimaDelSalto=!!(G.strada&&G.strada.arresto)") &&
  ev.includes("if(!detenutoPrimaDelSalto){") &&
  ev.includes('if(report) report.classList.remove("on")'));

console.log("\nBlocco 4 — riciclaggio / costi / tempo");
test("capacità settimanale già usa anno:settimana e used",
  crime.includes("function stradaLavaggioStato()") &&
  crime.includes("s.lavaggio={key:key,used:0}") &&
  crime.includes("stradaLavaggioStato().used += importo"));
test("riciclaggio costa 45 minuti",
  time.includes("ricicla:45") &&
  crime.includes('GAME_TIME.durationFor("ricicla")') &&
  crime.includes('GAME_TIME.advance(minuti, "crime:launder")'));
test("riciclaggio non parte se manca tempo prima delle 04:00",
  crime.includes("GAME_TIME.remaining() < minuti"));
test("uomini vengono ridotti al numero realmente pagabile",
  crime.includes("Math.floor(Math.max(0, G.money) / STRADA_UOMO_UPKEEP)"));
test("protezione decade se non pagabile",
  crime.includes("s.prot = 0") &&
  crime.includes("Protezione saltata."));
test("avvocato decade se non pagabile",
  crime.includes("s.avvocato = false") &&
  crime.includes("La parcella non era coperta."));
test("UI principale mostra residuo e durata riciclaggio",
  crimeui.includes("const launderCap=") &&
  crimeui.includes('GAME_TIME.durationFor("ricicla")') &&
  crimeui.includes('"Limite settimanale raggiunto"'));
test("UI legacy disabilita il riciclaggio a capacità zero",
  crime.includes("rip.disabled = !!s.arresto || s.sporchi <= 0 || ripCap <= 0"));

console.log("\nPunto 1 — controllo tempo globale coerente");
test("controller tempo globale è caricato dopo i motori eventi",
  index.indexOf('<script src="js/game/tempo-controlli.js') > index.indexOf('<script src="js/game/eventi-tempo.js'));
test("esiste un solo controller globale del tempo",
  timeControls.includes('const ROOT_ID = "adf-time-controls"') &&
  timeControls.includes('window.ADF_TIME_CONTROLS=Object.freeze'));
test("controller si monta nella testata della finestra attiva",
  timeControls.includes('const HOSTS = [') &&
  timeControls.includes('head:".pbarra"') &&
  /* punto 7: la vecchia schermata di gioco non c'è più, al suo posto il
     quaderno sopra alla mappa — la testata dove si monta è la sua. */
  timeControls.includes('head:".pnhead"') &&
  timeControls.includes('head:".pohead"') &&
  timeControls.includes('head:".nghead"') &&
  timeControls.includes('head:".topbar"') &&
  timeControls.includes('head:".adf-jail-top"'));
/* Lo Studio è un foglio sopra all'hub, e l'hub resta acceso sotto: senza una
   riga sua la pastiglia si agganciava all'hub e con lo z-index 142 finiva
   sopra ai pannelli dello Studio (z-index 94), coprendo «Il quartiere», il
   tasto «POSTA» e la stima degli stream. L'ora nello Studio ce l'ha la fascia
   in alto. Le due cose che devono restare vere: la riga muta c'è, e sta
   **prima** di quella dell'hub. */
test("lo Studio è muto e viene prima dell'hub: nessuna pastiglia sui pannelli",
  timeControls.includes('{id:"studio", root:"#studio.on",          mute:true}') &&
  timeControls.includes('if(spec.mute) return null;') &&
  timeControls.indexOf('id:"studio"') < timeControls.indexOf('id:"hub"'));
test("pannello fixed nel body viene riposizionato vicino al widget attivo",
  timeControls.includes('.adf-tc-panel{position:fixed') &&
  timeControls.includes('function positionPanel()') &&
  timeControls.includes('panel.style.left=Math.round(left)+"px"') &&
  timeControls.includes('panel.style.top=Math.round(top)+"px"'));
test("slider orario e tasti +/- lavorano a step di 15 minuti",
  timeControls.includes('type="range"') &&
  timeControls.includes('const STEP = Number(GAME_TIME.SLOT) || 15') &&
  timeControls.includes('adf-tc-minus') && timeControls.includes('adf-tc-plus'));
test("attesa usa il clock reale e non teletrasporta G.timeMinutes",
  timeControls.includes('GAME_TIME.advance(step,"wait-global"') &&
  !timeControls.includes('G.timeMinutes=target'));
test("attesa si ferma su action o evento alto pendente",
  timeControls.includes('GAME_TIME.pending && GAME_TIME.pending()') &&
  timeControls.includes('GAME_EVENTS.blocked && GAME_EVENTS.blocked()'));
test("widget +1/+7 delega al bridge Eventi V2",
  timeControls.includes('window.ADF_TIME_SKIP(count)') &&
  timeControls.includes('calendarSerial()'));
test("controller reagisce anche a finestre create dinamicamente",
  timeControls.includes('new MutationObserver'));


console.log("\nOpp criminali — ingresso reale nel giro");
test("nuova carriera dichiara esplicitamente di non essere nel giro criminale",
  state.includes("arresto:null, giroAvviato:false"));
test("profilo pulito non entra nel pool Opp criminale",
  crime.includes("const giroAvviato=stradaGiroAvviato();") &&
  crime.includes("if(giroAvviato && !s.arresto && Math.random() < probOpp) stradaOpp();"));
test("il primo colpo realmente tentato rende persistente l'ingresso nel giro",
  crime.includes("s.giroAvviato=true;") &&
  crime.indexOf("s.giroAvviato=true;") < crime.indexOf("G.energy -= colpo.energia;"));
test("migrazione vecchi salvataggi usa prove criminali concrete",
  crime.includes("Number(s.precedenti)>0") &&
  crime.includes("Number(s.sporchi)>0") &&
  crime.includes("!!s.carcere") &&
  crime.includes("Object.values(s.attivita||{}).some(Boolean)") &&
  crime.includes("s.lavaggio&&Number(s.lavaggio.used)>0"));
test("una storia criminale già attiva non decade con heat o rep",
  crime.includes("if(s.giroAvviato===true)return true;"));

console.log("\nHardening eventi — arbitro globale");
const street = leggi("js/game/strada.js");
const clockEvents = leggi("js/game/eventi-tempo.js");
test("Eventi V2 espone un unico arbitro HIGH globale",
  ev.includes("ADF.beginHigh=beginGlobalHigh") &&
  ev.includes("ADF.endHigh=endGlobalHigh") &&
  ev.includes("ADF.highReady=highReady") &&
  ev.includes("pendingGlobalHigh"));
test("LOW/MEDIUM condividono la guardia anti-doppio evento",
  ev.includes("ADF.claimAutoEvent=claimAutoEvent") &&
  clockEvents.includes('ADF_EVENTI.claimAutoEvent("clock")') &&
  street.includes('ADF_EVENTI.claimAutoEvent("street")'));
test("il clock usa la stessa finestra HIGH del catalogo",
  clockEvents.includes('ADF_EVENTI.beginHigh("clock",e.id)') &&
  clockEvents.includes('ADF_EVENTI.endHigh("clock",p.id)') &&
  clockEvents.includes("ADF_EVENTI.highReady"));
test("un HIGH per strada non ha annulla e usa il lock globale",
  street.includes('if(!obbligatorio) ev.annulla=function(){}') &&
  street.includes('ADF_EVENTI.beginHigh("street",scelto.id)') &&
  street.includes("mostraIncontro(scena,true"));
test("HIGH catalogo e strada sopravvivono al refresh",
  ev.includes("pendingGlobalHigh") &&
  ev.includes('ph.source==="catalog"') &&
  ev.includes('ph.source==="street"') &&
  street.includes("ADF_RESTORE_STREET_HIGH"));
const sc0=ev.indexOf("function showCatalog(");
const sc1=ev.indexOf("function autoResolve(",sc0);
const scBody=sc0>=0&&sc1>sc0?ev.slice(sc0,sc1):"";
test("HIGH catalogo prende il lock prima di chat o LaFamegram",
  scBody.includes('beginGlobalHigh("catalog",e.id') &&
  scBody.indexOf('beginGlobalHigh("catalog",e.id') < scBody.indexOf("mirrorDelivery(e)"));
test("gli skip del widget sono bloccati da qualunque HIGH globale",
  ev.includes("!globalHigh() && !overlayBusy()") &&
  timeControls.includes("ADF_EVENTI.globalHigh") &&
  timeControls.includes("window.ADF_TIME_SKIP(count)"));
test("refresh di un HIGH catalogo non duplica Chat o LaFamegram",
  scBody.includes("!meta.fromSkip && !meta.restorePending") &&
  scBody.includes("mirrorDelivery(e)"));

console.log("\nHardening accesso azioni — luogo / orari / fine giornata");
test("spostamenti espone una guardia runtime per le azioni",
  travel.includes("function actionAccess(id, at)") &&
  travel.includes("function guardAction(id, opts)") &&
  travel.includes("actionAccess,") &&
  travel.includes("guardAction,"));
test("la guardia usa clock, orari e posizione reale",
  travel.includes("GAME_TIME.canStart(id)") &&
  travel.includes("GAME_HOURS.actionStatus(id, now)") &&
  travel.includes("requiredPlaceForAction(id)") &&
  travel.includes('reason:"wrong-place"') &&
  travel.includes('reason:"hours"') &&
  travel.includes('reason:"day-end"'));

console.log("\nHardening carcere — blocco globale gameplay");
test("spostamenti riconosce il carcere come stato runtime",
  travel.includes("function inJail()") &&
  travel.includes('const JAIL = "crimin"') &&
  travel.includes("G.strada && G.strada.arresto") &&
  travel.includes("inJail,"));
const jailAction0=travel.indexOf("function actionAccess(id, at)");
const jailAction1=travel.indexOf("function actionBlockText",jailAction0);
const jailActionBody=jailAction0>=0&&jailAction1>jailAction0?travel.slice(jailAction0,jailAction1):"";
test("un detenuto non pu? iniziare nessuna ACTION",
  jailActionBody.includes('return {ok:false, reason:"jail", id, now, duration, remaining') &&
  jailActionBody.indexOf('reason:"jail", id') < jailActionBody.indexOf("GAME_TIME.pending"));

test("un detenuto non può viaggiare fuori dal carcere",
  travel.includes('if(inJail() && toId !== JAIL)') &&
  travel.includes('reason:"jail", fromId, toId'));
test("il nuovo giorno resta in carcere finché la pena è attiva",
  travel.includes('G.currentPlace = inJail()') &&
  travel.includes('(luogo(JAIL) ? JAIL : from)'));
test("il tempo resta disponibile per scontare la pena",
  crime.includes("s.arresto.settimane--") &&
  timeControls.includes('id:"jail"') &&
  timeControls.includes("window.ADF_TIME_SKIP(count)"));
test("Hub disabilita le attività mentre sei detenuto",
  hub.includes("function hubDetenuto()") &&
  hub.includes('if(hubDetenuto()) return {ok:false, perche:"Sei in carcere"}') &&
  hub.includes('? {ok:false, perche:"Sei in carcere"}'));
test("Agenda mostra esplicitamente il blocco carcere",
  tel.includes('gate.reason === "jail"') &&
  tel.includes('GAME_TRAVEL.inJail()') &&
  tel.includes('return {ok:false, perche:"Sei in carcere"}'));

console.log("\nCarcere contestuale — solo vita interna");
test("il carcere ha un micro-loop dedicato e non sblocca ACTION normali",
  crime.includes("const CARCERE_EVENTI = [") &&
  crime.includes("function carcereGiorno()") &&
  crime.includes("window.ADF_JAIL=Object.freeze") &&
  travel.includes('reason:"jail"'));
test("gli eventi carcere hanno cadenza 4-8 giorni e memoria anti-ripetizione", (() => {
  const compact = crime.replace(/\s+/g, "");
  return compact.includes("if(gap<4)returnfalse;") &&
         compact.includes("if(gap<8&&Math.random()>=.28)returnfalse;") &&
         compact.includes("c.recenti.slice(0,4)");
})());
test("la UI carcere espone solo azioni dedicate e feed interno",
  crimeui.includes('data-jail-action') &&
  crimeui.includes('id="adf-jail-events"') &&
  crimeui.includes("renderJailLoop(el)"));
test("ora d'aria e giro hanno limiti giorno/settimana",
  crime.includes("if(c.daily.aria)") &&
  crime.includes("if(c.weekly.giro)") &&
  crime.includes('GAME_TIME.advance(minuti,"jail:"+id'));
test("il ricorso dell'avvocato è una volta per detenzione e toglie solo 1 settimana",
  crime.includes("if(c.ricorsoUsato)") &&
  crime.includes("a.settimane=Math.max(1,(Number(a.settimane)||1)-1)") &&
  crime.includes("STRADA_AVVOCATO_COSTO"));
test("sim sostituisce street e chat con carcereGiorno durante la detenzione",
  sim.includes("if(G.strada && G.strada.arresto)") &&
  sim.includes('typeof carcereGiorno === "function"') &&
  sim.includes('typeof provaIncontro === "function"') &&
  sim.includes('!detenutoAInizioSettimana && typeof chatSettimana'));
test("trial ed eventi legacy settimanali restano fuori dal carcere",
  sim.includes("!detenutoAInizioSettimana && G.trialCd <= 0") &&
  sim.includes("!detenutoAInizioSettimana && Math.random() < .38"));
test("Eventi V2 non consegna catalogo, hook o street legacy in carcere",
  ev.includes("function adfInJail()") &&
  ev.includes("if(adfInJail()) return null") &&
  ev.includes("if(adfInJail()) return;") &&
  ev.includes("if(adfInJail()) return false"));
test("eventi clock non pianifica né valuta eventi cittadini in carcere",
  clockEvents.includes("function inJail()") &&
  clockEvents.includes("if(inJail()) return null") &&
  clockEvents.includes("if(inJail()) return;"));
test("trasferte lascia scadere inviti ma non ne genera di nuovi in carcere",
  transfers.indexOf("scadenze();") < transfers.indexOf("G.strada && G.strada.arresto") &&
  transfers.includes("if(G.strada && G.strada.arresto){ salva(); return; }"));

console.log("\nCatalogo carcere V2 — coerenza / HIGH / persistenza");
const jail0=crime.indexOf("CARCERE EVENTI V2 — 35 SCENE CONTESTUALI");
const jail1=crime.indexOf("/* ==================== IL CICLO SETTIMANALE",jail0);
const jailV2src=jail0>=0&&jail1>jail0?crime.slice(jail0,jail1):"";
const jailMeta=[...jailV2src.matchAll(/\{id:"(jail_[^"]+)",n:"([^"]+)",cat:"([^"]+)",tier:"([^"]+)"/g)];
test("catalogo carcere contiene 35 eventi con ID e titoli unici",
  jailMeta.length===35 &&
  new Set(jailMeta.map(x=>x[1])).size===35 &&
  new Set(jailMeta.map(x=>x[2].toLowerCase())).size===35);
test("ripartizione editoriale è 10 routine, 8 rapporti, 7 crime, 5 esterno e 5 high",
  ["routine","rapporti","crime","esterno","high"].every((k,i)=>
    jailMeta.filter(x=>x[3]===k).length===[10,8,7,5,5][i]));
test("i cinque HIGH sono separati dal pool automatico e sono once per detenzione",
  jailMeta.filter(x=>x[4]==="high").length===5 &&
  (jailV2src.match(/tier:"high"/g)||[]).length===5 &&
  (jailV2src.match(/tier:"high",weight:1[^]*?once:true/g)||[]).length>=1 &&
  jailV2src.includes('e.tier!=="high"&&carcereEligible'));
test("eventi carcere hanno gating su giorni, reputazione, precedenti, fan, pena e avvocato",
  jailV2src.includes("e.minDays") && jailV2src.includes("e.minRep") &&
  jailV2src.includes("e.minPrecedents") && jailV2src.includes("e.minFans") &&
  jailV2src.includes("e.minWeeks") && jailV2src.includes("e.lawyer===true"));
test("HIGH carcere ha cooldown minimo e persiste finché non scegli",
  jailV2src.includes("(d-c.lastHighDay)>=18") &&
  jailV2src.includes("c.pendingHigh=e.id") &&
  jailV2src.includes("function carcereRestoreHigh()") &&
  jailV2src.includes("c.pendingHigh=null;c.lastHighDay=ctx.day"));
test("un HIGH carcere non espone annulla e le opzioni passano tutte dal resolver",
  !jailV2src.includes("annulla") &&
  jailV2src.includes("opts:choices.map") &&
  jailV2src.includes("carcereResolveHigh(e,o)"));
test("azioni carcere si bloccano finché un HIGH è pendente",
  jailV2src.includes('pending?"Decisione in sospeso"') &&
  jailV2src.includes('if(c.pendingHigh)return {ok:false,t:"Prima devi prendere la decisione aperta in carcere."}'));
test("GAME_TIME considera il pending HIGH carcere un blocco esterno",
  time.includes('ADF_JAIL.blocked === "function"') &&
  time.includes('return "jail-event-pending"'));
test("widget tempo e skip rispettano lo stesso pending HIGH carcere",
  timeControls.includes('typeof ADF_JAIL.blocked==="function"') &&
  timeControls.includes("ADF_JAIL.blocked()"));
test("sanzioni disciplinari possono sospendere davvero l'ora d'aria",
  jailV2src.includes("airBlockedUntil") &&
  jailV2src.includes("function carcereAirDays") &&
  jailV2src.includes('?"Sospesa per "'));
test("scelte fatte dentro possono avere una conseguenza coerente al rilascio",
  jailV2src.includes("releaseRepBonus") &&
  jailV2src.includes("releaseHeatBonus") &&
  crime.includes("Quello che hai deciso dentro ti aspetta fuori."));
test("catalogo carcere non reintroduce giornalisti, hater o trasferte come incontri interni",
  !/giornalist|hater|trasfert/i.test(jailV2src));
const ux0=ui.indexOf("const esegui = () => {");
const ux1=ui.indexOf("const fansBefore = G.fans",ux0);
const uxBody=ux0>=0&&ux1>ux0?ui.slice(ux0,ux1+32):"";
test("ui consulta la guardia prima di scalare energia",
  uxBody.includes("GAME_TRAVEL.guardAction(a.id)") &&
  ui.indexOf("GAME_TRAVEL.guardAction(a.id)",ux0) <
    ui.indexOf("G.energy -= en2",ux0));
test("entrambe le nuove mosse palestra richiedono lo stesso luogo",
  hours.includes('palestra_pesi:"palestra"') &&
  hours.includes('palestra_cardio:"palestra"') &&
  travel.includes("GAME_HOURS.placeForAction"));
test("i turni con luogo fisico mantengono la mappa esplicita",
  travel.includes('lavapiatti:"pizzeria"') &&
  travel.includes('operaio:"fabbrica"') &&
  travel.includes('if(id === "turno")'));

console.log("\nLuoghi — Beat Maker assorbito dallo Studio");
test("Beat Maker non è più un hotspot fisico",
  !hub.includes('{id:"beatmaker", n:"Beat Maker"') &&
  !travel.includes("beatmaker: {") &&
  !hours.includes('beatmaker:"studio"') &&
  !hours.includes('beatmaker:"beat"'));
test("la produzione beat richiede lo Studio mentre La Sala resta networking",
  hours.includes('beat:"studio"') &&
  hub.includes('{id:"studio", n:"Studio"') &&
  hub.includes('{id:"beat", n:"La Sala"'));
test("spostamenti migra i vecchi salvataggi Beat Maker allo Studio",
  travel.includes('G.currentPlace === "beatmaker"') &&
  travel.includes('G.currentPlace = "studio"'));
test("eventi tempo continua a canonicalizzare i luoghi",
  clockEvents.includes("function canonicalPlace(id)") &&
  clockEvents.includes("GAME_HOURS.normalizePlace") &&
  clockEvents.includes("place:canonicalPlace(") &&
  clockEvents.includes("fromId:canonicalPlace(") &&
  clockEvents.includes("toId:canonicalPlace("));

{
  const vm=require("vm");
  let pending=false, canStart=true, hoursOpen=true;
  const box={
    console,Math,JSON,Object,Array,String,Number,Boolean,Date,
    G:{currentPlace:"vita",job:null,strada:{arresto:null}},
    HUB_LUOGHI:[
      {id:"vita",n:"Casa",x:0,y:0,w:10,h:10},
      {id:"crimin",n:"Attività criminali",x:10,y:0,w:10,h:10},
      {id:"studio",n:"Studio",x:20,y:0,w:10,h:10},
      {id:"beat",n:"La Sala",x:30,y:0,w:10,h:10},
      {id:"palestra",n:"Palestra",x:40,y:0,w:10,h:10},
      {id:"pizzeria",n:"Pizzeria",x:60,y:0,w:10,h:10},
      {id:"fabbrica",n:"Fabbrica",x:80,y:0,w:10,h:10}
    ],
    GAME_TIME:{
      now:()=>600,pending:()=>pending,canStart:()=>canStart,
      durationFor:id=>id==="turno"?300:id==="registra"?180:60,
      remaining:()=>480,formatDuration:m=>m+" min",format:m=>String(m),
      text:()=>"10:00",DAY_END:1680,travel:()=>({blocked:false})
    },
    GAME_HOURS:{
      normalizePlace:id=>String(id||""),
      actionStatus:()=>hoursOpen?{open:true}:{open:false,phase:"before",nextText:"12:00",label:"Apre alle 12:00"},
      placeForAction:id=>({beat:"studio",registra:"studio",palestra_pesi:"palestra",palestra_cardio:"palestra"}[id]||null),
      directActionForPlace:()=>null,
      placeStatus:()=>({open:true})
    },
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    CustomEvent:function(){},save:()=>{}
  };
  const listeners={};
  box.window=box;
  box.addEventListener=(type,fn)=>{
    if(!listeners[type]) listeners[type]=[];
    listeners[type].push(fn);
  };
  box.dispatchEvent=()=>{};
  vm.createContext(box);

  let loaded=true;
  try{ vm.runInContext(travel,box,{filename:"spostamenti.js"}); }
  catch(e){ loaded=false; test("spostamenti si carica nel test runtime",false,e.message); }

  if(loaded){
    let g=box.GAME_TRAVEL.actionAccess("registra");
    test("runtime: registra da Casa viene bloccata per luogo",
      !g.ok && g.reason==="wrong-place" && g.requiredPlace==="studio");

    box.G.currentPlace="studio";
    g=box.GAME_TRAVEL.actionAccess("registra");
    test("runtime: registra in Studio e in orario passa",g.ok===true);

    box.G.currentPlace="beatmaker";
    test("runtime: un vecchio salvataggio Beat Maker migra allo Studio",
      box.GAME_TRAVEL.current()==="studio");

    g=box.GAME_TRAVEL.actionAccess("beat");
    test("runtime: Cerca un beat si fa nello Studio",
      g.ok===true && box.GAME_TRAVEL.current()==="studio" &&
      box.GAME_TRAVEL.logicalPlace("studio")==="studio");

    hoursOpen=false;
    g=box.GAME_TRAVEL.actionAccess("registra");
    test("runtime: un'azione fuori orario viene bloccata",
      !g.ok && g.reason==="hours");

    hoursOpen=true; canStart=false;
    g=box.GAME_TRAVEL.actionAccess("registra");
    test("runtime: un'azione oltre fine giornata viene bloccata",
      !g.ok && g.reason==="day-end");

    canStart=true; box.G.job={id:"lavapiatti"}; box.G.currentPlace="vita";
    g=box.GAME_TRAVEL.actionAccess("turno");
    test("runtime: il turno lavapiatti richiede la Pizzeria",
      !g.ok && g.reason==="wrong-place" && g.requiredPlace==="pizzeria");

    box.G.strada.arresto={settimane:2,colpo:"test"};
    box.G.job=null; box.G.currentPlace="vita";
    g=box.GAME_TRAVEL.actionAccess("registra");
    test("runtime carcere: un'azione viene bloccata prima di luogo/orari",
      !g.ok && g.reason==="jail" && g.currentPlace==="crimin");

    let p=box.GAME_TRAVEL.plan("studio");
    test("runtime carcere: non puoi viaggiare allo Studio",
      !p.ok && p.reason==="jail" && p.fromId==="crimin");

    p=box.GAME_TRAVEL.plan("crimin");
    test("runtime carcere: il punto Carcere resta la posizione corrente",
      p.ok===true && p.same===true && box.GAME_TRAVEL.current()==="crimin");

    const starts=listeners["game-time:day-start"]||[];
    starts.forEach(fn=>fn());
    test("runtime carcere: nuovo giorno non ti riporta a Casa",
      box.G.currentPlace==="crimin");

    box.G.strada.arresto=null;
    starts.forEach(fn=>fn());
    test("runtime carcere: dopo la scarcerazione il nuovo giorno torna a Casa",
      box.G.currentPlace==="vita");
  }
}

console.log("\nPunto 15 — niente pulsanti vuoti per ID duplicati");
test("la X della Strada non usa più id=\"st-x\", quello resta solo allo Studio",
  crime.includes('$("str-x").onclick = () => { hubTap(); chiudiStrada(); };') &&
  index.includes('id="str-x"'));
test("index.html non ha nessun id duplicato",
  (() => {
    const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    const visti = new Set();
    const doppi = new Set();
    for(const id of ids){ if(visti.has(id)) doppi.add(id); visti.add(id); }
    return doppi.size === 0;
  })());

console.log("\nPunto 1 — dallo Studio si esce solo con «Torna alla mappa»");
test("lo Studio non ha più una X in testata, né uno sfondo che chiude al click",
  !index.includes('id="st-x"') &&
  !studio.includes('e.target.id === "studio"') &&
  !studio.includes('$("st-x")'));
test("lo Studio non chiude più su Escape: ricade sul menu di sistema globale, come La Sala",
  !studio.includes('e.key === "Escape"'));
test("chiudiStudio() resta esposta perché la chiama il bottone globale, non lo Studio stesso",
  studio.includes("function chiudiStudio()"));
test("il menu di sistema riconosce lo Studio come host e ci mostra «Torna alla mappa»",
  menuSystem.includes('if(document.querySelector("#studio.on")) return "studio";'));
test("«Torna alla mappa» chiude davvero lo Studio prima di andare all'hub",
  menuSystem.includes('if($id("studio") && $id("studio").classList.contains("on") && typeof chiudiStudio === "function") chiudiStudio();'));
test("la barra globale si monta nella testata dello Studio, non sotto in hub",
  menuSystem.includes('{id:"studio",  root:"#studio.on",        head:".sthead"}'));

/* Punto 14 di ALE: le azioni in Studio chiudevano lo Studio prima di partire,
   e ogni mossa ti buttava alla mappa. Il fix vero (studioAzione() non chiude
   più) è invisibile a "le ACTION standard dello Studio non vengono addebitate
   due volte" qui sopra, che guarda solo il pezzo giusto del file — se qualcuno
   rimette dentro chiudiStudio() prima di hubAzione(id), lì sopra continua a
   passare. Questi controlli guardano proprio quello: che non chiuda più, che
   lo Studio si aggiorni da solo dopo, e che le finestre che un'azione apre
   sopra di sé (foglio, titolo del pezzo, scena a pagina piena) restino
   davvero sopra allo Studio, non dietro, per via dello z-index. */
console.log("\nPunto 14 — le azioni in Studio non chiudono più lo Studio");
test("studioAzione() non chiude più lo Studio prima della mossa, e si ridisegna dopo",
  (() => {
    const a = studio.indexOf("function studioAzione(id)");
    const b = studio.indexOf("\n}", a);
    const body = a >= 0 && b > a ? studio.slice(a, b) : "";
    return body.includes("hubAzione(id)") &&
      body.includes("renderStudio()") &&
      !body.includes("chiudiStudio()");
  })());
test("renderStudio() si aggiorna da sola solo se lo Studio è ancora aperto",
  /function renderStudio\(\)\{\s*const root ?= ?\$\("studio"\);\s*if\(!root \|\| !root\.classList\.contains\("on"\)\) return;/
    .test(studio.replace(/\n\s*/g, "\n")) ||
  (() => {
    const a = studio.indexOf("function renderStudio()");
    const b = studio.indexOf("\n}", a);
    const body = a >= 0 && b > a ? studio.slice(a, b) : "";
    return body.includes('classList.contains("on")') && body.includes("return;");
  })());
test("lo z-index dello Studio sta sotto a modal, report/scena e foglio: quello che un'azione apre sopra di sé si vede",
  (() => {
    const zStudio = Number((/\.studio\{[^}]*z-index:(\d+)/.exec(studioCss) || [])[1]);
    const zModal = Number((/\.modal\{[^}]*z-index:(\d+)/.exec(overlaysCss) || [])[1]);
    const zScena = Number((/\.scenapiena\{[^}]*z-index:(\d+)/.exec(effectsCss) || [])[1]);
    const zWriter = Number((/\.writer\{[^}]*z-index:(\d+)/.exec(overlaysCss) || [])[1]);
    return zStudio > 0 && zStudio < zModal && zStudio < zScena && zStudio < zWriter;
  })());
test("il percorso sincrono di un'azione diretta (ui.js) ridisegna lo Studio dopo l'esito",
  (() => {
    const a = ui.indexOf("const esegui = () => {");
    const b = ui.lastIndexOf("};", ui.indexOf("const pesa ="));
    const body = a >= 0 && b > a ? ui.slice(a, b) : "";
    return body.includes('if(typeof renderStudio === "function") renderStudio();');
  })());
test("scrivere le barre (writer.js) ridisegna lo Studio, sia a strofa chiusa sia lasciando perdere",
  writer.includes('$("w-done").onclick = () => { chiudiFoglio(); save(); renderGioco(); if(typeof renderStudio === "function") renderStudio(); };') &&
  writer.includes('$("w-x").onclick = () => { if(WR) annullaAzione(); chiudiFoglio(); renderGioco(); if(typeof renderStudio === "function") renderStudio(); };') &&
  writer.includes('$("w-cancel").onclick = () => { annullaAzione(); chiudiFoglio(); renderGioco(); if(typeof renderStudio === "function") renderStudio(); };'));
test("le finestre generiche (modal.js: conferma spesa, titolo del pezzo, «Come la fai») ridisegnano lo Studio dopo",
  (() => {
    const a = modal.indexOf("function showEvent(e)");
    const b = modal.indexOf("\n}", a);
    const bodyEvent = a >= 0 && b > a ? modal.slice(a, b) : "";
    const c = modal.indexOf("function chiudiModale()");
    const d = modal.indexOf("\n}", c);
    const bodyChiudi = c >= 0 && d > c ? modal.slice(c, d) : "";
    return bodyEvent.includes('if(typeof renderStudio === "function") renderStudio();') &&
      bodyChiudi.includes('if(typeof renderStudio === "function") renderStudio();');
  })());
test("registrare il pezzo (actions.js) ridisegna lo Studio dopo il titolo",
  (() => {
    const a = actions.indexOf('{id:"registra"');
    const b = actions.indexOf('{id:"mixa"', a);
    const body = a >= 0 && b > a ? actions.slice(a, b) : "";
    return /SFX\.rec\(\);\s*save\(\);\s*renderGioco\(\);\s*if\(typeof renderStudio === "function"\) renderStudio\(\);/.test(body);
  })());

console.log("\nPunto 1 (bis) — «Torna alla mappa» funziona in ogni stanza dove si vede");
test("Piazza e Writer si mostravano nella barra HOSTS ma il menu non li riconosceva: ora sì",
  menuSystem.includes('if(document.querySelector("#piazza.on")) return "piazza";') &&
  menuSystem.includes('if(document.querySelector("#writer.on")) return "writer";'));
test("«Torna alla mappa» annulla un freestyle o una strofa a metà invece di lasciarli pendenti",
  menuSystem.includes('typeof uscitaPiazza === "function") uscitaPiazza();') &&
  menuSystem.includes('typeof uscitaFoglio === "function") uscitaFoglio();'));
test("uscitaFoglio() esiste ed è la stessa sequenza di annulla+chiudi+renderGioco della X del foglio",
  writer.includes("function uscitaFoglio()") &&
  writer.includes("if(WR) annullaAzione(); chiudiFoglio(); renderGioco();"));
test("il Pannello (ex Quaderno) è riconosciuto come host ma «Torna alla mappa» non lo chiudeva: ora sì",
  menuSystem.includes('if(document.querySelector("#pannello.on")) return "pannello";') &&
  menuSystem.includes('typeof chiudiPannello === "function") chiudiPannello();'));
test("il vero bug: in Piazza e Writer il bottone si vedeva ma restava disabled per sempre — mappaBloccata() riusava la lista dell'ESC, che li considera giustamente \"interni\" a prescindere",
  menuSystem.includes("function dialogoFlottante(){") &&
  !/dialogoFlottante\(\)\{[^}]*piazza/s.test(menuSystem) &&
  !/dialogoFlottante\(\)\{[^}]*writer/s.test(menuSystem));
test("mappaBloccata() ora blocca solo i dialoghi flottanti veri, non Piazza/Writer (che tornaMappa() sa chiudere da soli)",
  (() => {
    const b0 = menuSystem.indexOf("function mappaBloccata(){");
    const b1 = menuSystem.indexOf("}", b0);
    const body = menuSystem.slice(b0, b1);
    return body.includes("dialogoFlottante()") && !body.includes("internoDaChiuderePrima()");
  })());
test("l'ESC continua a lasciar chiudere Piazza e Writer da soli prima di aprire il menu di sistema",
  (() => {
    const b0 = menuSystem.indexOf("function internoDaChiuderePrima(){");
    const b1 = menuSystem.indexOf("}", b0);
    const body = menuSystem.slice(b0, b1);
    return body.includes('querySelector("#writer.on")') && body.includes('querySelector("#piazza.on")');
  })());
test("hostAttivo() e la lista HOSTS che monta la barra riconoscono esattamente le stesse stanze",
  (() => {
    const hostBody = menuSystem.slice(
      menuSystem.indexOf("function hostAttivo(){"),
      menuSystem.indexOf("}", menuSystem.indexOf("function hostAttivo(){"))
    );
    const daHostAttivo = [...hostBody.matchAll(/return "([a-z]+)";/g)].map(m => m[1]).sort();
    const hostsBlock = menuSystem.slice(menuSystem.indexOf("const HOSTS=["), menuSystem.indexOf("];", menuSystem.indexOf("const HOSTS=[")));
    const daHosts = [...hostsBlock.matchAll(/id:"([a-z]+)"/g)].map(m => m[1]).sort();
    return daHostAttivo.length > 0 && daHosts.length > 0 &&
      JSON.stringify(daHostAttivo) === JSON.stringify(daHosts);
  })());
test("ogni stanza non-hub/jail riconosciuta da hostAttivo() ha davvero un modo di chiudersi in tornaMappa()",
  (() => {
    const tm0 = menuSystem.indexOf("function tornaMappa(){");
    const tm1 = menuSystem.indexOf("\n  function creaBarraGlobale", tm0);
    const body = tm0 >= 0 && tm1 > tm0 ? menuSystem.slice(tm0, tm1) : "";
    const hostBody = menuSystem.slice(
      menuSystem.indexOf("function hostAttivo(){"),
      menuSystem.indexOf("}", menuSystem.indexOf("function hostAttivo(){"))
    );
    const stanze = [...hostBody.matchAll(/return "([a-z]+)";/g)].map(m => m[1])
      .filter(id => id !== "jail" && id !== "hub");
    return !!body && stanze.every(id => body.includes('$id("' + id + '")'));
  })());

console.log("\nPunto 2 — la zona da toccare è la sagoma dell'edificio, non un rettangolo");
/* Il rettangolo uguale per tutti (10.50×12.50) non c'è più: su una foto in
   prospettiva non combaciava con nessun palazzo. Adesso ogni posto ha il suo
   profilo in HUB_SAGOME, e il rettangolo del bottone è solo il contenitore. */
test("i dieci luoghi hanno un profilo in HUB_SAGOME, di almeno tre punti",
  (() => {
    const b0 = hub.indexOf("const HUB_SAGOME");
    const b1 = hub.indexOf("});", b0);
    if(b0 < 0 || b1 < 0) return false;
    const blocco = hub.slice(b0, b1);
    const sagome = [...blocco.matchAll(/([a-z]+):\s*\[(\[[^\]]*\][,\s]*)+\]/g)];
    return sagome.length === 10 &&
      sagome.every(m => (m[0].match(/\[[\d.]+,[\d.]+\]/g) || []).length >= 3);
  })());
test("nessun luogo porta più x/y/w/h a mano: misure e baricentro escono dal profilo",
  !/\{id:"[a-z]+", n:"[^"]*", x:/.test(hub) && hub.includes("function hubSagoma"));
test("il bottone non prende i clic: li prende il poligono della sagoma",
  (() => {
    const css = leggi("css/hub.css");
    const b0 = css.indexOf(".pspot {");
    const b1 = css.indexOf("}", b0);
    const body = b0 >= 0 ? css.slice(b0, b1) : "";
    return body.includes("pointer-events: none") &&
      /\.pspot-sagoma polygon\s*\{[^}]*pointer-events:\s*all/.test(css);
  })());
test("l'ultimo luogo toccato non resta con l'anello giallo del focus: si toglie il fuoco al click",
  (() => {
    const c0 = hub.indexOf('$("hb-pins").addEventListener("click"');
    const c1 = hub.indexOf("});", c0);
    const body = c0 >= 0 && c1 > c0 ? hub.slice(c0, c1) : "";
    return !!body && body.includes("b.blur();") && body.indexOf("b.blur();") < body.indexOf("l.vai()");
  })());

console.log("\nPunto 3 — via i tastini che muovono la mappa");
test("le frecce «scorri per esplorare» (pfrec) e il giro guidato (HUB_QUI) non esistono più",
  !hub.includes("pfrec") && !hub.includes("HUB_QUI") && !hub.includes('"qui"'));
test("nessun foglio di stile parla ancora di pfrec o di .pspot.qui",
  (() => {
    const css = [
      leggi("css/hub.css"), leggi("css/tocco.css")
    ].join("\n");
    return !css.includes("pfrec") && !css.includes(".qui");
  })());

console.log("\nPunto 4 — lo Shop è uno shop, non un menù impostazioni");
test("Attrezzatura e Beat sono card (.shcard/.shbeat), non righe di lista (.li)",
  ui.includes('"shcard') && ui.includes('"shbeat') &&
  !/\$\("g-shop"\)\.innerHTML\s*=\s*GEAR\.map\(g2 => \{[^}]*<div class="li"/.test(ui));
test("ogni pezzo di attrezzatura ha un'icona propria (cuffie, mic, manopole, altoparlante, barre)",
  ui.includes("SH_GEAR_ICONE") &&
  ui.includes('cuffie:"cuffie"') && ui.includes('monitor:"altoparlante"') &&
  hub.includes("cuffie:'<path") && hub.includes("altoparlante:'<path"));
test("la cassa dello shop si vede sempre, non solo scorrendo fino in fondo",
  ui.includes('$("sh-cash")') && ui.includes("fmt(G.money)"));
test("Attrezzatura e Beat sono due reparti dietro due linguette, non due liste impilate",
  index.includes('data-sh="gear"') && index.includes('data-sh="beat"') &&
  index.includes('data-shsec="gear"') && index.includes('data-shsec="beat"') &&
  (index.match(/\bdata-sh="/g) || []).length === 2 &&
  (index.match(/\bdata-shsec="/g) || []).length === 2 &&
  !index.includes('data-sh="fit"') && !index.includes('data-shsec="fit"') &&
  negozio.includes('const shTabs = $("sh-tabs")') &&
  negozio.includes('shTabs.addEventListener("click"') &&
  negozio.includes("s.dataset.shsec === b.dataset.sh"));
test("il reparto Vestiti legacy resta nascosto e inerte finché manca il nuovo catalogo cosmetico",
  negozio.includes("ADF_ABBIGLIAMENTO_HIBERNATE_V2") &&
  negozio.includes("window.ADF_ABBIGLIAMENTO_LEGACY_ACTIVE = false") &&
  negozio.includes("function renderAbbigliamento(){ return; }") &&
  negozio.includes("function ngCompra(){ return false; }") &&
  !index.includes('id="g-fit"') && !negozio.includes("data-compra"));
test("comprare attrezzatura e beat resta la stessa economia di prima: stesso costo, stesso G.money, stesso G.gear/G.beats",
  ui.includes("G.money -= g2.p; G.gear[g2.id] = true;") &&
  ui.includes("G.money -= b.price; G.market.splice(i,1); G.beats.push("));

console.log("\nProblemi riscontrati \u2014 carcere senza notifiche, didascalie scritte in casa");
const caption = leggi("js/game/crime-caption.js");
test("in carcere la fascia di LaFamegram non compare",
  ev.includes("function adfRenderSocialBanner(post){") &&
  ev.includes("  if(adfInJail()) return;") &&
  ev.indexOf("  if(adfInJail()) return;") > ev.indexOf("function adfRenderSocialBanner(post){"));
test("e se era gi\u00e0 a schermo quando ti prendono, se ne va con te",
  ev.includes('window.addEventListener("jail-ui:opened"') &&
  ev.includes("adfHideSocialBanner();") &&
  crimeui.includes('new CustomEvent("jail-ui:opened"'));
test("il post resta comunque nel feed: \u00e8 solo la notifica che non arriva",
  ev.includes("s.runtime.socialAlerts.unshift({") &&
  ev.indexOf("s.runtime.socialAlerts.unshift({") < ev.indexOf("adfRenderSocialBanner(post);"));
test("le didascalie della strada non citano nessuna lirica vera",
  !/\bby:\s*"/.test(caption) && !caption.includes("track:") &&
  !/Wu-Tang|2Pac|Tupac|Notorious|Jay-Z|Eminem|Kendrick|Drake|Snoop|Nas\b/.test(caption));
test("ogni didascalia dice da dove arriva, e a schermo ci finisce quella firma",
  caption.includes('da:"') && caption.includes("a.textContent=c.da"));
test("e sono abbastanza da reggere il filtro delle ultime 28 uscite",
  (caption.match(/\{id:"c\d{3}"/g) || []).length >= 40 &&
  caption.includes('da:"') && caption.includes("recent.slice(-28)"));

console.log("\nPunto 13 — l'albero delle abilità");
test("la linguetta «Abilità» apre l'albero, senza vista di mezzo",
  hub.includes('if(b.dataset.v === "abilita"){') &&
  hub.includes("apriAbilita()") && !hub.includes("function vistaAbilita("));
test("l'albero è una schermata sua, con dentro i 32 nodi del disegno",
  index.includes('<div class="abilita" id="abilita">') &&
  (index.match(/class="skill-hotspot"/g) || []).length === 32);
test("la tela riempie la finestra: niente più bande sopra e sotto",
  abilitaCss.includes("#abilita .hud-canvas{position:relative;width:100%;height:100%") &&
  !abilitaCss.includes("aspect-ratio:1672/793"));
test("il tasto per tornare alla mappa c'è, e si vede",
  index.includes('id="returnToMap"') && index.includes("Torna alla mappa") &&
  abilitaCss.includes("#abilita .nav-hot.back{"));
test("la colonna di sinistra legge la partita, non il disegno",
  abilita.includes("function renderColonna()") &&
  abilita.includes("window.ARTIST_PORTRAIT") && abilita.includes("livello()") &&
  ["ab-nome","ab-livello","ab-xp","ab-citta","ab-punti","ab-skill"]
    .every(id => abilita.includes('"#' + id + '"') && index.includes('id="' + id + '"')));
test("le quattro barre sono quelle del gioco, col fondoscala di hub.js",
  abilita.includes('k:"flow"') && abilita.includes('k:"scrittura"') &&
  abilita.includes('k:"presenza"') && abilita.includes('k:"rete"') &&
  abilita.includes("v / 88 * 100") && hub.includes("v / 88 * 100"));
test("la fase dei nodi la dà la carriera vera",
  abilita.includes("function fase(){") && abilita.includes("G.phase") &&
  abilita.includes("return (fase() + 1) >= item.row"));
test("i talenti non scrivono nel salvataggio della partita",
  abilita.includes("ABILITA_CHIAVE") && !/\bG\.(talenti|pt)\b/.test(abilita));

console.log("\nPulizia — quello che finisce addosso a chi installa il gioco");
const trasferte = leggi("js/game/trasferte.js");
test("il foglio delle trasferte non si richiede da solo dentro al build",
  trasferte.includes("function regoleCaricate()") &&
  trasferte.includes('r.selectorText.indexOf(".trascosti")') &&
  trasferte.indexOf("if(regoleCaricate()) return;") <
    trasferte.indexOf('l.href = "css/trasferte.css'));
/* La prova qui sotto e quella delle immagini orfane si reggono a vicenda: quella
   là smette di guardare dentro al dataset degli avatar *perché* il build lo
   salta. Se un giorno qualcuno toglie il salto dal build e non se ne accorge
   nessuno, 2,8 GB tornano nel pacchetto in silenzio — che è il modo esatto in
   cui i guai di questo progetto sono sempre arrivati: due liste scritte a mano
   in due file, e una che resta indietro. Qui la seconda lista controlla la prima. */
test("il dataset degli avatar resta fuori dal pacchetto per gli store",
  build.includes("FUORI_DAL_PACCHETTO") &&
  build.includes('path.join(RADICE, "media", "makehuman-editor-v1")') &&
  /if\(FUORI_DAL_PACCHETTO\.has\(da\)\) return;/.test(build) &&
  fs.existsSync(path.join(ROOT, "media", "makehuman-editor-v1")));
test("i video delle transizioni stanno in una cartella sola, senza doppioni",
  (() => {
    const dir = path.join(ROOT, "media/video");
    const fuori = fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith(".mp4"));
    const dentro = fs.readdirSync(path.join(dir, "Transizioni di scena"));
    return fuori.length === 0 && new Set(dentro).size === dentro.length;
  })());
test("in media/ non restano immagini che nessuna riga di codice carica",
  (() => {
    /* media/ la copia intera strumenti/build.js: un concept lasciato qui
       finisce nel pacchetto per gli store senza che nessuno lo chieda mai.
       Il posto dei concept e' frontend/concept/, che il build non guarda.
       I video restano fuori dal conto: sono il materiale del punto 23,
       ancora da collegare. */
    /* le pagine del creator RPG stanno dentro a media/ e chiamano i loro
       disegni da lì: contano come codice anche quelle. */
    const codice = ["js","css","media","pagine"].flatMap(d => elencaFile(path.join(ROOT, d)))
      .concat([path.join(ROOT, "index.html")])
      .filter(f => /\.(js|css|html)$/i.test(f))
      .map(f => fs.readFileSync(f, "utf8")).join("\n");
    /* Le foto che Carletto ha caricato il 06/09 (commit 35f9227, "le undici
       foto delle azioni e dei luoghi"): l'asset e' arrivato prima del codice
       che lo mostra. Non sono avanzi da buttare, sono materiale in attesa —
       quindi non fanno suonare l'allarme, ma restano scritte qui una per una
       cosi' non si dimenticano. Il giorno che le azioni le caricano davvero,
       questa lista si svuota e la prova torna a essere quella di prima.
       Se una foto qui dentro non esiste piu' sul disco, la prova lo dice. */
    const IN_ARRIVO = [
      "casa_di_provincia.png", "concerto_live.png", "freestyle_in_piazza.png",
      "palestra.png", "registrazione_pezzo.png", "scrittura_barre.png",
      "stacca_la_spina.png", "studio_creazione_beat.png", "studio_mixaggio.png",
      "studio_promo_su_lafamegram.png", "studio_uscita_pezzo.png",
      /* la versione definitiva di Casa, arrivata dopo le altre */
      "casa_di provincia_definitiva.png",
      /* Le stesse scene, ma senza gli elementi HTML sopra: servono per capire
         cosa e' disegno e cosa e' foto quando si rifanno le pagine dei
         luoghi. Erano dieci, tutte con il nome che gli aveva dato ChatGPT.
         Quattro adesso sono il fondale vero delle sezioni dello Studio
         (js/game/studio.js, STUDIO_FOTO) e sono uscite da questa lista: si
         chiamano studio_beat / studio_testo / studio_cabina / studio_mix /
         studio_uscita / studio_promo, e
         se sparissero dal disco il gioco se ne accorgerebbe da solo. Queste
         quattro restano materiale in attesa — le due di casa, il freestyle sotto
         il cavalcavia e il live club: i loro posti non hanno ancora una
         pagina che le carichi. */
      "ChatGPT Image 6 set 2026, 19_43_32 (2).png",
      "ChatGPT Image 6 set 2026, 19_43_34 (6).png",
      "ChatGPT Image 6 set 2026, 19_43_34 (8).png",
      "ChatGPT Image 6 set 2026, 19_43_35 (10).png"
    ];
    /* Il dataset degli avatar (`media/makehuman-editor-v1`) sta fuori dal conto,
       e per due motivi diversi. Il primo: i suoi disegni non li nomina il
       codice, li nominano i suoi cataloghi JSON — cercarli in js/css/html non
       li troverebbe mai, e li chiamerebbe orfani tutti e 1.717. Il secondo, che
       conta di più: questa prova esiste per non far finire nel pacchetto roba
       che nessuno ha chiesto, e quel dataset nel pacchetto **non ci va** — lo
       salta `strumenti/build.js` (`FUORI_DAL_PACCHETTO`). Quindi non c'è niente
       da sorvegliare: qui dentro può restare quello che serve a chi lavora agli
       avatar, tanto a chi installa il gioco non arriva. */
    const DATASET_FUORI = path.join(ROOT, "media", "makehuman-editor-v1");
    const tutte = elencaFile(path.join(ROOT, "media"))
      .filter(f => !f.startsWith(DATASET_FUORI))
      .filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f));
    const fantasma = IN_ARRIVO.filter(n =>
      !tutte.some(f => path.basename(f) === n));
    if(fantasma.length) console.log("      in attesa ma non piu' sul disco: " + fantasma.join(", "));
    /* Un nome puo' non comparire mai per intero: le icone del telefono le
       monta il codice a pezzi — `'media/photo/telefono/app-' + a.id + '.png'`
       — quindi cercare "app-agenda.png" non trova niente anche se quella
       foto e' caricata eccome. Qui si cerca allora il pezzo fisso: la
       cartella piu' l'inizio del nome, ma solo se nel codice la stringa
       *finisce li'* (segue un apice, cioe' e' una concatenazione). Cosi'
       "media/photo/telefono/app-" vale, mentre un file "m.png" buttato in
       una cartella dove il codice nomina "mappa_citta_giorno.png" non si
       salva per sbaglio: dopo la "m" li' non c'e' un apice, c'e' una "a". */
    const montataAPezzi = f => {
      const nome = path.basename(f);
      const dir = path.relative(ROOT, f).split(path.sep).join("/").slice(0, -nome.length);
      for(let n = 1; n < nome.length; n++){
        const pezzo = dir + nome.slice(0, n);
        if(codice.includes(pezzo + "'") || codice.includes(pezzo + '"') ||
           codice.includes(pezzo + "`")) return true;
      }
      return false;
    };
    const orfane = tutte
      .filter(f => !codice.includes(path.basename(f)))
      .filter(f => !montataAPezzi(f))
      .filter(f => !IN_ARRIVO.includes(path.basename(f)));
    if(orfane.length) console.log("      " + orfane.map(f => path.relative(ROOT, f)).join("\n      "));
    return orfane.length === 0 && fantasma.length === 0;
  })());

console.log("\nLe pagine di servizio — quando qualcosa non va");
test("la schermata di avvio sta nell'HTML, non la disegna il codice",
  index.includes('id="avvio"') && index.includes("Anni di <em>Fame</em>") &&
  !servizio.includes('id="avvio"><'));
test("il messaggio «ci sta mettendo troppo» è CSS puro: si vede anche se il JS non parte",
  servizioCss.includes("#avvio .lento{") && servizioCss.includes("animation:avvioLento") &&
  servizioCss.includes("12s forwards") && !servizio.includes("lento"));
test("gli ascoltatori degli errori si installano prima dei moduli del gioco",
  index.indexOf('<script src="js/servizio.js') > index.indexOf('<script src="js/core.js') &&
  index.indexOf('<script src="js/servizio.js') < index.indexOf('<script src="js/game/state.js') &&
  servizio.includes('window.addEventListener("error"') &&
  servizio.includes('window.addEventListener("unhandledrejection"'));
test("da ogni schermata si esce: nessuna senza tasti",
  (servizio.match(/tasti: \[/g) || []).length ===
  (servizio.match(/titolo: /g) || []).length);
test("un salvataggio illeggibile viene messo da parte, non perso",
  state.includes("illeggibile-") && state.includes("__ADF_SALVATAGGIO_ROTTO") &&
  state.indexOf("localStorage.setItem(copia") < state.indexOf("__ADF_SALVATAGGIO_ROTTO = { chiave"));
test("il server che non risponde lo dice a qualcuno",
  leggi("js/net/online.js").includes('new CustomEvent("adf:rete-staccata"') &&
  servizio.includes('window.addEventListener("adf:rete-staccata"'));
test("la pagina del 404 non sta piu' qui: la fa il middleware del backend",
  !fs.existsSync(path.join(ROOT, "404.html")) &&
  !build.includes("404.html") &&
  (() => {
    const R = require(path.join(ROOT, "..", "backend", "risposte.js"));
    return typeof R.PAGINE[404] === "function" &&
      R.PAGINE[404]({ dove: "/api/x" }).indexOf("/api/x") > 0;
  })());

console.log("\nPunto 27 — la landing, l'accesso e il gioco sono tre pagine");
test("le tre pagine stanno tutte in pagine/",
  ["landing","accesso","gioco"].every(n => fs.existsSync(path.join(ROOT, "pagine", n + ".html"))));
test("ognuna ha il <base href=\"../\">: da pagine/ i percorsi restano quelli di sempre",
  [landing, accesso, index].every(t => t.includes('<base href="../">')));
test("index.html è solo la porta d'ingresso: rimanda alla landing e non carica niente",
  porta.includes("pagine/landing.html") &&
  !/<script[^>]+src="(?!http)/.test(porta) &&
  !/<link[^>]+rel="stylesheet"[^>]+href="(?!http)/.test(porta));
test("la landing non si porta dietro il gioco: solo lo stato e le fasi",
  (() => {
    const suoi = [...landing.matchAll(/<script[^>]+src="(js\/[^"?]+)/g)].map(m => m[1])
      .filter(f => f.startsWith("js/game/"));
    if(suoi.some(f => f !== "js/game/state.js" && f !== "js/game/phases.js")) console.log("      " + suoi.join(", "));
    return suoi.every(f => f === "js/game/state.js" || f === "js/game/phases.js");
  })());
test("nella pagina del gioco la landing non c'è più",
  !index.includes('id="s-menu"') && !index.includes('class="land"') &&
  !index.includes('<script src="js/landing.js') && !index.includes('<script src="js/avvio.js'));
test("nella landing il gioco non c'è più",
  !landing.includes('id="s-hub"') && !landing.includes('id="s-profile"') &&
  !landing.includes('<script src="js/game/hub.js'));
test("i nomi dei file delle pagine stanno scritti in un posto solo (js/pagine.js)",
  (() => {
    /* nei commenti si possono nominare quanto si vuole — anzi, è giusto che
       lo facciano. Quello che non deve succedere è che un altro file se li
       costruisca da sé: il giorno che cambiano nome (la demo monofile) si
       riscrive js/pagine.js e basta. */
    const senzaCommenti = t => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const altrove = elencaFile(path.join(ROOT, "js"))
      .filter(f => /\.js$/.test(f) && path.basename(f) !== "pagine.js")
      .filter(f => /pagine\/(landing|accesso|gioco)\.html/.test(senzaCommenti(fs.readFileSync(f, "utf8"))))
      .map(f => path.relative(ROOT, f));
    if(altrove.length) console.log("      " + altrove.join("\n      "));
    return altrove.length === 0;
  })());
test("il build impacchetta tutte e tre le pagine",
  build.includes('{ file: "pagine/landing.html"') &&
  build.includes('{ file: "pagine/accesso.html"') &&
  build.includes('{ file: "pagine/gioco.html"'));

console.log("\nPunti 24, 25, 28 — la via d'uscita, il nome della scheda, i beat gratis");
test("punto 24: la plancia ha un tasto «Menu» in chiaro, non solo il logo",
  index.includes('id="hb-menu"') && index.includes('data-adf-global="menu"') &&
  index.includes('id="hb-logo"') &&
  leggi("css/hub.css").includes(".pmenu {"));
test("punto 24: quel tasto salva prima di uscire, e se non può dice perché",
  menuSystem.includes("function uscitaRapida()") &&
  menuSystem.includes('adfGlobal === "menu") uscitaRapida()') &&
  menuSystem.includes("exitToMenu:uscitaRapida") &&
  (() => {
    const f = menuSystem.slice(menuSystem.indexOf("function uscitaRapida()"));
    const corpo = f.slice(0, f.indexOf("\n  }") + 4);
    return corpo.includes("checkpointNonSicuro()") && corpo.includes("scriviCheckpoint()") &&
      corpo.includes("tornaAlMenu()") && corpo.includes("apri()");
  })());
test("punto 25: la scheda non si chiama più «Disciplina»",
  hub.includes('["condizione", "Condizione"') &&
  hub.includes('HUB_VISTA === "condizione" ? vistaCondizione()') &&
  hub.includes("La tua condizione") &&
  !hub.includes('["disciplina"') && !hub.includes('class="ptit">Disciplina') &&
  tel.includes('HUB_VISTA = "condizione"'));
test("punto 28: girare a cercare beat non costa energia",
  /\{id:"beat", n:"Cerca un beat", e:0,/.test(actions));
test("punto 28: ma costa tempo, che è il freno vero",
  /beat:\s*120/.test(time) && hours.includes('beat:      {open:"13:00", close:"02:00"}'));
test("punto 28: una mossa da zero energia si scrive «gratis», non «0 energia»",
  ui.includes("(en2 ? '<i>' + en2 + '</i>energia' : 'gratis')"));

console.log("\nPunti 8 e 9 — l'agenda: gli appuntamenti e le notifiche");
test("punto 8: ogni evento della plancia ha il quadratino per segnarlo",
  hub.includes("function hubTastoAgenda(") &&
  hub.includes('hubTastoAgenda(e, "oggi")') &&
  index.includes('id="hb-eventi"') &&
  leggi("css/hub.css").includes(".pevseg {"));
test("punto 8: il tasto sta accanto alla card, non dentro al bottone",
  hub.includes('<div class="pevbox"') &&
  leggi("css/hub.css").includes(".pevbox {") &&
  !/pevseg[\s\S]{0,400}<\/button>[\s\S]{0,40}pevfoot/.test(hub));
test("punto 8: l'avviso arriva un quarto d'ora prima, e se il tempo è saltato lo dice",
  agenda.includes("const PREAVVISO = 15") &&
  agenda.includes("function controllaOggi(") &&
  agenda.includes("Fra poco: ") && agenda.includes("È cominciata: "));
test("punto 9: gli eventi della settimana ci sono, e sono sempre quelli per quella settimana",
  agenda.includes("const SETTIMANALI = [") &&
  agenda.includes("function settimanali(") &&
  agenda.includes("(Number(G.year) || 1) * 53") &&
  /* «sempre quelli» vuol dire che il seme è la settimana e non il caso:
     Math.random dentro a settimanali() li farebbe cambiare a ogni disegno */
  !/function settimanali[\s\S]{0,700}Math\.random/.test(agenda));
test("punto 9: l'avviso della settimana arriva la mattina del giorno stesso",
  agenda.includes("function controllaGiorno(") &&
  agenda.includes("ultimoGiorno") &&
  agenda.includes("Oggi: "));
test("l'agenda ascolta l'orologio del gioco, non un timer suo",
  agenda.includes('window.addEventListener("game-time:advanced"') &&
  !agenda.includes("setInterval"));
test("le notifiche dell'agenda finiscono nel centro notifiche che c'è già",
  agenda.includes("ADF_EVENTI.addNotification") &&
  !agenda.includes("notifications.unshift"));
test("gli appuntamenti stanno nel salvataggio, e le voci vecchie si buttano",
  state.includes("agenda:{voci:[], ultimoGiorno:0}") &&
  agenda.includes("function pulisci(") &&
  index.includes('js/game/agenda.js'));
test("l'app Agenda del telefono mostra quello che ti sei segnato",
  tel.includes("function segnatiInAgenda(") &&
  tel.includes("segnatiInAgenda() +") &&
  tel.includes("data-agendavia"));

console.log("\nPunto 7 — i file .md in cartelle con nomi coerenti");
test("in radice restano solo README, ROADMAP e CLAUDE",
  (() => {
    const fuori = fs.readdirSync(path.join(ROOT, ".."))
      .filter(f => /\.md$/i.test(f) && f !== "README.md" && f !== "ROADMAP.md")
      /* CLAUDE.md non e' un documento: e' la versione corta delle regole di lavoro,
         e sta in radice perche' e' li' che ogni sessione la va a leggere */
      .filter(f => f !== "CLAUDE.md")
      /* PROVARE.md e backend.md sono appunti locali, fuori da git apposta */
      .filter(f => f !== "PROVARE.md" && f !== "backend.md");
    if(fuori.length) console.log("      " + fuori.join(", "));
    return fuori.length === 0;
  })());
test("le due cartelle nuove ci sono, con dentro un README che dice cosa c'è",
  ["documentazione", "prompt"].every(d =>
    fs.existsSync(path.join(ROOT, "..", d, "README.md"))));
test("i file spostati sono dove dice il README di radice",
  ["documentazione/comandidelterminale.md", "documentazione/stili-interfaccia.md",
   "documentazione/problemi-riscontrati.md", "prompt/prompt-ambientazioni.md",
   "prompt/prompt-app-telefono.md"].every(f => fs.existsSync(path.join(ROOT, "..", f))));
test("nessun documento punta più ai vecchi percorsi in radice",
  (() => {
    const morti = [];
    const guarda = d => {
      for(const v of fs.readdirSync(d, {withFileTypes:true})){
        if(v.name === "node_modules" || v.name === ".git" || v.name === "dist" ||
           v.name === "registro-modifiche") continue;
        const f = path.join(d, v.name);
        if(v.isDirectory()){ guarda(f); continue; }
        if(!/\.(md|js|html)$/i.test(v.name)) continue;
        /* questo file no: i vecchi nomi ce li ha dentro apposta, per cercarli */
        if(v.name === "audit-regressioni.js") continue;
        const t = fs.readFileSync(f, "utf8");
        if(/\]\(\.\.?\/?(comandidelterminale|prompt-ambientazioni|prompt-app-telefono|problemi_riscontrati)\.md\)/.test(t) ||
           /\]\([^)]*stili%20interfaccia/.test(t)) morti.push(path.relative(path.join(ROOT, ".."), f));
      }
    };
    guarda(path.join(ROOT, ".."));
    if(morti.length) console.log("      " + morti.join("\n      "));
    return morti.length === 0;
  })());

console.log("\nLe regole di lavoro");
const RADICE = path.join(ROOT, "..");
test("stanno in documentazione/, e non piu' dentro a implementazioni/",
  fs.existsSync(path.join(RADICE, "documentazione", "come-si-lavora.md")) &&
  !fs.existsSync(path.join(RADICE, "implementazioni", "00-come-si-lavora.md")));
test("la versione corta e' in radice, dove ogni sessione la legge",
  fs.existsSync(path.join(RADICE, "CLAUDE.md")));
test("CLAUDE.md dice le cose che non si possono dimenticare",
  (() => {
    const t = fs.readFileSync(path.join(RADICE, "CLAUDE.md"), "utf8");
    /* il branch, la verifica giusta, il giro di fine task, i numeri che si spostano */
    const manca = ["task/", "npm run verifica", "segnala-problemi", "backend-allineato",
                   "registro-modifiche/"].filter(s => !t.includes(s));
    if(manca.length) console.log("      manca: " + manca.join(", "));
    return manca.length === 0;
  })());
test("il giro di fine task e' ancora acceso dopo il commit",
  (() => {
    const s = fs.readFileSync(path.join(RADICE, ".claude", "settings.json"), "utf8");
    return fs.existsSync(path.join(RADICE, "scripts", "dopo-la-task.js")) &&
           s.includes("dopo-la-task.js") && s.includes("PostToolUse");
  })());
test("nessun documento punta piu' al vecchio 00-come-si-lavora.md",
  (() => {
    const morti = [];
    const guarda = d => {
      for(const v of fs.readdirSync(d, {withFileTypes:true})){
        if(v.name === "node_modules" || v.name === ".git" || v.name === "dist" ||
           v.name === "registro-modifiche") continue;
        const f = path.join(d, v.name);
        if(v.isDirectory()){ guarda(f); continue; }
        if(!/\.(md|js)$/i.test(v.name)) continue;
        if(v.name === "audit-regressioni.js") continue;
        if(/\]\([^)]*00-come-si-lavora\.md\)/.test(fs.readFileSync(f, "utf8")))
          morti.push(path.relative(RADICE, f));
      }
    };
    guarda(RADICE);
    if(morti.length) console.log("      " + morti.join("\n      "));
    return morti.length === 0;
  })());

/* L'hover che resta acceso dopo il tocco. Su un telefono non esiste un
   «passarci sopra»: il browser lascia la riga accesa dopo il tap, e ti ritrovi
   la scheda evidenziata finché non tocchi da un'altra parte — sembra selezionata
   e non lo è. Ogni regola :hover del progetto vive dentro a
   `@media (hover:hover)`, così sul mouse resta identica e sul dito non parte.
   La prova: tolti i blocchi della gabbia, di :hover non deve restare niente. */
test("nessun :hover fuori da @media (hover:hover): sul telefono non resta acceso",
  (() => {
    const fuori = [];
    /* Non basta guardare `css/`: sei pezzi di grafica sono scritti dentro al
       JavaScript (la pastiglia del tempo, i tasti del pannello, il calendario,
       i post di LaFamegram, il carcere) e la prima passata li aveva saltati —
       e il controllo diceva «tutto a posto» lo stesso. Adesso guarda anche i
       file di codice che si portano dentro un foglio di stile. */
    const daGuardare = fs.readdirSync(path.join(ROOT, "css"))
      .filter(n => n.endsWith(".css")).map(n => "css/" + n)
      .concat(["js/game/tempo-controlli.js", "js/game/eventi-v2.js",
        "js/game/strada-crimine-ui.js", "js/menu-sistema.js",
        "js/game/telefono.js", "js/game/traphone16.js"]);
    for(const nome of daGuardare){
      const testo = leggi(nome);
      /* via i blocchi @media (hover:hover){...}, contando le graffe */
      let s = testo, i;
      while((i = s.search(/@media\s*\(\s*hover\s*:\s*hover\s*\)\s*\{/)) >= 0){
        let j = s.indexOf("{", i), d = 1, k = j + 1;
        while(k < s.length && d > 0){
          if(s[k] === "{") d++;
          else if(s[k] === "}") d--;
          k++;
        }
        s = s.slice(0, i) + s.slice(k);
      }
      /* i commenti non sono regole: possono nominare :hover liberamente */
      s = s.replace(/\/\*[\s\S]*?\*\//g, "");
      if(s.includes(":hover")) fuori.push(nome);
    }
    if(fuori.length) console.log("      " + fuori.join("\n      "));
    return fuori.length === 0;
  })());

for(const f of ["strumenti/build.js","strumenti/verifica-build.js","js/game/eventi-v2.js","js/game/eventi-tempo.js","js/game/telefono.js","js/game/actions.js","js/game/writer.js","js/game/hub.js","js/game/ui.js","js/game/orari.js","js/game/spostamenti.js","js/game/strada-crimine-ui.js","js/game/strada-crimine.js","js/game/tempo.js","js/game/tempo-controlli.js","js/menu-sistema.js","js/game/studio.js","js/game/studio-elementi.js","js/game/piazza.js","js/game/negozio.js","js/game/crime-caption.js","js/game/abilita.js","js/servizio.js","js/game/agenda.js"]){
  try{ new Function(leggi(f)); test(f + " compila", true); }
  catch(e){ test(f + " compila", false, e.message); }
}

console.log("\nRisultato: " + ok + " ok, " + no + " falliti");
process.exit(no ? 1 : 0);
