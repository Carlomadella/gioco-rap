/* Il simulatore di bilanciamento: mille carriere da un anno, per vedere quali curve
   sono rotte.

     npm run bilanciamento                                  mille carriere da un anno
     npm run bilanciamento -- --carriere 60 --giorni 120    un giro corto, per provare
     npm run bilanciamento -- --riprendi                    riparte da dove si era fermato
     npm run bilanciamento -- --solo-rapporto               rifà il rapporto dai risultati
     npm run bilanciamento -- --sola 17                     rigioca la carriera 17, uguale,
                                                            in test-results/bilanciamento-sola-17

   Una carriera alla volta: un anno dura da due minuti e mezzo (chi fa crimini, chi sta
   fermo, chi fa a caso) a tredici (chi lavora), quindi una notte ne fa un centinaio e le mille si chiudono in più notti,
   ognuna con --riprendi. In parallelo (29/09/2026, otto alla volta) dopo una trentina di
   carriere le pagine si fermavano o si ricaricavano a metà: --lavoratori N c'è ancora,
   ma i risultati di quel giro non erano da fidarsi.

   Opzioni: --carriere N (1000) · --giorni N (364) · --lavoratori N (1)
   · --strategie musicista,promo,… (tutte) · --seme N (1) · --porta N (8124)
   · --uscita cartella (test-results/bilanciamento, dentro a frontend/: git la ignora).

   Il giocatore lo fa strumenti/bilanciamento/bot.js, dentro al browser vero: è il bot
   del giro di un anno del 27/09/2026, con una strategia per carriera (chi lavora, chi
   spinge la promo, chi fa crimini, chi sta fermo, chi fa a caso, il musicista del giro).
   Le strategie si alternano carriera dopo carriera, ognuna col suo seme: la carriera 17
   si rigioca uguale con --seme 1.

   Ogni carriera finita è una riga di `carriere.jsonl`, scritta subito: se la notte si
   interrompe, --riprendi salta quelle già fatte. Alla fine strumenti/bilanciamento/
   rapporto.js legge tutte le righe e scrive `rapporto.md` (da leggere la mattina) e
   `rapporto.json` (le curve settimana per settimana).

   Gira su una porta sua con --playwright, come le prove: la 8000 è quella del
   `npm run dev` di chi lavora, e il watcher farebbe ricaricare le pagine a metà.
   Non entra in `npm run verifica`: dura ore. */
"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { installaBot } = require("./bilanciamento/bot.js");
const { scriviRapporto } = require("./bilanciamento/rapporto.js");

const RADICE = path.resolve(__dirname, "..");
const arg = (nome, def) => { const i = process.argv.indexOf(nome); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def; };
const flag = nome => process.argv.includes(nome);

const CARRIERE = Number(arg("--carriere", 1000));
const GIORNI = Number(arg("--giorni", 364));
const LAVORATORI = Math.max(1, Number(arg("--lavoratori", 1)));
const SEME = Number(arg("--seme", 1));
const PORTA = Number(arg("--porta", 8124));
const SOLA = Number(arg("--sola", 0));
const USCITA = path.resolve(RADICE, arg("--uscita", SOLA ? "test-results/bilanciamento-sola-" + SOLA : "test-results/bilanciamento"));
const RIGHE = path.join(USCITA, "carriere.jsonl");
const TUTTE = ["musicista", "lavoratore", "promo", "criminale", "fermo", "caso"];
const STRATEGIE = arg("--strategie", TUTTE.join(",")).split(",").map(s => s.trim()).filter(Boolean);
const TEMPO_GIORNO = 60000;   // un giorno che non torna in un minuto è un blocco, non lentezza

const pausa = ms => new Promise(r => setTimeout(r, ms));
const oraBreve = ms => { const s = Math.round(ms / 1000); return Math.floor(s / 3600) + "h" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + "m"; };

