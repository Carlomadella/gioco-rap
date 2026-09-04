/* Suono, notifiche, animazioni, rapporto di fine settimana, avvio (window.GAME). */
"use strict";

/* ==================== VITA: suono, animazioni, momenti ==================== */
/* L'interruttore dell'audio sta nelle impostazioni (SET.audio.on): il tasto ♪
   in partita è la stessa manopola, vista da vicino. I volumi arrivano da lì. */
let AC = null, muted = !SET.audio.on;
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; } }
  if(AC.state === "suspended") AC.resume();
  return AC;
}
/* ---- il banco: tutto passa di qui, compressore e un filo di riverbero.
   È il riverbero che toglie i suoni dal chiptino: un click secco attaccato
   all'uscita suona come un gioco del '90, lo stesso click con dieci millisecondi
   di stanza intorno suona come un'app. ---- */
let BUS = null, RIV = null;
function impulso(c, dur, coda){
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const b = c.createBuffer(2, len, c.sampleRate);
  for(let ch = 0; ch < 2; ch++){
    const d = b.getChannelData(ch);
    for(let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, coda);
  }
  return b;
}
function bus(){
  const c = ac(); if(!c) return null;
  if(BUS && BUS.context === c) return BUS;
  const g = c.createGain(); g.gain.value = 1;
  try{
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 3.4;
    comp.attack.value = .004; comp.release.value = .2;
    g.connect(comp); comp.connect(c.destination);
  }catch(e){ g.connect(c.destination); }
  BUS = g;
  try{
    const cv = c.createConvolver(); cv.buffer = impulso(c, 1.2, 3.4);
    const rg = c.createGain(); rg.gain.value = .55;
    cv.connect(rg); rg.connect(BUS);
    RIV = cv;
  }catch(e){ RIV = null; }
  return BUS;
}

/* una nota: attacco morbido, coda esponenziale, filtro in cima e un po' di stanza */
function nota(o){
  if(muted) return;
  const c = ac(), out = bus(); if(!c || !out) return;
  const t = c.currentTime + (o.when || 0);
  const dur = o.dur || .2, vol = (o.vol == null ? .06 : o.vol) * volSfx();
  if(vol <= 0) return;
  const osc = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  osc.type = o.tipo || "sine";
  osc.frequency.setValueAtTime(o.hz, t);
  if(o.hz2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.hz2), t + dur * (o.glide || .7));
  if(o.detune) osc.detune.setValueAtTime(o.detune, t);
  f.type = "lowpass"; f.frequency.value = o.cut || 5200; f.Q.value = o.q || .7;
  const atk = o.atk == null ? .006 : o.atk;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + atk);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  osc.connect(f); f.connect(g); g.connect(out);
  if(RIV && o.riv){ const s = c.createGain(); s.gain.value = o.riv * volSfx(); g.connect(s); s.connect(RIV); }
  osc.start(t); osc.stop(t + dur + .05);
}
/* un fruscio: il transiente dei click, il respiro della folla, la mano sul fader */
function fruscio(o){
  if(muted) return;
  const c = ac(), out = bus(); if(!c || !out) return;
  const t = c.currentTime + (o.when || 0);
  const dur = o.dur || .08, vol = (o.vol == null ? .07 : o.vol) * volSfx();
  if(vol <= 0) return;
  const len = Math.max(1, Math.floor(c.sampleRate * (dur + .06)));
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = o.filtro || "bandpass";
  f.frequency.setValueAtTime(o.f || 2200, t);
  if(o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.f2), t + dur);
  f.Q.value = o.q == null ? 1.1 : o.q;
  const g = c.createGain();
  const atk = o.atk == null ? .004 : o.atk;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + atk);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out);
  if(RIV && o.riv){ const s = c.createGain(); s.gain.value = o.riv * volSfx(); g.connect(s); s.connect(RIV); }
  src.start(t); src.stop(t + dur + .06);
}

