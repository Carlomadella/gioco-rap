/* Il rapporto del simulatore di bilanciamento: legge `carriere.jsonl` e scrive
   `rapporto.md` (da leggere la mattina) e `rapporto.json` (le curve settimana per
   settimana, per strategia: mediana, 10° e 90° percentile).

   Le «curve rotte» sono controlli a soglia, scritti uno per uno qui sotto in SOSPETTI:
   non dicono che il bilanciamento è sbagliato, dicono dove guardare. Ognuno confronta le
   strategie fra loro, perché è il confronto che dice se una curva è storta — il `fermo`
   è il controllo: quello che gli cresce, cresce da solo. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const quantile = (v, q) => {
  const a = v.filter(x => typeof x === "number" && isFinite(x)).sort((x, y) => x - y);
  if(!a.length) return null;
  const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return Math.round((a[lo] + (a[hi] - a[lo]) * (i - lo)) * 10) / 10;
};
const med = v => quantile(v, .5);
const num = n => n == null ? "—" : Math.abs(n) >= 10000 ? Math.round(n).toLocaleString("it-IT") : String(n);
const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "—";
const somma = (tab, da) => { for(const [k, v] of Object.entries(da || {})) tab[k] = (tab[k] || 0) + v; };
/* una carriera interrotta chiude con una settimana `parziale` che ha solo i tempi */
const ultima = r => r.settimane.filter(s => !s.parziale).pop() || {};

const CURVE = ["fan", "soldi", "hype", "pezzi", "stream", "ben", "luc", "rep", "calore", "ms", "msSalto"];

function leggi(file){
  if(!fs.existsSync(file)) return [];
  const righe = [];
  for(const r of fs.readFileSync(file, "utf8").split("\n")){
    if(!r.trim()) continue;
    try{ righe.push(JSON.parse(r)); }catch(e){}
  }
  /* con --riprendi una carriera ripresa può comparire due volte: vale l'ultima */
  const per = new Map();
  for(const r of righe) per.set(r.n, r);
  return [...per.values()].sort((a, b) => a.n - b.n);
}

function perStrategia(carriere){
  const g = {};
  for(const r of carriere) (g[r.strategia] = g[r.strategia] || []).push(r);
  return g;
}

/* le curve: per ogni settimana, i quantili di ogni numero sulle carriere che ci sono arrivate */
function curve(lista){
  const perG = new Map();
  for(const r of lista) for(const s of r.settimane){
    if(!perG.has(s.g)) perG.set(s.g, []);
    perG.get(s.g).push(s);
  }
  return [...perG.keys()].sort((a, b) => a - b).map(g => {
    const ss = perG.get(g), riga = { g, carriere: ss.length };
    for(const k of CURVE){
      const v = ss.map(s => s[k]);
      riga[k] = { p10: quantile(v, .1), p50: quantile(v, .5), p90: quantile(v, .9) };
    }
    riga.inCarcere = ss.filter(s => s.carcere).length;
    riga.hypeAlTetto = ss.filter(s => s.hype >= s.hypeCap).length;
    riga.fasi = {};
    for(const s of ss) if(s.fase != null) riga.fasi[s.fase] = (riga.fasi[s.fase] || 0) + 1;
    return riga;
  });
}

function riassunto(lista){
  const fine = lista.map(ultima);
  const azioni = {}, rifiuti = {}, salti = {}, fasi = {}, abil = {};
  for(const r of lista){ somma(azioni, r.azioni); somma(rifiuti, r.rifiuti); somma(salti, r.salti); }
  for(const f of fine){
    fasi[f.fase] = (fasi[f.fase] || 0) + 1;
    for(const [k, v] of Object.entries(f.abilita || {})) (abil[k] = abil[k] || []).push(v);
  }
  const q = k => ({ p10: quantile(fine.map(f => f[k]), .1), p50: med(fine.map(f => f[k])), p90: quantile(fine.map(f => f[k]), .9) });
  return {
    carriere: lista.length,
    interrotte: lista.filter(r => r.interrotta).length,
    finite: lista.filter(r => r.settimane.some(s => s.finita)).length,
    conErroriJS: lista.filter(r => r.erroriJS.length || r.console.length).length,
    conInvarianti: lista.filter(r => r.invarianti.length).length,
    conBlocchi: lista.filter(r => r.blocchi.length).length,
    giorni: med(lista.map(r => r.giorni)),
    secondi: med(lista.map(r => r.secondi)),
    fine: Object.fromEntries(CURVE.map(k => [k, q(k)])),
    abilita: Object.fromEntries(Object.entries(abil).map(([k, v]) => [k, med(v)])),
    contratto: fine.filter(f => f.contratto).length,
    lavoro: fine.filter(f => f.lavoro).length,
    classifica: med(fine.map(f => f.classifica).filter(Boolean)),
    fasi, salti,
    colpi: med(lista.map(r => r.colpi)), arresti: med(lista.map(r => r.arresti)),
    giorniInCarcere: med(lista.map(r => r.giorniInCarcere)),
    eventi: med(lista.map(r => r.eventi)),
    azioni: Object.fromEntries(Object.entries(azioni).map(([k, v]) => [k, Math.round(v / lista.length * 10) / 10]).sort((a, b) => b[1] - a[1])),
    rifiuti: Object.fromEntries(Object.entries(rifiuti).map(([k, v]) => [k, Math.round(v / lista.length * 10) / 10]).sort((a, b) => b[1] - a[1]))
  };
}

