/* Il foglio: scrittura delle barre, rime, metrica, punteggio. */
"use strict";

/* ==================== IL FOGLIO: SCRIVI TU LE BARRE ==================== */
const TEMI = [
  {t:"Quello che non hai", d:"Le cose che ti mancano e che nomini per non pensarci.", k:["soldi","niente","vuoto","fame","zero","manca","tasca","freddo"]},
  {t:"Il quartiere", d:"Le strade, i palazzi, la gente che ci è rimasta.", k:["strada","quartiere","palazzo","piazza","cortile","citta","muro","panchina"]},
  {t:"Chi ti ha detto di lasciar perdere", d:"Le facce che non ci credevano. Rispondi a loro.", k:["nessuno","dicevano","ridere","sbagliato","ora","adesso","guarda","credeva"]},
  {t:"Le notti sveglio", d:"Le ore in cui non dormi e scrivi.", k:["notte","sonno","buio","ore","insonnia","sveglio","alba","luce"]},
  {t:"Tua madre", d:"Quello che non le hai mai detto in faccia.", k:["madre","mamma","casa","cucina","mani","preoccupa","aspetta","figlio"]},
  {t:"I soldi che ancora non ci sono", d:"Il conto, l'affitto, il lavoro che odi.", k:["affitto","conto","lavoro","turno","paga","banca","euro","debito"]},
  {t:"Chi ti sta intorno", d:"Chi c'era prima e chi è arrivato dopo.", k:["amici","fratelli","crew","gente","dietro","davanti","soli","insieme"]}
];