for(const s of STRATEGIE) if(!TUTTE.includes(s)){ console.error("Strategia sconosciuta: " + s + " (ci sono " + TUTTE.join(", ") + ")"); process.exit(2); }

function giaFatte(){
  if(!fs.existsSync(RIGHE)) return new Set();
  return new Set(fs.readFileSync(RIGHE, "utf8").split("\n").filter(Boolean).map(r => { try{ return JSON.parse(r).n; }catch(e){ return null; } }));
}

async function avviaServer(){
  const srv = spawn(process.execPath, ["strumenti/dev.js", "--porta", String(PORTA), "--playwright"], { cwd: RADICE, stdio: "ignore" });
  for(let i = 0; i < 120; i++){
    try{ const r = await fetch(`http://127.0.0.1:${PORTA}/pagine/gioco.html`); if(r.ok) return srv; }catch(e){}
    await pausa(250);
  }
  srv.kill();
  throw new Error("il server sulla porta " + PORTA + " non risponde (è occupata?)");
}

/* una carriera intera su una pagina già aperta */
async function carriera(page, n, strategia){
  const seme = SEME * 100003 + n;
  const rec = { n, strategia, seme, giorni: 0, settimane: [], azioni: {}, rifiuti: {}, erroriJS: [], console: [],
    blocchi: [], invarianti: [], salti: {}, eventi: 0, colpi: 0, arresti: 0, giorniInCarcere: 0, note: [] };
  const suErrore = e => { if(rec.erroriJS.length < 20) rec.erroriJS.push({ g: rec.giorni, m: e.message.slice(0, 300) }); };
  const suConsole = m => { if(m.type() === "error" && rec.console.length < 20) rec.console.push({ g: rec.giorni, m: m.text().slice(0, 300) }); };
  page.on("pageerror", suErrore);
  page.on("console", suConsole);
  const t0 = Date.now();
  let msSett = [], msSalti = [];
  try{
    await page.goto(`http://127.0.0.1:${PORTA}/pagine/gioco.html`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    /* ACTIONS è un const globale, non una proprietà di window */
    await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP && typeof ACTIONS !== "undefined", null, { timeout: 60000 });
    await page.evaluate(installaBot);
    await page.evaluate(seme => { __SIM.semina(seme); GAME.enter(); }, seme);
    await pausa(300);
    for(let g = 1; g <= GIORNI; g++){
      rec.giorni = g;
      const tg = Date.now();
      let timer;
      const sc = await Promise.race([
        page.evaluate(([s, g]) => __SIM.giorno(s, g), [strategia, g]),
        new Promise((_, no) => { timer = setTimeout(() => no(new Error("giorno " + g + " fermo da un minuto")), TEMPO_GIORNO); })
      ]).finally(() => clearTimeout(timer));
      for(const [k, v] of Object.entries(sc.azioni)) rec.azioni[k] = (rec.azioni[k] || 0) + v;
      for(const [k, v] of Object.entries(sc.rifiuti)) rec.rifiuti[k] = (rec.rifiuti[k] || 0) + v;
      rec.salti[sc.salto] = (rec.salti[sc.salto] || 0) + 1;
      rec.eventi += sc.eventi; rec.colpi += sc.colpi; rec.arresti += sc.arresti;
      if(sc.foto.carcere) rec.giorniInCarcere++;
      if(sc.blocchi.length && rec.blocchi.length < 30) rec.blocchi.push({ g, x: sc.blocchi.slice(0, 3) });
      if(sc.salto === "bloccato" && rec.blocchi.length < 30) rec.blocchi.push({ g, x: ["il «+1» non chiude la giornata"] });
      if(sc.invarianti.length && rec.invarianti.length < 30) rec.invarianti.push({ g, p: sc.invarianti.slice(0, 5) });
      /* quanto dura una giornata vera: se cresce con la carriera, il gioco rallenta */
      msSett.push(Date.now() - tg);
      msSalti.push(sc.msSalto || 0);
      if(g % 7 === 0 || g === GIORNI){
        rec.settimane.push({ g, ...sc.foto, ms: Math.round(msSett.reduce((a, b) => a + b, 0) / msSett.length), msMax: Math.max(...msSett),
          msSalto: Math.round(msSalti.reduce((a, b) => a + b, 0) / msSalti.length) });
        msSett = []; msSalti = [];
      }
      if(sc.foto.finita){ rec.note.push("partita finita al giorno " + g); break; }
    }
  }catch(e){
    rec.note.push("carriera interrotta: " + e.message.split("\n")[0]);
    if(msSett.length) rec.settimane.push({ g: rec.giorni, ms: Math.round(msSett.reduce((a, b) => a + b, 0) / msSett.length), msMax: Math.max(...msSett), parziale: true });
    rec.interrotta = true;
  }finally{
    page.off("pageerror", suErrore);
    page.off("console", suConsole);
  }
  rec.secondi = Math.round((Date.now() - t0) / 1000);
  return rec;
}