/* ---- I SUONI ----
   «morbido» è quello di casa: click d'aria, legni, accordi caldi, niente onde
   quadre. «retrò» è il vecchio banco a otto bit, per chi lo rimpiange. */
const SUONI = {
  morbido:{
    /* il click dei bottoni: un soffio corto in alto più un tocco di legno sotto */
    tap(){
      fruscio({dur:.035, filtro:"bandpass", f:2600, q:1.4, vol:.05, riv:.1});
      nota({hz:1046, hz2:784, dur:.075, tipo:"sine", vol:.045, atk:.002, cut:4200, riv:.14});
    },
    /* i bottoni grossi, quelli che aprono qualcosa */
    apri(){
      fruscio({dur:.05, filtro:"bandpass", f:1800, q:1.1, vol:.045, riv:.16});
      nota({hz:523, hz2:784, dur:.16, tipo:"sine", vol:.05, atk:.008, cut:3600, riv:.26});
    },
    chiudi(){
      nota({hz:740, hz2:392, dur:.15, tipo:"sine", vol:.045, atk:.006, cut:2600, riv:.2});
      fruscio({dur:.05, filtro:"lowpass", f:1400, vol:.035, riv:.1});
    },
    /* la penna sul foglio */
    write(){
      fruscio({dur:.045, filtro:"highpass", f:3600, q:.7, vol:.04, riv:.1});
      fruscio({dur:.05, filtro:"highpass", f:4600, q:.7, vol:.035, when:.07, riv:.1});
      nota({hz:1318, dur:.09, tipo:"sine", vol:.028, when:.02, cut:5200, riv:.16});
    },
    /* i soldi: tre note di celesta, non l'arpeggio del flipper */
    cash(){
      [1046.5, 1318.5, 1568].forEach((f, i) =>
        nota({hz:f, dur:.5 - i*.06, tipo:"sine", vol:.05, atk:.004, when:i*.055, cut:6000, riv:.34}));
      nota({hz:523.25, dur:.5, tipo:"sine", vol:.03, atk:.01, cut:2200, riv:.3});
    },
    /* la sala: il tonfo del rec e la porta imbottita che si chiude */
    rec(){
      nota({hz:120, hz2:48, dur:.55, tipo:"sine", vol:.12, atk:.004, cut:900, riv:.14});
      fruscio({dur:.09, filtro:"bandpass", f:1200, q:.9, vol:.05, when:.02, riv:.2});
    },
    /* il fader che sale */
    mix(){
      fruscio({dur:.4, filtro:"lowpass", f:420, f2:5200, vol:.05, atk:.06, riv:.24});
      nota({hz:196, hz2:294, dur:.42, tipo:"triangle", vol:.035, atk:.05, cut:2400, riv:.24});
    },
    /* l'uscita del pezzo: un accordo che si apre e resta */
    publish(){
      [261.63, 392, 523.25, 659.25, 783.99].forEach((f, i) =>
        nota({hz:f, dur:1.15 - i*.08, tipo:"sine", vol:i < 2 ? .05 : .038, atk:.07 + i*.02,
              when:i*.045, cut:5200, riv:.5}));
    },
    /* la folla: fiato, non rumore bianco */
    crowd(){
      fruscio({dur:.9, filtro:"lowpass", f:600, f2:1500, vol:.09, atk:.18, riv:.55});
      nota({hz:98, dur:.7, tipo:"sine", vol:.05, atk:.12, cut:400, riv:.3});
      nota({hz:196, dur:.6, tipo:"triangle", vol:.025, atk:.15, cut:900, riv:.4, when:.06});
    },
    /* quando va male: due note che scendono, sorde */
    fail(){
      nota({hz:311, hz2:196, dur:.5, tipo:"triangle", vol:.055, atk:.008, cut:1100, riv:.28});
      nota({hz:155, dur:.55, tipo:"sine", vol:.05, atk:.02, cut:700, riv:.2, when:.06});
    },
    /* la settimana che gira */
    week(){
      nota({hz:587.33, dur:.36, tipo:"sine", vol:.05, atk:.005, cut:4200, riv:.3});
      nota({hz:880, dur:.42, tipo:"sine", vol:.045, atk:.005, when:.1, cut:5200, riv:.34});
      fruscio({dur:.06, filtro:"bandpass", f:3000, q:1.3, vol:.03, riv:.14});
    },
    /* il traguardo */
    fanfare(){
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        nota({hz:f, dur:1 - i*.1, tipo:"sine", vol:.06, atk:.006, when:i*.085, cut:6200, riv:.5}));
      nota({hz:261.63, dur:1.3, tipo:"triangle", vol:.035, atk:.06, cut:1800, riv:.45});
      nota({hz:392, dur:1.2, tipo:"sine", vol:.03, atk:.08, when:.1, cut:2600, riv:.45});
    },
    errore(){
      nota({hz:220, dur:.22, tipo:"sine", vol:.06, atk:.005, cut:900, riv:.12});
      nota({hz:207.65, dur:.26, tipo:"sine", vol:.05, atk:.005, when:.09, cut:900, riv:.12});
    },
    /* la piazza: metronomo e giudizio sulle barre */
    click(forte){
      fruscio({dur:.03, filtro:"highpass", f:forte ? 4200 : 5600, q:.7, vol:forte ? .05 : .03, riv:.08});
      if(forte) nota({hz:92, hz2:58, dur:.16, tipo:"sine", vol:.09, atk:.003, cut:600});
    },
    pocket(){ nota({hz:1568, dur:.34, tipo:"sine", vol:.05, atk:.003, cut:7000, riv:.4});
              nota({hz:2093, dur:.24, tipo:"sine", vol:.028, atk:.003, when:.02, cut:8000, riv:.4}); },
    buono(){ nota({hz:1046.5, dur:.26, tipo:"sine", vol:.045, atk:.003, cut:5200, riv:.3}); },
    perso(){ nota({hz:174.61, hz2:130.81, dur:.28, tipo:"triangle", vol:.055, atk:.005, cut:800, riv:.18}); },
    /* punto 44: la promo — un ting che sale, non il click generico di prima */
    promo(){
      nota({hz:1568, hz2:2093, dur:.12, tipo:"sine", vol:.045, atk:.003, cut:7000, riv:.22});
      fruscio({dur:.03, filtro:"highpass", f:5200, q:.8, vol:.03, when:.01, riv:.12});
    },
    /* la palestra — un tonfo di peso e un fiato, non il tap di tutti gli altri */
    palestra(){
      nota({hz:90, hz2:55, dur:.22, tipo:"sine", vol:.09, atk:.002, cut:500, riv:.1});
      fruscio({dur:.12, filtro:"lowpass", f:900, vol:.05, when:.02, riv:.12});
    },
    /* la fine della giornata — più morbido della settimana, che resta il battito grosso */
    giorno(){
      nota({hz:440, dur:.3, tipo:"sine", vol:.035, atk:.02, cut:2600, riv:.4});
      nota({hz:659.25, dur:.32, tipo:"sine", vol:.03, atk:.03, when:.08, cut:3200, riv:.4});
    }
  },
  retro:{
    tap(){ beep(520, .06, "square", .04); },
    apri(){ beep(660, .07, "square", .04); },
    chiudi(){ beep(392, .07, "square", .04); },
    write(){ beep(660, .05, "square", .035); beep(880, .06, "square", .03, .05); },
    cash(){ [880,1174,1568].forEach((f,i) => beep(f, .09, "triangle", .05, i*.05)); },
    rec(){ beep(58, .3, "sine", .12); noiseHit(.14, 1800, .1, .12); },
    mix(){ beep(320, .1, "sawtooth", .04); beep(480, .12, "sawtooth", .035, .09); },
    publish(){ [392,523,659,784].forEach((f,i) => beep(f, .16, "triangle", .06, i*.06)); },
    crowd(){ noiseHit(.7, 700, .09); beep(196, .3, "sine", .05); },
    fail(){ beep(180, .22, "sawtooth", .05); beep(120, .3, "sawtooth", .05, .12); },
    week(){ beep(294, .12, "triangle", .05); beep(392, .16, "triangle", .05, .1); },
    fanfare(){ [523,659,784,1046,1318].forEach((f,i) => beep(f, .22, "triangle", .07, i*.09)); },
    errore(){ beep(150, .18, "sawtooth", .05); },
    click(forte){ beep(forte ? 62 : 48, .09, "sine", .09); },
    pocket(){ beep(880, .05, "square", .03); },
    buono(){ beep(660, .05, "square", .025); },
    perso(){ beep(150, .1, "sawtooth", .04); },
    promo(){ beep(1046, .07, "square", .035); beep(1568, .06, "square", .03, .05); },
    palestra(){ beep(80, .12, "square", .07); noiseHit(.1, 500, .08, .02); },
    giorno(){ beep(392, .1, "triangle", .04); beep(523, .1, "triangle", .035, .08); }
  }
};