const VOC = "aeiouàáèéìíòóùú";
function sillabe(riga){
  const ws = (riga.toLowerCase().match(/[a-zàáèéìíòóùú']+/g) || []);
  let n = 0;
  for(const w of ws){
    const g = w.match(new RegExp("[" + VOC + "]+", "g")) || [];
    let c = 0;
    for(const grp of g) c += grp.length >= 3 ? 2 : 1;
    n += Math.max(1, c);
  }
  return n;
}
function pulisci(w){
  return w.toLowerCase().replace(/[àá]/g,"a").replace(/[èé]/g,"e").replace(/[ìí]/g,"i")
    .replace(/[òó]/g,"o").replace(/[ùú]/g,"u").replace(/[^a-z]/g,"");
}
function ultimaParola(riga){
  const ws = (riga.toLowerCase().match(/[a-zàáèéìíòóùú']+/g) || []);
  return ws.length ? pulisci(ws[ws.length-1]) : "";
}
/* quanto rimano due finali: 1 rima piena, .6 rima sporca, .35 assonanza, .12 stessa parola */
function quantoRima(a, b){
  if(!a || !b) return 0;
  if(a === b) return .12;
  if(a.length >= 3 && b.length >= 3 && a.slice(-3) === b.slice(-3)) return 1;
  if(a.slice(-2) === b.slice(-2)) return .6;
  const va = (a.match(/[aeiou]/g)||[]).slice(-2).join(""), vb = (b.match(/[aeiou]/g)||[]).slice(-2).join("");
  if(va && va === vb) return .35;
  if(a.slice(-1) === b.slice(-1) && VOC.indexOf(a.slice(-1)) >= 0) return .2;
  return 0;
}

function analizza(righe, tema){
  const vive = righe.map(r => r.trim()).filter(r => r.length > 1);
  const fin = vive.map(ultimaParola);
  const sil = vive.map(sillabe);

  // rime: per ogni riga il legame migliore con un'altra
  const gruppi = fin.map(() => 0);
  let rimaTot = 0, lettera = 0;
  const lett = "ABCDEFGH";
  for(let i=0;i<fin.length;i++){
    let best = 0, bestJ = -1;
    for(let j=0;j<fin.length;j++){
      if(i === j) continue;
      const v = quantoRima(fin[i], fin[j]);
      if(v > best){ best = v; bestJ = j; }
    }
    rimaTot += best;
    if(best >= .35){
      if(gruppi[bestJ]) gruppi[i] = gruppi[bestJ];
      else { lettera++; gruppi[i] = lettera; gruppi[bestJ] = lettera; }
    }
  }
  const rima = vive.length > 1 ? clamp(rimaTot / vive.length, 0, 1) : 0;

  // metrica: quanto sono regolari le righe
  const media = sil.reduce((a,b) => a+b, 0) / Math.max(1, sil.length);
  const scarto = sil.reduce((a,b) => a + Math.abs(b - media), 0) / Math.max(1, sil.length);
  let metrica = clamp(1 - scarto/4.2, 0, 1);
  if(media < 5) metrica *= media/5;           // righe troppo corte non contano
  if(vive.length < 4) metrica *= 0.75;

  // parole: varietà e sostanza
  const tutte = vive.join(" ").toLowerCase().match(/[a-zàáèéìíòóùú']+/g) || [];
  const uniche = new Set(tutte.map(pulisci));
  const varieta = tutte.length ? uniche.size / tutte.length : 0;
  const lung = tutte.length ? tutte.reduce((a,w) => a + w.length, 0) / tutte.length : 0;
  let parole = clamp(varieta*1.15, 0, 1) * 0.7 + clamp((lung - 3)/3.2, 0, 1) * 0.3;
  if(tutte.length < 16) parole *= tutte.length/16;

  // tema
  const testo = " " + tutte.map(pulisci).join(" ") + " ";
  const usate = tema ? tema.k.filter(k => testo.indexOf(" " + k) >= 0).length : 0;
  const temaS = clamp(usate/3, 0, 1);

  const qTesto = clamp(10 + rima*42 + metrica*22 + parole*18 + temaS*8, 0, 100);
  return {vive, sil, gruppi, lett, rima, metrica, parole, tema:temaS, usate, qTesto, media};
}

const RCOL = ["", "#FFC53D", "#3DC7FF", "#FF4D9D", "#57C98B", "#B026FF", "#FF5A36", "#FFFFFF"];
let WR = null;

/* Ogni azione con una scena si può fare in due modi:
   veloce (un clic, risultato medio dalle statistiche) oppure giocata, con il moltiplicatore. */
const BOOST = 1.5;
function scegliModo(o){
  showEvent({k:"Come la fai", t:o.t, d:o.d, opts:[
    {n:"Falla veloce", d:o.dv, run(){ return o.veloce(); }},
    {n:"Giocala tu · ×1,5", d:o.dg, run(){ o.gioca(); return {t:"", c:""}; }}
  ]});
}

/* la tua stanza: scrivania, lampada, finestra sulla città, e tu seduto a scrivere */
function disegnaStanza(){
  const A2 = window.ARTIST || {};
  const col = A2.color || "#FF5A36";
  const skin = A2.skin || "#E8B991";
  const casa = (G.life && G.life.casa) || 0;
  const muro = ["#241C33","#26203A","#2A2440","#2E2748","#332C52"][casa] || "#241C33";
  const poster = ["#FF5A36","#B026FF","#FFC53D","#3DC7FF"];
  let posters = "";
  for(let i=0;i<Math.min(4, 1+casa);i++)
    posters += '<g transform="translate(' + (24 + i*40) + ',' + (26 + (i%2)*10) + ') rotate(' + (i%2?2:-2) + ')">' +
      '<rect width="30" height="38" rx="1.5" fill="' + poster[i] + '" opacity=".82"/>' +
      '<rect x="4" y="5" width="22" height="17" fill="#0F0C18" opacity=".55"/>' +
      '<rect x="4" y="26" width="16" height="3" fill="#0F0C18" opacity=".45"/></g>';
  return '<svg viewBox="0 0 380 190" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + muro + '"/><stop offset="1" stop-color="#120E1C"/></linearGradient>' +
      '<linearGradient id="lamp2" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFE1A3" stop-opacity=".42"/>' +
      '<stop offset="1" stop-color="#FFE1A3" stop-opacity="0"/></linearGradient></defs>' +
    '<rect width="380" height="190" fill="url(#wl)"/>' +
    posters +
    // finestra
    '<rect x="248" y="18" width="104" height="74" rx="3" fill="#0A0812"/>' +
    '<rect x="252" y="22" width="96" height="66" fill="#1A1338"/>' +
    '<circle cx="330" cy="36" r="7" fill="#F3EAD3" opacity=".8"/><circle cx="327" cy="34" r="6" fill="#1A1338"/>' +
    '<g fill="#0A0812">' +
      '<path d="M252,88 L252,58 L268,58 L268,50 L282,50 L282,88 Z"/>' +
      '<path d="M290,88 L290,44 L308,44 L308,88 Z"/>' +
      '<path d="M314,88 L314,62 L334,62 L334,54 L348,54 L348,88 Z"/></g>' +
    '<g fill="#FFC96B" opacity=".8">' +
      '<rect x="256" y="64" width="3" height="4"/><rect x="262" y="64" width="3" height="4"/>' +
      '<rect x="272" y="56" width="3" height="4"/><rect x="294" y="50" width="3" height="4"/>' +
      '<rect x="300" y="50" width="3" height="4"/><rect x="294" y="62" width="3" height="4"/>' +
      '<rect x="318" y="68" width="3" height="4"/><rect x="338" y="60" width="3" height="4"/></g>' +
    '<rect x="248" y="18" width="104" height="74" rx="3" fill="none" stroke="#332B46" stroke-width="4"/>' +
    '<path d="M300,20 L300,90 M250,55 L350,55" stroke="#332B46" stroke-width="3"/>' +
    // pavimento
    '<rect y="150" width="380" height="40" fill="#150F1F"/>' +
    '<path d="M0,150 L380,150 L380,155 L0,155 Z" fill="#000" opacity=".45"/>' +
    // lampada
    '<path d="M198,50 L230,50 L236,66 L192,66 Z" fill="#43394E"/>' +
    '<path d="M198,50 L230,50 L232,56 L196,56 Z" fill="#554A62"/>' +
    '<ellipse cx="214" cy="66" rx="20" ry="4" fill="#FFD98A" opacity=".55"/>' +
    '<rect x="212" y="66" width="4" height="50" fill="#2A2436"/>' +
    '<ellipse cx="214" cy="118" rx="15" ry="4" fill="#2A2436"/>' +
    '<path d="M192,66 L168,150 L260,150 Z" fill="url(#lamp2)"/>' +
    '<ellipse cx="214" cy="150" rx="62" ry="11" fill="#FFE1A3" opacity=".13"/>' +
    // sedia
    '<rect x="98" y="84" width="8" height="62" rx="3" fill="#282936"/>' +
    '<rect x="98" y="84" width="34" height="8" rx="4" fill="#2E2F3E"/>' +
    // scrivania
    '<rect x="88" y="116" width="212" height="9" rx="2" fill="#57432E"/>' +
    '<rect x="88" y="125" width="212" height="4" fill="#382A1D"/>' +
    '<rect x="98" y="129" width="7" height="26" fill="#382A1D"/>' +
    '<rect x="284" y="129" width="7" height="26" fill="#382A1D"/>' +
    // tu, seduto: gambe sotto, busto sopra il piano
    '<g>' +
      '<path d="M118,146 L118,126 L150,126 L150,146 Z" fill="#1D1E28"/>' +
      '<path d="M120,126 C116,106 118,96 124,92 L142,92 C149,96 152,108 150,126 Z" fill="' + col + '"/>' +
      '<path d="M146,98 C160,100 172,106 180,112 L176,118 C168,113 158,109 146,108 Z" fill="' + col + '"/>' +
      '<rect x="128" y="80" width="9" height="8" fill="' + skin + '"/>' +
      '<ellipse cx="133" cy="72" rx="12" ry="12.6" fill="' + skin + '"/>' +
      '<path d="M121,73 C121,63 127,58 133,58 C139,58 145,63 145,73 C141,66 125,66 121,73 Z" fill="#100D0C"/>' +
      '<ellipse cx="142" cy="73" rx="1.6" ry="2" fill="#1A1414"/>' +
      '<path d="M133,84 C133,80 136,78 140,78 L140,84 Z" fill="#0F0C14" opacity=".3"/>' +
    '</g>' +
    // quaderno sotto la mano, penna
    '<g transform="rotate(-3 200 112)">' +
      '<rect x="176" y="104" width="52" height="12" rx="1.5" fill="#F2E9D8"/>' +
      '<rect x="176" y="104" width="52" height="12" rx="1.5" fill="none" stroke="#CFC3AC" stroke-width="1"/>' +
      '<g stroke="#B9AE9A" stroke-width="1.1"><path d="M182,108 h38M182,112 h24"/></g></g>' +
    '<rect x="184" y="110" width="22" height="2.6" rx="1.3" fill="#1E1E28" transform="rotate(-24 195 111)"/>' +
    '<circle cx="180" cy="113" r="4.8" fill="' + skin + '"/>' +
    // tazza
    '<rect x="246" y="103" width="15" height="14" rx="2" fill="#2C3A52"/>' +
    '<rect x="246" y="103" width="15" height="4" rx="1.5" fill="#3A4C6C"/>' +
    '<path d="M261,106 h5 a4.5,4.5 0 0 1 0,9 h-5" fill="none" stroke="#2C3A52" stroke-width="2.4"/>' +
    '<rect width="380" height="190" fill="url(#vg)"/>' +
    '<rect width="380" height="190" filter="url(#grn)" opacity=".14"/>' +
    '</svg>' +
    '<div class="oltre">' + ((window.ARTIST||{}).city || "casa tua") + ' · ' +
      ["da tua madre","una stanza in affitto","il tuo monolocale","il bilocale in centro","l\'attico"][casa] + '</div>';
}

function apriFoglio(boost){
  WR = {righe:["","","",""], tema:pick(TEMI), boost: boost || 1};
  $("w-tema").innerHTML = '<b>Tema della settimana: ' + WR.tema.t + '</b><span>' + WR.tema.d +
    ' Se lo tocchi davvero, il pezzo pesa di più.</span>';
  $("w-title").textContent = "Scrivi la tua strofa";
  $("w-stanza").innerHTML = disegnaStanza();
  $("w-done").textContent = "Chiudi la strofa";
  $("w-done").onclick = () => chiudiStrofa();
  $("w-cancel").style.display = "";
  disegnaFoglio();
  $("writer").classList.add("on");
  setTimeout(() => { const f = document.querySelector(".wline input"); if(f) f.focus(); }, 80);
}
function chiudiFoglio(){ $("writer").classList.remove("on"); WR = null; }

function disegnaFoglio(){
  const a = analizza(WR.righe, WR.tema);
  let h = '<div class="wfoglio">';
  WR.righe.forEach((r, i) => {
    const viva = r.trim().length > 1;
    const idx = WR.righe.slice(0, i).filter(x => x.trim().length > 1).length;
    const g = viva ? a.gruppi[idx] : 0;
    h += '<div class="wline"><span class="no">' + (i+1) + '</span>' +
      '<input data-i="' + i + '" maxlength="90" placeholder="' +
        (i === 0 ? "Scrivi la prima barra…" : "…") + '" value="' + r.replace(/"/g,"&quot;") + '">' +
      '<span class="sil">' + (viva ? sillabe(r) : "") + '</span>' +
      '<span class="rm' + (g ? " on" : "") + '" style="' + (g ? "background:" + RCOL[g] : "") + '">' +
        (g ? a.lett[g-1] : "·") + '</span></div>';
  });
  h += '</div>';
  h += '<div class="waddrow">' +
    (WR.righe.length < 10 ? '<button class="wadd" id="w-more">+ Aggiungi una riga</button>' : '') +
    (WR.righe.length > 2 ? '<button class="wadd" id="w-less">− Togli l\'ultima</button>' : '') + '</div>';
  const m = (l, v, c) => '<div class="wm"><div class="l">' + l + '</div><div class="v">' + Math.round(v*100) +
    '</div><div class="bar"><i style="--c:' + c + ';width:' + Math.round(v*100) + '%"></i></div></div>';
  h += '<div class="wmeters">' + m("Rime", a.rima, "var(--acid)") + m("Metrica", a.metrica, "var(--sky)") +
    m("Parole", a.parole, "var(--pink)") + '</div>';

  let tip;
  if(a.vive.length < 2) tip = "Le lettere colorate a destra dicono quali righe rimano fra loro. Il numero è quante <b>sillabe</b> hai messo in quella barra.";
  else if(a.rima < .35) tip = "Le tue righe <b>non rimano</b>. Prova a far finire due barre con lo stesso suono: <i>−ale</i>, <i>−ento</i>, <i>−one</i>.";
  else if(a.metrica < .5) tip = "Le barre sono <b>troppo diverse di lunghezza</b> (media " + Math.round(a.media) +
    " sillabe). Su un beat devono stare più o meno nello stesso spazio.";
  else if(a.parole < .45) tip = "Stai <b>ripetendo le stesse parole</b>. Cambia il vocabolario, il pezzo cresce.";
  else if(!a.usate) tip = "Non hai ancora toccato il tema. Anche una parola sola sposta il pezzo.";
  else tip = "Sta venendo bene. <b>" + a.usate + "</b> parole sul tema, rime a posto, metrica tenuta.";
  h += '<div class="wtip">' + tip + '</div>';
  $("w-body").innerHTML = h;

  const skill = 0.5 + G.skills.scrittura/100 * 0.5;
  const qFin = Math.round(clamp(a.qTesto * skill * qFactors().mult * WR.boost, 3, 100));
  $("w-st").innerHTML = a.vive.length < 2 ? "Servono almeno <b>due barre</b>"
    : "Qualità del pezzo: <b>" + qFin + "</b>" + (WR.boost > 1 ? ' <span style="color:var(--acid)">×1,5 incluso</span>' : "");
  $("w-done").disabled = a.vive.length < 2;

  $("w-body").querySelectorAll("input").forEach(inp => {
    inp.oninput = () => {
      WR.righe[+inp.dataset.i] = inp.value;
      const pos = inp.selectionStart, i = inp.dataset.i;
      disegnaFoglio();
      const n2 = document.querySelector('.wline input[data-i="' + i + '"]');
      if(n2){ n2.focus(); try{ n2.setSelectionRange(pos, pos); }catch(e){} }
    };
    inp.onkeydown = e => {
      if(e.key === "Enter"){
        e.preventDefault();
        const i = +inp.dataset.i;
        if(i === WR.righe.length-1 && WR.righe.length < 10) WR.righe.push("");
        disegnaFoglio();
        const n2 = document.querySelector('.wline input[data-i="' + Math.min(i+1, WR.righe.length-1) + '"]');
        if(n2) n2.focus();
      }
    };
  });
  const more = $("w-more"); if(more) more.onclick = () => { WR.righe.push(""); disegnaFoglio(); SFX.tap(); };
  const less = $("w-less"); if(less) less.onclick = () => { WR.righe.pop(); disegnaFoglio(); SFX.tap(); };
}

function chiudiStrofa(){
  const a = analizza(WR.righe, WR.tema);
  const skill = 0.5 + G.skills.scrittura/100 * 0.5;
  const q = Math.round(clamp(a.qTesto * skill * qFactors().mult * WR.boost, 3, 100));
  const testo = a.vive.join("\n");
  G.bars.push({q, txt:testo, tema:WR.tema.t});
  gain("scrittura", 1.2 + a.qTesto/100 * 1.4);
  G.wellbeing = clamp(G.wellbeing - 1, 0, 100);

  const giudizio = q >= 72 ? "Questa è roba seria." : q >= 55 ? "Regge. Su un beat giusto funziona."
    : q >= 38 ? "Si può usare, ma non è il tuo pezzo migliore." : "È un abbozzo. In studio si sentirà.";
  const riga = (n, v, nota) => '<div class="wrow"><b>' + n + '</b><span class="bar"><i style="width:' +
    Math.round(v*100) + '%"></i></span><span>' + nota + '</span></div>';
  $("w-title").textContent = "Strofa chiusa";
  $("w-tema").innerHTML = '<b>' + WR.tema.t + '</b><span>' + giudizio + '</span>';
  $("w-body").innerHTML = '<div class="wres"><div class="qq">' + q + '</div>' +
    '<div class="qs">qualità della strofa · la tua scrittura vale ' + Math.round(skill*100) + '% e il resto lo fa come stai' +
      (WR.boost > 1 ? ' · <b style="color:var(--acid)">×1,5 perché te la sei giocata</b>' : '') + '</div>' +
    riga("Rime", a.rima, a.rima >= .8 ? "rime piene" : a.rima >= .5 ? "rime sporche" : a.rima >= .3 ? "solo assonanze" : "quasi niente") +
    riga("Metrica", a.metrica, Math.round(a.media) + " sillabe di media") +
    riga("Parole", a.parole, new Set((a.vive.join(" ").toLowerCase().match(/[a-z]+/g)||[]).map(pulisci)).size + " parole diverse") +
    riga("Tema", a.tema, a.usate + " parole sul tema") +
    '</div><div class="wtxt">' + testo.replace(/</g,"&lt;") + '</div>';
  $("w-st").innerHTML = "In cartella hai <b>" + G.bars.length + "</b> strofe";
  $("w-done").textContent = "Metti via il foglio";
  $("w-done").onclick = () => { chiudiFoglio(); save(); renderGioco(); };
  $("w-cancel").style.display = "none";
  SFX.publish();
  pushLog("Strofa scritta sul tema «" + WR.tema.t.toLowerCase() + "», qualità <b>" + q + "</b>.", q >= 60 ? "good" : "");
}

$("w-x").onclick = () => { if(WR){ G.energy += 1; } chiudiFoglio(); renderGioco(); };
$("p-x").onclick = () => uscitaPiazza();
window.__FS = () => FS;
window.__R = () => renderGioco();
$("w-cancel").onclick = () => { G.energy += 1; chiudiFoglio(); renderGioco(); };
$("w-done").onclick = () => chiudiStrofa();
