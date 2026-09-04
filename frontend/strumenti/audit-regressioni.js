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

const build = leggi("strumenti/build.js");
const ev = leggi("js/game/eventi-v2.js");
const tel = leggi("js/game/telefono.js");
const actions = leggi("js/game/actions.js");
const posto = leggi("js/game/posto.js");
const studio = leggi("js/game/studio.js");
const writer = leggi("js/game/writer.js");
const hub = leggi("js/game/hub.js");
const ui = leggi("js/game/ui.js");
const hours = leggi("js/game/orari.js");
const travel = leggi("js/game/spostamenti.js");
const crimeui = leggi("js/game/strada-crimine-ui.js");
const crime = leggi("js/game/strada-crimine.js");
const state = leggi("js/game/state.js");
const sim = leggi("js/game/sim.js");
const skip = leggi("js/game/skip.js");
const transfers = leggi("js/game/trasferte.js");
const time = leggi("js/game/tempo.js");
const timeControls = leggi("js/game/tempo-controlli.js");
const index = leggi("index.html");
const avvio = leggi("js/avvio.js");
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
test("verificatore dist controlla bundle, catalogo, media e demo",
  verifyBuild.includes("stile-[0-9a-f]{8}") &&
  verifyBuild.includes("gioco-[0-9a-f]{8}") &&
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
const s0 = tel.indexOf("function schermataMessaggi()");
const s1 = tel.indexOf("/* ---- Contatti", s0);
const msgScreen = s0 >= 0 && s1 > s0 ? tel.slice(s0,s1) : "";
test("schermata Messaggi non legge G.log", !!msgScreen && !msgScreen.includes("G.log"));
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
test("telefono compatto può aprire la stessa schermata Messaggi del PC",
  tel.includes('data-telapp="messaggi"') &&
  tel.includes("(TEL_APP ? schermataWrap(TEL_APP) : '')") &&
  tel.includes('if(!telPC()){ renderTelefonoVecchio(); return; }'));
test("G.log mobile è esplicitamente Notifiche",
  tel.includes('{id:"notifiche", n:"Notifiche"') &&
  tel.includes('g.log.length - (g.seenLog || 0)') &&
  /* punto 7: il bottone «Diario» non c'è più, il telefono chiama la funzione
     invece di simulare un click su un elemento che non esiste. */
  tel.includes('openDiary()'));
test("Vedi tutti i messaggi non apre più il Diario",
  mobilePhone.includes('data-telapp="messaggi"') &&
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

test("caricando una carriera arrestata si entra direttamente nel carcere",
  avvio.includes('const jailed=!!(G.strada&&G.strada.arresto)') &&
  avvio.includes('window.apriCarcere({direct:true,reason:"resume"})'));

test("avatar del detenuto usa ritratto reale con sbarre sovrapposte",
  crimeui.includes('id="adf-jail-portrait"') &&
  crimeui.includes('class="adf-jail-bars"') &&
  crimeui.includes('portrait.innerHTML=window.ARTIST_PORTRAIT()'));

test("carcere carica il registro dedicato prima della sua UI",
  index.includes('js/game/jail-backgrounds.js?v=1') &&
  index.indexOf('js/game/jail-backgrounds.js?v=1') < index.indexOf('js/game/strada-crimine-ui.js?v=3'));

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
  timeControls.includes('head:".qhead"') &&
  timeControls.includes('head:".pohead"') &&
  timeControls.includes('head:".nghead"') &&
  timeControls.includes('head:".topbar"') &&
  timeControls.includes('head:".adf-jail-top"'));
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

for(const f of ["strumenti/build.js","strumenti/verifica-build.js","js/game/eventi-v2.js","js/game/eventi-tempo.js","js/game/telefono.js","js/game/actions.js","js/game/writer.js","js/game/hub.js","js/game/ui.js","js/game/orari.js","js/game/spostamenti.js","js/game/strada-crimine-ui.js","js/game/strada-crimine.js","js/game/tempo.js","js/game/tempo-controlli.js","js/menu-sistema.js","js/game/studio.js"]){
  try{ new Function(leggi(f)); test(f + " compila", true); }
  catch(e){ test(f + " compila", false, e.message); }
}

console.log("\nRisultato: " + ok + " ok, " + no + " falliti");
process.exit(no ? 1 : 0);
