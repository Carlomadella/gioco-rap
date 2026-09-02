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

for(const f of ["strumenti/build.js","js/game/eventi-v2.js","js/game/telefono.js"]){
  try{ new Function(leggi(f)); test(f + " compila", true); }
  catch(e){ test(f + " compila", false, e.message); }
}

console.log("\nRisultato: " + ok + " ok, " + no + " falliti");
process.exit(no ? 1 : 0);
