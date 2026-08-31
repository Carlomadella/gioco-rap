/* Ascolto dei beat. Il genere (js/game/beats.js) decide bpm, andatura della cassa
   e scala; il seme decide il giro preciso dentro a quel genere. Più il beat è buono,
   più il giro è pieno, intonato e a tempo: quello che senti è la qualità che poi
   finisce nel pezzo. */
"use strict";

const BEAT_ARIA = {
  cupo:    {scala:[0,3,5,6,7,10], ott:0},
  jazz:    {scala:[0,3,5,7,10],   ott:1},
  aperto:  {scala:[0,2,3,7,9],    ott:1},
  morbido: {scala:[0,2,4,7,9],    ott:1}
};

/* seme stabile: i beat delle partite gia' iniziate lo ricavano dal nome */
function beatSeed(b){
  if(b.seed == null){
    let h = 2166136261;
    const s = (b.n || "beat") + (b.q || 0);
    for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    b.seed = Math.abs(h) % 1000000000;
  }
  return b.seed;
}
function beatRng(seed){
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* scheda del beat: il genere decide il giro, il seme decide il pezzo dentro al giro.
   I beat comprati prima che i generi esistessero pescano il loro dal seme. */
function beatInfo(b){
  const r = beatRng(beatSeed(b));
  const id = BEAT_GEN[b.gen] ? b.gen : BEAT_IDS[Math.floor(r() * BEAT_IDS.length)];
  const g = genBeat(id);
  const bpm = Math.round(g.bpm[0] + r() * (g.bpm[1] - g.bpm[0]));
  const root = 33 + Math.floor(r() * 8);
  return {gen:id, g, nome:g.n, bpm, root, r};
}
const beatEtichetta = b => { const i = beatInfo(b); return i.nome + " · " + i.bpm + " bpm"; };

/* ==================== suono ==================== */
let BEAT_PLAY = null;

function beatNoise(c, dur){
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  return buf;
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

function beatKick(c, out, t, v, nodes){
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(135, t);
  o.frequency.exponentialRampToValueAtTime(40, t + .12);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + .006);
  g.gain.exponentialRampToValueAtTime(.0001, t + .32);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + .36); nodes.push(o);
}
function beatSnare(c, out, buf, t, v, hp, nodes){
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + .17);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + .2); nodes.push(s);
  const o = c.createOscillator(), g2 = c.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(190, t);
  g2.gain.setValueAtTime(v * .5, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .1);
  o.connect(g2); g2.connect(out); o.start(t); o.stop(t + .12); nodes.push(o);
}
function beatHat(c, out, buf, t, v, open, nodes){
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6500;
  const g = c.createGain();
  const d = open ? .16 : .035;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + d + .03); nodes.push(s);
}
function beatTone(c, out, t, hz, dur, type, v, cut, nodes){
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = "lowpass"; f.frequency.value = cut;
  o.type = type; o.frequency.setValueAtTime(hz, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + .02);
  g.gain.setValueAtTime(v, t + dur * .6);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .05); nodes.push(o);
}

function beatStop(){
  const p = BEAT_PLAY;
  BEAT_PLAY = null;
  document.querySelectorAll(".play.on").forEach(b => { b.classList.remove("on"); b.textContent = "▶"; });
  if(!p) return;
  clearTimeout(p.timer);
  try{
    const now = p.c.currentTime;
    p.master.gain.cancelScheduledValues(now);
    p.master.gain.setValueAtTime(p.master.gain.value, now);
    p.master.gain.linearRampToValueAtTime(0, now + .07);
    p.nodes.forEach(n => { try{ n.stop(now + .09); }catch(e){} });
  }catch(e){}
}

