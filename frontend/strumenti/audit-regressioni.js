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
const writer = leggi("js/game/writer.js");
const hub = leggi("js/game/hub.js");
const hours = leggi("js/game/orari.js");
const crimeui = leggi("js/game/strada-crimine-ui.js");
const crime = leggi("js/game/strada-crimine.js");
const time = leggi("js/game/tempo.js");
const timeControls = leggi("js/game/tempo-controlli.js");
const index = leggi("index.html");
const cat = JSON.parse(leggi("js/game/eventi-master-1000-v1.2.13.json"));

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

console.log("\nBlocco 3 — carcere separato");
test("hub manda il detenuto alla schermata Carcere",
  hub.includes('G.strada && G.strada.arresto && typeof apriCarcere === "function"'));
test("orari non bloccano il carcere alle 08:00",
  hours.includes('id === "crimin" && G.strada && G.strada.arresto') &&
  hours.includes('jail:true'));
test("esiste una UI Carcere separata dal root criminale",
  crimeui.includes('function ensureJail()') &&
  crimeui.includes('jail.id="adf-jail"') &&
  crimeui.includes('window.apriCarcere=openJail'));
test("apriStrada reindirizza al carcere se detenuto",
  crimeui.includes('function open(){if(street().arresto)return openJail();'));
test("dopo l'esito Arrestato si esce dal giro e si apre il carcere",
  crimeui.includes('if(street().arresto&&!STRADA_SCENA){close();openJail()}'));
test("la UI carcere usa la pena esistente, non una seconda condanna",
  crimeui.includes('const a=street().arresto;') &&
  crimeui.includes('Number(a.settimane)') &&
  !crimeui.includes('carcereSettimane'));


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
  index.indexOf('js/game/tempo-controlli.js') > index.indexOf('js/game/eventi-tempo.js'));
test("esiste un solo controller globale del tempo",
  timeControls.includes('const ROOT_ID = "adf-time-controls"') &&
  timeControls.includes('window.ADF_TIME_CONTROLS=Object.freeze'));
test("controller si monta nella testata della finestra attiva",
  timeControls.includes('const HOSTS = [') &&
  timeControls.includes('head:".pbarra"') &&
  timeControls.includes('head:"#gtop .tline"') &&
  timeControls.includes('head:".pohead"') &&
  timeControls.includes('head:".nghead"') &&
  timeControls.includes('head:".topbar"') &&
  timeControls.includes('head:".adf-jail-top"'));
test("pannello resta ancorato sotto lo stesso blocco in alto a destra",
  timeControls.includes('right:var(--adf-time-right,14px)') &&
  timeControls.includes('top:calc(100% + 9px)'));
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
test("cambio giorno riusa il comando Fine giornata esistente",
  timeControls.includes('document.getElementById("g-advance")') &&
  timeControls.includes('official.click()'));
test("controller reagisce anche a finestre create dinamicamente",
  timeControls.includes('new MutationObserver'));

for(const f of ["strumenti/build.js","js/game/eventi-v2.js","js/game/telefono.js","js/game/actions.js","js/game/writer.js","js/game/hub.js","js/game/orari.js","js/game/strada-crimine-ui.js","js/game/strada-crimine.js","js/game/tempo.js","js/game/tempo-controlli.js"]){
  try{ new Function(leggi(f)); test(f + " compila", true); }
  catch(e){ test(f + " compila", false, e.message); }
}

console.log("\nRisultato: " + ok + " ok, " + no + " falliti");
process.exit(no ? 1 : 0);