/* i vecchi mattoncini restano: piazza.js e chi altro li usa non cambia riga */
function beep(freq, dur, type, vol, when){
  if(muted) return;
  const c = ac(), out = bus(); if(!c || !out) return;
  const t = c.currentTime + (when || 0);
  const v = (vol || .07) * volSfx(); if(v <= 0) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || "triangle"; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .03);
}
function noiseHit(dur, hp, vol, when){
  fruscio({dur:dur, filtro:"highpass", f:hp || 1200, q:.7, vol:(vol || .12), when:when, atk:.002});
}

/* Il banco in uso lo decidono le impostazioni. Un nome che manca al retrò
   ricade sul morbido: meglio un suono buono che nessun suono. */
const SUONO_NOMI = ["tap","apri","chiudi","write","cash","rec","mix","publish","crowd","fail",
  "week","fanfare","errore","click","pocket","buono","perso","promo","palestra","giorno"];
const SFX = {};
SUONO_NOMI.forEach(k => {
  SFX[k] = function(a){
    const banco = SUONI[SET.audio.suoni] || SUONI.morbido;
    const f = banco[k] || SUONI.morbido[k];
    if(f) f(a);
  };
});

const SND = {scrivi:"write", beat:"apri", registra:"rec", mixa:"mix", pubblica:"publish",
  promo:"promo", free:"crowd", live:"crowd", turno:"cash", cercalavoro:"apri", stacca:"tap",
  palestra_pesi:"palestra", palestra_cardio:"palestra"};