/* I controlli. Ognuno torna una frase se trova qualcosa, null se no. `R` sono i
   riassunti per strategia, `C` le curve, `tutte` le carriere. */
const SOSPETTI = [
  function crescitaDaSola(R){
    if(!R.fermo || !R.musicista) return null;
    const f = R.fermo.fine.fan.p50, m = R.musicista.fine.fan.p50;
    if(f == null || m == null || m <= 0) return null;
    if(f >= m * .5) return `**I fan crescono da soli.** Chi non fa niente (\`fermo\`) chiude l'anno con ${num(f)} fan, il musicista con ${num(m)}: la metà della carriera arriva senza giocarla.`;
    return null;
  },
  function criminePagaTroppo(R){
    if(!R.criminale || !R.lavoratore) return null;
    const c = R.criminale.fine.soldi.p50, l = R.lavoratore.fine.soldi.p50;
    if(c == null || l == null) return null;
    if(c > Math.max(l, 500) * 3) return `**Il crimine paga troppo.** Il criminale chiude con € ${num(c)} di mediana, chi lavora tutti i giorni con € ${num(l)}.`;
    if(c < Math.min(l, 0) - 500) return `**Il crimine non paga mai.** Il criminale chiude con € ${num(c)}, chi lavora con € ${num(l)}: la Strada è solo un modo di perdere.`;
    return null;
  },
  function lavoroNonServe(R){
    if(!R.lavoratore || !R.fermo) return null;
    const l = R.lavoratore.fine.soldi.p50, f = R.fermo.fine.soldi.p50;
    if(l == null || f == null) return null;
    if(l <= f + 200) return `**Lavorare non rende.** Chi fa il turno tutti i giorni chiude con € ${num(l)}, chi sta fermo con € ${num(f)}.`;
    return null;
  },
  function promoNonServe(R){
    if(!R.promo || !R.musicista) return null;
    const p = R.promo.fine.fan.p50, m = R.musicista.fine.fan.p50;
    if(p == null || m == null) return null;
    if(m > 0 && p < m * .6) return `**La promo non spinge.** Chi fa promo ogni giorno chiude con ${num(p)} fan, il musicista con ${num(m)}: spingere pesa meno che fare pezzi, di parecchio.`;
    if(m > 0 && p > m * 3) return `**La promo schiaccia la musica.** Chi fa promo chiude con ${num(p)} fan, il musicista con ${num(m)}: conviene pubblicare il minimo e spingere.`;
    return null;
  },
  function soldiSottoZero(R){
    const s = Object.entries(R).filter(([, r]) => r.fine.soldi.p50 != null && r.fine.soldi.p50 < 0).map(([k, r]) => `\`${k}\` (€ ${num(r.fine.soldi.p50)})`);
    return s.length ? `**Si finisce l'anno in rosso.** Mediana dei soldi sotto zero per ${s.join(", ")}.` : null;
  },
  function soldiEsplodono(R){
    const s = Object.entries(R).filter(([, r]) => r.fine.soldi.p50 != null && r.fine.soldi.p50 > 50000).map(([k, r]) => `\`${k}\` (€ ${num(r.fine.soldi.p50)})`);
    return s.length ? `**I soldi scappano.** Dopo un anno la mediana supera i 50.000 € per ${s.join(", ")}: in provincia è troppo.` : null;
  },
  function hypeAlTetto(R, C){
    const s = [];
    for(const [k, cc] of Object.entries(C)){
      const tot = cc.reduce((a, r) => a + r.carriere, 0), tetto = cc.reduce((a, r) => a + r.hypeAlTetto, 0);
      if(tot && tetto / tot > .4) s.push(`\`${k}\` (${pct(tetto, tot)} delle settimane)`);
    }
    return s.length ? `**L'hype sta sempre al tetto.** ${s.join(", ")}: il tetto per fase lavora al posto della curva.` : null;
  },
  function piatto(R, C){
    const s = [];
    for(const k of ["musicista", "promo"]){
      const cc = C[k];
      if(!cc || cc.length < 8) continue;
      const a = cc[Math.floor(cc.length * .75)].fan.p50, b = cc[cc.length - 1].fan.p50;
      if(a > 100 && b != null && b < a * 1.05) s.push(`\`${k}\` (${num(a)} → ${num(b)})`);
    }
    return s.length ? `**L'ultimo trimestre è piatto.** I fan non crescono più nelle ultime settimane per ${s.join(", ")}: manca qualcosa da inseguire.` : null;
  },
  function abilitaAlMassimo(R){
    const s = [];
    for(const [k, r] of Object.entries(R)) for(const [a, v] of Object.entries(r.abilita)) if(v >= 85) s.push(`\`${k}\` ${a} ${v}`);
    return s.length ? `**Abilità già al massimo in un anno.** ${s.join(", ")}: il tetto è 88, dopo non si sale più.` : null;
  },
  function benessereFermo(R){
    const s = Object.entries(R).filter(([, r]) => { const b = r.fine.ben; return b.p90 != null && (b.p90 <= 5 || b.p10 >= 95); })
      .map(([k, r]) => `\`${k}\` (${r.fine.ben.p10}–${r.fine.ben.p90})`);
    return s.length ? `**Il benessere sta incollato a un estremo.** ${s.join(", ")}.` : null;
  },
  function fortunaComanda(R){
    const s = [];
    for(const [k, r] of Object.entries(R)){
      const f = r.fine.fan;
      if(r.carriere >= 10 && f.p10 != null && f.p90 > 200 && f.p90 > Math.max(f.p10, 1) * 20) s.push(`\`${k}\` (${num(f.p10)} contro ${num(f.p90)})`);
    }
    return s.length ? `**Comanda la fortuna.** Con la stessa strategia, fra le carriere peggiori e le migliori i fan cambiano di più di venti volte: ${s.join(", ")}.` : null;
  },
  function carcereInfinito(R){
    const c = R.criminale;
    if(!c || c.giorniInCarcere == null) return null;
    if(c.giorniInCarcere > 120) return `**Il criminale vive in carcere.** Mediana ${c.giorniInCarcere} giorni dentro su un anno.`;
    if(c.colpi != null && c.colpi > 30 && c.arresti === 0) return `**Non ti prendono mai.** Il criminale fa ${c.colpi} colpi di mediana e zero arresti.`;
    return null;
  },
  function azioniMai(R){
    const s = [];
    for(const [k, r] of Object.entries(R)){
      const riuscite = new Set(Object.keys(r.azioni));
      const per = {};
      for(const [chiave, v] of Object.entries(r.rifiuti)){
        const id = chiave.split(" · ")[0];
        if(id === "colpo") continue;
        per[id] = (per[id] || 0) + v;
      }
      for(const [id, v] of Object.entries(per)) if(v >= 20 && !riuscite.has(id)) s.push(`\`${k}\` non riesce mai «${id}» (${v} tentativi a carriera)`);
    }
    return s.length ? `**Azioni che non partono mai.** ${s.join("; ")}. Guarda i rifiuti qui sotto per il perché.` : null;
  },
  /* non è bilanciamento, ma si vede solo così: un «+1» che a fine anno costa molto più
     che all'inizio vuol dire che qualcosa nel salvataggio cresce senza tetto. Si guarda il
     «+1» da solo (msSalto): la giornata intera conta anche le mosse del bot, che crescono
     con la carriera per conto loro. Le righe vecchie, senza msSalto, usano la giornata. */
  function rallenta(R, C){
    const s = [];
    for(const [k, cc] of Object.entries(C)){
      const salto = cc.some(r => r.msSalto && r.msSalto.p50 != null);
      const c = salto ? "msSalto" : "ms";
      const t = cc.filter(r => r[c] && r[c].p50 != null);
      if(t.length < 8) continue;
      const a = med(t.slice(0, 4).map(r => r[c].p50)), b = med(t.slice(-4).map(r => r[c].p50));
      if(b > (salto ? 500 : 1000) && b > a * 2) s.push(`\`${k}\` (${num(a)} → ${num(b)} ms ${salto ? "per il «+1»" : "a giornata, bot compreso"})`);
    }
    return s.length ? `**Il gioco rallenta col passare della carriera.** ${s.join(", ")}: qualcosa cresce senza tetto, e prima o poi un giorno non torna più.` : null;
  },
  function nessunContratto(R){
    const r = R.musicista;
    if(!r || r.carriere < 10) return null;
    return r.contratto === 0 ? `**Nessun contratto in un anno.** Neanche un musicista su ${r.carriere} ne firma uno.` : null;
  }
];