(async () => {
  fs.mkdirSync(USCITA, { recursive: true });
  if(flag("--solo-rapporto")){ console.log(scriviRapporto(RIGHE, USCITA, { giorni: GIORNI })); return; }
  if(!flag("--riprendi") && fs.existsSync(RIGHE)) fs.renameSync(RIGHE, RIGHE.replace(/\.jsonl$/, "-" + Date.now() + ".jsonl"));

  const fatte = giaFatte();
  const coda = [];
  if(SOLA) coda.push(SOLA);
  else for(let n = 1; n <= CARRIERE; n++) if(!fatte.has(n)) coda.push(n);
  console.log(`Simulatore di bilanciamento: ${coda.length} carriere da ${GIORNI} giorni (${fatte.size} già fatte), ` +
    `${LAVORATORI} alla volta, strategie ${STRATEGIE.join(", ")}.`);

  const { chromium } = require("@playwright/test");
  const srv = await avviaServer();
  const browser = await chromium.launch();
  const t0 = Date.now();
  let finite = 0;
  const chiudi = async () => { try{ await browser.close(); }catch(e){} srv.kill(); };
  process.on("SIGINT", async () => { console.log("\nFermato: con --riprendi riparte da qui."); await chiudi(); process.exit(130); });

  async function lavoratore(){
    let ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 860 } });
    let page = await ctx.newPage();
    while(coda.length){
      const n = coda.shift();
      const strategia = STRATEGIE[(n - 1) % STRATEGIE.length];
      const rec = await carriera(page, n, strategia);
      fs.appendFileSync(RIGHE, JSON.stringify(rec) + "\n");
      finite++;
      const ultima = rec.settimane.filter(s => !s.parziale).pop() || {};
      const eta = (Date.now() - t0) / finite * coda.length / 1;
      console.log(`#${n} ${strategia.padEnd(10)} ${rec.secondi}s  fan ${ultima.fan}  € ${ultima.soldi}  fase ${ultima.fase}` +
        (rec.erroriJS.length ? `  errori JS ${rec.erroriJS.length}` : "") + (rec.interrotta ? "  INTERROTTA" : "") +
        `   [${finite} fatte, ne mancano ${coda.length}, ~${oraBreve(eta)}]`);
      /* una pagina che ha visto un blocco non si riusa: contesto nuovo */
      if(rec.interrotta){ try{ await ctx.close(); }catch(e){} ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 860 } }); page = await ctx.newPage(); }
    }
    await ctx.close();
  }

  try{
    await Promise.all(Array.from({ length: LAVORATORI }, lavoratore));
  }finally{
    await chiudi();
  }
  console.log(`Finito in ${oraBreve(Date.now() - t0)}.`);
  console.log(scriviRapporto(RIGHE, USCITA, { giorni: GIORNI }));
})().catch(e => { console.error("Simulatore fermo:", e); process.exit(1); });