/* Suona quattro battute del beat. Riclicca sopra per fermarlo. */
function beatSuona(b, btn){
  const key = beatSeed(b);
  const stesso = BEAT_PLAY && BEAT_PLAY.key === key;
  beatStop();
  if(stesso) return;
  if(muted){
    toast("L'audio è spento: riaccendilo col tasto <b>♪</b> in alto.", "bad", "♪", ["#5A6472","#2B2B34"]);
    return;
  }
  const c = ac(); if(!c) return;

  const info = beatInfo(b), r = info.r, st = info.g;
  const q = clamp(b.q || 30, 5, 100);
  const pulito = q / 100;                    // quanto è a tempo e intonato
  const cut = 700 + q * 42;                  // quanto è aperto in alto
  const sbava = (1 - pulito) * 0.03;         // ritardi e sbavature
  const scala = BEAT_ARIA[st.aria].scala;
  const snare = st.snare || [4, 12];

  const master = c.createGain(); master.gain.value = .0001;
  master.connect(c.destination);
  master.gain.linearRampToValueAtTime(Math.max(.0001, .85 * volBeat()), c.currentTime + .08);
  const nodes = [];
  const nz = beatNoise(c, .3);

  const spb = 60 / info.bpm, sed = spb / 4, bars = 4;
  const t0 = c.currentTime + .1;
  const jit = () => (Math.random() * 2 - 1) * sbava;

  /* il giro della cassa: uno dei giri tipici del genere, piu' un colpo in piu'
     se il beat e' curato. Stesso genere, stessa andatura; seme diverso, giro diverso. */
  const kick = st.kick[Math.floor(r() * st.kick.length)].slice();
  if(q >= 55){
    const extra = [3,6,7,10,11,13,14][Math.floor(r() * 7)];
    if(kick.indexOf(extra) < 0) kick.push(extra);
  }
  const melodia = [];
  if(q >= 26){
    const nn = 3 + Math.floor(r() * 3) + (q >= 70 ? 2 : 0);
    for(let i = 0; i < nn; i++)
      melodia.push([Math.floor(r() * 16), scala[Math.floor(r() * scala.length)] + (r() < .3 ? 12 : 0)]);
  }

  for(let bar = 0; bar < bars; bar++){
    const bt = t0 + bar * spb * 4;
    const ultima = bar === bars - 1;
    for(let s = 0; s < 16; s++){
      const t = bt + s * sed;
      if(kick.indexOf(s) >= 0) beatKick(c, master, t + jit(), .5, nodes);
      if(snare.indexOf(s) >= 0) beatSnare(c, master, nz, t + jit(), .3, 1400 + q * 8, nodes);
      /* charleston: ottavi o sedicesimi secondo lo stile, con le raffiche del drill */
      const suonaHat = st.hat === 1 ? true : s % 2 === 0;
      if(suonaHat){
        const open = q >= 45 && s === 14;
        beatHat(c, master, nz, t + jit() * .5, open ? .16 : .1 + r() * .05, open, nodes);
        if(st.roll && s === 10 && q >= 40){
          beatHat(c, master, nz, t + sed / 3, .08, false, nodes);
          beatHat(c, master, nz, t + sed * 2 / 3, .08, false, nodes);
        }
      }
      /* il basso segue la cassa: sotto q25 sta solo sui tempi forti */
      if(kick.indexOf(s) >= 0 && (q >= 25 || s % 4 === 0)){
        const nota = info.root + scala[Math.floor((s / 16) * scala.length)];
        beatTone(c, master, t + jit(), midiHz(nota), sed * 2.4, "sawtooth",
          .16 + pulito * .07, 220 + q * 4, nodes);
      }
    }
    /* la melodia entra dalla seconda battuta e sull'ultima si sposta */
    if(bar > 0) melodia.forEach(([s, semi]) => {
      const off = ultima && r() < .5 ? 1 : 0;
      const stonato = (1 - pulito) * (Math.random() * 26 - 13);
      beatTone(c, master, bt + (s + off) * sed + jit(),
        midiHz(info.root + 24 + semi + BEAT_ARIA[st.aria].ott * 12) * (1 + stonato / 1200),
        sed * 2, q >= 60 ? "triangle" : "square", .085, cut, nodes);
    });
    /* sopra q55 sotto ci sta anche un accordo tenuto */
    if(q >= 55) [0, 3, 7].forEach(semi =>
      beatTone(c, master, bt, midiHz(info.root + 12 + semi), spb * 3.6, "sine", .05, cut, nodes));
  }

  const durata = (bars * spb * 4 + .6) * 1000;
  BEAT_PLAY = {key, c, master, nodes, timer:setTimeout(beatStop, durata)};
  if(btn){ btn.classList.add("on"); btn.textContent = "■"; }
}