function tabella(intest, righe){
  return ["| " + intest.join(" | ") + " |", "| " + intest.map(() => "---").join(" | ") + " |", ...righe.map(r => "| " + r.join(" | ") + " |")].join("\n");
}

function scriviRapporto(file, cartella, opz){
  opz = opz || {};
  const tutte = leggi(file);
  if(!tutte.length) return "Rapporto: nessuna carriera in " + file + ".";
  const G = perStrategia(tutte);
  const R = {}, C = {};
  for(const [k, l] of Object.entries(G)){ R[k] = riassunto(l); C[k] = curve(l); }
  const trovati = SOSPETTI.map(f => { try{ return f(R, C, tutte); }catch(e){ return `(il controllo ${f.name} è andato in errore: ${e.message})`; } }).filter(Boolean);

  const errori = {}, invar = {}, blocchi = {};
  for(const r of tutte){
    for(const e of r.erroriJS.concat(r.console)) errori[e.m] = (errori[e.m] || []).concat(r.n);
    for(const i of r.invarianti) for(const p of i.p) invar[p.replace(/-?\d+(\.\d+)?/g, "N")] = (invar[p.replace(/-?\d+(\.\d+)?/g, "N")] || new Set()).add(r.n);
    for(const b of r.blocchi) for(const x of b.x) blocchi[x] = (blocchi[x] || new Set()).add(r.n);
  }
  const interrotte = tutte.filter(r => r.interrotta);
  const nomi = Object.keys(R);
  const riga = (k, f) => nomi.map(n => f(R[n], n));

  const md = [];
  md.push("# Simulatore di bilanciamento — il rapporto", "");
  md.push(`*${tutte.length} carriere da ${med(tutte.map(r => r.giorni))} giorni, scritto il ${new Date().toLocaleString("it-IT")}. ` +
    `Le cifre sono mediane a fine carriera; fra parentesi il 10° e il 90° percentile.*`, "");

  md.push("## Le curve che sembrano rotte", "");
  md.push(trovati.length ? trovati.map(t => "- " + t).join("\n") : "Nessuna soglia superata. Non vuol dire che il bilanciamento è giusto: vuol dire che le strategie si separano come ci si aspetta.", "");

  md.push("## Le cose rotte davvero", "");
  const rotte = [];
  if(interrotte.length) rotte.push(`- **${interrotte.length} carriere interrotte**: ` + interrotte.slice(0, 8).map(r => `#${r.n} (${r.note.join("; ")})`).join(", "));
  for(const [m, ns] of Object.entries(errori).sort((a, b) => b[1].length - a[1].length).slice(0, 10))
    rotte.push(`- errore JS in ${ns.length} carriere (${ns.slice(0, 5).map(n => "#" + n).join(" ")}): \`${m.slice(0, 160)}\``);
  for(const [p, ns] of Object.entries(invar).sort((a, b) => b[1].size - a[1].size).slice(0, 10))
    rotte.push(`- invariante saltata in ${ns.size} carriere (${[...ns].slice(0, 5).map(n => "#" + n).join(" ")}): ${p}`);
  for(const [b, ns] of Object.entries(blocchi).sort((a, b) => b[1].size - a[1].size).slice(0, 10))
    rotte.push(`- blocco in ${ns.size} carriere (${[...ns].slice(0, 5).map(n => "#" + n).join(" ")}): ${b}`);
  md.push(rotte.length ? rotte.join("\n") : "Niente: nessun errore JS, nessuna invariante saltata, nessun giorno che non si chiude.", "");
  md.push("Una carriera si rigioca uguale col suo numero: `npm run bilanciamento -- --sola N` rigioca la carriera N da sola, in una cartella sua: questo rapporto resta com'è.", "");

  md.push("## Le strategie a fine anno", "");
  const q3 = x => x.p50 == null ? "—" : `${num(x.p50)} (${num(x.p10)}–${num(x.p90)})`;
  md.push(tabella(["", ...nomi], [
    ["carriere", ...riga(0, r => r.carriere + (r.interrotte ? ` (${r.interrotte} interrotte)` : ""))],
    ["fan", ...riga(0, r => q3(r.fine.fan))],
    ["soldi €", ...riga(0, r => q3(r.fine.soldi))],
    ["hype", ...riga(0, r => q3(r.fine.hype))],
    ["pezzi fuori", ...riga(0, r => q3(r.fine.pezzi))],
    ["stream (ultima sett.)", ...riga(0, r => q3(r.fine.stream))],
    ["benessere", ...riga(0, r => q3(r.fine.ben))],
    ["lucidità", ...riga(0, r => q3(r.fine.luc))],
    ["reputazione Strada", ...riga(0, r => q3(r.fine.rep))],
    ["fasi raggiunte", ...riga(0, r => Object.entries(r.fasi).map(([f, n]) => `${f}: ${n}`).join(", "))],
    ["con contratto", ...riga(0, r => pct(r.contratto, r.carriere))],
    ["con un lavoro", ...riga(0, r => pct(r.lavoro, r.carriere))],
    ["miglior classifica", ...riga(0, r => num(r.classifica))],
    ["colpi · arresti · giorni dentro", ...riga(0, r => `${num(r.colpi)} · ${num(r.arresti)} · ${num(r.giorniInCarcere)}`)],
    ["eventi risposti", ...riga(0, r => num(r.eventi))],
    ["giornate chiuse male", ...riga(0, r => Object.entries(r.salti).filter(([k]) => k !== "ok").map(([k, v]) => `${k}: ${v}`).join(", ") || "—")],
    ["secondi a carriera", ...riga(0, r => num(r.secondi))],
    ["ms a giornata, inizio → fine", ...nomi.map(n => { const t = C[n].filter(r => r.ms.p50 != null); return t.length ? `${num(t[0].ms.p50)} → ${num(t[t.length - 1].ms.p50)}` : "—"; })],
    ["ms del «+1», inizio → fine", ...nomi.map(n => { const t = C[n].filter(r => r.msSalto && r.msSalto.p50 != null); return t.length ? `${num(t[0].msSalto.p50)} → ${num(t[t.length - 1].msSalto.p50)}` : "—"; })]
  ]), "");

  md.push("### Abilità a fine anno (mediana)", "");
  const abil = [...new Set(nomi.flatMap(n => Object.keys(R[n].abilita)))];
  md.push(tabella(["", ...nomi], abil.map(a => [a, ...riga(0, r => num(r.abilita[a]))])), "");

  md.push("## Le curve, un mese alla volta", "", "Mediana dei fan e dei soldi ogni quattro settimane.", "");
  const settimane = [...new Set(nomi.flatMap(n => C[n].map(r => r.g)))].sort((a, b) => a - b).filter((g, i, a) => i % 4 === 3 || i === a.length - 1);
  const alla = (n, g, k) => { const r = C[n].find(x => x.g === g); return r ? num(r[k].p50) : "—"; };
  md.push(tabella(["giorno", ...nomi.map(n => n + " fan"), ...nomi.map(n => n + " €")],
    settimane.map(g => [String(g), ...nomi.map(n => alla(n, g, "fan")), ...nomi.map(n => alla(n, g, "soldi"))])), "");

  md.push("## Cosa fanno, e cosa non riescono a fare", "", "Media a carriera. I rifiuti sono il gioco che dice di no: orario, energia, soldi, posto.", "");
  for(const n of nomi){
    const az = Object.entries(R[n].azioni).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ");
    const ri = Object.entries(R[n].rifiuti).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(", ");
    md.push(`- **${n}** — fa: ${az || "niente"}.  \n  rifiuti: ${ri || "nessuno"}.`);
  }
  md.push("", "---", "", "Le curve settimana per settimana (10°, 50° e 90° percentile) sono in `rapporto.json`. " +
    "Le soglie dei sospetti stanno in `strumenti/bilanciamento/rapporto.js`, una funzione per controllo.");

  fs.mkdirSync(cartella, { recursive: true });
  fs.writeFileSync(path.join(cartella, "rapporto.md"), md.join("\n") + "\n");
  fs.writeFileSync(path.join(cartella, "rapporto.json"), JSON.stringify({ scritto: new Date().toISOString(), carriere: tutte.length, sospetti: trovati, strategie: R, curve: C }, null, 1));
  return `Rapporto: ${path.join(cartella, "rapporto.md")} — ${tutte.length} carriere, ${trovati.length} curve sospette` +
    (interrotte.length ? `, ${interrotte.length} carriere interrotte` : "") + (Object.keys(errori).length ? `, ${Object.keys(errori).length} errori JS diversi` : "") + ".";
}

module.exports = { scriviRapporto, leggi, SOSPETTI };