/* ---- il click dei pulsanti ----
   Uno solo, per tutta l'app: si sente premendo qualunque cosa sia premibile.
   I bottoni grossi — quelli che aprono una scena o mandano avanti — hanno il
   loro tocco più pieno. Le card delle azioni no: quelle hanno già il suono
   della cosa che fanno, e la piazza nemmeno: lì il tempo è il gioco. */
const CLICK_PIENO = ["mrow","solid","opt2","sl","navback","tornamenu"];
document.addEventListener("pointerdown", e => {
  if(!SET.audio.click || muted) return;
  const b = e.target.closest("button,[data-go],[role=button]");
  if(!b || b.disabled) return;
  if(b.closest(".tile") || b.closest("#piazza")) return;
  if(b.hasAttribute("data-muto")) return;
  const pieno = CLICK_PIENO.some(k => b.classList.contains(k));
  SFX[pieno ? "apri" : "tap"]();
}, true);

function toast(html, kind, icon, colors){
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  const c = colors || ["#FF5A36","#B026FF"];
  el.innerHTML = '<span class="ic" style="background:linear-gradient(140deg,' + c[0] + ',' + c[1] + ')">' +
    (icon || "●") + '</span><span class="tx">' + html + '</span>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

function countTo(el, to, fmtFn){
  const from = parseFloat(el.dataset.v || "0");
  el.dataset.v = to;
  if(from === to){ el.textContent = fmtFn(to); return; }
  const t0 = performance.now(), dur = 620;
  const step = now => {
    const k = Math.min(1, (now - t0)/dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmtFn(from + (to - from) * e);
    if(k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function flash(big, sub, tone){
  const el = $("flash");
  $("f-big").textContent = big; $("f-sub").textContent = sub;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  if(tone) SFX.fanfare();
  setTimeout(() => el.classList.remove("on"), 2300);
}

/* rapporto di fine settimana */
function weekReport(before, costs){
  const streams = G.songs.filter(x => x.released).reduce((a,x) => a + (x.last||0), 0);
  const dFans = G.fans - before.fans;
  const dMoney = Math.round(G.money - before.money);
  const pos = chartPosition(streams);
  $("r-t").textContent = "Anno " + G.year + " · Settimana " + G.week;
  $("r-grid").innerHTML =
    '<div class="rbox"><div class="v" id="rv1">0</div><div class="l">stream</div></div>' +
    '<div class="rbox"><div class="v up" id="rv2">0</div><div class="l">nuovi fan</div></div>' +
    '<div class="rbox"><div class="v ' + (dMoney >= 0 ? "up" : "down") + '" id="rv3">0</div><div class="l">in cassa</div></div>';
  $("r-pos").innerHTML = streams > 0
    ? '<b>#' + pos + '</b> posizione in classifica questa settimana'
    : '<b>—</b> nessun pezzo fuori: la classifica non ti vede';
  $("r-pos").style.display = "block";
  const shiftTxt = weekEarn > 0 ? "<b>+" + fmt(weekEarn) + " €</b> dai turni e dai live" : "nessuna entrata dal lavoro";
  $("r-news").innerHTML =
    '<div>' + shiftTxt + ' · <b>−' + fmt(costs) + ' €</b> di spese fisse, di cui ' + fmt(lifeCost()) + ' € di lifestyle</div>' +
    G.log.slice(0,3).map(l => '<div>' + l.t + '</div>').join("");
  $("report").classList.add("on");
  SFX.week();
  countTo($("rv1"), streams, v => Math.round(v).toLocaleString("it-IT"));
  countTo($("rv2"), dFans, v => "+" + Math.round(v).toLocaleString("it-IT"));
  countTo($("rv3"), dMoney, v => (v >= 0 ? "+" : "") + Math.round(v).toLocaleString("it-IT") + " €");
  if(pos <= 10 && streams > 0 && pos < (before.bestPos || 99)){
    setTimeout(() => flash("#" + pos, "sei entrato in classifica", true), 900);
  }
}
$("r-go").onclick = () => { $("report").classList.remove("on"); };

/* il tasto ♪ e l'interruttore nelle impostazioni sono la stessa cosa */
function aggiornaTastoAudio(){
  const b = $("g-mute"); if(!b) return;
  b.textContent = muted ? "✕" : "♪";
  b.style.opacity = muted ? ".5" : "1";
  b.title = muted ? "Audio spento" : "Audio acceso";
}
/* Il tasto ♪ non c'è più nel markup (punto 7): era la stessa manopola
   dell'interruttore Audio delle impostazioni — lo diceva già il commento qui
   sopra. `aggiornaTastoAudio()` resta, con la sua guardia, perché le
   impostazioni la chiamano a ogni cambio: se un giorno il tasto torna, torna a
   funzionare da solo. */
aggiornaTastoAudio();

window.__ADFCELEB = n => { flash("TRAGUARDO", n, true); };
window.GAME = {
  enter(){
    const art = window.ARTIST || {};
    syncEnergy();
    openWeek();
    if(!G.log.length) pushLog("<b>Si comincia.</b> Zero fan, zero contatti, una settimana davanti.", "big");
    renderGioco();
    /* la mappa è la prima cosa che si vede: va riempita anche lei */
    if(typeof renderHub === "function") renderHub();
  }
};
