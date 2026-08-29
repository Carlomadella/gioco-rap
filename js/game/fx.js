/* Suono, notifiche, animazioni, rapporto di fine settimana, avvio (window.GAME). */
"use strict";

/* ==================== VITA: suono, animazioni, momenti ==================== */
let AC = null, muted = false;
try{ muted = localStorage.getItem("adf-mute") === "1"; }catch(e){}
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; } }
  if(AC.state === "suspended") AC.resume();
  return AC;
}
function beep(freq, dur, type, vol, when){
  if(muted) return;
  const c = ac(); if(!c) return;
  const t = c.currentTime + (when || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || "triangle"; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol || .07, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .03);
}
function noiseHit(dur, hp, vol, when){
  if(muted) return;
  const c = ac(); if(!c) return;
  const t = c.currentTime + (when || 0);
  const len = Math.floor(c.sampleRate * (dur + .05));
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp || 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(vol || .12, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur + .05);
}
const SFX = {
  tap(){ beep(520, .06, "square", .04); },
  write(){ beep(660, .05, "square", .035); beep(880, .06, "square", .03, .05); },
  cash(){ [880,1174,1568].forEach((f,i) => beep(f, .09, "triangle", .05, i*.05)); },
  rec(){ beep(58, .3, "sine", .12); noiseHit(.14, 1800, .1, .12); },
  mix(){ beep(320, .1, "sawtooth", .04); beep(480, .12, "sawtooth", .035, .09); },
  publish(){ [392,523,659,784].forEach((f,i) => beep(f, .16, "triangle", .06, i*.06)); },
  crowd(){ noiseHit(.7, 700, .09); beep(196, .3, "sine", .05); },
  fail(){ beep(180, .22, "sawtooth", .05); beep(120, .3, "sawtooth", .05, .12); },
  week(){ beep(294, .12, "triangle", .05); beep(392, .16, "triangle", .05, .1); },
  fanfare(){ [523,659,784,1046,1318].forEach((f,i) => beep(f, .22, "triangle", .07, i*.09)); }
};
const SND = {scrivi:"write", beat:"tap", registra:"rec", mixa:"mix", pubblica:"publish",
  promo:"tap", free:"crowd", live:"crowd", turno:"cash", cercalavoro:"tap", stacca:"tap"};

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
$("r-go").onclick = () => { $("report").classList.remove("on"); SFX.tap(); };

$("g-mute").onclick = () => {
  muted = !muted;
  try{ localStorage.setItem("adf-mute", muted ? "1" : "0"); }catch(e){}
  $("g-mute").textContent = muted ? "✕" : "♪";
  $("g-mute").style.opacity = muted ? ".5" : "1";
  if(!muted) SFX.tap();
};
$("g-mute").textContent = muted ? "✕" : "♪";

window.__ADFCELEB = n => { flash("TRAGUARDO", n, true); };
window.GAME = {
  enter(){
    const art = window.ARTIST || {};
    syncEnergy();
    openWeek();
    if(!G.log.length) pushLog("<b>Si comincia.</b> Zero fan, zero contatti, una settimana davanti.", "big");
    renderGioco();
  }
};
